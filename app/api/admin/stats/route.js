import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const organizationId = session.user.organizationId;

        const [busCount, passengerCount, driverCount, activeTripCount, organization] = await Promise.all([
            prisma.bus.count({ where: { organizationId } }),
            prisma.passenger.count({ where: { organizationId } }),
            prisma.user.count({ where: { organizationId, role: 'DRIVER' } }),
            prisma.trip.count({ where: { organizationId, status: 'ONGOING' } }),
            prisma.organization.findUnique({ where: { id: organizationId }, select: { type: true, name: true, lat: true, lng: true } })
        ]);

        // Get active buses with their current location
        const activeTripsData = await prisma.trip.findMany({
            where: {
                organizationId,
                status: 'ONGOING',
            },
            include: {
                bus: true,
            },
        });

        const activeBuses = activeTripsData.map(trip => ({
            id: trip.id,
            busNumber: trip.bus.busNumber,
            currentLat: trip.currentLat,
            currentLng: trip.currentLng,
            lastUpdate: trip.lastLocationTime || trip.updatedAt,
        }));

        // Get utilization stats (trips in the last 24h)
        const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentTrips = await prisma.trip.findMany({
            where: {
                organizationId,
                scheduledStart: { gte: last24h },
            },
            select: {
                scheduledStart: true,
                distanceCovered: true,
            }
        });

        // Group trips by hour for utilization chart
        const utilizationData = Array(24).fill(0).map((_, i) => ({
            hour: i,
            count: 0
        }));

        recentTrips.forEach(trip => {
            if (trip.scheduledStart) {
                const hour = new Date(trip.scheduledStart).getHours();
                utilizationData[hour].count++;
            }
        });

        // Calculate total distance covered in last 24h
        const totalDistance = recentTrips.reduce((acc, trip) => acc + (trip.distanceCovered || 0), 0);

        return NextResponse.json({
            organizationType: organization?.type || 'OTHER',
            organizationName: organization?.name || 'Authorized Entity',
            organizationCoords: {
                lat: organization?.lat || 9.0765, // Abuja default
                lng: organization?.lng || 7.3986
            },
            stats: {
                buses: busCount,
                passengers: passengerCount,
                drivers: driverCount,
                activeTrips: activeTripCount,
                totalDistance: totalDistance.toFixed(1),
                avgEta: 12.4, // Placeholder for now or calculate from attendance records
            },
            activeBuses,
            utilizationData: utilizationData.map(d => d.count),
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
