'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const DashboardContext = createContext();

export function DashboardProvider({ children }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [data, setData] = useState(null);
    const [organizations, setOrganizations] = useState([]);
    const [globalUsers, setGlobalUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch('/api/super-admin/stats');
            if (res.ok) {
                setData(await res.json());
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchOrganizations = useCallback(async () => {
        const res = await fetch('/api/super-admin/organizations');
        if (res.ok) {
            const d = await res.json();
            setOrganizations(d.organizations);
        }
    }, []);

    const fetchGlobalUsers = useCallback(async () => {
        const res = await fetch('/api/super-admin/users');
        if (res.ok) {
            const d = await res.json();
            setGlobalUsers(d.users);
        }
    }, []);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated' && session.user.role !== 'SUPER_ADMIN') {
            router.push('/');
        } else if (status === 'authenticated') {
            fetchStats();
            fetchOrganizations();
            fetchGlobalUsers();
        }
    }, [status, router, session, fetchStats, fetchOrganizations, fetchGlobalUsers]);

    // Filtered data based on search
    const filteredOrganizations = organizations.filter(org =>
        org.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredUsers = globalUsers.filter(user =>
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.organization?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <DashboardContext.Provider value={{
            data,
            organizations: filteredOrganizations,
            globalUsers: filteredUsers,
            loading,
            fetchStats,
            fetchOrganizations,
            fetchGlobalUsers,
            session,
            searchQuery,
            setSearchQuery
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
