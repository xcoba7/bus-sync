'use client';

import { useParentDashboard } from './ParentDashboardContext';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import MapComponent from '@/components/MapComponent';
import { getTerminology } from '@/lib/terminology';
import NotificationPanel from '@/components/NotificationPanel';
import { calculateDistance, calculateETA } from '@/lib/utils';
import { QRCodeSVG } from 'qrcode.react';
import {
    Navigation,
    Clock,
    User,
    ArrowRight,
    Calendar,
    AlertCircle,
    X,
    MapPin,
    ChevronDown,
    QrCode,
    Car
} from 'lucide-react';

export default function ParentOverview() {
    const { students } = useParentDashboard();
    const { data: session } = useSession();
    const router = useRouter();
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [busLocation, setBusLocation] = useState(null);
    const [activeTrip, setActiveTrip] = useState(null);
    const [loading, setLoading] = useState(false);
    const [eta, setEta] = useState(null);
    const [distance, setDistance] = useState(null);
    const [orgType, setOrgType] = useState('OTHER');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Absence Reporting State
    const [showAbsenceModal, setShowAbsenceModal] = useState(false);
    const [absenceDate, setAbsenceDate] = useState('');
    const [absenceReason, setAbsenceReason] = useState('');
    const [submittingAbsence, setSubmittingAbsence] = useState(false);


    // Initialize selected student when students are loaded
    useEffect(() => {
        if (students.length > 0 && !selectedStudent) {
            setSelectedStudent(students[0]);
            setOrgType(students[0].organization?.type || 'OTHER');
        }
    }, [students, selectedStudent]);


    const fetchBusLocation = useCallback(async () => {
        if (!selectedStudent?.busId) return;
        try {
            const response = await fetch(`/api/parent/bus-location?busId=${selectedStudent.busId}&studentId=${selectedStudent.id}`);
            if (response.ok) {
                const data = await response.json();
                if (data.trip) {
                    setBusLocation(data.location || data.trip.route.stops[0]);
                    setActiveTrip(data.trip);
                    // Distance and ETA will be calculated by Google Maps via handleDirectionsLoaded
                } else {
                    setBusLocation(null);
                    setActiveTrip(null);
                    setEta(null);
                    setDistance(null);
                }
            }
        } catch (error) {
            console.error('Failed to fetch bus location:', error);
        }
    }, [selectedStudent]);

    const handleReportAbsence = async (e) => {
        e.preventDefault();
        if (!selectedStudent || !absenceDate) return;

        setSubmittingAbsence(true);
        try {
            const res = await fetch('/api/parent/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    passengerId: selectedStudent.id,
                    date: absenceDate,
                    reason: absenceReason
                })
            });

            if (res.ok) {
                const data = await res.json();
                alert(data.message || 'Absence reported successfully');
                setShowAbsenceModal(false);
                setAbsenceDate('');
                setAbsenceReason('');
            } else {
                const err = await res.json();
                alert(`Error: ${err.error || err.message || 'Failed to report absence'}`);
            }
        } catch (error) {
            console.error(error);
            alert('Failed to submit absence report');
        } finally {
            setSubmittingAbsence(false);
        }
    };

    useEffect(() => {
        if (selectedStudent?.busId) {
            const interval = setInterval(fetchBusLocation, 5000);
            fetchBusLocation();
            return () => clearInterval(interval);
        }
    }, [selectedStudent, fetchBusLocation]);

    const markers = [];
    if (busLocation) {
        markers.push({
            lat: busLocation.lat, lng: busLocation.lng,
            title: 'School Bus',
            icon: {
                url: '/bus.png',
                scaledSize: { width: 100, height: 100 },
            }
        });
    }
    if (selectedStudent) {
        markers.push({
            lat: selectedStudent.lat, lng: selectedStudent.lng,
            title: 'Pickup Location'

        });
    }

    const handleDirectionsLoaded = useCallback((distanceData) => {
        if (distanceData) {
            // Convert to km and round to 1 decimal
            const distKm = distanceData.distanceKm.toFixed(1);
            setDistance(distKm);

            // Calculate ETA in minutes from distance
            // Assuming average speed of 30 km/h in city traffic
            const etaMinutes = Math.round((distanceData.distanceKm / 30) * 60);
            setEta(etaMinutes);
        }
    }, []);

    // Determine destination coordinates: ensure strict fallback
    const destinationCoords = activeTrip?.studentStop
        ? { lat: activeTrip.studentStop.lat, lng: activeTrip.studentStop.lng }
        : (selectedStudent ? { lat: selectedStudent.lat, lng: selectedStudent.lng } : null);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Area with Ward Selector */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl  tracking-tight text-slate-900">Dashboard Overview</h1>
                    <p className="text-slate-500 text-sm font-medium">Real-time monitoring and updates</p>
                </div>

                {/* Ward Selector Dropdown */}
                {selectedStudent && (
                    <div className="relative z-20">
                        <div className="absolute -bottom-2 -left-2 bg-indigo-100 text-xs text-indigo-600 p-1 px-2 rounded-full" >{students.length}</div>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center gap-3 bg-white pl-4 pr-6 py-3 rounded-2xl  border border-slate-200 hover:border-slate-300 transition-all group"
                        >
                            <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white text-xs ">
                                {selectedStudent.name.charAt(0)}
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] uppercase  text-slate-400 tracking-widest">Select Ward</p>
                                <p className="text-sm  text-slate-900 group-hover:text-blue-600 transition-colors">{selectedStudent.name}</p>
                            </div>
                            <ChevronDown className={`w-4 h-4 text-slate-400 ml-2 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl  border border-slate-100 overflow-hidden py-2 animate-in fade-in zoom-in-95 duration-100">
                                {students.map(student => (
                                    <button
                                        key={student.id}
                                        onClick={() => {
                                            setSelectedStudent(student);
                                            setIsDropdownOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors ${selectedStudent.id === student.id ? 'bg-slate-50' : ''}`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs  ${selectedStudent.id === student.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
                                            }`}>
                                            {student.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className={`text-sm  ${selectedStudent.id === student.id ? 'text-slate-900' : 'text-slate-600'}`}>
                                                {student.name}
                                            </p>
                                            {/*<p className="text-[10px] text-slate-400 uppercase tracking-wider">*/}
                                            {/*    {student.grade || student.department || 'Student'}*/}
                                            {/*</p>*/}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Main Map View - Dominant */}
            <div className="relative h-[500px] md:h-[600px] w-full bg-slate-100 rounded-[2.5rem] overflow-hidden">
                <MapComponent
                    center={busLocation || destinationCoords || { lat: 9.0765, lng: 7.3986 }}
                    zoom={15}
                    markers={markers}
                    showDirections={!!busLocation && !!destinationCoords}
                    origin={busLocation}
                    destination={destinationCoords}
                    onDirectionsLoaded={handleDirectionsLoaded}
                />

                {/* Floating Status Badge */}
                <div className="absolute top-6 left-6 flex items-center gap-2">
                    <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full  border border-white/50 flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${busLocation ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                        <span className="text-xs  uppercase tracking-widest text-slate-600">
                            {busLocation ? 'Bus Active' : 'No active rides'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Live Tracking Card */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100  flex flex-col justify-between group hover:border-slate-200 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                            <Navigation className="w-5 h-5" />
                        </div>
                        <span className="text-[10px]  uppercase tracking-widest text-slate-400">Estimate</span>
                    </div>
                    <div>
                        <div className="flex items-end gap-1 mb-1">
                            <span className="text-3xl text-slate-900 tracking-tight">{eta || '--'}</span>
                            <span className="text-sm  text-slate-400 mb-1">min</span>
                        </div>
                        <p className="text-xs font-medium text-slate-500">Arrival Time</p>
                    </div>
                </div>

                {/* Pickup Info */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100  flex flex-col justify-between group hover:border-slate-200 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                            <MapPin className="w-5 h-5" />
                        </div>
                        <span className="text-[10px]  uppercase tracking-widest text-slate-400">Address</span>
                    </div>
                    <div>
                        <p className="text-sm  text-slate-900 line-clamp-2 leading-tight mb-1">
                            {selectedStudent?.address || 'No pickup location set'}
                        </p>
                        <p className="text-xs font-medium text-slate-500">Home Address</p>
                    </div>
                </div>

                {/* Driver Info */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100  flex flex-col justify-between group hover:border-slate-200 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center">
                            <Car className="w-5 h-5" />
                        </div>
                        <span className="text-[10px]  uppercase tracking-widest text-slate-400">Driver</span>
                    </div>
                    <div>
                        <p className="text-sm  text-slate-900 line-clamp-1 mb-1">
                            {selectedStudent?.bus?.driver?.user?.name || 'Not Assigned'}
                        </p>
                        <p className="text-xs font-medium text-slate-500">
                            {selectedStudent?.bus?.busNumber ? `Bus #${selectedStudent.bus.busNumber}` : 'No Bus'}
                        </p>
                    </div>
                </div>

                {/* Quick Actions / Absence */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100  flex flex-col justify-between group hover:border-slate-200 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                        <span className="text-[10px]  uppercase tracking-widest text-slate-400">Action</span>
                    </div>
                    <button
                        onClick={() => setShowAbsenceModal(true)}
                        className="w-full bg-red-50 hover:bg-red-100 text-red-700  py-2.5 rounded-xl text-xs uppercase tracking-wide transition-colors"
                    >
                        Report Absence
                    </button>
                    <div className="mt-3 flex items-center gap-2 justify-center">
                        <QrCode className="w-3 h-3 text-slate-400" />
                        <span className="text-[10px] text-slate-400 font-medium">Ticket: {selectedStudent?.qrCode?.substring(0, 6)}...</span>
                    </div>
                </div>

            </div>

            {/* Absence Modal */}
            {showAbsenceModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-xl  text-slate-900">Report Absence</h3>
                                <p className="text-sm text-slate-500 font-medium mt-1">Notify the school that your ward won't be attending.</p>
                            </div>
                            <button onClick={() => setShowAbsenceModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors -mr-2">
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleReportAbsence} className="space-y-6">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center  text-sm  text-slate-900">
                                    {selectedStudent?.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-xs  text-slate-400 uppercase tracking-widest">Ward</p>
                                    <p className=" text-slate-900">{selectedStudent?.name}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs  text-slate-500 uppercase tracking-widest mb-2 block ml-1">Date of Absence</label>
                                    <input
                                        type="date"
                                        required
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-medium focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                                        value={absenceDate}
                                        onChange={e => setAbsenceDate(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="text-xs  text-slate-500 uppercase tracking-widest mb-2 block ml-1">Reason (Optional)</label>
                                    <textarea
                                        rows={3}
                                        placeholder="e.g. Sick leave, Appointment..."
                                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-medium focus:ring-2 focus:ring-slate-900 outline-none transition-all resize-none"
                                        value={absenceReason}
                                        onChange={e => setAbsenceReason(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAbsenceModal(false)}
                                    className="flex-1 py-4 rounded-2xl  text-slate-500 hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingAbsence}
                                    className="flex-1 py-4 rounded-2xl  text-white bg-slate-900 hover:bg-slate-800 transition-colors disabled:opacity-50  shadow-slate-900/20"
                                >
                                    {submittingAbsence ? 'Submitting...' : 'Submit Report'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
