'use client';

import { useState, useEffect } from 'react';
import { Clock, MapPin, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function HistoryPage() {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch('/api/parent/trip-history');
                if (res.ok) {
                    const data = await res.json();
                    setTrips(data.trips || []);
                }
            } catch (error) {
                console.error('Failed to fetch history:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="mb-8">
                <h2 className="text-2xl  text-slate-900 tracking-tight flex items-center gap-3">
                    <Clock className="w-6 h-6" />
                    Activity History
                </h2>
                <p className="text-sm text-slate-400 font-medium uppercase tracking-widest mt-1 ml-9">
                    Past Trips & Attendance
                </p>
            </header>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden ">
                {trips.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="font-medium">No activity history found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {trips.map((trip) => {
                            const date = new Date(trip.scheduledStart);
                            const attendance = trip.attendanceRecords?.[0]; // Assuming filtering for user's child done in API or relevant logical connection

                            return (
                                <div key={trip.id} className="p-6 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900  shrink-0">
                                            {format(date, 'd')}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className=" text-slate-900">
                                                    {trip.route?.name || 'Scheduled Route'}
                                                </h3>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px]  uppercase tracking-wide ${trip.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' :
                                                        trip.status === 'CANCELLED' ? 'bg-red-50 text-red-600' :
                                                            'bg-amber-50 text-amber-600'
                                                    }`}>
                                                    {trip.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider flex items-center gap-2">
                                                <Calendar className="w-3 h-3" />
                                                {format(date, 'MMM yyyy • h:mm a')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 pl-16 md:pl-0">
                                        <div className="text-right hidden md:block">
                                            <p className="text-xs  text-slate-400 uppercase tracking-widest mb-1">Bus Info</p>
                                            <p className="text-sm  text-slate-900">{trip.bus?.busNumber}</p>
                                        </div>

                                        <div className="flex flex-col items-end min-w-[100px]">
                                            {attendance ? (
                                                attendance.status === 'PRESENT' ? (
                                                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        <span className="text-xs  uppercase tracking-wider">Present</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1.5 rounded-xl">
                                                        <XCircle className="w-4 h-4" />
                                                        <span className="text-xs  uppercase tracking-wider">Absent</span>
                                                    </div>
                                                )
                                            ) : (
                                                <div className="flex items-center gap-2 text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl">
                                                    <span className="text-xs  uppercase tracking-wider">No Record</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
