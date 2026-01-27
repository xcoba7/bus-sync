'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Bus, Bell, LogOut } from 'lucide-react';

export default function StudentDashboardLayout({ children }) {
    const { data: session } = useSession();
    const router = useRouter();

    const handleLogout = async () => {
        await fetch('/api/auth/signout', { method: 'POST' });
        router.push('/login');
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-12">
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                            <Bus className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-slate-900">BusSync</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                        <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-red-600 rounded-full transition-colors">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>
            <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
                {children}
            </main>
        </div>
    );
}
