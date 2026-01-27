import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'DRIVER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!session.user.driverId) {
            return NextResponse.json({ route: null, passengers: [], activeTrip: null });
        }

        const driver = await prisma.driver.findUnique({
            where: { id: session.user.driverId },
            include: {
                buses: {
                    include: {
                        routes: true,
                        passengers: true,
                    },
                },
            },
        });

        if (!driver || !driver.buses[0]) {
            return NextResponse.json({ route: null, passengers: [], activeTrip: null });
        }

        const bus = driver.buses[0];

        const activeTrip = await prisma.trip.findFirst({
            where: {
                driverId: session.user.driverId,
                status: { in: ['SCHEDULED', 'ONGOING'] },
            },
            include: {
                attendanceRecords: true,
                route: true, // Include the route for this specific trip
            },
        });

        // Get route from active trip, or fall back to bus's first route
        let route = null;
        if (activeTrip && activeTrip.route) {
            route = activeTrip.route;
        } else if (bus.routes && bus.routes.length > 0) {
            route = bus.routes[0];
        }

        const passengersWithAttendance = bus.passengers.map(passenger => ({
            ...passenger,
            attendanceRecords: activeTrip ? activeTrip.attendanceRecords.filter(a => a.passengerId === passenger.id) : [],
        }));


        return NextResponse.json({
            route,
            passengers: passengersWithAttendance,
            activeTrip,
        });
    } catch (error) {
        console.error('Error fetching driver route:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}


