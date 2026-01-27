import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request, { params }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const { newDate } = await request.json();

        if (!newDate) {
            return NextResponse.json({ error: 'New date is required' }, { status: 400 });
        }

        // Get the schedule
        const schedule = await prisma.schedule.findUnique({
            where: { id },
            include: { route: true, bus: true }
        });

        if (!schedule) {
            return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
        }

        if (schedule.organizationId !== session.user.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const selectedDate = new Date(newDate);

        if (schedule.scheduleType === 'RECURRING') {
            // For recurring schedules, delete existing SCHEDULED trips and generate new ones
            await prisma.trip.deleteMany({
                where: {
                    scheduleId: id,
                    status: 'SCHEDULED'
                }
            });

            // Generate new trips for the next 7 days from the new date
            const tripPromises = [];
            for (let i = 0; i < 7; i++) {
                const tripDate = new Date(selectedDate);
                tripDate.setDate(tripDate.getDate() + i);

                // Check if this day matches the operating days
                const dayName = tripDate.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
                if (schedule.operatingDays.length === 0 || schedule.operatingDays.includes(dayName)) {
                    const scheduledTime = new Date(tripDate);
                    const [hours, minutes] = schedule.departureTime.split(':');
                    scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

                    tripPromises.push(
                        prisma.trip.create({
                            data: {
                                busId: schedule.busId,
                                driverId: schedule.driverId,
                                routeId: schedule.routeId,
                                scheduleId: schedule.id,
                                organizationId: schedule.organizationId,
                                status: 'SCHEDULED',
                                scheduledStart: scheduledTime
                            }
                        })
                    );
                }
            }

            await Promise.all(tripPromises);

            return NextResponse.json({
                message: 'Schedule rescheduled successfully',
                tripsGenerated: tripPromises.length
            });
        } else {
            // For ONE_TIME schedules, update the single trip
            const trip = await prisma.trip.findFirst({
                where: {
                    scheduleId: id,
                    status: 'SCHEDULED'
                }
            });

            if (trip) {
                const scheduledTime = new Date(selectedDate);
                const [hours, minutes] = schedule.departureTime.split(':');
                scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

                await prisma.trip.update({
                    where: { id: trip.id },
                    data: {
                        scheduledStart: scheduledTime
                    }
                });
            }

            return NextResponse.json({
                message: 'Trip rescheduled successfully'
            });
        }
    } catch (error) {
        console.error('Error rescheduling schedule:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
