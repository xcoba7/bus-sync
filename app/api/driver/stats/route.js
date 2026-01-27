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
            include: { driver: true }
        });

        if (!user || !user.driver) {
            return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Calculate trips today
        const tripsToday = await prisma.trip.count({
            where: {
                driverId: user.driver.id,
                actualStart: {
                    gte: today,
                    lt: tomorrow
                }
            }
        });

        // Calculate total trips
        const totalTrips = await prisma.trip.count({
            where: {
                driverId: user.driver.id,
                status: 'COMPLETED'
            }
        });

        // Calculate total passengers served
        const totalPassengers = await prisma.attendance.count({
            where: {
                trip: {
                    driverId: user.driver.id
                },
                boardedAt: {
                    not: null
                }
            }
        });

        // Calculate total distance
        const trips = await prisma.trip.findMany({
            where: {
                driverId: user.driver.id,
                status: 'COMPLETED',
                distanceCovered: {
                    not: null
                }
            },
            select: {
                distanceCovered: true
            }
        });

        const totalDistance = trips.reduce((sum, trip) => sum + (trip.distanceCovered || 0), 0);

        const stats = {
            tripsToday,
            totalTrips,
            totalPassengers,
            totalDistance: Math.round(totalDistance * 10) / 10 // Round to 1 decimal
        };

        return NextResponse.json({ stats });
    } catch (error) {
        console.error('Error fetching driver stats:', error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
