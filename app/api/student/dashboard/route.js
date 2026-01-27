import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'STUDENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const student = await prisma.student.findUnique({
            where: { userId: session.user.id },
            include: {
                bus: true,
                route: true,
                school: true,
            }
        });

        if (!student) {
            return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
        }

        // Get next scheduled trip for this bus
        const nextTrip = await prisma.trip.findFirst({
            where: {
                busId: student.busId,
                status: 'SCHEDULED',
                startTime: { gte: new Date() }
            },
            include: {
                driver: {
                    include: {
                        user: {
                            select: { name: true }
                        }
                    }
                }
            },
            orderBy: { startTime: 'asc' }
        });

        // Get current ongoing trip if any
        const activeTrip = await prisma.trip.findFirst({
            where: {
                busId: student.busId,
                status: 'ONGOING'
            }
        });

        // Get attendance history
        const history = await prisma.attendance.findMany({
            where: { studentId: student.id },
            include: {
                trip: {
                    include: {
                        route: true,
                        bus: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        return NextResponse.json({
            student,
            nextTrip,
            activeTrip,
            history
        });

    } catch (error) {
        console.error('Error fetching student dashboard:', error);
        return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
    }
}
