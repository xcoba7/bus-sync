import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const driverEmail = 'driver1_1@bussync.com';

    const driverUser = await prisma.user.findUnique({
        where: { email: driverEmail },
        include: {
            driver: {
                include: {
                    buses: {
                        include: {
                            routes: true
                        }
                    }
                }
            }
        }
    });

    if (!driverUser || !driverUser.driver) {
        console.error('Driver not found');
        return;
    }

    const driver = driverUser.driver;
    const bus = driver.buses[0];

    if (!bus) {
        console.error('Driver has no bus');
        return;
    }

    const routes = bus.routes;
    console.log(`\n📋 Driver Audit: ${driverEmail}`);
    console.log(`Bus: ${bus.busNumber} (ID: ${bus.id})`);
    console.log(`Routes assigned to Bus: ${routes.length}`);

    for (const route of routes) {
        const passengers = await prisma.passenger.findMany({
            where: { routeId: route.id }
        });
        console.log(`- Route: ${route.name} (ID: ${route.id})`);
        console.log(`  - Passengers on this route: ${passengers.length}`);
        passengers.forEach(p => console.log(`    - ${p.name} (ID: ${p.id})`));
    }

    // Also check if any passengers are assigned to the BUS but not the ROUTE
    const busPassengers = await prisma.passenger.findMany({
        where: { busId: bus.id, routeId: null }
    });
    if (busPassengers.length > 0) {
        console.log(`\n⚠️ Passengers assigned to BUS but NO ROUTE: ${busPassengers.length}`);
        busPassengers.forEach(p => console.log(`  - ${p.name}`));
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
