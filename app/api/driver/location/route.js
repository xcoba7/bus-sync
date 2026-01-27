import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'DRIVER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { lat, lng, speed, heading, accuracy } = await request.json();

        if (!session.user.driverId) {
            return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
        }

        const activeTrip = await prisma.trip.findFirst({
            where: {
                driverId: session.user.driverId,
                status: 'ONGOING',
            },
        });

        if (!activeTrip) {
            return NextResponse.json({ error: 'No active trip' }, { status: 400 });
        }

        await prisma.$transaction([
            prisma.trip.update({
                where: { id: activeTrip.id },
                data: {
                    currentLat: lat,
                    currentLng: lng,
                    lastLocationTime: new Date(),
                },
            }),
            prisma.busLocationHistory.create({
                data: {
                    tripId: activeTrip.id,
                    lat,
                    lng,
                    speed,
                    heading,
                    accuracy,
                },
            }),
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating location:', error);
        return NextResponse.json({ error: 'Failed to update location' }, { status: 500 });
    }
}
