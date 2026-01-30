import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const driverEmail = 'driver1_1@bussync.com';
    const parentEmail = 'parent1_1@bussync.com';

    const driverUser = await prisma.user.findUnique({
        where: { email: driverEmail },
        include: { driver: { include: { buses: true } } }
    });

    const parentUser = await prisma.user.findUnique({
        where: { email: parentEmail },
        include: { passengers: true }
    });

    if (!driverUser || !driverUser.driver || !driverUser.driver.buses[0]) {
        console.error('Test driver not found or has no bus');
        return;
    }

    if (!parentUser || !parentUser.passengers[0]) {
        console.error('Test parent not found or has no student');
        return;
    }

    const bus = driverUser.driver.buses[0];
    const student = parentUser.passengers[0];

    // Find a route for this bus
    const route = await prisma.route.findFirst({
        where: { busId: bus.id }
    });

    if (!route) {
        console.error('No route found for this bus');
        return;
    }

    // Update student to use this bus and route
    const updatedStudent = await prisma.passenger.update({
        where: { id: student.id },
        data: {
            busId: bus.id,
            routeId: route.id
        }
    });

    console.log(`\n✅ TEST LINK CREATED!`);
    console.log(`Student: ${updatedStudent.name}`);
    console.log(`Driver: ${driverEmail}`);
    console.log(`Parent: ${parentEmail}`);
    console.log(`Bus: ${bus.busNumber}`);
    console.log(`Route: ${route.name}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
