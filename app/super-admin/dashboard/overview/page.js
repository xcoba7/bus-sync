'use client';

import {
    Building2,
    Users,
    Globe,
    ChevronRight,
    LayoutDashboard
} from 'lucide-react';
import { useDashboard } from '../DashboardContext';
import Link from 'next/link';

export default function OverviewPage() {
    const { data } = useDashboard();
    const { stats, recentOrganizations } = data || {};

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl  text-slate-900 tracking-tight">Overview</h1>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {[
                    { label: 'Organizations', value: stats?.organizations, icon: Building2, color: 'from-blue-600 to-indigo-500' },
                    { label: 'Total Users', value: stats?.users, icon: Users, color: 'from-violet-600 to-purple-500' },
                    { label: 'Total Trips', value: stats?.trips, icon: Globe, color: 'from-emerald-600 to-teal-500' },
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/60 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden cursor-default">
                        <div className={`absolute -right-4 -top-4 w-32 h-32 bg-black opacity-[0.03] group-hover:opacity-[0.08] rounded-full blur-2xl transition-all duration-700`} />
                        <div className={`w-14 h-14 rounded-2xl bg-black shadow-lg flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-500`}>
                            <stat.icon className="w-7 h-7" />
                        </div>
                        <p className="text-[10px]  text-slate-400 uppercase tracking-[0.2em]">{stat.label}</p>
                        <p className="text-4xl  text-slate-900 tracking-tight mt-1">{stat.value || 0}</p>
                    </div>
                ))}
            </div>

            <div className="grid lg:grid-cols-1 gap-10">
                <section className="bg-white/60 backdrop-blur-xl rounded-[3rem] border border-white shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col group/card">
                    <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl  text-slate-900 tracking-tight">Recent Organizations</h2>
                            <p className="text-[9px]  text-slate-400 uppercase tracking-widest mt-1">Tenant Registry Activity</p>
                        </div>
                        <Link
                            href="/super-admin/dashboard/organizations"
                            className="px-4 py-2 rounded-lg text-[10px]  uppercase tracking-widest border border-slate-200 hover:border-black transition-all"
                        >
                            View All
                        </Link>
                    </div>
                    <div className="flex-1 p-8 space-y-4">
                        {recentOrganizations?.map((org) => (
                            <Link
                                href="/super-admin/dashboard/organizations"
                                key={org.id}
                                className="group flex items-center justify-between p-5 rounded-3xl bg-slate-50/50 border border-transparent hover:border-indigo-100 hover:bg-white hover:shadow-xl hover:shadow-indigo-50/50 transition-all cursor-pointer"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all scale-95 group-hover:scale-100">
                                        {org.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className=" text-slate-900 tracking-tight leading-none">{org.name}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="w-1 h-1 bg-indigo-400 rounded-full" />
                                            <p className="text-[9px]  text-slate-400 uppercase tracking-widest">{org._count.users} Active Users • {org._count.buses} Buses</p>
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
