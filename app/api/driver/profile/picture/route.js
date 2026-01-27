import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { writeFile } from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/prisma';

export async function POST(req) {
    try {
        const session = await getServerSession();
        console.log({session})
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('profileImage');

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Generate filename
        const fileExtension = file.name.split('.').pop();
        const fileName = `${user.id}.${fileExtension}`;
        const filePath = path.join(process.cwd(), 'public', 'uploads', 'profiles', fileName);

        // Write file
        await writeFile(filePath, buffer);

        // Update user profile image
        const imageUrl = `/uploads/profiles/${fileName}`;
        await prisma.user.update({
            where: { id: user.id },
            data: { profileImage: imageUrl }
        });

        return NextResponse.json({ imageUrl, message: 'Profile picture uploaded successfully' });
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        return NextResponse.json({ error: 'Failed to upload profile picture' }, { status: 500 });
    }
}
