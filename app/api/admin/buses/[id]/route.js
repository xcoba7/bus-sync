import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const data = await request.json();
        const { busNumber, licensePlate, capacity, model, year, status, driverId } = data;

        const bus = await prisma.bus.update({
            where: { id },
            data: {
                busNumber: busNumber || undefined,
                licensePlate: licensePlate || undefined,
                capacity: capacity ? parseInt(capacity) : undefined,
                model: model || undefined,
                year: year ? parseInt(year) : undefined,
                status: status || undefined,
                driverId: driverId === null ? null : (driverId || undefined)
            }
        });

        return NextResponse.json({ bus });
    } catch (error) {
        console.error('Error updating bus:', error);
        return NextResponse.json({ error: 'Failed to update bus' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;

        await prisma.bus.delete({
            where: { id }
        });

        return NextResponse.json({ message: 'Bus deleted successfully' });
    } catch (error) {
        console.error('Error deleting bus:', error);
        return NextResponse.json({ error: 'Failed to delete bus' }, { status: 500 });
    }
}
