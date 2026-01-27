'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardProvider, useDashboard } from './DashboardContext';
import Loader from '@/components/Loader'

function DashboardLayoutContent({ children }) {
    const { loading, orgName, session, terms, fetchData } = useDashboard();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        await fetch('/api/auth/signout', { method: 'POST' });
        router.push('/admin/login');
    };

    if (loading) {
        return (
            <Loader />
        );
    }

    const navItems = [
        { id: 'overview', label: 'Overview', path: '/admin/dashboard/overview', icon: 'M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z' },
        { id: 'allocation', label: 'Student Management', path: '/admin/dashboard/allocation', icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 1 0 8 4 4 0 0 1 0-8z M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75' },
        { id: 'schedules', label: 'Schedules', path: '/admin/dashboard/schedules', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
        { id: 'drivers', label: 'Driver Management', path: '/admin/dashboard/drivers', icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z' },
        { id: 'fleet', label: 'Fleet Management', path: '/admin/dashboard/fleet', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
        { id: 'tracking', label: 'Live Tracking', path: '/admin/dashboard/tracking', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' },
    ];

    const activeView = navItems.find(item => pathname === item.path)?.id || 'overview';

    return (
        <div className="min-h-screen bg-[#fcfdfe] flex">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar Navigation */}
            <aside className={`w-72 bg-white border-r border-slate-100 flex flex-col fixed lg:sticky top-0 h-screen z-50 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="p-8">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <Link href="/" className="text-3xl text-slate-900 tracking-tight">Bus Sync</Link>
                            <p className="text-blue-600 tracking-widest">Admin</p>
                        </div>
                        <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-slate-600">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <nav className="space-y-1">
                        {navItems.map(item => (
                            <Link
                                key={item.id}
                                href={item.path}
                                onClick={() => setIsSidebarOpen(false)}
                                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-lg text-sm  transition-all duration-300 relative group/nav ${pathname === item.path ? 'bg-black text-white  -200 translate-x-1' : 'text-black hover:bg-slate-50 hover:text-slate-600'}`}
                            >
                                {pathname === item.path && (
                                    <div className="absolute inset-0 bg-black rounded-lg opacity-20 -z-10 animate-pulse" />
                                )}
                                <svg className={`w-5 h-5 transition-transform duration-300 ${pathname === item.path ? 'scale-110' : 'group-hover/nav:scale-110'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                                </svg>
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className="mt-auto p-8 pt-0">
                    <div className="rounded-3xl p-6 border border-slate-100">
                        <p className="text-[10px] text-slate-400  uppercase tracking-tighter mb-2">Organization</p>
                        <p className="text-sm text-slate-900">{orgName || session?.user?.name}</p>
                        <button onClick={handleLogout} className="cursor-pointer mt-4 flex items-center gap-2 text-xs  text-red-500 hover:text-red-600 transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Log Out
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Top Header */}
                <header className="h-20 lg:h-24 bg-white/80 backdrop-blur-md border-b border-slate-50 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-2 bg-slate-50 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16m-7 6h7" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-lg lg:text-2xl  text-slate-900 tracking-tight capitalize">{activeView.replace('-', ' ')}</h1>
                            <p className="text-[10px] lg:text-xs text-slate-400  uppercase tracking-widest hidden sm:block">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                        </div>
                    </div>
                </header>

                {/* View Content */}
                <div className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-10 custom-scrollbar relative">
                    {children}
                </div>
            </main>
        </div>
    );
}

export default function AdminDashboardLayout({ children }) {
    return (
        <DashboardProvider>
            <DashboardLayoutContent>{children}</DashboardLayoutContent>
        </DashboardProvider>
    );
}
