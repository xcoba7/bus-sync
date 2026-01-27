'use client';

import { useEffect, useRef, useState } from 'react';
import {
    QrCode,
    Users,
    Calendar,
    CheckCircle2,
    XCircle,
    Clock,
    TrendingUp,
    Search,
    Filter,
    Camera,
    Square,
    UserCheck,
    UserX,
    BusFront
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useDriver } from '../DriverContext';
import Link from 'next/link'

export default function AttendancePage() {
    const {
        students, activeTrip, scheduledTrips, scanning, setScanning,
        scanResult, setScanResult, fetchInitialData
    } = useDriver();

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const scannerRef = useRef(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (scanning) {
            const scanner = new Html5QrcodeScanner("attendance-reader", { fps: 10, qrbox: 250 });
            scanner.render(onScanSuccess, onScanFailure);
            scannerRef.current = scanner;
            return () => {
                if (scannerRef.current) scannerRef.current.clear();
            }
        }
    }, [scanning]);

    const onScanSuccess = async (decodedText) => {
        if (scannerRef.current) scannerRef.current.clear();
        setScanning(false);
        setScanResult('Verifying...');

        try {
            const res = await fetch('/api/driver/attendance/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ qrCode: decodedText })
            });
            const data = await res.json();
            if (res.ok) {
                setScanResult({ success: true, name: data.passengerName });
                fetchInitialData();
            } else {
                setScanResult({ success: false, error: data.error });
            }
        } catch (e) {
            setScanResult({ success: false, error: 'Network error' });
        }
        setTimeout(() => setScanResult(null), 5000);
    };

    const onScanFailure = () => { };

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

    // Filter students
    const filteredStudents = students.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchesSearch) return false;

        if (statusFilter === 'ALL') return true;

        const attendance = student.attendanceRecords?.find(a => a.tripId === activeTrip?.id);
        if (statusFilter === 'BOARDED') return attendance?.boardedAt;
        if (statusFilter === 'ABSENT') return attendance?.status === 'ABSENT';
        if (statusFilter === 'PENDING') return !attendance?.boardedAt && attendance?.status !== 'ABSENT';

        return true;
    });

    // Calculate stats
    const totalStudents = students.length;
    const boardedCount = students.filter(s =>
        s.attendanceRecords?.some(a => a.tripId === activeTrip?.id && a.boardedAt)
    ).length;
    const absentCount = students.filter(s =>
        s.attendanceRecords?.some(a => a.tripId === activeTrip?.id && a.status === 'ABSENT')
    ).length;
    const pendingCount = totalStudents - boardedCount - absentCount;
    const attendanceRate = totalStudents > 0 ? Math.round((boardedCount / totalStudents) * 100) : 0;

    const handleMarkAllPresent = async () => {
        if (!activeTrip) return;

        const pendingStudents = students.filter(student => {
            const attendance = student.attendanceRecords?.find(a => a.tripId === activeTrip?.id);
            return !attendance?.boardedAt && attendance?.status !== 'ABSENT';
        });

        if (pendingStudents.length === 0) return;

        if (!confirm(`Mark ${pendingStudents.length} students as present?`)) return;

        try {
            const res = await fetch('/api/driver/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    passengerIds: pendingStudents.map(s => s.id),
                    type: 'mark-boarded'
                })
            });
            if (res.ok) fetchInitialData();
        } catch (e) {
            console.error('Failed to mark all present:', e);
        }
    };

    return (
        <>
            {/* QR Scanner Overlay */}
            {scanning && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm p-6 flex flex-col items-center justify-center">
                    <div className="w-full max-w-md">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-xl  text-white flex items-center gap-2">
                                <Camera className="w-6 h-6" />
                                Scan QR Code
                            </h2>
                            <button
                                onClick={() => setScanning(false)}
                                className="text-white/80 hover:text-white underline  transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                        <div id="attendance-reader" className="w-full rounded-3xl overflow-hidden" />
                        <p className="mt-8 text-white/60 text-center text-sm">
                            Align the passenger's QR code within the frame
                        </p>
                    </div>
                </div>
            )}

            {/* Scan Result */}
            {scanResult && (
                <div className={`fixed top-24 left-6 right-6 p-4 rounded-2xl z-[70] animate-bounce shadow-2xl flex items-center gap-3 ${scanResult.success ? 'bg-emerald-500' : 'bg-red-500'
                    } text-white`}>
                    {scanResult.success ? <CheckCircle2 className="w-6 h-6" /> : <Square className="w-6 h-6 rotate-45" />}
                    <span className="">
                        {scanResult.success ? `Boarded: ${scanResult.name}` : `Error: ${scanResult.error}`}
                    </span>
                </div>
            )}

            {/* Today's Schedule */}
            <div className="rounded-[2rem] p-6 -mt-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm  uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Today's Schedule
                    </h3>
                </div>

                <div className="space-y-3">
                    {scheduledTrips.length > 0 ? (
                        scheduledTrips.map(trip => (
                            <div key={trip.id} className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="">{trip.route.name}</p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {new Date(trip.scheduledStart).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs  uppercase ${trip.id === activeTrip?.id
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-slate-200 text-slate-600'
                                        }`}>
                                        {trip.id === activeTrip?.id ? 'Active' : 'Scheduled'}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-slate-500">
                            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">No trips scheduled for today</p>
                        </div>
                    )}
                </div>
            </div>

            {
                scheduledTrips.length > 0 &&
                <>
                    <div className="space-y-6 -mt-12">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="p-6 rounded-[2rem] border border-slate-200 bg-gradient-to-br from-emerald-50 to-white">
                                <div className="flex items-center justify-between mb-2">
                                    <UserCheck className="w-8 h-8 text-emerald-600" />
                                    <span className="text-xs uppercase tracking-wider text-emerald-600 ">Boarded</span>
                                </div>
                                <p className="text-3xl  text-emerald-600">{boardedCount}</p>
                                <p className="text-xs text-slate-500 mt-1">of {totalStudents} students</p>
                            </div>

                            <div className="p-6 rounded-[2rem] border border-slate-200 bg-gradient-to-br from-red-50 to-white">
                                <div className="flex items-center justify-between mb-2">
                                    <UserX className="w-8 h-8 text-red-600" />
                                    <span className="text-xs uppercase tracking-wider text-red-600 ">Absent</span>
                                </div>
                                <p className="text-3xl  text-red-600">{absentCount}</p>
                                <p className="text-xs text-slate-500 mt-1">marked absent</p>
                            </div>

                            <div className="p-6 rounded-[2rem] border border-slate-200 bg-gradient-to-br from-amber-50 to-white">
                                <div className="flex items-center justify-between mb-2">
                                    <Clock className="w-8 h-8 text-amber-600" />
                                    <span className="text-xs uppercase tracking-wider text-amber-600 ">Pending</span>
                                </div>
                                <p className="text-3xl  text-amber-600">{pendingCount}</p>
                                <p className="text-xs text-slate-500 mt-1">awaiting check-in</p>
                            </div>

                            <div className="p-6 rounded-[2rem] border border-slate-200 bg-gradient-to-br from-blue-50 to-white">
                                <div className="flex items-center justify-between mb-2">
                                    <TrendingUp className="w-8 h-8 text-blue-600" />
                                    <span className="text-xs uppercase tracking-wider text-blue-600 ">Rate</span>
                                </div>
                                <p className="text-3xl  text-blue-600">{attendanceRate}%</p>
                                <p className="text-xs text-slate-500 mt-1">attendance rate</p>
                            </div>
                        </div>




                        {/* Student Roster */}
                        <div className="relative rounded-[2rem] border border-slate-200 overflow-hidden">
                            <div className="p-6 lg:flex justify-between border-b border-slate-200">
                                <div className="flex items-center gap-4 mb-4 lg:mb-0">
                                    <h3 className="text-sm uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        Student Roster ({filteredStudents.length})
                                    </h3>
                                    {activeTrip && pendingCount > 0 && (
                                        <button
                                            onClick={handleMarkAllPresent}
                                            className="ml-4 px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-xs font-medium hover:bg-emerald-200 transition-colors"
                                        >
                                            Mark All Present
                                        </button>
                                    )}
                                </div>

                                {/* Filters */}
                                <div className="flex gap-3">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search students..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-black transition-colors"
                                        />
                                    </div>
                                    <div className="relative">
                                        <Filter className="max-sm:hidden absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="w-full max-sm:px-1.5 pl-10 pr-4 text-center py-2.5 bg-black text-white rounded-xl focus:outline-none focus:border-black transition-colors appearance-none"
                                        >
                                            <option value="ALL">All Students</option>
                                            <option value="BOARDED">Boarded</option>
                                            <option value="ABSENT">Absent</option>
                                            <option value="PENDING">Pending</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {
                                attendanceRate === 100 &&
                                <Link href="/driver/dashboard/route" className="group cursor-pointer hover:brightness-95 hover:animate-none animate-pulse fixed bottom-10 right-10 bg-black text-white rounded-full p-6">
                                    Dispatch
                                </Link>
                            }

                            {/* Student List */}
                            <div className="divide-y divide-slate-200 max-h-[600px] overflow-y-auto">
                                {filteredStudents.length > 0 ? (
                                    filteredStudents.map(student => {
                                        const attendance = student.attendanceRecords?.find(a => a.tripId === activeTrip?.id);
                                        const boarded = attendance?.boardedAt;
                                        const absent = attendance?.status === 'ABSENT';

                                        return (
                                            <div key={student.id} className="p-4 hover:bg-slate-50 transition-colors">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center  ${boarded ? 'bg-emerald-500 text-white' :
                                                            absent ? 'bg-red-500 text-white' :
                                                                'bg-slate-200 text-slate-600'
                                                            }`}>
                                                            {student.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="">{student.name}</p>
                                                            <p className="text-xs text-slate-500 uppercase tracking-wider">
                                                                {boarded ? 'Boarded' : absent ? 'Absent' : 'Pending'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {activeTrip && (
                                                    <div className="space-y-2">
                                                        {/* Show all action buttons */}
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <button
                                                                onClick={() => handleManualBoarding(student.id, 'mark-boarded')}
                                                                disabled={boarded}
                                                                className={`p-2 rounded-full text-[10px]  uppercase tracking-widest transition-all border ${boarded
                                                                    ? 'bg-emerald-500 text-white border-emerald-500 cursor-default'
                                                                    : 'bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white border-emerald-500/20'
                                                                    }`}
                                                            >
                                                                {boarded ? '✓ Boarded ' : 'Board'}
                                                            </button>
                                                            <button
                                                                onClick={() => handleManualBoarding(student.id, 'mark-absent')}
                                                                disabled={absent}
                                                                className={`px-4 py-2 rounded-full text-[10px]  uppercase tracking-widest transition-all border ${absent
                                                                    ? 'bg-red-500 text-white border-red-500 cursor-default'
                                                                    : 'bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white border-red-500/20'
                                                                    }`}
                                                            >
                                                                {absent ? '✓ ' : ''}Absent
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="p-12 text-center text-slate-500">
                                        <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                        <p className="text-sm">No students found</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </>
            }

        </>
    );
}
