import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { optimizeRoute, calculateArrivalTimes } from '@/lib/googleMapsService';

/**
 * Generate route stops from passengers assigned to a bus
 */
async function generateStopsFromPassengers(busId, organizationId, startTime = '07:00') {
    // Fetch passengers assigned to this bus
    const passengers = await prisma.passenger.findMany({
        where: {
            busId,
            organizationId,
            isActive: true
        },
        select: {
            id: true,
            name: true,
            address: true,
            lat: true,
            lng: true
        },
        orderBy: {
            name: 'asc'
        }
    });

    if (passengers.length === 0) {
        return [];
    }

    // If only one passenger, return single stop
    if (passengers.length === 1) {
        return [{
            order: 1,
            stopName: passengers[0].name,
            address: passengers[0].address,
            lat: passengers[0].lat,
            lng: passengers[0].lng,
            estimatedTime: startTime,
            passengerId: passengers[0].id
        }];
    }

    try {
        // Get organization address as starting point (optional)
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
            select: { lat: true, lng: true, address: true }
        });

        const waypoints = passengers.map(p => ({ lat: p.lat, lng: p.lng }));

        // Optimize route using Google Maps
        const optimized = await optimizeRoute(
            waypoints,
            organization?.lat && organization?.lng ? { lat: organization.lat, lng: organization.lng } : null,
            null
        );

        // Calculate arrival times
        const arrivalTimes = calculateArrivalTimes(optimized.legs, startTime);

        // Build stops array in optimized order
        const stops = [];

        // Add organization as first stop if available
        if (organization?.lat && organization?.lng) {
            stops.push({
                order: 1,
                stopName: 'Starting Point',
                address: organization.address || 'Organization Location',
                lat: organization.lat,
                lng: organization.lng,
                estimatedTime: startTime,
                passengerId: null
            });
        }

        // Add passenger stops in optimized order
        optimized.optimizedOrder.forEach((waypointIndex, index) => {
            const passenger = passengers[waypointIndex];
            stops.push({
                order: stops.length + 1,
                stopName: passenger.name,
                address: passenger.address,
                lat: passenger.lat,
                lng: passenger.lng,
                estimatedTime: arrivalTimes[index] || startTime,
                passengerId: passenger.id
            });
        });

        return stops;
    } catch (error) {
        console.error('Error generating stops:', error);
        // Fallback: return passengers in database order
        return passengers.map((p, index) => ({
            order: index + 1,
            stopName: p.name,
            address: p.address,
            lat: p.lat,
            lng: p.lng,
            estimatedTime: startTime,
            passengerId: p.id
        }));
    }
}

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const routes = await prisma.route.findMany({
            where: { organizationId: session.user.organizationId },
            include: {
                bus: true,
                _count: {
                    select: { passengers: true }
                }
            },
        });

        return NextResponse.json({ routes });
    } catch (error) {
        console.error('Error fetching routes:', error);
        return NextResponse.json({ error: 'Failed to fetch routes' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();
        const { name, description, busId, startTime, endTime, operatingDays, routeType, autoGenerateStops = true } = data;

        if (!name || !busId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Verify bus belongs to this organization
        const bus = await prisma.bus.findFirst({
            where: {
                id: busId,
                organizationId: session.user.organizationId
            }
        });

        if (!bus) {
            return NextResponse.json({ error: 'Invalid bus selected' }, { status: 400 });
        }

        // Auto-generate stops from passengers
        let stops = [];
        if (autoGenerateStops) {
            stops = await generateStopsFromPassengers(busId, session.user.organizationId, startTime || '07:00');

            if (stops.length === 0) {
                return NextResponse.json({
                    error: 'No passengers assigned to this bus. Please assign passengers before creating a route.'
                }, { status: 400 });
            }
        } else {
            // Manual stops provided
            stops = data.stops || [];
        }

        const route = await prisma.route.create({
            data: {
                name,
                description,
                busId,
                organizationId: session.user.organizationId,
                stops,
                startTime,
                endTime,
                operatingDays,
                routeType,
                isActive: true
            },
            include: {
                bus: true,
                _count: {
                    select: { passengers: true }
                }
            }
        });

        // Update passengers to link them to this route
        if (autoGenerateStops && stops.length > 0) {
            const passengerIds = stops
                .filter(s => s.passengerId)
                .map(s => s.passengerId);

            if (passengerIds.length > 0) {
                await prisma.passenger.updateMany({
                    where: {
                        id: { in: passengerIds }
                    },
                    data: {
                        routeId: route.id
                    }
                });
            }
        }

        return NextResponse.json({ route }, { status: 201 });
    } catch (error) {
        console.error('Error creating route:', error);
        return NextResponse.json({ error: 'Failed to create route' }, { status: 500 });
    }
}
