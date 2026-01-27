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

        const passengers = await prisma.passenger.findMany({
            where: { organizationId: session.user.organizationId },
            include: {
                guardian: {
                    select: {
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
                bus: true,
                route: true,
            },
            orderBy: {
                name: 'asc',
            },
        });
        return NextResponse.json({ passengers });
    } catch (error) {
        console.error('Error fetching passengers:', error);
        return NextResponse.json({ error: 'Failed to fetch passengers' }, { status: 500 });
    }
}


export async function PATCH(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { passengerId, busId, routeId } = await request.json();

        if (!passengerId) {
            return NextResponse.json({ error: 'Passenger ID is required' }, { status: 400 });
        }

        const passenger = await prisma.passenger.update({
            where: { id: passengerId },
            data: {
                busId: busId || null,
                routeId: routeId || null,
            },
        });

        return NextResponse.json({ passenger });
    } catch (error) {
        console.error('Error updating passenger:', error);
        return NextResponse.json({ error: 'Failed to update passenger' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();
        const { name, address, guardianEmail, guardianName, guardianPhone } = data;

        if (!name || !address || !guardianEmail || !guardianName) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        let guardian = await prisma.user.findUnique({
            where: { email: guardianEmail }
        });

        // Create Guardian if not exists
        if (!guardian) {
            // Check if phone number is already taken by another user
            if (guardianPhone) {
                const phoneUser = await prisma.user.findUnique({ where: { phone: guardianPhone } });
                if (phoneUser) {
                    return NextResponse.json({ error: 'Phone number already in use by another account' }, { status: 400 });
                }
            }

            const tempPassword = Math.random().toString(36).slice(-8); // Generate random password
            // Ideally, email this to them. For now, we just create the account.
            const hashedPassword = await import('bcryptjs').then(bcrypt => bcrypt.hash(tempPassword, 10));

            guardian = await prisma.user.create({
                data: {
                    name: guardianName,
                    email: guardianEmail,
                    phone: guardianPhone || null,
                    password: hashedPassword,
                    role: 'PARENT',
                    organizationId: session.user.organizationId,
                }
            });
        }

        const newPassenger = await prisma.passenger.create({
            data: {
                name,
                address,
                lat: 0.0,
                lng: 0.0,
                guardianId: guardian.id,
                organizationId: session.user.organizationId,
                isActive: true
            }
        });

        return NextResponse.json({ passenger: newPassenger });

    } catch (error) {
        console.error('Error creating passenger:', error);
        return NextResponse.json({ error: 'Failed to create passenger' }, { status: 500 });
    }
}
