import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { busId, driverId, routeId, startTime } = await request.json();

        if (!busId || !driverId) {
            return NextResponse.json({ error: 'Bus ID and Driver ID are required' }, { status: 400 });
        }

        const trip = await prisma.trip.create({
            data: {
                busId,
                driverId,
                routeId: routeId || null,
                organizationId: session.user.organizationId,
                scheduledStart: startTime ? new Date(startTime) : new Date(),
                status: 'SCHEDULED',
            },
        });

        // Notify driver
        const driver = await prisma.driver.findUnique({ where: { id: driverId }, include: { user: true } });
        await prisma.notification.create({
            data: {
                userId: driver.userId,
                type: 'TRIP_STARTED',
                title: 'New Trip Scheduled',
                message: `A new trip has been scheduled for you.`,
            }
        });

        return NextResponse.json({ trip });
    } catch (error) {
        console.error('Error scheduling trip:', error);
        return NextResponse.json({ error: 'Failed to schedule trip' }, { status: 500 });
    }
}

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const trips = await prisma.trip.findMany({
            where: { organizationId: session.user.organizationId },
            include: {
                bus: true,
                driver: {
                    include: {
                        user: {
                            select: { name: true }
                        }
                    }
                },
                route: true,
            },
            orderBy: {
                scheduledStart: 'desc',
            },
        });

        return NextResponse.json({ trips });
    } catch (error) {
        console.error('Error fetching trips:', error);
        return NextResponse.json({ error: 'Failed to fetch trips' }, { status: 500 });
    }
}
