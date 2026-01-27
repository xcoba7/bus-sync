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

        const { passengerId, passengerIds, type } = await request.json();

        if (!session.user.driverId) {
            return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
        }

        const activeTrip = await prisma.trip.findFirst({
            where: {
                driverId: session.user.driverId,
                status: { in: ['SCHEDULED', 'ONGOING'] },
            },
        });

        if (!activeTrip) {
            return NextResponse.json({ error: 'No active trip' }, { status: 400 });
        }

        const targetPassengerIds = passengerIds || [passengerId];
        const results = [];

        for (const pid of targetPassengerIds) {
            // Get passenger info for guardian notification
            const passenger = await prisma.passenger.findUnique({
                where: { id: pid },
            });

            if (!passenger) continue;

            let attendance = await prisma.attendance.findFirst({
                where: {
                    tripId: activeTrip.id,
                    passengerId: pid,
                },
            });

            if (type === 'boarded' || type === 'mark-boarded') {
                if (attendance) {
                    attendance = await prisma.attendance.update({
                        where: { id: attendance.id },
                        data: {
                            boardedAt: new Date(),
                            boardedLat: activeTrip.currentLat,
                            boardedLng: activeTrip.currentLng,
                            status: 'PRESENT'
                        },
                    });
                } else {
                    attendance = await prisma.attendance.create({
                        data: {
                            tripId: activeTrip.id,
                            passengerId: pid,
                            boardedAt: new Date(),
                            boardedLat: activeTrip.currentLat,
                            boardedLng: activeTrip.currentLng,
                            status: 'PRESENT'
                        },
                    });
                }

                // Create notification for guardian
                await prisma.notification.create({
                    data: {
                        userId: passenger.guardianId,
                        type: 'STUDENT_BOARDED',
                        title: 'Passenger Boarded',
                        message: `${passenger.name} has ${type === 'mark-boarded' ? 'been manually marked as' : ''} boarded the bus`,
                    },
                });
            } else if (type === 'mark-absent') {
                if (attendance) {
                    attendance = await prisma.attendance.update({
                        where: { id: attendance.id },
                        data: {
                            boardedAt: null,
                            status: 'ABSENT'
                        },
                    });
                } else {
                    attendance = await prisma.attendance.create({
                        data: {
                            tripId: activeTrip.id,
                            passengerId: pid,
                            status: 'ABSENT'
                        },
                    });
                }

                // Create notification for guardian
                await prisma.notification.create({
                    data: {
                        userId: passenger.guardianId,
                        type: 'STUDENT_ABSENT',
                        title: 'Passenger Absent',
                        message: `${passenger.name} was marked as absent for the trip.`,
                    },
                });
            } else if (type === 'mark-reset') {
                if (attendance) {
                    attendance = await prisma.attendance.update({
                        where: { id: attendance.id },
                        data: {
                            boardedAt: null,
                            status: 'AWAITING'
                        },
                    });
                }
            } else if (type === 'dropped') {
                if (attendance) {
                    attendance = await prisma.attendance.update({
                        where: { id: attendance.id },
                        data: {
                            droppedAt: new Date(),
                            droppedLat: activeTrip.currentLat,
                            droppedLng: activeTrip.currentLng,
                        },
                    });
                } else {
                    // Create attendance record with drop-off only
                    attendance = await prisma.attendance.create({
                        data: {
                            tripId: activeTrip.id,
                            passengerId: pid,
                            droppedAt: new Date(),
                            droppedLat: activeTrip.currentLat,
                            droppedLng: activeTrip.currentLng,
                        },
                    });
                }

                // Create notification for guardian
                await prisma.notification.create({
                    data: {
                        userId: passenger.guardianId,
                        type: 'STUDENT_DROPPED',
                        title: 'Passenger Dropped Off',
                        message: `${passenger.name} has been dropped off`,
                    },
                });
            }
            results.push(attendance);
        }

        return NextResponse.json({ results });
    } catch (error) {
        console.error('Error marking attendance:', error);
        return NextResponse.json({ error: 'Failed to mark attendance' }, { status: 500 });
    }
}
