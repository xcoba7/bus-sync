'use client';

import { useState, useEffect } from 'react';
import { useDashboard } from '../DashboardContext';
import { Clock, Calendar, Bus, User, Plus, X, Search, Users, Trash2, Edit2, CalendarClock } from 'lucide-react';
import Loader from '@/components/Loader';

export default function SchedulesPage() {
    const { busesList, studentsList, driversList, fetchResources } = useDashboard();
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showStudentModal, setShowStudentModal] = useState(false);
    const [selectedBus, setSelectedBus] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('unassigned');
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [rescheduleDate, setRescheduleDate] = useState('');
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [editingSchedule, setEditingSchedule] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        busId: '',
        driverId: '',
        scheduleType: 'RECURRING',
        operatingDays: [],
        departureTime: '07:00',
        returnTime: '15:00',
        date: ''
    });

    const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

    useEffect(() => {
        fetchSchedules();
        fetchResources();
    }, []);

    const fetchSchedules = async () => {
        try {
            const res = await fetch('/api/admin/schedules');
            if (res.ok) {
                const data = await res.json();
                setSchedules(data.schedules || []);
            }
        } catch (error) {
            console.error('Error fetching schedules:', error);
        } finally {
            setLoading(false);
        }
    };

    const getAssignedStudents = (busId) => {
        return studentsList.filter(s => s.busId === busId);
    };

    const getUnassignedStudents = () => {
        return studentsList.filter(s => !s.busId);
    };

    const getRemainingSeats = (bus) => {
        const assigned = getAssignedStudents(bus.id).length;
        return bus.capacity - assigned;
    };

    const handleBusSelect = (busId) => {
        const bus = busesList.find(b => b.id === busId);
        setSelectedBus(bus);

        // Auto-select driver if bus has one assigned
        const assignedDriver = bus?.driverId || formData.driverId;
        setFormData({ ...formData, busId, driverId: assignedDriver });
    };

    const openStudentModal = () => {
        if (!selectedBus) {
            alert('Please select a bus first');
            return;
        }
        setActiveTab('unassigned');
        setShowStudentModal(true);
    };

    const handleAssignStudents = async () => {
        if (selectedStudents.length === 0) return;

        const remainingSeats = getRemainingSeats(selectedBus);
        if (selectedStudents.length > remainingSeats) {
            alert(`Cannot assign ${selectedStudents.length} students. Only ${remainingSeats} seats available.`);
            return;
        }

        try {
            const res = await fetch('/api/admin/students/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    busId: selectedBus.id,
                    studentIds: selectedStudents
                })
            });

            if (res.ok) {
                alert('Students assigned successfully');
                setSelectedStudents([]);
                setShowStudentModal(false);
                fetchResources();
            } else {
                const error = await res.json();
                alert(`Error: ${error.error}`);
            }
        } catch (error) {
            alert('Failed to assign students');
        }
    };

    const handleUnassignStudent = async (studentId) => {
        if (!confirm('Remove this student from the bus?')) return;

        try {
            const res = await fetch('/api/admin/students/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    busId: null,
                    studentIds: [studentId]
                })
            });

            if (res.ok) {
                fetchResources();
            }
        } catch (error) {
            console.error('Error unassigning student:', error);
        }
    };

    const toggleDay = (day) => {
        setFormData(prev => ({
            ...prev,
            operatingDays: prev.operatingDays.includes(day)
                ? prev.operatingDays.filter(d => d !== day)
                : [...prev.operatingDays, day]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.busId) {
            alert('Please select a bus');
            return;
        }

        const assignedStudents = getAssignedStudents(formData.busId);
        if (assignedStudents.length === 0) {
            alert('Please assign students to this bus before creating a schedule');
            return;
        }

        if (formData.scheduleType === 'RECURRING' && formData.operatingDays.length === 0) {
            alert('Please select at least one operating day');
            return;
        }

        if (formData.scheduleType === 'ONE_TIME' && !formData.date) {
            alert('Please select a date for one-time schedule');
            return;
        }

        try {
            setSubmitting(true);
            const url = editingSchedule
                ? `/api/admin/schedules/${editingSchedule.id}`
                : '/api/admin/schedules';
            const method = editingSchedule ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                alert(editingSchedule
                    ? 'Schedule updated successfully!'
                    : 'Schedule created successfully! Route auto-generated from student addresses.');
                setShowModal(false);
                resetForm();
                fetchSchedules();
            } else {
                const error = await res.json();
                alert(`Error: ${error.error}`);
            }
        } catch (error) {
            alert('Failed to save schedule');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this schedule?')) return;

        try {
            const res = await fetch(`/api/admin/schedules/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchSchedules();
            }
        } catch (error) {
            console.error('Error deleting schedule:', error);
        }
    };

    const openEditModal = (schedule) => {
        setEditingSchedule(schedule);
        const bus = busesList.find(b => b.id === schedule.busId);
        setSelectedBus(bus);

        // Ensure operatingDays is an array and properly formatted
        const operatingDays = Array.isArray(schedule.operatingDays) ? schedule.operatingDays : [];

        setFormData({
            busId: schedule.busId,
            driverId: schedule.driverId,
            scheduleType: operatingDays.length > 0 ? 'RECURRING' : 'ONE_TIME',
            operatingDays: operatingDays,
            departureTime: schedule.boardingTime,
            returnTime: schedule.boardingTime,
            date: ''
        });
        setShowModal(true);
    };
    const resetForm = () => {
        setFormData({
            busId: '',
            driverId: '',
            scheduleType: 'RECURRING',
            operatingDays: [],
            departureTime: '07:00',
            returnTime: '15:00',
            date: ''
        });
        setSelectedBus(null);
        setEditingSchedule(null);
    };

    const filteredUnassignedStudents = getUnassignedStudents().filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredAssignedStudents = selectedBus
        ? getAssignedStudents(selectedBus.id).filter(s =>
            s.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : [];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl text-slate-900">Schedule Management</h2>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="bg-black text-white px-6 py-3 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Create Schedule
                </button>
            </div>

            {/* Schedules List */}
            <div className="bg-white rounded-3xl border border-slate-50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="p-6 text-left text-xs text-slate-400 uppercase tracking-wider">Bus & Route</th>
                                <th className="p-6 text-left text-xs text-slate-400 uppercase tracking-wider">Driver</th>
                                <th className="p-6 text-left text-xs text-slate-400 uppercase tracking-wider">Schedule Time</th>
                                <th className="p-6 text-left text-xs text-slate-400 uppercase tracking-wider">Schedule Type</th>
                                <th className="p-6 text-left text-xs text-slate-400 uppercase tracking-wider">Passengers</th>
                                <th className="p-6 text-right text-xs text-slate-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="p-20 text-center text-slate-400">Loading...</td>
                                </tr>
                            ) : schedules.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-20 text-center text-slate-400">No schedules found</td>
                                </tr>
                            ) : (
                                schedules.map(schedule => (
                                    <tr key={schedule.id} className="hover:bg-slate-50/30 transition-colors">
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                                                    <Bus className="w-5 h-5 text-white" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">{schedule.bus?.busNumber}</p>
                                                    <p className="text-xs text-slate-500">{schedule.bus?.model || 'Auto-generated'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <p className="text-sm">{schedule.driver?.user?.name}</p>
                                        </td>
                                        <td className="p-6">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-slate-400" />
                                                    <p className="text-sm">{schedule.boardingTime}</p>
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {schedule.operatingDays?.map(day => (
                                                        <span key={day} className="px-2 py-0.5 bg-slate-100 text-slate-600 capitalize text-xs rounded">
                                                            {day.substring(0, 3).toLowerCase()}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 text-xs">
                                            <span className="bg-slate-200 text-slate-700 rounded-full px-6 py-1">{schedule.operatingDays.length > 0 ? "Recurring" : "One-Time"}</span>
                                        </td>
                                        <td className="p-6 ">
                                            <p className="text-sm lg:ml-8">{(schedule.route?.stops).length}</p>
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedSchedule(schedule);
                                                        setShowRescheduleModal(true);
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                    title="Reschedule"
                                                >
                                                    <CalendarClock className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(schedule)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(schedule.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Schedule Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl mb-6">{editingSchedule ? 'Edit Schedule' : 'Create New Schedule'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Bus Selection */}
                            <div>
                                <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">Select Bus</label>
                                <select
                                    required
                                    className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-black outline-none"
                                    value={formData.busId}
                                    onChange={(e) => handleBusSelect(e.target.value)}
                                >
                                    <option value="">Choose a bus...</option>
                                    {busesList.map(bus => {
                                        const assigned = getAssignedStudents(bus.id).length;
                                        const remaining = bus.capacity - assigned;
                                        return (
                                            <option key={bus.id} value={bus.id}>
                                                {bus.busNumber} - Capacity: {bus.capacity} | Assigned: {assigned} | Available: {remaining}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            {/* Assigned Students */}
                            {selectedBus && (
                                <div className="bg-slate-50 rounded-2xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-sm font-bold">Assigned Students</h3>
                                            <p className="text-xs text-slate-500">
                                                {getAssignedStudents(selectedBus.id).length} / {selectedBus.capacity} seats
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={openStudentModal}
                                            className="px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-slate-800 flex items-center gap-2"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add Students
                                        </button>
                                    </div>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {getAssignedStudents(selectedBus.id).map(student => (
                                            <div key={student.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center">
                                                        <User className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium">{student.name}</p>
                                                        <p className="text-xs text-slate-500">{student.address}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleUnassignStudent(student.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                        {getAssignedStudents(selectedBus.id).length === 0 && (
                                            <p className="text-center text-slate-400 py-8 text-sm">No students assigned yet</p>
                                        )}
                                    </div>
                                </div>
                            )}


                            {/* Schedule Type */}
                            <div>
                                <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">Schedule Type</label>
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, scheduleType: 'RECURRING' })}
                                        className={`flex-1 py-3 rounded-xl transition-all ${formData.scheduleType === 'RECURRING' ? 'bg-black text-white' : 'bg-slate-100 text-slate-600'}`}
                                    >
                                        Recurring
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, scheduleType: 'ONE_TIME' })}
                                        className={`flex-1 py-3 rounded-xl transition-all ${formData.scheduleType === 'ONE_TIME' ? 'bg-black text-white' : 'bg-slate-100 text-slate-600'}`}
                                    >
                                        One-Time
                                    </button>
                                </div>
                            </div>

                            {/* Operating Days (Recurring) */}
                            {formData.scheduleType === 'RECURRING' && (
                                <div>
                                    <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">Operating Days</label>
                                    <div className="grid grid-cols-7 gap-2">
                                        {daysOfWeek.map(day => (
                                            <button
                                                key={day}
                                                type="button"
                                                onClick={() => toggleDay(day)}
                                                className={`py-3 rounded-xl text-xs uppercase transition-all ${formData.operatingDays.includes(day) ? 'bg-black text-white' : 'bg-slate-100 text-slate-600'}`}
                                            >
                                                {day.substring(0, 3)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Date (One-Time) */}
                            {formData.scheduleType === 'ONE_TIME' && (
                                <div>
                                    <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-black outline-none"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                            )}


                            {/* Trip Time */}
                            <div>
                                <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">Trip Time</label>
                                <input
                                    type="time"
                                    required
                                    className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-black outline-none"
                                    value={formData.departureTime}
                                    onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                                />
                            </div>



                            {/* Actions */}
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); resetForm(); }}
                                    className="flex-1 py-3 rounded-xl text-slate-500 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 bg-black text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? 'Saving...' : (editingSchedule ? 'Update Schedule' : 'Create Schedule')}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Loading Overlay */}
                    {submitting && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-3xl z-50">
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                                <p className="mt-4 text-sm font-medium text-slate-900">
                                    {editingSchedule ? 'Updating schedule...' : 'Creating schedule...'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Student Assignment Modal */}
            {showStudentModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl mb-4">Manage Students for {selectedBus?.busNumber}</h2>
                        <p className="text-sm text-slate-600 mb-6">
                            Remaining Seats: <span className="font-bold">{getRemainingSeats(selectedBus)}</span>
                        </p>

                        {/* Tabs */}
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => { setActiveTab('unassigned'); setSearchTerm(''); }}
                                className={`flex-1 py-3 rounded-xl transition-all font-medium ${activeTab === 'unassigned'
                                    ? 'bg-black text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                Unassigned
                                <span className="ml-2 px-2 py-0.5 rounded-full text-xs ${
                                    activeTab === 'unassigned' ? 'bg-white/20' : 'bg-slate-200'
                                }">
                                    {getUnassignedStudents().length}
                                </span>
                            </button>
                            <button
                                onClick={() => { setActiveTab('assigned'); setSearchTerm(''); }}
                                className={`flex-1 py-3 rounded-xl transition-all font-medium ${activeTab === 'assigned'
                                    ? 'bg-black text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                Assigned
                                <span className="ml-2 px-2 py-0.5 rounded-full text-xs ${
                                    activeTab === 'assigned' ? 'bg-white/20' : 'bg-slate-200'
                                }">
                                    {getAssignedStudents(selectedBus.id).length}
                                </span>
                            </button>
                        </div>

                        {/* Search */}
                        <div className="relative mb-4">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search students..."
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-black outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Student List - Unassigned Tab */}
                        {activeTab === 'unassigned' && (
                            <div className="space-y-2 max-h-96 overflow-y-auto mb-6">
                                {filteredUnassignedStudents.map(student => (
                                    <label
                                        key={student.id}
                                        className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedStudents.includes(student.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedStudents([...selectedStudents, student.id]);
                                                } else {
                                                    setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                                                }
                                            }}
                                            className="w-5 h-5 rounded"
                                        />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{student.name}</p>
                                            <p className="text-xs text-slate-500">{student.address}</p>
                                        </div>
                                    </label>
                                ))}
                                {filteredUnassignedStudents.length === 0 && (
                                    <p className="text-center text-slate-400 py-8">No unassigned students found</p>
                                )}
                            </div>
                        )}

                        {/* Student List - Assigned Tab */}
                        {activeTab === 'assigned' && (
                            <div className="space-y-2 max-h-96 overflow-y-auto mb-6">
                                {filteredAssignedStudents.map(student => (
                                    <div
                                        key={student.id}
                                        onClick={() => handleUnassignStudent(student.id)}
                                        className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-red-50 cursor-pointer transition-colors group"
                                    >
                                        <div className="w-8 h-8 bg-slate-200 group-hover:bg-red-100 rounded-lg flex items-center justify-center transition-colors">
                                            <User className="w-4 h-4 text-slate-600 group-hover:text-red-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{student.name}</p>
                                            <p className="text-xs text-slate-500">{student.address}</p>
                                        </div>
                                        <X className="w-4 h-4 text-slate-400 group-hover:text-red-600 transition-colors" />
                                    </div>
                                ))}
                                {filteredAssignedStudents.length === 0 && (
                                    <p className="text-center text-slate-400 py-8">
                                        {searchTerm ? 'No assigned students found' : 'No students assigned to this bus yet'}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-4">
                            <button
                                onClick={() => { setShowStudentModal(false); setSelectedStudents([]); setSearchTerm(''); }}
                                className="flex-1 py-3 rounded-xl text-slate-500 hover:bg-slate-50"
                            >
                                Close
                            </button>
                            {activeTab === 'unassigned' && (
                                <button
                                    onClick={handleAssignStudents}
                                    disabled={selectedStudents.length === 0}
                                    className="flex-1 py-3 rounded-xl bg-black text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Assign {selectedStudents.length} Student{selectedStudents.length !== 1 ? 's' : ''}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Reschedule Modal */}
            {
                showRescheduleModal && selectedSchedule && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-xl font-bold">Reschedule Trip</h3>
                                    <p className="text-sm text-slate-500 mt-1">Select a new date for this schedule</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowRescheduleModal(false);
                                        setRescheduleDate('');
                                        setSelectedSchedule(null);
                                    }}
                                    className="p-2 hover:bg-slate-100 rounded-full"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Schedule Info */}
                                <div className="p-4 bg-slate-50 rounded-xl">
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Current Schedule</p>
                                    <p className="font-semibold">{selectedSchedule.route?.name}</p>
                                    <p className="text-sm text-slate-600 mt-1">
                                        {selectedSchedule.scheduleType === 'ONE_TIME' ? 'One-Time' : 'Recurring'}
                                    </p>
                                </div>

                                {/* New Date Input */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        New Date
                                    </label>
                                    <input
                                        type="date"
                                        value={rescheduleDate}
                                        onChange={(e) => setRescheduleDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:border-transparent"
                                    />
                                    <p className="text-xs text-slate-500 mt-2">
                                        {selectedSchedule.scheduleType === 'RECURRING'
                                            ? 'New trips will be generated for the next 7 days from this date'
                                            : 'The trip will be rescheduled to this date'}
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-4 mt-6">
                                <button
                                    onClick={() => {
                                        setShowRescheduleModal(false);
                                        setRescheduleDate('');
                                        setSelectedSchedule(null);
                                    }}
                                    className="flex-1 py-3 rounded-xl text-slate-500 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        if (!rescheduleDate) {
                                            alert('Please select a date');
                                            return;
                                        }

                                        try {
                                            const response = await fetch(`/api/admin/schedules/${selectedSchedule.id}/reschedule`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ newDate: rescheduleDate })
                                            });

                                            if (response.ok) {
                                                alert('Schedule rescheduled successfully!');
                                                fetchSchedules();
                                                setShowRescheduleModal(false);
                                                setRescheduleDate('');
                                                setSelectedSchedule(null);
                                            } else {
                                                const data = await response.json();
                                                alert(`Error: ${data.error || 'Failed to reschedule'}`);
                                            }
                                        } catch (error) {
                                            console.error('Failed to reschedule:', error);
                                            alert('Failed to reschedule schedule');
                                        }
                                    }}
                                    disabled={!rescheduleDate}
                                    className="flex-1 py-3 rounded-xl text-white bg-black hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Reschedule
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
