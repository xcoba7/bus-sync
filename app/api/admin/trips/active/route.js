import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch all ongoing trips with route and stop information
        const trips = await prisma.trip.findMany({
            where: {
                organizationId: session.user.organizationId,
                status: 'ONGOING'
            },
            include: {
                route: {
                    include: {
                        stops: {
                            orderBy: { order: 'asc' }
                        }
                    }
                },
                bus: {
                    select: {
                        id: true,
                        busNumber: true,
                        currentLat: true,
                        currentLng: true
                    }
                },
                driver: {
                    include: {
                        user: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        });

        return NextResponse.json({ trips });
    } catch (error) {
        console.error('Error fetching active trips:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
