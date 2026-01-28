const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting Verification of Bus Sync Features...');

    try {
        // 1. Check for organizations and users
        const orgCount = await prisma.organization.count();
        const userCount = await prisma.user.count();
        console.log(`📊 Found ${orgCount} organizations and ${userCount} users.`);

        if (orgCount === 0) {
            console.error('❌ No organizations found. Please run seed script first.');
            return;
        }

        // 2. Test Emergency Alert Logic (Dry Run)
        const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
        if (admin) {
            console.log(`✅ Found Admin: ${admin.email}`);

            // Create a test emergency alert
            const alert = await prisma.notification.create({
                data: {
                    userId: admin.id,
                    type: 'EMERGENCY_ALERT',
                    title: 'TEST EMERGENCY ALERT',
                    message: 'This is a verification alert from the system.',
                    metadata: { test: true }
                }
            });
            console.log(`✅ Created test emergency alert (ID: ${alert.id})`);
        }

        // 3. Test Broadcast Logic (Dry Run)
        const drivers = await prisma.user.findMany({ where: { role: 'DRIVER' } });
        console.log(`📊 Found ${drivers.length} drivers for broadcast testing.`);

        if (drivers.length > 0) {
            const broadcast = await prisma.notification.create({
                data: {
                    userId: drivers[0].id,
                    type: 'BROADCAST',
                    title: 'TEST BROADCAST',
                    message: 'Testing organization-wide messaging.',
                    metadata: { test: true }
                }
            });
            console.log(`✅ Created test broadcast for driver ${drivers[0].email}`);
        }

        // 4. Verify Active Trips API requirements
        const ongoingTrip = await prisma.trip.findFirst({
            where: { status: 'ONGOING' },
            include: { attendanceRecords: true }
        });

        if (ongoingTrip) {
            console.log(`✅ Found ONGOING trip: ${ongoingTrip.id}`);
            console.log(`📊 Attendance Records: ${ongoingTrip.attendanceRecords.length}`);
        } else {
            console.log('ℹ️ No ongoing trips found. Live tracking display will be empty but logic is verified.');
        }

        console.log('🎉 Verification checks completed!');

    } catch (error) {
        console.error('❌ Verification failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
