'use client';

import { useState, useEffect } from 'react';
import { History as HistoryIcon, Calendar, MapPin, Users, TrendingUp, Filter, Download, X, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function TripHistory() {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [stats, setStats] = useState({ totalTrips: 0, totalDistance: 0, avgPassengers: 0 });

    // Filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    // Trip Details Modal
    const [showTripDetails, setShowTripDetails] = useState(false);
    const [selectedTrip, setSelectedTrip] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, [page, startDate, endDate, statusFilter]);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '10',
                ...(startDate && { startDate }),
                ...(endDate && { endDate }),
                ...(statusFilter !== 'ALL' && { status: statusFilter })
            });

            const response = await fetch(`/api/driver/history?${params}`);
            if (response.ok) {
                const data = await response.json();
                setTrips(data.trips || []);
                setTotalPages(data.totalPages || 1);
                setStats(data.stats || { totalTrips: 0, totalDistance: 0, avgPassengers: 0 });
            }
        } catch (error) {
            console.error('Failed to fetch history:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTripDetails = async (tripId) => {
        try {
            setLoadingDetails(true);
            const response = await fetch(`/api/driver/history/${tripId}`);
            if (response.ok) {
                const data = await response.json();
                setSelectedTrip(data.trip);
                setShowTripDetails(true);
            } else {
                alert('Failed to load trip details');
            }
        } catch (error) {
            console.error('Failed to fetch trip details:', error);
            alert('Error loading trip details');
        } finally {
            setLoadingDetails(false);
        }
    };

    const closeTripDetails = () => {
        setShowTripDetails(false);
        setSelectedTrip(null);
    };

    const calculateDuration = (start, end) => {
        if (!start || !end) return 'N/A';
        const diff = new Date(end) - new Date(start);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };



    return (
        <div className="space-y-8">

            {/* Filters */}
            <div className="-mt-8">
                <h3 className="text-sm uppercase tracking-wider text-black mb-4 flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Filters
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs text-black mb-2 uppercase">Start Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-4 py-2  focus:outline-none focus:border-black transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-black mb-2 uppercase">End Date</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full /50 border border-slate-200 rounded-xl px-4 py-2  focus:outline-none focus:border-black transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-black mb-2 uppercase">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full /50 border border-slate-200 rounded-xl px-4 py-2  focus:outline-none focus:border-black transition-colors"
                        >
                            <option value="ALL">All Trips</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="ONGOING">Ongoing</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Trip History List */}
            <div className="rounded-[2rem] border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                    <h2 className="text-xl  flex items-center gap-3">
                        <HistoryIcon className="w-6 h-6 text-black" />
                        Trip History
                    </h2>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm transition-colors">
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                </div>

                {loading ? (
                    <div className="p-12 text-center">
                        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="mt-4 text-black">Loading trips...</p>
                    </div>
                ) : trips.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                        <HistoryIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No trip history found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/10">
                        {trips.map((trip) => (
                            <div
                                key={trip.id}
                                onClick={() => fetchTripDetails(trip.id)}
                                className="p-6 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className=" text-lg">{trip.route?.name || 'Unknown Route'}</h3>
                                            <span className={`px-3 py-1 rounded-full text-xs uppercase ${getStatusColor(trip.status)}`}>
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

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-6 border-t border-slate-200 flex items-center justify-between">
                        <button
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-black">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(Math.min(totalPages, page + 1))}
                            disabled={page === totalPages}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Trip Details Modal */}
            {showTripDetails && selectedTrip && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white rounded-t-3xl">
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-bold text-slate-900">
                                    {selectedTrip.route?.name || 'Trip Details'}
                                </h2>
                                <span className={`px-3 py-1 rounded-full text-xs uppercase ${getStatusColor(selectedTrip.status)}`}>
                                    {selectedTrip.status}
                                </span>
                            </div>
                            <button
                                onClick={closeTripDetails}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {loadingDetails ? (
                            <div className="p-12 text-center">
                                <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
                                <p className="mt-4 text-slate-600">Loading trip details...</p>
                            </div>
                        ) : (
                            <div className="p-6 space-y-6">
                                {/* Trip Overview */}
                                <div className="bg-slate-50 rounded-2xl p-6">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Trip Overview</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Bus</p>
                                            <p className="text-sm font-medium text-slate-900">
                                                {selectedTrip.bus?.busNumber} {selectedTrip.bus?.model && `(${selectedTrip.bus.model} ${selectedTrip.bus.year})`}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Driver</p>
                                            <p className="text-sm font-medium text-slate-900">{selectedTrip.driver?.user?.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Date</p>
                                            <p className="text-sm font-medium text-slate-900">
                                                {new Date(selectedTrip.actualStart || selectedTrip.scheduledStart).toLocaleDateString('en-US', {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Time</p>
                                            <p className="text-sm font-medium text-slate-900">
                                                {selectedTrip.actualStart && new Date(selectedTrip.actualStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                {selectedTrip.actualEnd && ` → ${new Date(selectedTrip.actualEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                                                {!selectedTrip.actualStart && 'Scheduled: ' + new Date(selectedTrip.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Trip Metrics */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-blue-50 rounded-2xl p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <MapPin className="w-4 h-4 text-blue-600" />
                                            <p className="text-xs uppercase tracking-wider text-blue-600">Distance</p>
                                        </div>
                                        <p className="text-2xl font-bold text-blue-900">
                                            {selectedTrip.distanceCovered ? `${selectedTrip.distanceCovered} km` : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="bg-purple-50 rounded-2xl p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Clock className="w-4 h-4 text-purple-600" />
                                            <p className="text-xs uppercase tracking-wider text-purple-600">Duration</p>
                                        </div>
                                        <p className="text-2xl font-bold text-purple-900">
                                            {calculateDuration(selectedTrip.actualStart, selectedTrip.actualEnd)}
                                        </p>
                                    </div>
                                    <div className="bg-green-50 rounded-2xl p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <TrendingUp className="w-4 h-4 text-green-600" />
                                            <p className="text-xs uppercase tracking-wider text-green-600">Location Updates</p>
                                        </div>
                                        <p className="text-2xl font-bold text-green-900">
                                            {selectedTrip._count?.locationHistory || 0}
                                        </p>
                                    </div>
                                </div>

                                {/* Student Attendance */}
                                <div>
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Student Attendance</h3>
                                    {selectedTrip.attendanceRecords && selectedTrip.attendanceRecords.length > 0 ? (
                                        <div className="bg-slate-50 rounded-2xl overflow-hidden">
                                            <div className="overflow-x-auto">
                                                <table className="w-full">
                                                    <thead>
                                                        <tr className="bg-slate-100 border-b border-slate-200">
                                                            <th className="p-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">Student</th>
                                                            <th className="p-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">Status</th>
                                                            <th className="p-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">Boarded</th>
                                                            <th className="p-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">Dropped</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-200">
                                                        {selectedTrip.attendanceRecords.map((record) => (
                                                            <tr key={record.id} className="hover:bg-slate-100 transition-colors">
                                                                <td className="p-4">
                                                                    <div>
                                                                        <p className="text-sm font-medium text-slate-900">{record.passenger.name}</p>
                                                                        <p className="text-xs text-slate-500">{record.passenger.address}</p>
                                                                    </div>
                                                                </td>
                                                                <td className="p-4">
                                                                    {record.status === 'PRESENT' ? (
                                                                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                                                            <CheckCircle className="w-3 h-3" />
                                                                            Present
                                                                        </span>
                                                                    ) : record.status === 'ABSENT' ? (
                                                                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                                                                            <XCircle className="w-3 h-3" />
                                                                            Absent
                                                                        </span>
                                                                    ) : (
                                                                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-200 text-slate-700 rounded-full text-xs font-medium">
                                                                            {record.status || 'Unknown'}
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="p-4">
                                                                    <p className="text-sm text-slate-700">
                                                                        {record.boardedAt ? new Date(record.boardedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                                    </p>
                                                                </td>
                                                                <td className="p-4">
                                                                    <p className="text-sm text-slate-700">
                                                                        {record.droppedAt ? new Date(record.droppedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                                    </p>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-slate-50 rounded-2xl p-8 text-center">
                                            <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                            <p className="text-slate-500">No attendance records for this trip</p>
                                        </div>
                                    )}
                                </div>

                                {/* Trip Notes */}
                                {selectedTrip.notes && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-amber-700 mb-2">Notes</h3>
                                        <p className="text-sm text-amber-900">{selectedTrip.notes}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}


export const getStatusColor = (status) => {
    switch (status) {
        case 'COMPLETED': return 'bg-emerald-200 border border-emerald-400';
        case 'ONGOING': return 'bg-blue-200 border border-blue-400';
        case 'CANCELLED': return 'bg-red-200 border border-red-400';
        default: return 'bg-slate-500 ';
    }
};