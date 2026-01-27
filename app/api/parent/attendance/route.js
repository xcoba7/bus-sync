import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'PARENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();
        const { passengerId, date, reason } = data;

        if (!passengerId || !date) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Verify passenger belongs to guardian
        const passenger = await prisma.passenger.findUnique({
            where: { id: passengerId },
            include: { bus: true }
        });

        if (!passenger || passenger.guardianId !== session.user.id) {
            return NextResponse.json({ error: 'Passenger not found or unauthorized' }, { status: 404 });
        }

        if (!passenger.busId) {
            return NextResponse.json({ error: 'Passenger has no assigned bus' }, { status: 400 });
        }

        // Parse date range for the day
        const queryDate = new Date(date);
        const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));

        // Find scheduled trips for the bus on that day
        const trips = await prisma.trip.findMany({
            where: {
                busId: passenger.busId,
                scheduledStart: {
                    gte: startOfDay,
                    lte: endOfDay
                },
                status: 'SCHEDULED'
            }
        });

        if (trips.length === 0) {
            return NextResponse.json({ message: 'No scheduled trips found for this date. Please contact administration if this is an error.' }, { status: 404 });
        }

        // Create/Update attendance for each trip
        const updates = await Promise.all(trips.map(trip => {
            return prisma.attendance.upsert({
                where: {
                    tripId_passengerId: {
                        tripId: trip.id,
                        passengerId: passenger.id
                    }
                },
                update: {
                    status: 'ABSENT',
                    notes: reason || 'Parent reported absence'
                },
                create: {
                    tripId: trip.id,
                    passengerId: passenger.id,
                    status: 'ABSENT',
                    notes: reason || 'Parent reported absence'
                }
            });
        }));

        // Send a notification to the driver (optional but good)
        // We'll skip complex notification logic for now to keep it simple, 
        // but typically we'd create a Notification record for the driver.

        return NextResponse.json({
            success: true,
            message: `Absence reported for ${trips.length} trip(s)`,
            count: trips.length
        });

    } catch (error) {
        console.error('Error reporting absence:', error);
        return NextResponse.json({ error: 'Failed to report absence' }, { status: 500 });
    }
}
