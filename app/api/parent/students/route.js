import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'PARENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const passengers = await prisma.passenger.findMany({
            where: { guardianId: session.user.id },
            include: {
                organization: true,
                bus: {
                    include: {
                        driver: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
            },
        });
        
        return NextResponse.json({ students: passengers });
    } catch (error) {
        console.error('Error fetching students:', error);
        return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
    }
}
