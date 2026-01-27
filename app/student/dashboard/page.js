'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
    Bus,
    Calendar,
    Clock,
    History,
    MapPin,
    QrCode,
    CheckCircle2,
    XCircle,
    Bell,
    LogOut,
    User
} from 'lucide-react';
import { format } from 'date-fns';

export default function StudentDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated' && session.user.role !== 'STUDENT') {
            router.push('/');
        } else if (status === 'authenticated') {
            fetchDashboard();
        }
    }, [status, router, session]);

    const fetchDashboard = async () => {
        try {
            const res = await fetch('/api/student/dashboard');
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (error) {
            console.error('Failed to fetch student dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await fetch('/api/auth/signout', { method: 'POST' });
        router.push('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-12 h-12 bg-indigo-600 rounded-full mb-4"></div>
                    <div className="h-4 w-32 bg-slate-200 rounded"></div>
                </div>
            </div>
        );
    }

    const { student, nextTrip, activeTrip, history } = data || {};

    return (
        <>
            {/* Profile Section */}
            {/* Profile Section */}
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-8 text-white shadow-xl shadow-indigo-100">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl backdrop-blur-md flex items-center justify-center">
                        <User className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Hi, {session.user.name}!</h1>
                        <p className="text-indigo-100 text-sm">{student?.school?.name}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                        <p className="text-xs text-indigo-200 uppercase font-bold tracking-wider mb-1">Assigned Bus</p>
                        <p className="font-semibold">{student?.bus?.busNumber || 'None'}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                        <p className="text-xs text-indigo-200 uppercase font-bold tracking-wider mb-1">Route</p>
                        <p className="font-semibold">{student?.route?.name || 'None'}</p>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-5 gap-6">
                {/* Next Trip & QR Column */}
                <div className="md:col-span-3 space-y-6">
                    {/* Next Trip Card */}
                    <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-indigo-600" />
                                Next Ship
                            </h2>
                            {activeTrip && (
                                <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                                    ONGOING
                                </span>
                            )}
                        </div>

                        {nextTrip ? (
                            <div className="space-y-4">
                                <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl">
                                    <div className="bg-white p-2 rounded-xl shadow-sm">
                                        <Calendar className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">
                                            {format(new Date(nextTrip.startTime), 'EEEE, MMM do')}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            Departure at {format(new Date(nextTrip.startTime), 'h:mm a')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl">
                                    <div className="bg-white p-2 rounded-xl shadow-sm">
                                        <MapPin className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">Pickup Location</p>
                                        <p className="text-xs text-slate-500">{student?.pickupAddress}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-400">
                                <p className="mb-2">No upcoming schedules found.</p>
                                <p className="text-xs">Enjoy your day!</p>
                            </div>
                        )}
                    </section>

                    {/* Authorization Card */}
                    <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 text-center">
                        <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center justify-center gap-2">
                            <QrCode className="w-5 h-5 text-indigo-600" />
                            Bus Entry QR
                        </h2>
                        <div className="inline-block p-6 bg-slate-50 rounded-3xl border-2 border-indigo-50 border-dashed">
                            <QRCodeSVG
                                value={student?.qrCode || 'ERROR'}
                                size={180}
                                className="rounded-lg"
                            />
                        </div>
                        <p className="mt-6 text-sm text-slate-500 max-w-[240px] mx-auto">
                            Show this QR code to the driver when boarding your assigned bus.
                        </p>
                    </section>
                </div>

                {/* History Column */}
                <div className="md:col-span-2">
                    <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 h-full">
                        <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <History className="w-5 h-5 text-indigo-600" />
                            Recent Activity
                        </h2>
                        <div className="space-y-4">
                            {history && history.length > 0 ? (
                                history.map((record) => (
                                    <div key={record.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-100 transition-colors group">
                                        <div className="flex items-start justify-between mb-2">
                                            <p className="text-sm font-bold text-slate-900">
                                                {record.trip?.route?.name || 'Bus Trip'}
                                            </p>
                                            {record.boardedAt ? (
                                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                            ) : (
                                                <XCircle className="w-4 h-4 text-slate-300" />
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 mb-2">
                                            {format(new Date(record.createdAt), 'MMM d, h:mm a')}
                                        </p>
                                        <div className="flex items-center gap-4 text-[10px] uppercase font-bold tracking-tighter">
                                            <span className={record.boardedAt ? 'text-green-600' : 'text-slate-400'}>
                                                IN: {record.boardedAt ? format(new Date(record.boardedAt), 'HH:mm') : '--:--'}
                                            </span>
                                            <span className={record.droppedAt ? 'text-indigo-600' : 'text-slate-400'}>
                                                OUT: {record.droppedAt ? format(new Date(record.droppedAt), 'HH:mm') : '--:--'}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 text-slate-400 italic">
                                    No history yet.
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}
