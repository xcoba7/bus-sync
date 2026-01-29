'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Bus,
    Users,
    Navigation,
    CheckCircle2,
    Calendar,
    Square,
    TrendingUp,
    Activity,
    MapPin,
    ArrowRight,
    History as HistoryIcon,
    AlertTriangle,
    Clock,
    Send
} from 'lucide-react';
import { useDriver } from './DriverContext';
import { getStatusColor } from './history/page';
import { sendEmergencyAlert, sendBroadcast } from '@/lib/notification-manager';

export default function DriverOverview() {
    const {
        route, students, activeTrip, scheduledTrips,
        fetchInitialData, stats, geoError, setGeoError
    } = useDriver();


    const [recentTrips, setRecentTrips] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    useEffect(() => {
        fetchInitialData();
        fetchRecentHistory();
    }, []);

    const fetchRecentHistory = async () => {
        try {
            setLoadingHistory(true);
            const response = await fetch('/api/driver/history?page=1&limit=5');
            if (response.ok) {
                const data = await response.json();
                setRecentTrips(data.trips || []);
            }
        } catch (error) {
            console.error('Failed to fetch recent trips:', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const startTrip = async (tripId) => {
        try {
            const response = await fetch('/api/driver/trip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tripId })
            });
            if (response.ok) {
                fetchInitialData();
                alert('Trip started successfully!');
            } else {
                const data = await response.json();
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            alert('Failed to start trip');
        }
    };

    const handleManualBoarding = async (studentId, type) => {
        try {
            const res = await fetch('/api/driver/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ passengerId: studentId, type })
            });
            if (res.ok) fetchInitialData();
        } catch (e) {
            console.error('Failed to update boarding status:', e);
        }
    };

    const handleEmergencyAlert = async () => {
        if (confirm('Are you sure you want to trigger an EMERGENCY ALERT? This will notify all administrators immediately.')) {
            const res = await sendEmergencyAlert('EMERGENCY: Assistance needed immediately!');
            if (res.success) alert('Emergency alert sent!');
            else alert('Failed to send alert');
        }
    };

    const handleReportDelay = async () => {
        const minutes = prompt('Estimated delay in minutes:', '15');
        if (minutes) {
            const res = await sendBroadcast('Route Delayed', `Bus ${activeTrip?.bus?.busNumber || ''} is experiencing a delay of approximately ${minutes} minutes.`, 'PARENTS');
            if (res.success) alert('Delay reported to parents');
            else alert('Failed to report delay');
        }
    };

    return (
        <div className="space-y-6">
            {/* GPS Error Alert */}
            {geoError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 animate-in slide-in-from-top-4">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <div className="flex-1 text-sm font-medium">
                        {geoError}
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Trips Today', value: stats.tripsToday, color: 'bg-black', icon: Activity, animate: true },
                    { label: 'Total Trips', value: stats.totalTrips, color: 'bg-black', icon: TrendingUp },
                    { label: 'Passengers Served', value: stats.totalPassengers, color: 'bg-black', icon: Users },
                    { label: 'Distance Covered', value: `${stats.totalDistance || 0} km`, color: 'bg-black', icon: Navigation },
                ].map((item, idx) => {
                    const Icon = item.icon;
                    return (
                        <div key={idx} className="p-6 rounded-[2rem] border border-slate-200 transition-all duration-500 group relative overflow-hidden">
                            <div className={`absolute -right-4 -top-4 w-32 h-32 ${item.color} opacity-[0.05] group-hover:opacity-[0.12] rounded-full blur-2xl transition-all duration-700`} />
                            <div className={`w-12 h-12 rounded-lg ${item.color} flex items-center justify-center mb-4  group-hover:scale-110 transition-transform duration-500 relative`}>
                                <Icon className="w-6 h-6 text-white" />
                                {item.animate && (
                                    <div className="absolute -top-1 -right-1 flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em]">{item.label}</p>
                                <p className="text-3xl  tracking-tight">{item.value}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Active Trip Banner */}
            <div className="rounded-[2rem] p-6 bg-black text-white">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <p className="text-xs uppercase tracking-widest opacity-90 mb-1">Scheduled Trip</p>
                        <h3 className="text-2xl ">{route?.name}</h3>
                        <p className="text-sm opacity-90 mt-1">
                            {students.filter(s => s.attendanceRecords?.some(a => a.tripId === activeTrip.id && a.boardedAt)).length}/{students.length} passengers boarded
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={handleEmergencyAlert}
                            className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs uppercase font-bold hover:bg-red-700 transition-colors flex items-center gap-2"
                        >
                            <AlertTriangle className="w-4 h-4" />
                            Emergency
                        </button>
                        <button
                            onClick={handleReportDelay}
                            className="bg-amber-500 text-white px-4 py-2 rounded-xl text-xs uppercase font-bold hover:bg-amber-600 transition-colors flex items-center gap-2"
                        >
                            <Clock className="w-4 h-4" />
                            Report Delay
                        </button>
                        <Link
                            href="/driver/dashboard/route"
                            className="bg-white text-black px-6 py-3 rounded-2xl text-xs uppercase hover:scale-105 transition-all flex items-center gap-2"
                        >
                            View Route
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Recent Trip History */}
            <section className="rounded-[2rem] border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                    <h2 className="text-xl  flex items-center gap-3">
                        <HistoryIcon className="w-6 h-6 text-black" />
                        Recent Trips
                    </h2>
                    <Link
                        href="/driver/dashboard/history"
                        className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-sm transition-colors font-medium"
                    >
                        View All
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {loadingHistory ? (
                    <div className="p-12 text-center">
                        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="mt-4 text-black">Loading trips...</p>
                    </div>
                ) : recentTrips.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                        <HistoryIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No trip history found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-200">
                        {recentTrips.map((trip) => (
                            <div key={trip.id} className="p-6 hover:bg-slate-50 transition-colors">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className=" text-lg">{trip.route?.name || 'Unknown Route'}</h3>
                                            <span className={`px-3 py-1 rounded-full text-xs  uppercase ${getStatusColor(trip.status)}`}>
                                                {trip.status}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-4 text-sm text-black">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                {new Date(trip.actualStart || trip.scheduledStart).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </div>
                                            {trip.distanceCovered && (
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4" />
                                                    {trip.distanceCovered} km
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2">
                                                <Users className="w-4 h-4" />
                                                {trip._count?.attendanceRecords || 0} passengers
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-sm text-black">
                                        {trip.actualStart && trip.actualEnd ? (
                                            <div>
                                                <div>{new Date(trip.actualStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                <div className="text-xs">→ {new Date(trip.actualEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            </div>
                                        ) : (
                                            <div>Scheduled: {new Date(trip.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>


        </div>
    );
}
