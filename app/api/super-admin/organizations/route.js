import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const organizations = await prisma.organization.findMany({
            include: {
                _count: {
                    select: { users: true, buses: true, passengers: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ organizations });

    } catch (error) {
        console.error('Error fetching organizations:', error);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const {
            name,
            subscriptionPlan,
            subscriptionStatus,
            organizationType,
            maxBuses,
            maxStudents,
            maxDrivers,
            isActive,
            hasSmsNotifications,
            hasAdvancedAnalytics,
            // Admin details
            adminName,
            adminEmail,
            adminPassword
        } = await request.json();

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            const organization = await tx.organization.create({
                data: {
                    name,
                    subscriptionPlan: subscriptionPlan || 'FREE',
                    subscriptionStatus: subscriptionStatus || 'TRIAL',
                    type: organizationType || 'OTHER',
                    maxBuses: maxBuses || 5,
                    maxStudents: maxStudents || 100,
                    maxDrivers: maxDrivers || 10,
                    isActive: isActive ?? true,
                    hasSmsNotifications: hasSmsNotifications || false,
                    hasAdvancedAnalytics: hasAdvancedAnalytics || false
                }
            });

            let admin = null;
            if (adminEmail && adminPassword) {
                const hashedPassword = await bcrypt.hash(adminPassword, 10);
                admin = await tx.user.create({
                    data: {
                        name: adminName || `${name} Admin`,
                        email: adminEmail,
                        password: hashedPassword,
                        role: 'ADMIN',
                        organizationId: organization.id,
                        emailVerified: true
                    }
                });
            }

            return { organization, admin };
        });

        return NextResponse.json(result);

    } catch (error) {
        console.error('Error creating organization:', error);
        return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
    }
}
