import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
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

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const status = searchParams.get('status') || 'COMPLETED'; // Default to COMPLETED

        // Build where clause
        const where = {
            driverId: user.driver.id,
            status, // Filter by status
            ...(startDate && {
                actualStart: {
                    gte: new Date(startDate)
                }
            }),
            ...(endDate && {
                actualStart: {
                    lte: new Date(endDate)
                }
            })
        };

        // Fetch trips
        const [trips, totalCount] = await Promise.all([
            prisma.trip.findMany({
                where,
                include: {
                    route: true,
                    bus: true,
                    _count: {
                        select: { attendanceRecords: true }
                    }
                },
                orderBy: {
                    actualEnd: 'desc' // Order by completion time
                },
                skip,
                take: limit
            }),
            prisma.trip.count({ where })
        ]);

        // Calculate stats
        const completedTrips = await prisma.trip.findMany({
            where: {
                driverId: user.driver.id,
                status: 'COMPLETED'
            },
            include: {
                _count: {
                    select: { attendanceRecords: true }
                }
            }
        });

        const totalTrips = completedTrips.length;
        const totalDistance = completedTrips.reduce((sum, trip) => sum + (trip.distanceCovered || 0), 0);
        const avgPassengers = totalTrips > 0
            ? Math.round(completedTrips.reduce((sum, trip) => sum + trip._count.attendanceRecords, 0) / totalTrips)
            : 0;

        const stats = {
            totalTrips,
            totalDistance: Math.round(totalDistance * 10) / 10,
            avgPassengers
        };

        return NextResponse.json({
            trips,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: page,
            totalCount,
            stats
        });
    } catch (error) {
        console.error('Error fetching trip history:', error);
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }
}
