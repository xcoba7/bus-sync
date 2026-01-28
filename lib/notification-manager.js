/**
 * Notification Manager
 * Handles in-app and browser push notifications
 */

export const NOTIFICATION_TYPES = {
    TRIP_STARTED: 'TRIP_STARTED',
    TRIP_COMPLETED: 'TRIP_COMPLETED',
    STUDENT_BOARDED: 'STUDENT_BOARDED',
    STUDENT_DROPPED: 'STUDENT_DROPPED',
    ROUTE_DELAYED: 'ROUTE_DELAYED',
    EMERGENCY_ALERT: 'EMERGENCY_ALERT',
    BROADCAST: 'BROADCAST',
};

/**
 * Request permission for browser notifications
 */
export async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.warn('This browser does not support desktop notifications');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
}

/**
 * Show a browser push notification
 * @param {string} title 
 * @param {Object} options 
 */
export function showPushNotification(title, options = {}) {
    if (Notification.permission === 'granted') {
        const defaultOptions = {
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            vibrate: [200, 100, 200],
            ...options
        };

        return new Notification(title, defaultOptions);
    }
}

/**
 * Send an emergency alert (Admin or Driver)
 */
export async function sendEmergencyAlert(message, metadata = {}) {
    try {
        const response = await fetch('/api/notifications/emergency', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, metadata }),
        });
        return await response.json();
    } catch (error) {
        console.error('Failed to send emergency alert:', error);
        return { error: 'Connection failed' };
    }
}

/**
 * Broadcast a message to a group
 */
export async function sendBroadcast(title, message, target = 'ALL') {
    try {
        const response = await fetch('/api/notifications/broadcast', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, message, target }),
        });
        return await response.json();
    } catch (error) {
        console.error('Failed to send broadcast:', error);
        return { error: 'Connection failed' };
    }
}
