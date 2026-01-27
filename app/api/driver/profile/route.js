import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'DRIVER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                driver: true
            }
        });

        if (!user || !user.driver) {
            return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
        }

        const profile = {
            name: user.name,
            email: user.email,
            phone: user.phone,
            profileImage: user.profileImage,
            licenseNumber: user.driver.licenseNumber,
            licenseExpiry: user.driver.licenseExpiry,
            emergencyContact: user.driver.emergencyContact
        };

        return NextResponse.json({ profile });
    } catch (error) {
        console.error('Error fetching driver profile:', error);
        return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'DRIVER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { name, phone, licenseNumber, licenseExpiry, emergencyContact } = body;

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { driver: true }
        });

        if (!user || !user.driver) {
            return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
        }

        // Update User
        await prisma.user.update({
            where: { id: user.id },
            data: {
                name,
                phone
            }
        });

        // Update Driver
        await prisma.driver.update({
            where: { id: user.driver.id },
            data: {
                licenseNumber,
                licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : null,
                emergencyContact
            }
        });

        // Fetch updated profile
        const updatedUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: { driver: true }
        });

        const profile = {
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone,
            profileImage: updatedUser.profileImage,
            licenseNumber: updatedUser.driver.licenseNumber,
            licenseExpiry: updatedUser.driver.licenseExpiry,
            emergencyContact: updatedUser.driver.emergencyContact
        };

        return NextResponse.json({ profile });
    } catch (error) {
        console.error('Error updating driver profile:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}
