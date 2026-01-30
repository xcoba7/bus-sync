import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

function getDayName(date) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
}

function createScheduledStartTime(boardingTime, targetDate) {
    const timeMatch = boardingTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!timeMatch) return new Date(targetDate);

    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const meridiem = timeMatch[3]?.toUpperCase();

    if (meridiem) {
        if (meridiem === 'PM' && hours !== 12) hours += 12;
        else if (meridiem === 'AM' && hours === 12) hours = 0;
    }

    const scheduledStart = new Date(targetDate);
    scheduledStart.setHours(hours, minutes, 0, 0);
    return scheduledStart;
}

async function main() {
    const adminEmail = 'admin1@bussync.com';
    const admin = await prisma.user.findUnique({
        where: { email: adminEmail }
    });

    if (!admin || !admin.organizationId) {
        console.error('Admin or Organization not found');
        return;
    }

    const organizationId = admin.organizationId;
    const dateToGenerate = new Date();
    const dayName = getDayName(dateToGenerate);

    const schedules = await prisma.schedule.findMany({
        where: { organizationId, isActive: true },
        include: { route: true }
    });

    console.log(`\n🚀 Generating Trips for Org: ${organizationId} (${dayName})`);
    console.log(`Found ${schedules.length} active schedules.`);

    let count = 0;
    for (const schedule of schedules) {
        if (!schedule.operatingDays.includes(dayName)) continue;

        // Check if trip already exists
        const startOfToday = new Date(dateToGenerate);
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date(dateToGenerate);
        endOfToday.setHours(23, 59, 59, 999);

        const existingTrip = await prisma.trip.findFirst({
            where: {
                scheduleId: schedule.id,
                scheduledStart: {
                    gte: startOfToday,
                    lte: endOfToday
                }
            }
        });

        if (existingTrip) {
            console.log(`- Trip already exists for schedule ${schedule.id}`);
            continue;
        }

        const scheduledStart = createScheduledStartTime(schedule.boardingTime, dateToGenerate);

        await prisma.trip.create({
            data: {
                busId: schedule.busId,
                driverId: schedule.driverId,
                routeId: schedule.routeId,
                scheduleId: schedule.id,
                organizationId: schedule.organizationId,
                scheduledStart,
                status: 'SCHEDULED',
            }
        });
        count++;
    }

    console.log(`✅ Generated ${count} new trips!`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
