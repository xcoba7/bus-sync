'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const ParentDashboardContext = createContext();

export function ParentDashboardProvider({ children }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [profile, setProfile] = useState(null);
    const [students, setStudents] = useState([]);
    const [stats, setStats] = useState({ activeTrips: 0, totalTips: 0 });
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    const fetchData = useCallback(async () => {
        try {
            // Fetch profile
            const profileRes = await fetch('/api/parent/profile');
            if (profileRes.ok) {
                const data = await profileRes.json();
                setProfile(data.profile);
            } else {
                console.error('Failed to fetch profile:', profileRes.status);
            }

            // Fetch students
            const studentsRes = await fetch('/api/parent/students');
            if (studentsRes.ok) {
                const data = await studentsRes.json();
                setStudents(data.students || []);
            }

            // Fetch notifications
            const notifRes = await fetch('/api/notifications');
            if (notifRes.ok) {
                const data = await notifRes.json();
                setNotifications(data.notifications || []);
            }

            // Fetch stats (we can reuse trip history or create a dedicated stats endpoint later)
            // For now, calculating from recent activity if possible or placeholder
            const historyRes = await fetch('/api/parent/trip-history');
            if (historyRes.ok) {
                const data = await historyRes.json();
                // Simple stats for now
                setStats({
                    activeTrips: 0, // Placeholder, would need real tracking data
                    totalTrips: data.trips?.length || 0
                })
            }

        } catch (error) {
            console.error('Failed to fetch parent data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login'); // Assuming main login is at /login or /parent/login
        } else if (status === 'authenticated' && session.user.role !== 'PARENT') {
            router.push('/');
        } else if (status === 'authenticated') {
            fetchData();
            // Poll for updates every 30 seconds
            const interval = setInterval(fetchData, 30000);
            return () => clearInterval(interval);
        }
    }, [status, router, session, fetchData]);
    
    
    return (
        <ParentDashboardContext.Provider value={{
            profile, setProfile,
            students, setStudents,
            stats, setStats,
            notifications, setNotifications,
            loading,
            fetchData,
            session,
            activeTab, setActiveTab
        }}>
            {children}
        </ParentDashboardContext.Provider>
    );
}

export function useParentDashboard() {
    const context = useContext(ParentDashboardContext);
    if (!context) {
        throw new Error('useParentDashboard must be used within a ParentDashboardProvider');
    }
    return context;
}
