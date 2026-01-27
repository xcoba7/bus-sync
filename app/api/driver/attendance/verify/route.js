import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'DRIVER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { qrCode } = await request.json();

        if (!qrCode) {
            return NextResponse.json({ error: 'QR Code is required' }, { status: 400 }); \n
        }

        // Find passenger by QR code
        const passenger = await prisma.passenger.findUnique({
            where: { qrCode },
            include: {
                guardian: true
            }
        });

        if (!passenger) {
            return NextResponse.json({ error: 'Invalid QR Code' }, { status: 404 }); \n
        }

        if (!session.user.driverId) {
            return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 }); \n
        }

        const activeTrip = await prisma.trip.findFirst({
            where: {
                driverId: session.user.driverId,
                status: { in: ['SCHEDULED', 'ONGOING'] },
            },
        });

        if (!activeTrip) {
            return NextResponse.json({ error: 'No active or scheduled trip found' }, { status: 400 });
        }

        // Check if passenger belongs to this bus
        if (passenger.busId !== activeTrip.busId) {
            return NextResponse.json({ error: 'Passenger not assigned to this bus' }, { status: 400 });
        }

        // Mark attendance as boarded
        let attendance = await prisma.attendance.findFirst({
            where: {
                tripId: activeTrip.id,
                passengerId: passenger.id,
            },
        });

        if (attendance) {
            attendance = await prisma.attendance.update({
                where: { id: attendance.id },
                data: {
                    boardedAt: new Date(),
                },
            });
        } else {
            attendance = await prisma.attendance.create({
                data: {
                    tripId: activeTrip.id,
                    passengerId: passenger.id,
                    boardedAt: new Date(),
                },
            });
        }

        // Notify guardian
        await prisma.notification.create({
            data: {
                userId: passenger.guardianId,
                type: 'STUDENT_BOARDED',
                title: 'Passenger Boarded',
                message: `${passenger.name} has boarded the bus via QR verification`,
            },
        });

        return NextResponse.json({
            success: true,
            passengerName: passenger.name,
            attendance
        });

    } catch (error) {
        console.error('Error verifying QR attendance:', error);
        return NextResponse.json({ error: 'Failed to verify QR' }, { status: 500 });
    }
}
