import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper function to get day of week name
function getDayName(date) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
}

// Helper function to parse boarding time and create DateTime
function createScheduledStartTime(boardingTime, targetDate) {
    // Parse time like "07:30 AM" or "14:30"
    const timeMatch = boardingTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!timeMatch) {
        throw new Error('Invalid boarding time format');
    }

    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const meridiem = timeMatch[3]?.toUpperCase();

    // Convert to 24-hour format if AM/PM is specified
    if (meridiem) {
        if (meridiem === 'PM' && hours !== 12) {
            hours += 12;
        } else if (meridiem === 'AM' && hours === 12) {
            hours = 0;
        }
    }

    const scheduledStart = new Date(targetDate);
    scheduledStart.setHours(hours, minutes, 0, 0);

    return scheduledStart;
}

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { targetDate } = await request.json();

        // Use provided date or default to today
        const dateToGenerate = targetDate ? new Date(targetDate) : new Date();
        const dayName = getDayName(dateToGenerate);

        // Get today's date at midnight for comparison
        const todayMidnight = new Date();
        todayMidnight.setHours(0, 0, 0, 0);

        // Fetch all active schedules for this organization
        const schedules = await prisma.schedule.findMany({
            where: {
                organizationId: session.user.organizationId,
                isActive: true,
            },
            include: {
                route: {
                    include: {
                        passengers: {
                            include: {
                                guardian: true
                            }
                        }
                    }
                },
                bus: true,
                driver: {
                    include: {
                        user: true
                    }
                }
            }
        });

        const generatedTrips = [];
        const notifications = [];

        for (const schedule of schedules) {
            // Check if this schedule operates on the target day
            const operatingDays = schedule.operatingDays;
            if (!operatingDays.includes(dayName)) {
                continue; // Skip this schedule
            }

            // Check if we already generated a trip for this schedule today
            const lastGenDate = schedule.lastGeneratedDate;
            if (lastGenDate) {
                const lastGenMidnight = new Date(lastGenDate);
                lastGenMidnight.setHours(0, 0, 0, 0);

                if (lastGenMidnight.getTime() === todayMidnight.getTime()) {
                    continue; // Already generated for today
                }
            }

            // Create scheduled start time
            const scheduledStart = createScheduledStartTime(schedule.boardingTime, dateToGenerate);

            // Create the trip
            const trip = await prisma.trip.create({
                data: {
                    busId: schedule.busId,
                    driverId: schedule.driverId,
                    routeId: schedule.routeId,
                    scheduleId: schedule.id,
                    organizationId: session.user.organizationId,
                    scheduledStart,
                    status: 'SCHEDULED',
                }
            });

            generatedTrips.push(trip);

            // Create notification for driver
            notifications.push({
                userId: schedule.driver.userId,
                type: 'TRIP_STARTED',
                title: 'New Trip Scheduled',
                message: `Trip on ${schedule.route.name} at ${schedule.boardingTime}`,
            });

            // Create notifications for all passengers' guardians
            for (const passenger of schedule.route.passengers) {
                if (passenger.guardianId) {
                    notifications.push({
                        userId: passenger.guardianId,
                        type: 'TRIP_STARTED',
                        title: `Bus Schedule for ${passenger.name}`,
                        message: `Pickup at ${schedule.boardingTime} on ${schedule.route.name}`,
                    });
                }
            }

            // Update schedule's lastGeneratedDate
            await prisma.schedule.update({
                where: { id: schedule.id },
                data: { lastGeneratedDate: new Date() }
            });
        }

        // Bulk create all notifications
        if (notifications.length > 0) {
            await prisma.notification.createMany({
                data: notifications
            });
        }

        return NextResponse.json({
            message: `Generated ${generatedTrips.length} trips and sent ${notifications.length} notifications`,
            trips: generatedTrips,
            notificationCount: notifications.length
        });
    } catch (error) {
        console.error('Error generating trips:', error);
        return NextResponse.json({ error: 'Failed to generate trips: ' + error.message }, { status: 500 });
    }
}
