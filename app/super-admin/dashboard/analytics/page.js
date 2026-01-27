'use client';

import {
    BarChart3
} from 'lucide-react';
import { useDashboard } from '../DashboardContext';

export default function AnalyticsPage() {
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl text-slate-900 tracking-tight">Analytics</h1>
                <p className="text-slate-400  uppercase text-[10px] tracking-[0.2em] mt-1">Platform telemetry & metrics</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl">
                    <div className="flex items-center justify-between mb-10">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Registry Growth (6 Months)</h3>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-indigo-600 rounded-full" />
                                <span className="text-[10px] font-black uppercase text-slate-400">Orgs</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-violet-400 rounded-full" />
                                <span className="text-[10px] font-black uppercase text-slate-400">Schools</span>
                            </div>
                        </div>
                    </div>
                    {/* Placeholder for chart */}
                    <div className="h-80 w-full bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200 flex items-center justify-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Advanced Telemetry Engine Offline</p>
                    </div>
                </div>

                <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl space-y-8">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Tenant Composition</h3>
                    <div className="space-y-6">
                        {[
                            { label: 'Educational', value: 65, color: 'bg-indigo-600' },
                            { label: 'Corporate', value: 20, color: 'bg-violet-400' },
                            { label: 'Religious', value: 10, color: 'bg-emerald-400' },
                            { label: 'Public Sector', value: 5, color: 'bg-amber-400' },
                        ].map((item, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] font-black uppercase text-slate-900">{item.label}</span>
                                    <span className="text-[10px] font-black text-slate-400">{item.value}%</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${item.color} rounded-full`}
                                        style={{ width: `${item.value}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
