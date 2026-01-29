import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { pusher } from '@/lib/pusher';

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { title, message, target } = await request.json();

        if (!title || !message) {
            return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
        }

        let users = [];

        // Determine target users
        if (target === 'ALL') {
            users = await prisma.user.findMany({
                where: { organizationId: session.user.organizationId },
                select: { id: true }
            });
        } else if (target === 'DRIVERS') {
            users = await prisma.user.findMany({
                where: {
                    organizationId: session.user.organizationId,
                    role: 'DRIVER'
                },
                select: { id: true }
            });
        } else if (target === 'PARENTS') {
            users = await prisma.user.findMany({
                where: {
                    organizationId: session.user.organizationId,
                    role: 'PARENT'
                },
                select: { id: true }
            });
        }

        // Create notifications for all target users
        const notifications = users.map(user => ({
            userId: user.id,
            type: 'BROADCAST',
            title: title,
            message: message,
            metadata: { senderId: session.user.id }
        }));

        await prisma.notification.createMany({
            data: notifications
        });

        // Trigger real-time notifications via Pusher
        const pusherPromises = users.map(user =>
            pusher.trigger(`notifications-${user.id}`, 'new-notification', {
                type: 'BROADCAST',
                title: title,
                message: message,
                metadata: { senderId: session.user.id },
                createdAt: new Date(),
            })
        );

        await Promise.all(pusherPromises);

        return NextResponse.json({ success: true, count: notifications.length });
    } catch (error) {
        console.error('Error sending broadcast:', error);
        return NextResponse.json({ error: 'Failed to send broadcast' }, { status: 500 });
    }
}
