import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper to generate random number in range
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper to pick random items from array
function pickRandom(arr, count = 1) {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return count === 1 ? shuffled[0] : shuffled.slice(0, count);
}

const usedLicensePlates = new Set();
function generateUniqueLicensePlate() {
    let lp;
    do {
        lp = `ABC${randomInt(100, 999)}XY`;
    } while (usedLicensePlates.has(lp));
    usedLicensePlates.add(lp);
    return lp;
}

async function main() {
    console.log('🚀 Start seeding...\n');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await prisma.schedule.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.busLocationHistory.deleteMany();
    await prisma.trip.deleteMany();
    await prisma.passenger.deleteMany();
    await prisma.route.deleteMany();
    await prisma.bus.deleteMany();
    await prisma.driver.deleteMany();
    await prisma.user.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.organization.deleteMany();

    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create Super Admin
    console.log('👑 Creating Super Admin...');
    await prisma.user.create({
        data: {
            name: 'Super Admin',
            email: 'super@bussync.com',
            password: hashedPassword,
            role: 'SUPER_ADMIN',
            emailVerified: true,
        },
    });

    // School data
    const schools = [
        { name: 'Green Valley Academy', address: 'Plot 452, Wuse 2, Abuja', lat: 9.0765, lng: 7.4951 },
        { name: 'Skyline International School', address: 'Plot 1024, Maitama, Abuja', lat: 9.0912, lng: 7.4955 },
        { name: 'Lead British International', address: 'Gwarinpa Estate, Abuja', lat: 9.1121, lng: 7.3821 },
        { name: 'Whiteplains British School', address: 'Jabi District, Abuja', lat: 9.0722, lng: 7.4221 },
        { name: 'Regent Primary School', address: 'Maitama District, Abuja', lat: 9.0888, lng: 7.4888 },
    ];

    const firstNames = ['Musa', 'Zainab', 'Tunde', 'Amaka', 'Kofi', 'Chioma', 'Ibrahim', 'Fatima', 'Emeka', 'Blessing',
        'Yusuf', 'Aisha', 'Chinedu', 'Ngozi', 'Aliyu', 'Halima', 'Oluwaseun', 'Funke', 'Kabiru', 'Hadiza'];
    const lastNames = ['Bello', 'Ibrahim', 'Johnson', 'Udoh', 'Nkrumah', 'Okafor', 'Mohammed', 'Abubakar', 'Nwosu', 'Eze',
        'Danjuma', 'Hassan', 'Okeke', 'Adeyemi', 'Sani', 'Lawal', 'Ajayi', 'Akindele', 'Idris', 'Bashir'];

    for (let schoolIdx = 0; schoolIdx < schools.length; schoolIdx++) {
        const school = schools[schoolIdx];
        console.log(`\n🏫 Seeding ${school.name}...`);

        // Create Organization
        const org = await prisma.organization.create({
            data: {
                name: school.name,
                type: 'SCHOOL',
                email: `admin@${school.name.toLowerCase().replace(/\s+/g, '')}.edu`,
                address: school.address,
                lat: school.lat,
                lng: school.lng,
                subscriptionStatus: 'ACTIVE',
                subscriptionPlan: 'PROFESSIONAL',
                maxBuses: 20,
                maxStudents: 500,
                maxDrivers: 25,
                maxAdmins: 5,
            },
        });

        // Create Admin for this school
        const admin = await prisma.user.create({
            data: {
                name: `${school.name} Admin`,
                email: `admin${schoolIdx + 1}@bussync.com`,
                password: hashedPassword,
                role: 'ADMIN',
                emailVerified: true,
                organizationId: org.id,
            },
        });

        // Create 5-8 buses per school
        const busCount = randomInt(5, 8);
        console.log(`  🚌 Creating ${busCount} buses...`);
        const buses = [];
        const drivers = [];

        for (let b = 0; b < busCount; b++) {
            // Create driver
            const driverName = `${pickRandom(firstNames)} ${pickRandom(lastNames)}`;
            const driverUser = await prisma.user.create({
                data: {
                    name: driverName,
                    email: `driver${schoolIdx + 1}_${b + 1}@bussync.com`,
                    password: hashedPassword,
                    phone: `080${randomInt(10000000, 99999999)}`,
                    role: 'DRIVER',
                    emailVerified: true,
                    organizationId: org.id,
                },
            });

            const driver = await prisma.driver.create({
                data: {
                    userId: driverUser.id,
                    licenseNumber: `DL${schoolIdx + 1}${b + 1}${randomInt(1000, 9999)}`,
                    licenseExpiry: new Date(2026, 11, 31),
                    emergencyContact: `081${randomInt(10000000, 99999999)}`,
                },
            });

            drivers.push(driver);

            // Create bus
            const bus = await prisma.bus.create({
                data: {
                    busNumber: `BUS-${String.fromCharCode(65 + schoolIdx)}${String(b + 1).padStart(2, '0')}`,
                    licensePlate: generateUniqueLicensePlate(),
                    capacity: randomInt(30, 50),
                    model: pickRandom(['Toyota Coaster', 'Mercedes Sprinter', 'Hyundai County', 'Isuzu NQR']),
                    year: randomInt(2018, 2024),
                    status: 'ACTIVE',
                    driverId: driver.id,
                    organizationId: org.id,
                },
            });

            buses.push(bus);
        }

        // Create 2-4 routes per school
        const routeCount = randomInt(2, 4);
        console.log(`  🗺️  Creating ${routeCount} routes...`);
        const routes = [];

        const routeNames = ['Morning Pickup Route', 'Afternoon Dropoff Route', 'Express Route', 'Extended Route'];

        for (let r = 0; r < routeCount; r++) {
            const assignedBus = buses[r % buses.length];

            const route = await prisma.route.create({
                data: {
                    name: `${routeNames[r]} ${r + 1}`,
                    description: `Route ${r + 1} for ${school.name}`,
                    busId: assignedBus.id,
                    organizationId: org.id,
                    stops: [
                        { address: 'Wuse Market', lat: 9.0579, lng: 7.4951, order: 1, stopName: 'Wuse Stop' },
                        { address: 'Garki Area 11', lat: 9.0333, lng: 7.4833, order: 2, stopName: 'Garki Stop' },
                        { address: school.address, lat: school.lat, lng: school.lng, order: 3, stopName: 'School' },
                    ],
                    startTime: '07:00 AM',
                    endTime: '08:30 AM',
                    operatingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
                    routeType: 'morning_pickup',
                    isActive: true,
                },
            });

            routes.push(route);
        }

        // Create 20-35 students per school
        const studentCount = randomInt(20, 35);
        console.log(`  👨‍🎓 Creating ${studentCount} students...`);

        // Create parents (fewer than students since some have multiple wards)
        const parentCount = Math.ceil(studentCount * 0.7); // 70% of students, so some parents have 2+ kids
        const parents = [];

        for (let p = 0; p < parentCount; p++) {
            const parentName = `${pickRandom(firstNames)} ${pickRandom(lastNames)}`;
            const parent = await prisma.user.create({
                data: {
                    name: parentName,
                    email: `parent${schoolIdx + 1}_${p + 1}@bussync.com`,
                    password: hashedPassword,
                    phone: `070${randomInt(10000000, 99999999)}`,
                    role: 'PARENT',
                    emailVerified: true,
                    organizationId: org.id,
                },
            });

            parents.push(parent);
        }

        // Create students
        const grades = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'];

        for (let s = 0; s < studentCount; s++) {
            const studentName = `${pickRandom(firstNames)} ${pickRandom(lastNames)}`;
            const assignedRoute = pickRandom(routes);
            const assignedBus = buses.find(b => b.id === assignedRoute.busId);
            const guardian = parents[s % parents.length]; // This ensures some parents have multiple kids

            await prisma.passenger.create({
                data: {
                    name: studentName,
                    rollNumber: `${String.fromCharCode(65 + schoolIdx)}${String(s + 1).padStart(4, '0')}`,
                    grade: pickRandom(grades),
                    address: `${randomInt(1, 999)} ${pickRandom(['Ademola', 'Adetokunbo', 'Aguiyi', 'Aminu'])} Street, Abuja`,
                    lat: school.lat + (Math.random() - 0.5) * 0.05,
                    lng: school.lng + (Math.random() - 0.5) * 0.05,
                    guardianId: guardian.id,
                    busId: assignedBus.id,
                    routeId: assignedRoute.id,
                    organizationId: org.id,
                    qrCode: `QR${schoolIdx + 1}${String(s + 1).padStart(4, '0')}`,
                    isActive: true,
                },
            });
        }

        // Create a schedule for each route
        console.log(`  📅 Creating schedules...`);
        for (const route of routes) {
            const assignedBus = buses.find(b => b.id === route.busId);
            const assignedDriver = drivers.find(d => d.id === assignedBus.driverId);

            await prisma.schedule.create({
                data: {
                    routeId: route.id,
                    busId: assignedBus.id,
                    driverId: assignedDriver.id,
                    organizationId: org.id,
                    boardingTime: '07:30 AM',
                    operatingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
                    isActive: true,
                },
            });
        }

        console.log(`  ✅ ${school.name} seeded successfully!`);
    }

    console.log('\n🎉 Seeding completed!\n');
    console.log('📊 Summary:');
    console.log(`   - Organizations: ${schools.length}`);
    console.log(`   - Total Buses: ${await prisma.bus.count()}`);
    console.log(`   - Total Drivers: ${await prisma.driver.count()}`);
    console.log(`   - Total Students: ${await prisma.passenger.count()}`);
    console.log(`   - Total Parents: ${await prisma.user.count({ where: { role: 'PARENT' } })}`);
    console.log(`   - Total Routes: ${await prisma.route.count()}`);
    console.log(`   - Total Schedules: ${await prisma.schedule.count()}`);
    console.log('\n🔑 Login Credentials:');
    console.log('   Super Admin: super@bussync.com / password123');
    console.log('   Admin 1: admin1@bussync.com / password123');
    console.log('   Driver 1: driver1_1@bussync.com / password123');
    console.log('   Parent 1: parent1_1@bussync.com / password123');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
