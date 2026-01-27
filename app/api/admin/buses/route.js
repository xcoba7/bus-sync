import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const buses = await prisma.bus.findMany({
            where: { organizationId: session.user.organizationId },
            include: {
                driver: {
                    include: {
                        user: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
                _count: {
                    select: { passengers: true }
                }
            },
        });

        return NextResponse.json({ buses });
    } catch (error) {
        console.error('Error fetching buses:', error);
        return NextResponse.json({ error: 'Failed to fetch buses' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();
        const { busNumber, licensePlate, capacity, model, year, driverId } = data;

        if (!busNumber || !licensePlate || !capacity) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check for duplicates
        const existingBus = await prisma.bus.findUnique({ where: { busNumber } });
        if (existingBus) {
            return NextResponse.json({ error: 'Bus number already exists' }, { status: 400 });
        }

        const newBus = await prisma.bus.create({
            data: {
                busNumber,
                licensePlate,
                capacity: parseInt(capacity),
                model,
                year: year ? parseInt(year) : null,
                organizationId: session.user.organizationId,
                driverId: driverId || null,
                status: 'ACTIVE'
            },
            include: {
                driver: {
                    include: {
                        user: {
                            select: { name: true }
                        }
                    }
                }
            }
        });

        return NextResponse.json({ bus: newBus });
    } catch (error) {
        console.error('Error creating bus:', error);
        return NextResponse.json({ error: 'Failed to create bus' }, { status: 500 });
    }
}
