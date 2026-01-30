import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const driverEmail = 'driver1_1@bussync.com';
    const parentEmail = 'parent1_1@bussync.com';

    const driver = await prisma.user.findUnique({
        where: { email: driverEmail },
        include: { driver: { include: { buses: true } } }
    });

    const parent = await prisma.user.findUnique({
        where: { email: parentEmail }
    });

    if (!driver || !driver.driver) {
        console.log('Driver not found');
        return;
    }

    const busId = driver.driver.buses[0]?.id;
    if (!busId) {
        console.log('Driver has no bus');
        return;
    }

    const passengers = await prisma.passenger.findMany({
        where: { busId: busId },
        include: { guardian: true }
    });

    console.log(`\n🔍 Linkage Data for ${driverEmail}:`);
    console.log(`Bus: ${driver.driver.buses[0].busNumber}`);
    console.log(`Passengers assigned: ${passengers.length}`);

    if (passengers.length > 0) {
        const firstPassenger = passengers[0];
        console.log(`--- First Student ---`);
        console.log(`Name: ${firstPassenger.name}`);
        console.log(`Guardian: ${firstPassenger.guardian.email} (${firstPassenger.guardian.name})`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
