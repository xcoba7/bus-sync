'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SuperAdminDashboardRoot() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/super-admin/dashboard/overview');
    }, [router]);

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-[#f8fafc] gap-6">
            <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
            <p className="font-black text-slate-400 uppercase tracking-widest text-xs animate-pulse">Syncing Global Authority...</p>
        </div>
    );
}
