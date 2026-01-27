import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const drivers = await prisma.driver.findMany({
            where: {
                user: {
                    organizationId: session.user.organizationId,
                },
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
            },
        });

        return NextResponse.json({ drivers });
    } catch (error) {
        console.error('Error fetching drivers:', error);
        return NextResponse.json({ error: 'Failed to fetch drivers' }, { status: 500 });
    }
}


export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();
        const { name, email, phone, password, licenseNumber, emergencyContact } = data;

        // Basic validation
        if (!name || !email || !password || !licenseNumber) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check for duplicates
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
        }

        const existingLicense = await prisma.driver.findUnique({ where: { licenseNumber } });
        if (existingLicense) {
            return NextResponse.json({ error: 'License number already registered' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Transaction to create User and Driver
        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    name,
                    email,
                    phone,
                    password: hashedPassword,
                    role: 'DRIVER',
                    organizationId: session.user.organizationId,
                },
            });

            const driver = await tx.driver.create({
                data: {
                    userId: user.id,
                    licenseNumber,
                    emergencyContact,
                },
            });

            return { user, driver };
        });

        return NextResponse.json({
            driver: {
                ...result.driver,
                user: {
                    name: result.user.name,
                    email: result.user.email
                }
            }
        });

    } catch (error) {
        console.error('Error creating driver:', error);
        return NextResponse.json({ error: 'Failed to create driver' }, { status: 500 });
    }
}
