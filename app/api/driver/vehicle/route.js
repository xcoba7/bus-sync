import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'DRIVER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { driver: true }
        });
        

        if (!user || !user.driver) {
            return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
        }

        // Find the bus assigned to this driver
        const bus = await prisma.bus.findFirst({
            where: {
                driverId: user.driver.id
            },
            include: {
                organization: {
                    select: {
                        name: true
                    }
                }
            }
        });
        
        if (!bus) {
            return NextResponse.json({ vehicle: null });
        }

        return NextResponse.json({ vehicle: bus });
    } catch (error) {
        console.error('Error fetching vehicle info:', error);
        return NextResponse.json({ error: 'Failed to fetch vehicle info' }, { status: 500 });
    }
}
