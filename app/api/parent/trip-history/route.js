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

        // Get all passenger IDs for this guardian
        const passengers = await prisma.passenger.findMany({
            where: { guardianId: session.user.id },
            select: { id: true, busId: true },
        });

        const busIds = [...new Set(passengers.map(s => s.busId).filter(Boolean))];

        // Get trips for all buses assigned to this guardian's passengers
        const trips = await prisma.trip.findMany({
            where: {
                busId: { in: busIds },
            },
            include: {
                bus: true,
                attendanceRecords: {
                    where: {
                        passengerId: { in: passengers.map(s => s.id) },
                    },
                },
            },
            orderBy: {
                scheduledStart: 'desc',
            },
            take: 20,
        });

        return NextResponse.json({ trips });
    } catch (error) {
        console.error('Error fetching trip history:', error);
        return NextResponse.json({ error: 'Failed to fetch trip history' }, { status: 500 });
    }
}
