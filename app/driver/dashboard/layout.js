'use client';

import { useSession } from 'next-auth/react';
import Loader from '../../../components/Loader'

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import {
    LayoutDashboard,
    User,
    History,
    Truck,
    Bell,
    QrCode,
    Shield,
    LogOut,
    Menu,
    X,
    Navigation
} from 'lucide-react';
import { DriverProvider, useDriver } from './DriverContext';

function LayoutContent({ children }) {
    const { session, scanning, setScanning, unreadNotifications, loading } = useDriver();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        await fetch('/api/auth/signout', { method: 'POST' });
        router.push('/driver/login');
    };

    if (loading) {
        return <Loader />
    }

    const navItems = [
        { id: 'overview', label: 'Overview', path: '/driver/dashboard', icon: LayoutDashboard },
        { id: 'route', label: 'Route & Navigation', path: '/driver/dashboard/route', icon: Navigation },
        { id: 'attendance', label: 'Attendance', path: '/driver/dashboard/attendance', icon: QrCode },
        { id: 'history', label: 'Trip History', path: '/driver/dashboard/history', icon: History },
        { id: 'vehicle', label: 'Vehicle Info', path: '/driver/dashboard/vehicle', icon: Truck },
        { id: 'profile', label: 'Profile', path: '/driver/dashboard/profile', icon: User },
    ];

    return (
        <div className="min-h-screen bg-white text-black flex">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-white z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar Navigation */}
            <aside className={`w-72  border-r border-slate-200 flex flex-col fixed lg:sticky top-0 h-screen z-50 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="p-8">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-3">
                            <div>
                                <Link href="/" className="text-3xl text-slate-900 tracking-tight">Bus Sync</Link>
                                <p className="text-sm text-indigo-500 tracking-widest">Driver</p>
                            </div>
                        </div>
                        <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2  hover:text-slate-400 transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <nav className="space-y-1">
                        {navItems.map(item => {
                            const Icon = item.icon;
                            const isActive = pathname === item.path;
                            return (
                                <Link
                                    key={item.id}
                                    href={item.path}
                                    onClick={() => setIsSidebarOpen(false)}
                                    className={`w-full flex items-center justify-between gap-4 px-4 py-3.5 rounded-lg text-sm transition-all duration-300 relative group/nav ${isActive
                                        ? 'bg-black text-white   translate-x-1'
                                        : 'text-black hover:bg-slate-100'
                                        }`}
                                >
                                    {isActive && (
                                        <div className="absolute inset-0 bg-black rounded-lg opacity-20 -z-10 animate-pulse" />
                                    )}
                                    <div className="flex items-center gap-4">
                                        <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover/nav:scale-110'}`} />
                                        {item.label}
                                    </div>
                                    {item.badge > 0 && (
                                        <span className="bg-red-500 text-white text-[10px]  px-2 py-0.5 rounded-full min-w-[20px] text-center">
                                            {item.badge > 99 ? '99+' : item.badge}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* QR Scanner Button */}
                    <button
                        onClick={() => setScanning(!scanning)}
                        className={`w-full mt-6 flex items-center gap-4 px-4 py-3.5 rounded-lg text-sm transition-all duration-300 ${scanning ? 'bg-red-500 text-black  shadow-red-500/20' : 'bg-white/5 hover:bg-slate-100 text-black'
                            }`}
                    >
                        <QrCode className="w-5 h-5" />
                        {scanning ? 'Stop Scanning' : 'Scan QR Code'}
                    </button>
                </div>

                <div className="mt-auto p-8 pt-0">
                    <div className="rounded-3xl p-6 border border-slate-200 bg-white/5">
                        <p className="text-sm  truncate">{session?.user?.name}</p>
                        <p className="text-xs text-slate-400 truncate">{session?.user?.email}</p>
                        <button
                            onClick={handleLogout}
                            className="mt-4 flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                            <LogOut className="w-4 h-4 transform scale-x-[-1]" />
                            Log Out
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Top Header */}
                <header className="h-20 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-2 bg-white/5 rounded-xl text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-lg lg:text-2xl  tracking-tight capitalize">
                                {navItems.find(item => item.path === pathname)?.label || 'Dashboard'}
                            </h1>
                            <p className="text-[10px] lg:text-xs text-slate-400 uppercase tracking-widest hidden sm:block">
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                    </div>
                </header>

                {/* View Content */}
                <div className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-10 custom-scrollbar">
                    {children}
                </div>
            </main>
        </div>
    );
}

export default function DriverDashboardLayout({ children }) {
    return (
        <DriverProvider>
            <LayoutContent>{children}</LayoutContent>
        </DriverProvider>
    );
}
