import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const organization = await prisma.organization.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        users: true,
                        buses: true,
                        passengers: true,
                        routes: true,
                        trips: true
                    }
                }
            }
        });

        if (!organization) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
        }

        return NextResponse.json({ organization });

    } catch (error) {
        console.error('Error fetching organization:', error);
        return NextResponse.json({ error: 'Failed to fetch organization' }, { status: 500 });
    }
}


export async function PATCH(request, { params }) {
    try {
        const { id } = await params;
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
            hasAdvancedAnalytics
        } = await request.json();

        const organization = await prisma.organization.update({
            where: { id },
            data: {
                name,
                subscriptionPlan,
                subscriptionStatus,
                type: organizationType,
                maxBuses,
                maxStudents,
                maxDrivers,
                isActive,
                hasSmsNotifications,
                hasAdvancedAnalytics
            }
        });

        return NextResponse.json({ organization });

    } catch (error) {
        console.error('Error updating organization:', error);
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Allow deleting organization even if users exist (Cascade delete handles it)
        await prisma.organization.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error deleting organization:', error);
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}
