import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { pusher } from '@/lib/pusher';

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !['ADMIN', 'DRIVER'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { message, metadata } = await request.json();

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        // Find all admins in the organization to notify
        const admins = await prisma.user.findMany({
            where: {
                organizationId: session.user.organizationId,
                role: 'ADMIN'
            },
            select: { id: true }
        });

        // Create notification data for admins
        const notifications = admins.map(admin => ({
            userId: admin.id,
            type: 'EMERGENCY_ALERT',
            title: 'EMERGENCY ALERT! 🚨',
            message: `${session.user.name}: ${message}`,
            metadata: {
                ...metadata,
                senderId: session.user.id,
                senderRole: session.user.role
            }
        }));

        // Also notify the driver if sent by admin (optional case)
        // or notify all drivers if it's a general emergency (optional)

        await prisma.notification.createMany({
            data: notifications
        });

        // Trigger real-time notifications via Pusher
        const pusherPromises = admins.map(admin =>
            pusher.trigger(`notifications-${admin.id}`, 'new-notification', {
                type: 'EMERGENCY_ALERT',
                title: 'EMERGENCY ALERT! 🚨',
                message: `${session.user.name}: ${message}`,
                metadata: {
                    ...metadata,
                    senderId: session.user.id,
                },
                createdAt: new Date(),
            })
        );

        await Promise.all(pusherPromises);

        return NextResponse.json({ success: true, count: notifications.length });
    } catch (error) {
        console.error('Error sending emergency alert:', error);
        return NextResponse.json({ error: 'Failed to send emergency alert' }, { status: 500 });
    }
}
