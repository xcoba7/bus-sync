'use client';

import { useState } from 'react';
import { useDashboard } from '../DashboardContext';
import { Send, AlertTriangle, Users, MessageSquare, Bell } from 'lucide-react';
import { sendBroadcast } from '@/lib/notification-manager';

export default function CommunicationsPage() {
    const { recentNotifications } = useDashboard();
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [target, setTarget] = useState('ALL');
    const [sending, setSending] = useState(false);

    const handleSendBroadcast = async (e) => {
        e.preventDefault();
        if (!title || !message) return;

        setSending(true);
        try {
            const res = await sendBroadcast(title, message, target);
            if (res.success) {
                alert(`Broadcast sent to ${res.count} users!`);
                setTitle('');
                setMessage('');
            } else {
                alert('Failed to send broadcast');
            }
        } catch (error) {
            alert('An error occurred');
        } finally {
            setSending(false);
        }
    };

    const emergencyAlerts = recentNotifications.filter(n => n.type === 'EMERGENCY_ALERT');

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* broadcast section */}
            <section className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-8 border-b border-slate-200 flex items-center gap-4 bg-slate-50/50">
                    <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center">
                        <Send className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">New Broadcast</h2>
                        <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Send announcements to your organization</p>
                    </div>
                </div>

                <form onSubmit={handleSendBroadcast} className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black mb-2 block">Broadcast Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g., Weather Delay"
                                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black mb-2 block">Target Audience</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { id: 'ALL', label: 'Everyone', icon: Users },
                                        { id: 'DRIVERS', label: 'Drivers', icon: Bell },
                                        { id: 'PARENTS', label: 'Parents', icon: Bell }
                                    ].map((opt) => (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => setTarget(opt.id)}
                                            className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${target === opt.id ? 'bg-black text-white border-black ring-4 ring-black/10' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'}`}
                                        >
                                            <opt.icon className="w-5 h-5" />
                                            <span className="text-xs font-bold">{opt.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black mb-2 block">Message Content</label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Type your announcement here..."
                                    rows={6}
                                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none resize-none"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={sending}
                                className="w-full bg-black text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                {sending ? 'Sending...' : (
                                    <>
                                        Send Message
                                        <Send className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </section>

            {/* Emergency alerts section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <section className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Emergency Alerts</h2>
                        <span className="px-3 py-1 bg-red-100 text-red-600 text-[10px] font-black rounded-full">LIVE</span>
                    </div>
                    <div className="space-y-4">
                        {emergencyAlerts.length === 0 ? (
                            <div className="bg-white rounded-[2rem] border border-slate-100 p-12 text-center text-slate-400">
                                <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p className="text-sm">No recent emergency alerts reported.</p>
                            </div>
                        ) : (
                            emergencyAlerts.map((alert) => (
                                <div key={alert.id} className="bg-red-50 border border-red-100 p-6 rounded-[2rem] relative overflow-hidden group">
                                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                        <AlertTriangle className="w-16 h-16 text-red-600" />
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-red-200">
                                            <AlertTriangle className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="space-y-1 relative z-10">
                                            <p className="text-red-600 font-bold uppercase tracking-widest text-[10px]">Critical Alert</p>
                                            <h3 className="text-lg font-bold text-red-900">{alert.title}</h3>
                                            <p className="text-sm text-red-700/80 leading-relaxed font-medium">{alert.message}</p>
                                            <p className="text-[10px] text-red-400 font-bold pt-2">
                                                {new Date(alert.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                <section className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Recent Activity</h2>
                        <MessageSquare className="w-4 h-4 text-slate-300" />
                    </div>
                    <div className="bg-white rounded-[2rem] border border-slate-100 divide-y divide-slate-50 overflow-hidden">
                        {recentNotifications.length === 0 ? (
                            <div className="p-12 text-center text-slate-400 text-sm italic">No recent communication logs</div>
                        ) : (
                            recentNotifications.map((notif) => (
                                <div key={notif.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${notif.type === 'BROADCAST' ? 'bg-blue-100 text-blue-600' :
                                                notif.type === 'EMERGENCY_ALERT' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                            <Bell className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">{notif.title}</p>
                                            <p className="text-xs text-slate-400 truncate max-w-[200px]">{notif.message}</p>
                                        </div>
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-300">
                                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
