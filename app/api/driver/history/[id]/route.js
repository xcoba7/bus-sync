import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(req, { params }) {
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

        const { id } = await params;

        // Fetch detailed trip data
        const trip = await prisma.trip.findUnique({
            where: { id },
            include: {
                route: {
                    select: {
                        name: true,
                        description: true,
                        stops: true
                    }
                },
                bus: {
                    select: {
                        busNumber: true,
                        model: true,
                        year: true
                    }
                },
                driver: {
                    include: {
                        user: {
                            select: {
                                name: true
                            }
                        }
                    }
                },
                attendanceRecords: {
                    include: {
                        passenger: {
                            select: {
                                name: true,
                                address: true
                            }
                        }
                    },
                    orderBy: {
                        boardedAt: 'asc'
                    }
                },
                _count: {
                    select: {
                        locationHistory: true
                    }
                }
            }
        });

        if (!trip) {
            return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
        }

        // Verify this trip belongs to the driver
        if (trip.driverId !== user.driver.id) {
            return NextResponse.json({ error: 'Unauthorized access to this trip' }, { status: 403 });
        }
        
        console.log({trip})
        return NextResponse.json({ trip });
    } catch (error) {
        console.error('Error fetching trip details:', error);
        return NextResponse.json({ error: 'Failed to fetch trip details' }, { status: 500 });
    }
}
