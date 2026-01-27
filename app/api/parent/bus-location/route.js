import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'PARENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const busId = searchParams.get('busId');
        const studentId = searchParams.get('studentId');

        if (!busId) {
            return NextResponse.json({ error: 'Bus ID required' }, { status: 400 });
        }

        // Get the active trip for this bus with route and stops
        const activeTrip = await prisma.trip.findFirst({
            where: {
                busId,
                status: 'ONGOING',
            },
            include: {
                route: true,
                driver: {
                    include: {
                        user: {
                            select: { name: true, phone: true }
                        }
                    }
                },
                bus: {
                    select: {
                        busNumber: true
                    }
                }
            },
            orderBy: {
                scheduledStart: 'desc',
            },
        });

        if (!activeTrip) {
            return NextResponse.json({ location: null, trip: null });
        }

        // Use bus location from bus record or trip record
        const busLat = activeTrip.bus?.currentLat || activeTrip.currentLat;
        const busLng = activeTrip.bus?.currentLng || activeTrip.currentLng;

        // Find the student's stop if studentId is provided
        let studentStop = null;
        if (studentId && activeTrip.route?.stops) {
            studentStop = activeTrip.route.stops.find(stop => stop.passengerId === studentId);
        }

        return NextResponse.json({
            location: busLat && busLng ? {
                lat: busLat,
                lng: busLng,
                timestamp: activeTrip.lastLocationTime || activeTrip.updatedAt,
            } : null,
            trip: {
                id: activeTrip.id,
                status: activeTrip.status,
                routeName: activeTrip.route?.name,
                busNumber: activeTrip.bus?.busNumber,
                route: activeTrip.route,
                studentStop: studentStop,
                driver: activeTrip.driver ? {
                    name: activeTrip.driver.user.name,
                    phone: activeTrip.driver.user.phone
                } : null
            }
        });
    } catch (error) {
        console.error('Error fetching bus location:', error);
        return NextResponse.json({ error: 'Failed to fetch bus location' }, { status: 500 });
    }
}
