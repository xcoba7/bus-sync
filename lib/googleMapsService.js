/**
 * Google Maps API Service
 * Provides route optimization and geocoding functionality
 */

/**
 * Optimize route order using Google Maps Directions API
 * @param {Array} waypoints - Array of {lat, lng} objects
 * @param {Object} origin - Optional origin point {lat, lng}
 * @param {Object} destination - Optional destination point {lat, lng}
 * @returns {Promise} Optimized route with order and legs
 */
export async function optimizeRoute(waypoints, origin = null, destination = null) {
    if (!waypoints || waypoints.length === 0) {
        throw new Error('Waypoints array is required');
    }

    // If only one waypoint, no optimization needed
    if (waypoints.length === 1) {
        return {
            order: [0], // Changed from optimizedOrder to order
            waypoints: waypoints,
            legs: [],
            totalDistance: 0,
            totalDuration: 0
        };
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        throw new Error('Google Maps API key not configured');
    }

    // Use first waypoint as origin if not provided
    const startPoint = origin || waypoints[0];
    // Use last waypoint as destination if not provided
    const endPoint = destination || waypoints[waypoints.length - 1];

    // Middle waypoints for optimization
    const middleWaypoints = origin && destination
        ? waypoints
        : waypoints.slice(1, -1);

    // Build request URL for Directions API
    const waypointsParam = middleWaypoints.length > 0
        ? `&waypoints=optimize:true|${middleWaypoints.map(w => `${w.lat},${w.lng}`).join('|')}`
        : '';

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${startPoint.lat},${startPoint.lng}&destination=${endPoint.lat},${endPoint.lng}${waypointsParam}&key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.status !== 'OK') {
            throw new Error(`Google Maps API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
        }

        const route = data.routes[0];
        const optimizedOrder = route.waypoint_order || [];
        const legs = route.legs || [];

        // Calculate total distance and duration
        let totalDistance = 0;
        let totalDuration = 0;
        legs.forEach(leg => {
            totalDistance += leg.distance?.value || 0;
            totalDuration += leg.duration?.value || 0;
        });

        // Convert meters to kilometers
        totalDistance = (totalDistance / 1000).toFixed(2);

        return {
            order: optimizedOrder, // Changed from optimizedOrder to order
            waypoints: middleWaypoints,
            legs,
            totalDistance: parseFloat(totalDistance),
            totalDuration: Math.round(totalDuration / 60), // Convert to minutes
            route
        };
    } catch (error) {
        console.error('Error optimizing route:', error);
        throw error;
    }
}

/**
 * Geocode an address to lat/lng coordinates
 * @param {string} address - Address to geocode
 * @returns {Promise} Object with lat, lng, and formatted_address
 */
export async function geocodeAddress(address) {
    if (!address) {
        throw new Error('Address is required');
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        throw new Error('Google Maps API key not configured');
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.status !== 'OK') {
            throw new Error(`Geocoding error: ${data.status}`);
        }

        const result = data.results[0];
        return {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng,
            formatted_address: result.formatted_address
        };
    } catch (error) {
        console.error('Error geocoding address:', error);
        throw error;
    }
}

/**
 * Calculate estimated arrival times for each stop
 * @param {Array} legs - Route legs from Google Maps
 * @param {string} startTime - Start time in HH:MM format
 * @returns {Array} Array of estimated arrival times
 */
export function calculateArrivalTimes(legs, startTime) {
    if (!legs || legs.length === 0) {
        return [];
    }

    const arrivalTimes = [];
    const [hours, minutes] = startTime.split(':').map(Number);
    let currentTime = hours * 60 + minutes; // Convert to minutes

    legs.forEach((leg, index) => {
        // Add duration to current time
        const durationMinutes = Math.round((leg.duration?.value || 0) / 60);
        currentTime += durationMinutes;

        // Convert back to HH:MM format
        const arrivalHours = Math.floor(currentTime / 60) % 24;
        const arrivalMinutes = currentTime % 60;
        const formattedTime = `${String(arrivalHours).padStart(2, '0')}:${String(arrivalMinutes).padStart(2, '0')}`;

        arrivalTimes.push(formattedTime);
    });

    return arrivalTimes;
}

/**
 * Calculate the total distance and duration of a route using Google Maps Directions API
 * @param {Object} origin - Starting point {lat, lng}
 * @param {Object} destination - Ending point {lat, lng}
 * @param {Array} waypoints - Array of intermediate stops [{lat, lng}, ...]
 * @returns {Promise<Object>} Object with distanceKm and durationMinutes
 */
export async function calculateRouteDistance(origin, destination, waypoints = []) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey || !origin || !destination) {
        console.warn('Missing API key or coordinates for distance calculation');
        return { distanceKm: 0, durationMinutes: 0 };
    }

    try {
        // Build waypoints string for Google Maps API
        const waypointsStr = waypoints.length > 0
            ? `&waypoints=${waypoints.map(w => `${w.lat},${w.lng}`).join('|')}`
            : '';

        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}${waypointsStr}&key=${apiKey}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.routes[0]?.legs) {
            // Sum up all leg distances and durations
            const totalMeters = data.routes[0].legs.reduce(
                (sum, leg) => sum + (leg.distance?.value || 0),
                0
            );
            const totalSeconds = data.routes[0].legs.reduce(
                (sum, leg) => sum + (leg.duration?.value || 0),
                0
            );

            const distanceKm = parseFloat((totalMeters / 1000).toFixed(2));
            const durationMinutes = Math.round(totalSeconds / 60);

            return { distanceKm, durationMinutes };
        }

        console.warn('Google Maps API returned no valid route:', data.status);
        return { distanceKm: 0, durationMinutes: 0 };
    } catch (error) {
        console.error('Error calculating route distance:', error);
        return { distanceKm: 0, durationMinutes: 0 };
    }
}
