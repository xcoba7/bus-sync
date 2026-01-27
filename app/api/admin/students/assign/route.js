import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { busId, studentIds } = await request.json();

        if (!Array.isArray(studentIds) || studentIds.length === 0) {
            return NextResponse.json({ error: 'Student IDs array is required' }, { status: 400 });
        }

        // If busId is provided, verify it belongs to the organization
        if (busId) {
            const bus = await prisma.bus.findFirst({
                where: {
                    id: busId,
                    organizationId: session.user.organizationId
                },
                select: {
                    capacity: true,
                    _count: {
                        select: { passengers: true }
                    }
                }
            });

            if (!bus) {
                return NextResponse.json({ error: 'Bus not found' }, { status: 404 });
            }

            // Check capacity
            const currentCount = bus._count.passengers;
            const newCount = currentCount + studentIds.length;

            if (newCount > bus.capacity) {
                return NextResponse.json({
                    error: `Cannot assign ${studentIds.length} students. Bus capacity: ${bus.capacity}, currently assigned: ${currentCount}`
                }, { status: 400 });
            }
        }

        // Update students' busId
        await prisma.passenger.updateMany({
            where: {
                id: { in: studentIds },
                organizationId: session.user.organizationId
            },
            data: {
                busId: busId || null
            }
        });

        return NextResponse.json({
            message: busId
                ? `Successfully assigned ${studentIds.length} student(s) to bus`
                : `Successfully unassigned ${studentIds.length} student(s) from bus`
        });
    } catch (error) {
        console.error('Error assigning students:', error);
        return NextResponse.json({ error: 'Failed to assign students' }, { status: 500 });
    }
}
