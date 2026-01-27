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

        const { id } = params;
        const data = await request.json();
        // Allow updating name, address, etc.
        const { name, address, lat, lng, guardianName, guardianEmail, guardianPhone } = data;

        // 1. Update Passenger
        const passenger = await prisma.passenger.update({
            where: { id },
            data: {
                name: name || undefined,
                address: address || undefined,
                lat: lat !== undefined ? parseFloat(lat) : undefined,
                lng: lng !== undefined ? parseFloat(lng) : undefined,
            },
            include: { guardian: true }
        });

        // 2. Update Guardian if fields are provided and guardian exists
        if (passenger.guardianId && (guardianName || guardianEmail || guardianPhone)) {
            // If email is being changed, check for uniqueness
            if (guardianEmail && guardianEmail !== passenger.guardian.email) {
                const existingUser = await prisma.user.findUnique({
                    where: { email: guardianEmail }
                });
                if (existingUser) {
                    return NextResponse.json({ error: 'Email already in use by another user' }, { status: 400 });
                }
            }

            // If phone is being changed, check for uniqueness
            if (guardianPhone && guardianPhone !== passenger.guardian.phone) {
                const existingPhone = await prisma.user.findUnique({
                    where: { phone: guardianPhone }
                });
                if (existingPhone) {
                    return NextResponse.json({ error: 'Phone number already in use by another user' }, { status: 400 });
                }
            }

            await prisma.user.update({
                where: { id: passenger.guardianId },
                data: {
                    name: guardianName || undefined,
                    email: guardianEmail || undefined,
                    phone: guardianPhone || undefined,
                }
            });

            // Refetch to return complete data
            const updatedPassenger = await prisma.passenger.findUnique({
                where: { id },
                include: { guardian: true, bus: true, route: true }
            });
            return NextResponse.json({ passenger: updatedPassenger });
        }

        return NextResponse.json({ passenger });
    } catch (error) {
        console.error('Error updating passenger:', error);
        return NextResponse.json({ error: 'Failed to update passenger' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;

        await prisma.passenger.delete({
            where: { id }
        });

        // Note: We do NOT delete the Guardian User, as they might have other children.

        return NextResponse.json({ message: 'Passenger deleted successfully' });
    } catch (error) {
        console.error('Error deleting passenger:', error);
        return NextResponse.json({ error: 'Failed to delete passenger' }, { status: 500 });
    }
}
