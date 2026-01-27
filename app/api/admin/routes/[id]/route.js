import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        const { id } = params;

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();
        const { name, description, busId, stops, startTime, endTime, operatingDays, routeType, isActive } = data;

        // Verify route belongs to this organization
        const existingRoute = await prisma.route.findFirst({
            where: {
                id,
                organizationId: session.user.organizationId
            }
        });

        if (!existingRoute) {
            return NextResponse.json({ error: 'Route not found' }, { status: 404 });
        }

        // If busId is changing, verify new bus belongs to this organization
        if (busId && busId !== existingRoute.busId) {
            const bus = await prisma.bus.findFirst({
                where: {
                    id: busId,
                    organizationId: session.user.organizationId
                }
            });

            if (!bus) {
                return NextResponse.json({ error: 'Invalid bus selected' }, { status: 400 });
            }
        }

        const updatedRoute = await prisma.route.update({
            where: { id },
            data: {
                name: name ?? undefined,
                description: description ?? undefined,
                busId: busId ?? undefined,
                stops: stops ?? undefined,
                startTime: startTime ?? undefined,
                endTime: endTime ?? undefined,
                operatingDays: operatingDays ?? undefined,
                routeType: routeType ?? undefined,
                isActive: isActive ?? undefined
            },
            include: {
                bus: true
            }
        });

        return NextResponse.json({ route: updatedRoute });
    } catch (error) {
        console.error('Error updating route:', error);
        return NextResponse.json({ error: 'Failed to update route' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        const { id } = params;

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify route belongs to this organization
        const route = await prisma.route.findFirst({
            where: {
                id,
                organizationId: session.user.organizationId
            }
        });

        if (!route) {
            return NextResponse.json({ error: 'Route not found' }, { status: 404 });
        }

        await prisma.route.delete({
            where: { id }
        });

        return NextResponse.json({ message: 'Route deleted successfully' });
    } catch (error) {
        console.error('Error deleting route:', error);
        return NextResponse.json({ error: 'Failed to delete route' }, { status: 500 });
    }
}
