import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { optimizeRoute, calculateArrivalTimes } from '@/lib/googleMapsService';

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { busId, driverId, scheduleType, operatingDays, departureTime, returnTime, date } = await request.json();

        if (!busId) {
            return NextResponse.json({
                error: 'Bus ID is required'
            }, { status: 400 });
        }

        // Get bus details and check if it has a driver
        const bus = await prisma.bus.findUnique({
            where: { id: busId },
            include: {
                driver: {
                    include: {
                        user: true
                    }
                }
            }
        });

        if (!bus) {
            return NextResponse.json({
                error: 'Bus not found'
            }, { status: 404 });
        }

        // Use provided driverId or fall back to bus's assigned driver
        const finalDriverId = driverId || bus.driverId;

        if (!finalDriverId) {
            return NextResponse.json({
                error: 'No driver assigned. Please assign a driver to the bus or select one manually.'
            }, { status: 400 });
        }

        // Validate schedule type requirements
        if (scheduleType === 'RECURRING' && (!Array.isArray(operatingDays) || operatingDays.length === 0)) {
            return NextResponse.json({
                error: 'Operating days are required for recurring schedules'
            }, { status: 400 });
        }

        if (scheduleType === 'ONE_TIME' && !date) {
            return NextResponse.json({
                error: 'Date is required for one-time schedules'
            }, { status: 400 });
        }

        // Fetch students assigned to this bus
        const students = await prisma.passenger.findMany({
            where: {
                busId,
                organizationId: session.user.organizationId,
                isActive: true
            },
            select: {
                id: true,
                name: true,
                address: true,
                lat: true,
                lng: true
            }
        });

        if (students.length === 0) {
            return NextResponse.json({
                error: 'No students assigned to this bus. Please assign students before creating a schedule.'
            }, { status: 400 });
        }

        // Auto-generate route from student addresses
        let route;
        try {
            // Get organization address as starting point
            const organization = await prisma.organization.findUnique({
                where: { id: session.user.organizationId },
                select: { lat: true, lng: true, address: true, name: true }
            });

            const waypoints = students.map(s => ({ lat: s.lat, lng: s.lng }));

            // Optimize route using Google Maps
            const optimized = await optimizeRoute(
                waypoints,
                organization?.lat && organization?.lng ? { lat: organization.lat, lng: organization.lng } : null,
                null
            );

            // Calculate arrival times
            const arrivalTimes = calculateArrivalTimes(optimized.legs, departureTime);

            // Build stops array
            const stops = [];

            // Add organization as first stop if available
            if (organization?.lat && organization?.lng) {
                stops.push({
                    order: 0,
                    stopName: organization.name || 'School',
                    address: organization.address,
                    lat: organization.lat,
                    lng: organization.lng,
                    estimatedTime: departureTime,
                    passengerId: null
                });
            }

            // Add student stops in optimized order (if optimization succeeded)
            if (optimized && optimized.order && Array.isArray(optimized.order)) {
                optimized.order.forEach((waypointIndex, idx) => {
                    const student = students[waypointIndex];
                    stops.push({
                        order: stops.length,
                        stopName: student.name,
                        address: student.address,
                        lat: student.lat,
                        lng: student.lng,
                        estimatedTime: arrivalTimes[idx],
                        passengerId: student.id
                    });
                });
            } else {
                // Fallback: add students in database order if optimization failed
                console.warn('Route optimization failed, using database order');
                students.forEach((student, idx) => {
                    stops.push({
                        order: stops.length,
                        stopName: student.name,
                        address: student.address,
                        lat: student.lat,
                        lng: student.lng,
                        estimatedTime: departureTime,
                        passengerId: student.id
                    });
                });
            }

            // Add organization as final stop (return to school) if available
            if (organization?.lat && organization?.lng) {
                stops.push({
                    order: stops.length,
                    stopName: `${organization.name || 'School'} (Return)`,
                    address: organization.address,
                    lat: organization.lat,
                    lng: organization.lng,
                    estimatedTime: returnTime || departureTime,
                    passengerId: null
                });
            }

            // Create route
            const bus = await prisma.bus.findUnique({
                where: { id: busId },
                select: { busNumber: true }
            });

            route = await prisma.route.create({
                data: {
                    name: `${bus.busNumber} - Auto Route`,
                    description: `Auto-generated route for ${students.length} students`,
                    busId,
                    organizationId: session.user.organizationId,
                    stops,
                    startTime: departureTime,
                    endTime: returnTime || departureTime,
                    operatingDays: operatingDays || [],
                    routeType: 'PICKUP'
                }
            });

        } catch (error) {
            console.error('Error generating route:', error);
            // Fallback: create simple route without optimization
            const stops = students.map((student, idx) => ({
                order: idx,
                stopName: student.name,
                address: student.address,
                lat: student.lat,
                lng: student.lng,
                estimatedTime: departureTime,
                passengerId: student.id
            }));

            route = await prisma.route.create({
                data: {
                    name: `Bus Route - ${new Date().toLocaleDateString()}`,
                    description: `Route for ${students.length} students`,
                    busId,
                    organizationId: session.user.organizationId,
                    stops,
                    startTime: departureTime,
                    endTime: returnTime || departureTime,
                    operatingDays: operatingDays || [],
                    routeType: 'PICKUP'
                }
            });
        }

        // Create schedule
        const schedule = await prisma.schedule.create({
            data: {
                routeId: route.id,
                busId,
                driverId: finalDriverId,
                boardingTime: departureTime,
                operatingDays: operatingDays || [],
                isActive: true,
                organizationId: session.user.organizationId,
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

        // Auto-generate trips based on schedule type
        const generatedTrips = [];

        if (scheduleType === 'ONE_TIME' && date) {
            // Create single trip for one-time schedule
            const scheduledDate = new Date(date);
            const [hours, minutes] = departureTime.split(':');
            scheduledDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            const trip = await prisma.trip.create({
                data: {
                    busId,
                    driverId: finalDriverId,
                    routeId: route.id,
                    scheduleId: schedule.id,
                    organizationId: session.user.organizationId,
                    scheduledStart: scheduledDate,
                    status: 'SCHEDULED',
                }
            });
            generatedTrips.push(trip);
        } else if (scheduleType === 'RECURRING' && operatingDays && operatingDays.length > 0) {
            // Generate trips for the next 7 days for recurring schedules
            const today = new Date();
            const daysMap = {
                'SUNDAY': 0, 'MONDAY': 1, 'TUESDAY': 2, 'WEDNESDAY': 3,
                'THURSDAY': 4, 'FRIDAY': 5, 'SATURDAY': 6
            };

            for (let i = 0; i < 7; i++) {
                const targetDate = new Date(today);
                targetDate.setDate(today.getDate() + i);
                const dayOfWeek = targetDate.getDay();

                // Check if this day is in operating days
                const dayName = Object.keys(daysMap).find(key => daysMap[key] === dayOfWeek);
                if (operatingDays.includes(dayName)) {
                    const [hours, minutes] = departureTime.split(':');
                    targetDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

                    const trip = await prisma.trip.create({
                        data: {
                            busId,
                            driverId: finalDriverId,
                            routeId: route.id,
                            scheduleId: schedule.id,
                            organizationId: session.user.organizationId,
                            scheduledStart: targetDate,
                            status: 'SCHEDULED',
                        }
                    });
                    generatedTrips.push(trip);
                }
            }
        }

        return NextResponse.json({
            schedule,
            message: `Schedule created successfully! ${generatedTrips.length} trip(s) generated.`,
            tripsGenerated: generatedTrips.length
        });
    } catch (error) {
        console.error('Error creating schedule:', error);
        return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 });
    }
}

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const schedules = await prisma.schedule.findMany({
            where: { organizationId: session.user.organizationId },
            include: {
                route: true,
                bus: true,
                driver: {
                    include: {
                        user: {
                            select: { name: true, email: true }
                        }
                    }
                },
                _count: {
                    select: { trips: true }
                }
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json({ schedules });
    } catch (error) {
        console.error('Error fetching schedules:', error);
        return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 });
    }
}
