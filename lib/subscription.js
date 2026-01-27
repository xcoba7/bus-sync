import { prisma } from './prisma';

/**
 * Check if organization can create more resources based on plan limits
 */
export async function checkPlanLimit(organizationId, resourceType) {
    const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        include: {
            _count: {
                select: {
                    buses: true,
                    passengers: true,
                    users: true,
                },
            },
        },
    });

    if (!org) {
        throw new Error('Organization not found');
    }

    // Check subscription status
    if (org.subscriptionStatus === 'SUSPENDED' || org.subscriptionStatus === 'CANCELLED') {
        throw new Error('Subscription is not active');
    }

    // Check trial expiry
    if (org.subscriptionStatus === 'TRIAL' && org.trialEndsAt && new Date() > org.trialEndsAt) {
        throw new Error('Trial period has expired');
    }

    // Check resource limits
    const limits = {
        bus: {
            current: org._count.buses,
            max: org.maxBuses,
            name: 'buses',
        },
        passenger: {
            current: org._count.passengers,
            max: org.maxStudents, // maxStudents is used for all passenger types
            name: 'passengers',
        },
        driver: {
            current: org._count.users, // This should be filtered by role in real implementation
            max: org.maxDrivers,
            name: 'drivers',
        },
        admin: {
            current: org._count.users, // This should be filtered by role in real implementation
            max: org.maxAdmins,
            name: 'admins',
        },
    };

    const limit = limits[resourceType];
    if (!limit) {
        return true; // No limit for this resource type
    }

    if (limit.current >= limit.max) {
        throw new Error(
            `Plan limit reached: You can only have ${limit.max} ${limit.name} on your current plan. Please upgrade to add more.`
        );
    }

    return true;
}

/**
 * Check if organization has access to a specific feature
 */
export function checkFeatureAccess(organization, feature) {
    const featureMap = {
        sms: 'hasSmsNotifications',
        analytics: 'hasAdvancedAnalytics',
        whiteLabel: 'hasWhiteLabel',
        api: 'hasApiAccess',
    };

    const featureKey = featureMap[feature];
    if (!featureKey) {
        return true; // Feature doesn't require special access
    }

    if (!organization[featureKey]) {
        throw new Error(`This feature requires a higher subscription plan`);
    }

    return true;
}

/**
 * Get plan details
 */
export const PLAN_DETAILS = {
    FREE: {
        name: 'Free',
        price: 0,
        maxBuses: 2,
        maxStudents: 50,
        maxDrivers: 3,
        maxAdmins: 1,
        features: [],
    },
    BASIC: {
        name: 'Basic',
        price: 49,
        maxBuses: 5,
        maxStudents: 100,
        maxDrivers: 10,
        maxAdmins: 2,
        features: ['sms'],
    },
    PROFESSIONAL: {
        name: 'Professional',
        price: 149,
        maxBuses: 15,
        maxStudents: 500,
        maxDrivers: 20,
        maxAdmins: 5,
        features: ['sms', 'analytics'],
    },
    ENTERPRISE: {
        name: 'Enterprise',
        price: 499,
        maxBuses: 999,
        maxStudents: 9999,
        maxDrivers: 100,
        maxAdmins: 20,
        features: ['sms', 'analytics', 'whiteLabel', 'api'],
    },
};
