import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateRouteDistance } from '@/lib/googleMapsService';

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'DRIVER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { tripId } = await request.json().catch(() => ({}));

        if (!session.user.driverId) {
            return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
        }

        const driver = await prisma.driver.findUnique({
            where: { id: session.user.driverId },
            include: { buses: { include: { passengers: true } } },
        });

        if (!driver || !driver.buses[0]) {
            return NextResponse.json({ error: 'No bus assigned to this driver' }, { status: 400 });
        }

        // Find a SCHEDULED trip for this driver
        const scheduledTrip = await prisma.trip.findFirst({
            where: {
                id: tripId || undefined,
                driverId: session.user.driverId,
                status: 'SCHEDULED',
            },
            include: {
                attendanceRecords: true,
                route: true
            }
        });

        if (!scheduledTrip) {
            return NextResponse.json({ error: 'No scheduled trip found for activation' }, { status: 404 });
        }

        const passengers = driver.buses[0].passengers;
        const boardedPassengerIds = scheduledTrip.attendanceRecords
            .filter(a => a.boardedAt)
            .map(a => a.passengerId);

        const allBoarded = passengers.every(s => boardedPassengerIds.includes(s.id));

        if (!allBoarded) {
            return NextResponse.json({
                error: 'Cannot start trip. Not all assigned passengers have boarded.',
                missingPassengers: passengers.filter(s => !boardedPassengerIds.includes(s.id)).map(s => s.name)
            }, { status: 400 });
        }

        // Get organization location for initial position
        const organization = await prisma.organization.findUnique({
            where: { id: session.user.organizationId },
            select: { lat: true, lng: true, name: true }
        });

        // Update trip to ONGOING and set actualStart and initial location
        const trip = await prisma.trip.update({
            where: { id: scheduledTrip.id },
            data: {
                status: 'ONGOING',
                actualStart: new Date(),
                currentLat: organization?.lat || 9.0765, // Default to Abuja fallback if missing
                currentLng: organization?.lng || 7.3986
            },
        });

        // Get route stops for distance/ETA calculation
        const routeStops = scheduledTrip.route?.stops || [];

        // Calculate distance and ETA for each passenger using Google Maps
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

        // Create notifications for all guardians with real distance and ETA
        const notificationPromises = passengers.map(async (passenger) => {
            // Find passenger's stop in route
            const passengerStop = routeStops.find(
                stop => stop.passengerId === passenger.id
            );

            let distanceKm = 0;
            let etaMinutes = 15; // Default fallback

            if (passengerStop && organization?.lat && organization?.lng && apiKey) {
                try {
                    // Get distance and time from Google Maps
                    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${organization.lat},${organization.lng}&destination=${passengerStop.lat},${passengerStop.lng}&key=${apiKey}`;
                    const response = await fetch(url);
                    const data = await response.json();

                    if (data.status === 'OK' && data.routes[0]?.legs[0]) {
                        const leg = data.routes[0].legs[0];
                        distanceKm = (leg.distance?.value / 1000).toFixed(1); // Convert meters to km
                        etaMinutes = Math.round(leg.duration?.value / 60); // Convert seconds to minutes
                    }
                } catch (error) {
                    console.error('Error calculating distance/ETA:', error);
                    // Will use fallback values
                }
            }

            console.log(`📧 Creating notification for ${passenger.name} (guardianId: ${passenger.guardianId})`);

            return prisma.notification.create({
                data: {
                    userId: passenger.guardianId,
                    type: 'TRIP_STARTED',
                    title: 'Bus Departed! 🚌',
                    message: `Bus ${driver.buses[0].busNumber} has started the trip. Your child ${passenger.name} is on board.\n\nEstimated arrival: ${etaMinutes} minutes\nDistance: ${distanceKm} km`,
                    metadata: {
                        tripId: trip.id,
                        busNumber: driver.buses[0].busNumber,
                        routeName: scheduledTrip.route?.name || 'Route',
                        eta: etaMinutes,
                        distance: distanceKm,
                        passengerName: passenger.name
                    }
                },
            });
        });

        const createdNotifications = await Promise.all(notificationPromises);
        console.log(`✅ Created ${createdNotifications.length} notifications for trip start`);

        return NextResponse.json({ trip });
    } catch (error) {
        console.error('Error starting trip:', error);
        return NextResponse.json({ error: 'Failed to start trip' }, { status: 500 });
    }
}

export async function PATCH(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'DRIVER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!session.user.driverId) {
            return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
        }

        const { distanceCovered } = await request.json().catch(() => ({}));

        const driver = await prisma.driver.findUnique({
            where: { id: session.user.driverId },
            include: { buses: { include: { passengers: true } } },
        });

        const trip = await prisma.trip.findFirst({
            where: {
                driverId: session.user.driverId,
                status: 'ONGOING',
            },
            include: {
                route: true
            }
        });

        if (!trip) {
            return NextResponse.json({ error: 'No active trip' }, { status: 400 });
        }

        // Calculate distance from route data (server-side)
        let calculatedDistance = distanceCovered || 0;
        let estimatedDurationMinutes = 0;

        if (trip.routeId) {
            try {
                const route = await prisma.route.findUnique({
                    where: { id: trip.routeId },
                    select: { stops: true }
                });

                if (route?.stops && Array.isArray(route.stops) && route.stops.length >= 2) {
                    const origin = route.stops[0];
                    const destination = route.stops[route.stops.length - 1];
                    const waypoints = route.stops.slice(1, -1);

                    // Calculate distance and duration using Google Maps
                    const routeData = await calculateRouteDistance(origin, destination, waypoints);

                    if (routeData.distanceKm > 0) {
                        calculatedDistance = routeData.distanceKm;
                        estimatedDurationMinutes = routeData.durationMinutes;
                        console.log(`✅ Calculated route: ${routeData.distanceKm} km, ${routeData.durationMinutes} min`);
                    } else if (!distanceCovered) {
                        console.warn('⚠️ Could not calculate route distance, using 0');
                    }
                }
            } catch (error) {
                console.error('Error calculating route distance:', error);
                // Fall back to provided distance or 0
            }
        }

        // Validate trip duration
        const durationMinutes = (new Date() - new Date(trip.actualStart)) / (1000 * 60);

        if (durationMinutes < 0) {
            console.error('❌ Invalid trip duration: negative value');
            return NextResponse.json({ error: 'Invalid trip duration' }, { status: 400 });
        } else if (durationMinutes > 480) { // 8 hours
            console.warn(`⚠️ Unusually long trip duration: ${durationMinutes.toFixed(0)} minutes (${(durationMinutes / 60).toFixed(1)} hours)`);
        } else {
            console.log(`✅ Trip duration: ${durationMinutes.toFixed(0)} minutes`);
        }

        // Update trip with completion data
        const updatedTrip = await prisma.trip.update({
            where: { id: trip.id },
            data: {
                actualEnd: new Date(),
                status: 'COMPLETED',
                distanceCovered: calculatedDistance,
                estimatedDuration: estimatedDurationMinutes
            },
        });

        // Create notifications for all guardians
        const passengers = driver.buses[0].passengers;
        await Promise.all(
            passengers.map(passenger =>
                prisma.notification.create({
                    data: {
                        userId: passenger.guardianId,
                        type: 'TRIP_COMPLETED',
                        title: 'Trip Completed ✅',
                        message: `Bus ${driver.buses[0].busNumber} has completed the trip. ${passenger.name} has been dropped off safely.`,
                        metadata: {
                            tripId: trip.id,
                            busNumber: driver.buses[0].busNumber,
                            routeName: trip.route?.name || 'Route',
                            distanceCovered: distanceCovered || 0,
                            passengerName: passenger.name
                        }
                    },
                })
            )
        );

        return NextResponse.json({ trip: updatedTrip });
    } catch (error) {
        console.error('Error ending trip:', error);
        return NextResponse.json({ error: 'Failed to end trip' }, { status: 500 });
    }
}
