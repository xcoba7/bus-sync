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
            return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
        }

        const trips = await prisma.trip.findMany({
            where: {
                driverId: session.user.driverId,
                status: 'SCHEDULED',
            },
            include: {
                route: true,
                bus: true
            },
            orderBy: {
                scheduledStart: 'asc'
            }
        });

        return NextResponse.json({ trips });
    } catch (error) {
        console.error('Error fetching driver schedules:', error);
        return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 });
    }
}
