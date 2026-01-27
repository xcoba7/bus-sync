/**
 * Dynamic terminology based on organization type
 * Maps organization types to appropriate labels for passengers, guardians, etc.
 */

export const TERMINOLOGY = {
    SCHOOL: {
        passenger: 'Student',
        passengers: 'Students',
        guardian: 'Parent',
        guardians: 'Parents',
        identifier: 'Roll Number',
        location: 'School',
    },
    COMPANY: {
        passenger: 'Employee',
        passengers: 'Employees',
        guardian: 'Emergency Contact',
        guardians: 'Emergency Contacts',
        identifier: 'Employee ID',
        location: 'Office',
    },
    CHURCH: {
        passenger: 'Member',
        passengers: 'Members',
        guardian: 'Guardian',
        guardians: 'Guardians',
        identifier: 'Member ID',
        location: 'Church',
    },
    CAMP: {
        passenger: 'Camper',
        passengers: 'Campers',
        guardian: 'Parent/Guardian',
        guardians: 'Parents/Guardians',
        identifier: 'Camper ID',
        location: 'Camp',
    },
    UNIVERSITY: {
        passenger: 'Student',
        passengers: 'Students',
        guardian: 'Emergency Contact',
        guardians: 'Emergency Contacts',
        identifier: 'Student ID',
        location: 'University',
    },
    HOTEL: {
        passenger: 'Guest',
        passengers: 'Guests',
        guardian: 'Contact Person',
        guardians: 'Contact Persons',
        identifier: 'Guest ID',
        location: 'Hotel',
    },
    TRANSPORTATION_SERVICE: {
        passenger: 'Passenger',
        passengers: 'Passengers',
        guardian: 'Contact',
        guardians: 'Contacts',
        identifier: 'Passenger ID',
        location: 'Destination',
    },
    OTHER: {
        passenger: 'Passenger',
        passengers: 'Passengers',
        guardian: 'Guardian',
        guardians: 'Guardians',
        identifier: 'ID',
        location: 'Location',
    },
};

/**
 * Get terminology for a specific organization type
 * @param {string} orgType - Organization type (e.g., 'SCHOOL', 'COMPANY')
 * @returns {object} Terminology object
 */
export function getTerminology(orgType) {
    return TERMINOLOGY[orgType] || TERMINOLOGY.OTHER;
}

/**
 * Get passenger label for organization type
 * @param {string} orgType - Organization type
 * @param {boolean} plural - Whether to return plural form
 * @returns {string} Passenger label
 */
export function getPassengerLabel(orgType, plural = false) {
    const terms = getTerminology(orgType);
    return plural ? terms.passengers : terms.passenger;
}

/**
 * Get guardian label for organization type
 * @param {string} orgType - Organization type
 * @param {boolean} plural - Whether to return plural form
 * @returns {string} Guardian label
 */
export function getGuardianLabel(orgType, plural = false) {
    const terms = getTerminology(orgType);
    return plural ? terms.guardians : terms.guardian;
}
