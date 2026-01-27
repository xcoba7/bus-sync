'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    LayoutDashboard,
    Building2,
    Users,
    BarChart3,
    Plus,
    Search,
    Compass,
    Settings,
    Shield
} from 'lucide-react';
import { DashboardProvider, useDashboard } from './DashboardContext';

function DashboardLayoutContent({ children }) {
    const { loading, session, fetchStats, fetchOrganizations, fetchGlobalUsers, searchQuery, setSearchQuery } = useDashboard();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [modal, setModal] = useState({ type: null, item: null });
    const [formLoading, setFormLoading] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        await fetch('/api/auth/signout', { method: 'POST' });
        router.push('/admin/login');
    };

    const handleOrgSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        const name = e.target.name.value;
        const url = modal.item ? `/api/super-admin/organizations/${modal.item.id}` : '/api/super-admin/organizations';
        const method = modal.item ? 'PATCH' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    subscriptionPlan: e.target.subscriptionPlan?.value,
                    subscriptionStatus: e.target.subscriptionStatus?.value,
                    organizationType: e.target.organizationType?.value,
                    maxBuses: parseInt(e.target.maxBuses?.value || 5),
                    maxStudents: parseInt(e.target.maxStudents?.value || 100),
                    maxDrivers: parseInt(e.target.maxDrivers?.value || 10),
                    isActive: e.target.isActive?.checked,
                    hasSmsNotifications: e.target.hasSmsNotifications?.checked,
                    hasAdvancedAnalytics: e.target.hasAdvancedAnalytics?.checked,
                    adminName: e.target.adminName?.value,
                    adminEmail: e.target.adminEmail?.value,
                    adminPassword: e.target.adminPassword?.value
                })
            });
            if (res.ok) {
                fetchStats();
                fetchOrganizations();
                setModal({ type: null, item: null });
            } else {
                const err = await res.json();
                alert(err.error || 'Operation failed');
            }
        } catch (error) {
            alert('Failed to save organization');
        } finally {
            setFormLoading(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-screen bg-[#f8fafc] gap-6">
            <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
            <p className=" text-slate-400 uppercase tracking-widest text-xs animate-pulse">Syncing Global Authority...</p>
        </div>
    );

    const navItems = [
        { id: 'overview', label: 'Overview', path: '/super-admin/dashboard/overview', icon: LayoutDashboard },
        { id: 'organizations', label: 'Organizations', path: '/super-admin/dashboard/organizations', icon: Building2 },
        { id: 'analytics', label: 'Analytics', path: '/super-admin/dashboard/analytics', icon: BarChart3 },
    ];

    const activeView = navItems.find(item => pathname === item.path)?.id || 'overview';

    return (
        <div className="min-h-screen bg-[#fcfdfe] flex">
            {/* Modal Logic (shared) */}
            {modal.type === 'org' && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl border border-white p-10 animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-2xl  text-slate-900 tracking-tight">
                                    {modal.item ? 'Modify' : 'Register'} Organization
                                </h2>
                                <p className="text-[10px] text-slate-400  uppercase tracking-[0.2em] mt-1">Onboard a new organization</p>
                            </div>
                            <button onClick={() => setModal({ type: null, item: null })} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                                <Plus className="w-6 h-6 rotate-45 text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleOrgSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                            <div className="space-y-2">
                                <label className="text-[10px] text-slate-400  uppercase tracking-widest ml-1">Organization Name</label>
                                <input
                                    name="name"
                                    defaultValue={modal.item?.name}
                                    placeholder="e.g. Skyline Education Group"
                                    required
                                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm  focus:ring-2 focus:ring-indigo-600/20 transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] text-slate-400  uppercase tracking-widest ml-1">Plan</label>
                                    <select
                                        name="subscriptionPlan"
                                        defaultValue={modal.item?.subscriptionPlan || 'FREE'}
                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm  focus:ring-2 focus:ring-indigo-600/20 appearance-none"
                                    >
                                        <option value="FREE">Free Trial</option>
                                        <option value="BASIC">Basic</option>
                                        <option value="PROFESSIONAL">Professional</option>
                                        <option value="ENTERPRISE">Enterprise</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-slate-400  uppercase tracking-widest ml-1">Status</label>
                                    <select
                                        name="subscriptionStatus"
                                        defaultValue={modal.item?.subscriptionStatus || 'TRIAL'}
                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm  focus:ring-2 focus:ring-indigo-600/20 appearance-none"
                                    >
                                        <option value="TRIAL">Trial</option>
                                        <option value="ACTIVE">Active</option>
                                        {/*<option value="SUSPENDED">Suspended</option>*/}
                                        {/*<option value="CANCELLED">Cancelled</option>*/}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] text-slate-400  uppercase tracking-widest ml-1">Organization Type</label>
                                <select
                                    name="organizationType"
                                    defaultValue={modal.item?.type || 'OTHER'}
                                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm  focus:ring-2 focus:ring-indigo-600/20 appearance-none"
                                >
                                    <option value="SCHOOL">School</option>
                                    <option value="COMPANY">Company</option>
                                    <option value="CHURCH">Church</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>

                            {!modal.item && (
                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    <p className="text-[10px]  text-slate-900 uppercase tracking-widest">Primary Admin Details</p>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-slate-400  uppercase tracking-widest ml-1">Admin Name</label>
                                            <input name="adminName" placeholder="Full name of organization admin" className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm  focus:ring-2 focus:ring-indigo-600/20 transition-all" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] text-slate-400  uppercase tracking-widest ml-1">Admin Email</label>
                                                <input type="email" name="adminEmail" placeholder="admin@org.com" className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm  focus:ring-2 focus:ring-indigo-600/20 transition-all" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] text-slate-400  uppercase tracking-widest ml-1">Initial Password</label>
                                                <input type="password" name="adminPassword" placeholder="••••••••" className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm  focus:ring-2 focus:ring-indigo-600/20 transition-all" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-4 pt-6">
                                <button type="button" onClick={() => setModal({ type: null, item: null })} className="flex-1 px-6 py-4 rounded-2xl  text-[10px] uppercase text-slate-500 hover:bg-slate-50 transition-all">Cancel</button>
                                <button type="submit" disabled={formLoading} className="flex-1 px-6 py-4 rounded-2xl  text-[10px] uppercase bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50">
                                    {formLoading ? 'Executing...' : 'Register'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Sidebar Navigation */}
            <aside className={`w-80 bg-white border-r border-slate-200 flex flex-col fixed lg:sticky top-0 h-screen z-50 transition-all duration-500 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="p-10">
                    <div className="flex items-center gap-4 mb-12">
                        <div>
                            <p className="text-xl  text-slate-900 tracking-tight">Bus Sync</p>
                            <p className="text-[10px] text-indigo-600 font-extralight  uppercase tracking-widest">Super Admin</p>
                        </div>
                    </div>

                    <nav className="space-y-2">
                        {navItems.map(item => (
                            <Link
                                key={item.id}
                                href={item.path}
                                onClick={() => setIsSidebarOpen(false)}
                                className={`w-full flex items-center gap-5 px-6 py-4 rounded-2xl text-xs  transition-all group relative ${pathname === item.path ? 'bg-slate-900 text-white shadow-2xl shadow-indigo-100 translate-x-2' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'}`}
                            >
                                <item.icon className={`w-5 h-5 transition-transform duration-500 ${pathname === item.path ? 'scale-110' : 'group-hover:scale-110'}`} />
                                {item.label}
                                {pathname === item.path && (
                                    <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                                )}
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className="mt-auto p-10 pt-0">
                    <div className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100">
                        <p className="text-[10px]  text-slate-400 uppercase tracking-widest mb-3">Operator</p>
                        <p className="text-sm  text-slate-900">{session?.user?.name}</p>
                        <button onClick={handleLogout} className="mt-6 flex items-center gap-3 text-[10px]  uppercase text-red-500 hover:text-red-600 transition-all">
                            Log Out
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="h-24 bg-white/80 backdrop-blur-md border-b border-slate-50 flex items-center justify-between px-10 sticky top-0 z-20">
                    <div className="flex items-center gap-6 flex-1">
                        <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-3 bg-slate-50 rounded-2xl text-slate-600 hover:bg-slate-100 transition-all">
                            <Compass className="w-6 h-6" />
                        </button>
                        {!pathname.includes('overview') && <div className="relative max-w-md w-full hidden md:block">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300"/>
                            <input
                                placeholder="Search..."
                                className="w-full pl-14 pr-6 py-4 bg-slate-50/50 border-none rounded-2xl text-[10px]  uppercase tracking-widest focus:ring-2 focus:ring-indigo-600/10 transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>}
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setModal({ type: 'org', item: null })}
                            className="bg-slate-900 text-white px-6 py-4 rounded-2xl text-[10px]  uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center gap-3"
                        >
                            <Plus className="w-4 h-4" />
                            Add Organization
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-10 custom-scrollbar pb-24 h-full relative">
                    {children}
                </div>
            </main>
        </div>
    );
}

export default function SuperAdminDashboardLayout({ children }) {
    return (
        <DashboardProvider>
            <DashboardLayoutContent>{children}</DashboardLayoutContent>
        </DashboardProvider>
    );
}
