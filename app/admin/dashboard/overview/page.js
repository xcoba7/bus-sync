'use client';

import { useDashboard } from '../DashboardContext';

export default function OverviewPage() {
    const { stats, terms, utilizationData } = useDashboard();

    return (
        <div className="space-y-10 ">
            {/* Analytics Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                {[
                    { label: 'Total Fleet', value: stats.buses, color: 'bg-black', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4', glow: '-500/20' },
                    { label: 'Ongoing Trips', value: stats.activeTrips, color: 'bg-black', icon: 'M13 10V3L4 14h7v7l9-11h-7z', glow: 'shadow-emerald-500/20', animate: true },
                    { label: `${terms.passenger} Body`, value: stats.passengers, color: 'bg-black', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197', glow: 'shadow-orange-500/20' },
                    { label: 'Active Drivers', value: stats.drivers, color: 'bg-black', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', glow: 'shadow-rose-500/20' },
                ].map((item, idx) => (
                    <div key={idx} className="p-8 rounded-[2.5rem] border border-slate-200 transition-all duration-500 group relative overflow-hidden">
                        <div className={`absolute -right-4 -top-4 w-32 h-32 bg-gradient-to-br ${item.color} opacity-[0.03] group-hover:opacity-[0.08] rounded-full blur-2xl transition-all duration-700`} />
                        <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center mb-6  ${item.glow}  transition-transform duration-500 relative`}>
                            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                            </svg>
                            {item.animate && (
                                <div className="absolute -top-1 -right-1 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                                </div>
                            )}
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px]  text-slate-400 uppercase tracking-[0.2em]">{item.label}</p>
                            <div className="flex items-baseline gap-2">
                                <p className="text-4xl  text-slate-900 tracking-tight">{item.value}</p>
                                {item.animate && <span className="text-[10px]  text-emerald-500 animate-pulse">LIVE</span>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid">
                {/* Visual Analytics Placeholder */}
                <div className="lg:col-span-2 bg-white/60 backdrop-blur-xl rounded-[2.5rem] lg:rounded-[3rem] p-8 lg:p-12 border border-white  shadow-slate-200/50 space-y-10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1" />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
                        <div>
                            <h2 className="text-2xl  text-slate-900 tracking-tight">Fleet Utilization</h2>
                        </div>
                        <div className="group bg-slate-900 text-white px-5 py-3 rounded-lg  text-xs flex items-center gap-3 cursor-default transition-all hover:bg-slate-800">
                            <span className="text-emerald-400 text-lg group-hover:scale-110 transition-transform">↗</span>
                            <div className="flex flex-col items-start leading-none">
                                <span className="text-[10px] opacity-60 uppercase mb-1">Performance</span>
                                <span className="tracking-widest">12.4%</span>
                            </div>
                        </div>
                    </div>

                    {/* Chart Area */}
                    <div className="h-64 lg:h-72 flex items-end gap-2 lg:gap-3 px-4 bg-gradient-to-b from-slate-50/50 to-white/50 rounded-3xl p-8 border border-slate-100 shadow-inner overflow-hidden group">
                        {utilizationData.slice(-12).map((count, i) => {
                            const maxVal = Math.max(...utilizationData, 1);
                            const height = (count / maxVal) * 100;
                            return (
                                <div key={i} className="flex-1 space-y-3 group/bar h-full">
                                    <div className="relative h-full flex flex-col justify-end">
                                        <div
                                            style={{ height: `${Math.max(height, 8)}%` }}
                                            className="w-full bg-black rounded-t-xl group-hover/bar:from-indigo-500 group-hover/bar:to-violet-400 transition-all duration-700 cursor-help relative group-hover/bar:-500/30 group-hover/bar:-translate-y-1"
                                            title={`${count} trips`}
                                        >
                                            <div className="absolute inset-x-0 bottom-0 top-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] bg-[length:16px_16px] animate-[slide_10s_linear_infinite] opacity-30" />
                                            {count > 0 && (
                                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-3 py-1.5 rounded-lg  opacity-0 group-hover/bar:opacity-100 transition-all duration-300 scale-50 group-hover/bar:scale-100 pointer-events-none whitespace-nowrap  z-20">
                                                    {count} TRIPS
                                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <span className="text-[10px]  text-slate-400 font-bold group-hover/bar:text-slate-900 transition-colors">
                                            {i + 1}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
