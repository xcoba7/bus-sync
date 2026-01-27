import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function PATCH(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;
        const data = await request.json();
        const { name, phone, licenseNumber, emergencyContact } = data;

        // Transaction to update User and Driver
        const result = await prisma.$transaction(async (tx) => {
            const driver = await tx.driver.findUnique({
                where: { id },
                include: { user: true }
            });

            if (!driver) {
                throw new Error('Driver not found');
            }

            // Update User details if provided
            if (name || phone) {
                await tx.user.update({
                    where: { id: driver.userId },
                    data: {
                        name: name || undefined,
                        phone: phone || undefined,
                    }
                });
            }

            // Update Driver details if provided
            if (licenseNumber || emergencyContact) {
                await tx.driver.update({
                    where: { id },
                    data: {
                        licenseNumber: licenseNumber || undefined,
                        emergencyContact: emergencyContact || undefined,
                    }
                });
            }

            return await tx.driver.findUnique({
                where: { id },
                include: { user: true }
            });
        });

        return NextResponse.json({ driver: result });
    } catch (error) {
        console.error('Error updating driver:', error);
        return NextResponse.json({ error: error.message || 'Failed to update driver' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;

        const driver = await prisma.driver.findUnique({
            where: { id },
            select: { userId: true }
        });

        if (!driver) {
            return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
        }

        // Delete the User (Cascades to Driver)
        await prisma.user.delete({
            where: { id: driver.userId }
        });

        return NextResponse.json({ message: 'Driver deleted successfully' });
    } catch (error) {
        console.error('Error deleting driver:', error);
        return NextResponse.json({ error: 'Failed to delete driver' }, { status: 500 });
    }
}
