import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixDriverProfiles() {
    console.log('Starting driver profile fix...');

    try {
        // Find all users with DRIVER role
        const driverUsers = await prisma.user.findMany({
            where: {
                role: 'DRIVER'
            },
            include: {
                driver: true
            }
        });

        console.log(`Found ${driverUsers.length} driver users`);

        let fixed = 0;
        let alreadyHaveProfile = 0;

        for (const user of driverUsers) {
            if (!user.driver) {
                // Create driver profile for this user
                console.log(`Creating driver profile for user: ${user.email}`);

                await prisma.driver.create({
                    data: {
                        userId: user.id,
                        licenseNumber: `LIC-AUTO-${user.id.substring(0, 8)}`,
                        licenseExpiry: new Date('2026-12-31'),
                        emergencyContact: user.phone || 'Not set'
                    }
                });

                fixed++;
            } else {
                alreadyHaveProfile++;
            }
        }

        console.log(`\n✅ Fix completed!`);
        console.log(`   - Drivers with existing profiles: ${alreadyHaveProfile}`);
        console.log(`   - Drivers fixed (profiles created): ${fixed}`);

    } catch (error) {
        console.error('Error fixing driver profiles:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

fixDriverProfiles()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
