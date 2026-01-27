import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request, { params }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const schedule = await prisma.schedule.findUnique({
            where: {
                id,
                organizationId: session.user.organizationId
            },
            include: {
                route: {
                    include: {
                        passengers: true
                    }
                },
                bus: true,
                driver: {
                    include: {
                        user: {
                            select: { name: true, email: true, phone: true }
                        }
                    }
                },
                trips: {
                    orderBy: { scheduledStart: 'desc' },
                    take: 10
                }
            }
        });

        if (!schedule) {
            return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
        }

        return NextResponse.json({ schedule });
    } catch (error) {
        console.error('Error fetching schedule:', error);
        return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
    }
}

export async function PATCH(request, { params }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const { busId, driverId, departureTime, operatingDays, scheduleType } = await request.json();

        // Verify schedule belongs to organization
        const existingSchedule = await prisma.schedule.findUnique({
            where: { id }
        });

        if (!existingSchedule || existingSchedule.organizationId !== session.user.organizationId) {
            return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
        }

        const schedule = await prisma.schedule.update({
            where: { id },
            data: {
                ...(busId && { busId }),
                ...(driverId && { driverId }),
                ...(departureTime && { boardingTime: departureTime }),
                ...(operatingDays && { operatingDays }),
            },
            include: {
                route: true,
                bus: true,
                driver: {
                    include: {
                        user: {
                            select: { name: true, email: true }
                        }
                    }
                }
            }
        });

        return NextResponse.json({ schedule, message: 'Schedule updated successfully' });
    } catch (error) {
        console.error('Error updating schedule:', error);
        return NextResponse.json({ error: 'Failed to update schedule' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Verify schedule belongs to organization
        const existingSchedule = await prisma.schedule.findUnique({
            where: { id },
            include: {
                trips: {
                    where: {
                        status: { in: ['SCHEDULED', 'ONGOING'] }
                    }
                }
            }
        });

        if (!existingSchedule || existingSchedule.organizationId !== session.user.organizationId) {
            return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
        }

        // Cancel all unfinished trips before deleting schedule
        if (existingSchedule.trips.length > 0) {
            await prisma.trip.updateMany({
                where: {
                    scheduleId: id,
                    status: { in: ['SCHEDULED', 'ONGOING'] }
                },
                data: {
                    status: 'CANCELLED'
                }
            });
        }

        // Now delete the schedule (completed trips will remain for history)
        await prisma.schedule.delete({
            where: { id }
        });

        return NextResponse.json({
            message: 'Schedule deleted successfully',
            tripsCancelled: existingSchedule.trips.length
        });
    } catch (error) {
        console.error('Error deleting schedule:', error);
        return NextResponse.json({ error: 'Failed to delete schedule' }, { status: 500 });
    }
}
