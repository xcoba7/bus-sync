'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { getTerminology } from '@/lib/terminology';
import { getPusherClient } from '@/lib/pusher-client';

const DashboardContext = createContext();

export function DashboardProvider({ children }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [studentsList, setStudentsList] = useState([]);
    const [driversList, setDriversList] = useState([]);
    const [busesList, setBusesList] = useState([]);
    const [routesList, setRoutesList] = useState([]);
    const [stats, setStats] = useState({ buses: 0, activeTrips: 0, students: 0, drivers: 0 });
    const [activeBuses, setActiveBuses] = useState([]);
    const [recentNotifications, setRecentNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [orgType, setOrgType] = useState('OTHER');
    const [orgName, setOrgName] = useState('');
    const [utilizationData, setUtilizationData] = useState(Array(24).fill(0));

    const terms = getTerminology(orgType);

    const fetchData = useCallback(async () => {
        try {
            const [statsRes, notificationsRes] = await Promise.all([
                fetch('/api/admin/stats'),
                fetch('/api/notifications'),
            ]);

            if (statsRes.ok) {
                const data = await statsRes.json();
                setStats(data.stats);
                setActiveBuses(data.activeBuses || []);
                if (data.organizationType) setOrgType(data.organizationType);
                if (data.organizationName) setOrgName(data.organizationName);
                if (data.utilizationData) {
                    setUtilizationData(data.utilizationData);
                }
            }

            if (notificationsRes.ok) {
                const data = await notificationsRes.json();
                setRecentNotifications(data.notifications.slice(0, 10) || []);
            }
        } catch (error) {
            console.error('Failed to fetch admin data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchResources = useCallback(async () => {
        try {
            const [sRes, dRes, bRes, rRes] = await Promise.all([
                fetch('/api/admin/students'),
                fetch('/api/admin/drivers'),
                fetch('/api/admin/buses'),
                fetch('/api/admin/routes')
            ]);
            if (sRes.ok) {
                const data = await sRes.json();
                setStudentsList(data.passengers || []);
            }
            if (dRes.ok) {
                const data = await dRes.json();
                setDriversList(data.drivers || []);
            }
            if (bRes.ok) {
                const data = await bRes.json();
                setBusesList(data.buses || []);
            }
            if (rRes.ok) {
                const data = await rRes.json();
                setRoutesList(data.routes || []);
            }
        } catch (error) {
            console.error('Failed to fetch resources:', error);
        }
    }, []);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/admin/login');
        } else if (status === 'authenticated' && session.user.role !== 'ADMIN') {
            router.push('/');
        } else if (status === 'authenticated') {
            fetchData();
            fetchResources();

            const interval = setInterval(fetchData, 15000);
            const pusher = getPusherClient();
            let notifChannel = null;

            if (pusher) {
                // Real-time Bus Tracking
                const trackingChannel = pusher.subscribe('tracking-channel');
                trackingChannel.bind('bus-location-update', (data) => {
                    setActiveBuses(prev => {
                        const index = prev.findIndex(b => b.id === data.busId);
                        if (index !== -1) {
                            const updated = [...prev];
                            updated[index] = {
                                ...updated[index],
                                currentLat: data.lat,
                                currentLng: data.lng,
                                lastLocationTime: data.updatedAt
                            };
                            return updated;
                        }
                        return prev;
                    });
                });

                // Real-time Notifications
                if (session?.user?.id) {
                    notifChannel = pusher.subscribe(`notifications-${session.user.id}`);
                    notifChannel.bind('new-notification', (data) => {
                        setRecentNotifications(prev => [data, ...prev].slice(0, 10));
                        if (window.Notification && Notification.permission === 'granted') {
                            new Notification(data.title, { body: data.message });
                        }
                    });
                }

                return () => {
                    pusher.unsubscribe('tracking-channel');
                    if (notifChannel) pusher.unsubscribe(`notifications-${session.user.id}`);
                    clearInterval(interval);
                };
            }

            return () => clearInterval(interval);
        }
    }, [status, router, session, fetchData, fetchResources]);

    return (
        <DashboardContext.Provider value={{
            studentsList, setStudentsList,
            driversList, setDriversList,
            busesList, setBusesList,
            routesList, setRoutesList,
            stats, activeBuses,
            recentNotifications,
            loading,
            orgType, orgName,
            utilizationData,
            terms,
            fetchData,
            fetchResources,
            session
        }}>
            {children}
        </DashboardContext.Provider>
    );
}

export function useDashboard() {
    const context = useContext(DashboardContext);
    if (!context) {
        throw new Error('useDashboard must be used within a DashboardProvider');
    }
    return context;
}
