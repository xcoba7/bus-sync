'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import {
    LayoutDashboard,
    User,
    Settings,
    LogOut,
    Menu,
    X,
    Bell,
    MapPin,
    Clock
} from 'lucide-react';
import { ParentDashboardProvider, useParentDashboard } from './ParentDashboardContext';
import NotificationPanel from '@/components/NotificationPanel';

function DashboardLayoutContent({ children }) {
    const { loading, notifications } = useParentDashboard();
    const { data: session } = useSession();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const pathname = usePathname();

    const handleLogout = async () => {
        await signOut({ redirect: true, callbackUrl: '/' });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                    <p className="font-medium text-sm text-gray-500">Loading...</p>
                </div>
            </div>
        );
    }

    const navItems = [
        { id: 'overview', label: 'Overview', path: '/parent/dashboard', icon: LayoutDashboard },
        { id: 'activity', label: 'Activity', path: '/parent/dashboard/history', icon: Clock },
        { id: 'profile', label: 'Profile', path: '/parent/dashboard/profile', icon: User },
    ];

    // Find the most specific active item (longest path match first)
    const activeView = [...navItems]
        .sort((a, b) => b.path.length - a.path.length)
        .find(item => pathname === item.path || pathname?.startsWith(item.path + '/')) || navItems[0];

    const unreadNotifications = notifications.filter(n => !n.isRead).length;

    return (
        <div className="min-h-screen bg-white lg:flex">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar Navigation */}
            <aside className={`w-72 bg-white flex flex-col fixed lg:sticky top-0 h-screen z-50 transition-transform duration-300 border-r border-gray-100 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="p-8 pb-0">
                    <div className="flex items-center justify-between mb-12">
                        <Link href="/" className="text-3xl  tracking-tight text-black">
                            <p>Bus Sync</p>
                            <p className="text-lg text-indigo-500">Parents</p>
                            
                        </Link>
                        <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-gray-400 hover:text-black">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <nav className="space-y-1">
                        {navItems.map(item => {
                            const Icon = item.icon;
                            // Use the same logic as activeView to determine active state
                            const isActive = activeView.id === item.id;
                            return (
                                <Link
                                    key={item.id}
                                    href={item.path}
                                    onClick={() => setIsSidebarOpen(false)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                        ? 'bg-black text-white shadow-md'
                                        : 'text-gray-500 hover:bg-gray-50 hover:text-black'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="mt-auto p-8 border-t border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm  text-gray-900">
                            {session?.user?.name?.charAt(0)}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-semibold text-black truncate">{session?.user?.name}</p>
                            <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-red-600 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Log Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-h-screen relative">
                {/* Header */}
                <header className="h-20 lg:h-24 flex items-center justify-between px-6 lg:px-10 sticky top-0 bg-white/80 backdrop-blur-md z-30 border-b border-gray-50 lg:border-none">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-2 -ml-2 text-black hover:bg-gray-50 rounded-lg transition-colors"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-2xl  text-black tracking-tight">{activeView.label}</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 relative">
                        <button
                            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                            className={`relative p-2 transition-colors rounded-full hover:bg-gray-50 ${isNotificationOpen ? 'text-black bg-gray-50' : 'text-gray-400 hover:text-black'}`}
                        >
                            <Bell className="w-5 h-5" />
                            {unreadNotifications > 0 && (
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
                            )}
                        </button>

                        {isNotificationOpen && (
                            <div className="absolute top-full right-0 mt-4 w-80 z-50 animate-in slide-in-from-top-2 duration-200">
                                <NotificationPanel userId={session?.user?.id} />
                            </div>
                        )}
                    </div>
                </header>

                {/* View Content */}
                <div className="flex-1 px-6 lg:px-10 pb-10">
                    <div className="max-w-7xl h-full">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function ParentDashboardLayout({ children }) {
    return (
        <ParentDashboardProvider>
            <DashboardLayoutContent>{children}</DashboardLayoutContent>
        </ParentDashboardProvider>
    );
}
