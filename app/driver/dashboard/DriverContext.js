'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Html5QrcodeScanner } from 'html5-qrcode';

const DriverContext = createContext();

export function DriverProvider({ children }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [route, setRoute] = useState(null);
    const [students, setStudents] = useState([]);
    const [activeTrip, setActiveTrip] = useState(null);
    const [scheduledTrips, setScheduledTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const scannerRef = useRef(null);

    // New state for enhanced dashboard
    const [driverProfile, setDriverProfile] = useState(null);
    const [stats, setStats] = useState({ tripsToday: 0, totalTrips: 0, totalPassengers: 0, totalDistance: 0 });
    const [vehicleInfo, setVehicleInfo] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadNotifications, setUnreadNotifications] = useState(0);

    const fetchInitialData = useCallback(async () => {
        try {
            const [routeRes, schedulesRes, statsRes, profileRes, vehicleRes, notifRes] = await Promise.all([
                fetch('/api/driver/route', { cache: 'no-store' }),
                fetch('/api/driver/schedules', { cache: 'no-store' }),
                fetch('/api/driver/stats', { cache: 'no-store' }),
                fetch('/api/driver/profile', { cache: 'no-store' }),
                fetch('/api/driver/vehicle', { cache: 'no-store' }),
                fetch('/api/notifications', { cache: 'no-store' })
            ]);


            if (routeRes.ok) {
                const data = await routeRes.json();
                setRoute(data.route);
                setStudents(data.passengers || []);
                setActiveTrip(data.activeTrip);
            }
            if (schedulesRes.ok) {
                const sData = await schedulesRes.json();
                console.log({ sData })
                setScheduledTrips(sData.trips || []);
            }
            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData.stats);
            }
            if (profileRes.ok) {
                const profileData = await profileRes.json();
                setDriverProfile(profileData.profile);
            }
            if (vehicleRes.ok) {
                const vehicleData = await vehicleRes.json();
                setVehicleInfo(vehicleData.vehicle);
            }
            if (notifRes.ok) {
                const notifData = await notifRes.json();
                setNotifications(notifData.notifications || []);
                setUnreadNotifications(notifData.notifications?.filter(n => !n.isRead).length || 0);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchInitialData();
            const interval = setInterval(fetchInitialData, 15000);
            return () => clearInterval(interval);
        }
    }, [status, fetchInitialData]);

    const locationIntervalRef = useRef(null);

    const updateLocation = useCallback(async (position) => {
        const { latitude, longitude, speed, heading, accuracy } = position.coords;
        try {
            await fetch('/api/driver/location', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lat: latitude,
                    lng: longitude,
                    speed: speed || 0,
                    heading: heading || 0,
                    accuracy: accuracy || 0
                })
            });
        } catch (error) {
            console.error('Failed to update location:', error);
        }
    }, []);

    useEffect(() => {
        if (activeTrip && activeTrip.status === 'ONGOING') {
            // Request permission and start tracking
            if ('geolocation' in navigator) {
                const watchId = navigator.geolocation.watchPosition(
                    updateLocation,
                    (error) => console.error('Geolocation error:', error),
                    {
                        enableHighAccuracy: true,
                        maximumAge: 0, // Force fresh location
                        timeout: 5000  // Faster timeout for better responsiveness
                    }
                );

                return () => navigator.geolocation.clearWatch(watchId);
            }
        }
    }, [activeTrip, updateLocation]);

    return (
        <DriverContext.Provider value={{
            route, setRoute,
            students, setStudents,
            activeTrip, setActiveTrip,
            scheduledTrips, setScheduledTrips,
            loading,
            scanning, setScanning,
            scanResult, setScanResult,
            fetchInitialData,
            session,
            // New state
            driverProfile, setDriverProfile,
            stats, setStats,
            vehicleInfo, setVehicleInfo,
            notifications, setNotifications,
            unreadNotifications, setUnreadNotifications
        }}>
            {children}
        </DriverContext.Provider>
    );
}

export function useDriver() {
    return useContext(DriverContext);
}
