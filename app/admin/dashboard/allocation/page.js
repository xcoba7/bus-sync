'use client';

import { useState } from 'react';
import { useDashboard } from '../DashboardContext';

export default function AllocationPage() {
    const { studentsList, busesList, terms, fetchResources } = useDashboard();
    const [studentSearch, setStudentSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // Modal State
    const [showAddStudentModal, setShowAddStudentModal] = useState(false);
    const [showEditStudentModal, setShowEditStudentModal] = useState(false);
    const [newStudent, setNewStudent] = useState({ name: '', address: '', guardianName: '', guardianEmail: '', guardianPhone: '' });
    const [selectedStudent, setSelectedStudent] = useState(null);

    const filteredStudents = studentsList.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
            s.guardian?.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
            s.bus?.busNumber.toLowerCase().includes(studentSearch.toLowerCase());

        const matchesFilter = filterStatus === 'all' ? true :
            filterStatus === 'assigned' ? s.busId !== null :
                s.busId === null;

        return matchesSearch && matchesFilter;
    });

    const totalStudents = studentsList.length;
    const assignedStudents = studentsList.filter(s => s.busId !== null).length;
    const unassignedStudents = totalStudents - assignedStudents;

    const handleAllocate = async (studentId, busId, routeId) => {
        try {
            const res = await fetch('/api/admin/students', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ passengerId: studentId, busId, routeId }),
            });
            if (res.ok) {
                fetchResources();
            }
        } catch (e) {
            alert('Failed to update allocation');
        }
    };

    const handleCreateStudent = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newStudent),
            });
            if (res.ok) {
                alert('Passenger registered successfully');
                setShowAddStudentModal(false);
                setNewStudent({ name: '', address: '', guardianName: '', guardianEmail: '', guardianPhone: '' });
                fetchResources();
            } else {
                const err = await res.json();
                alert(`Error: ${err.error}`);
            }
        } catch (error) {
            alert('Failed to register passenger');
        }
    };

    const handleUpdateStudent = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`/api/admin/students/${selectedStudent.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(selectedStudent),
            });
            if (res.ok) {
                alert(`${terms.passenger} updated successfully`);
                setShowEditStudentModal(false);
                fetchResources();
            } else {
                alert(`Failed to update ${terms.passenger}`);
            }
        } catch (e) {
            alert('Error updating');
        }
    };

    const handleDeleteStudent = async (id) => {
        if (!confirm('Are you sure? This will delete the passenger permanently.')) return;
        try {
            const res = await fetch(`/api/admin/students/${id}`, { method: 'DELETE' });
            if (res.ok) {
                await fetchResources();
            } else {
                alert('Failed to delete');
            }
        } catch (e) {
            alert('Error deleting');
        }
    };


    return (
        <div className="space-y-6 lg:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-[2.5rem] lg:rounded-[3rem] border border-slate-50 overflow-hidden">
                <div className="p-6 lg:p-8 border-b border-slate-50">
                    {/* Stats Row */}
                    <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-slate-50 rounded-2xl p-4">
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Total {terms.passengers}</p>
                            <p className="text-2xl font-bold text-slate-900">{totalStudents}</p>
                        </div>
                        <div className="bg-green-50 rounded-2xl p-4">
                            <p className="text-[10px] text-green-600 uppercase tracking-widest mb-1">Assigned</p>
                            <p className="text-2xl font-bold text-green-700">{assignedStudents}</p>
                        </div>
                        <div className="bg-amber-50 rounded-2xl p-4">
                            <p className="text-[10px] text-amber-600 uppercase tracking-widest mb-1">Unassigned</p>
                            <p className="text-2xl font-bold text-amber-700">{unassignedStudents}</p>
                        </div>
                    </div>

                    {/* Search and Filter Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex flex-col sm:flex-row gap-4 flex-1">
                            <div className="relative w-full sm:w-80">
                                <input
                                    type="text"
                                    placeholder={`Search by ${terms.passenger.toLowerCase()}, ${terms.guardian.toLowerCase()} or unit...`}
                                    className="pl-12 pr-6 py-4 border border-slate-100 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full"
                                    value={studentSearch}
                                    onChange={(e) => setStudentSearch(e.target.value)}
                                />
                                <svg className="w-5 h-5 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="px-6 py-4 border border-slate-100 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white cursor-pointer"
                            >
                                <option value="all">All {terms.passengers}</option>
                                <option value="assigned">Assigned Only</option>
                                <option value="unassigned">Unassigned Only</option>
                            </select>
                        </div>
                        <button
                            onClick={() => setShowAddStudentModal(true)}
                            className="bg-black text-white px-4 py-3 rounded-lg text-sm hover:bg-slate-800 transition-colors flex items-center gap-2 whitespace-nowrap"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                            </svg>
                            Register {terms.passenger}
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-50">
                                <th className="p-6 lg:p-8 text-[10px]  text-slate-400 uppercase tracking-widest">{terms.passenger} Detail</th>
                                <th className="p-6 lg:p-8 text-[10px]  text-slate-400 uppercase tracking-widest">Home Address</th>
                                <th className="p-6 lg:p-8 text-[10px]  text-slate-400 uppercase tracking-widest">Parent/Guardian</th>
                                <th className="p-6 lg:p-8 text-[10px]  text-slate-400 uppercase tracking-widest">Assigned Unit</th>
                                <th className="p-6 lg:p-8 text-[10px]  text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-20 text-center opacity-30 italic  text-slate-400 text-sm">No {terms.passengers.toLowerCase()} found matching transition parameters</td>
                                </tr>
                            ) : (
                                filteredStudents.map(student => (
                                    <tr key={student.id} className="group hover:bg-slate-50/30 transition-colors">
                                        <td className="p-6 lg:p-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 lg:w-12 h-10 lg:h-12 bg-indigo-50 rounded-lg flex items-center justify-center  text-black transition-transform group-hover:scale-110">
                                                    {student.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm  text-slate-900">{student.name}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6 lg:p-8">
                                            <div className="max-w-[200px]">
                                                <p className="text-xs  text-slate-600 truncate" title={student.address}>{student.address}</p>

                                            </div>
                                        </td>
                                        <td className="p-6 lg:p-8">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full`}>
                                                <span className="text-xs text-slate-600">{student.guardian.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-6 lg:p-8">
                                            <select
                                                className={`w-full max-w-[180px] bg-white px-4 py-3 rounded-xl text-xs  border transition-all cursor-pointer appearance-none ${student.busId ? 'text-black' : 'text-slate-400 border-slate-100 hover:border-indigo-200'}`}
                                                value={student.busId || ''}
                                                onChange={(e) => handleAllocate(student.id, e.target.value || null, student.routeId)}
                                            >
                                                <option value="">DEALLOCATED</option>
                                                {busesList.map(b => (
                                                    <option key={b.id} value={b.id} className="text-slate-900">{b.busNumber}</option>
                                                ))}
                                            </select>
                                        </td>

                                        <td className="p-6 lg:p-8 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedStudent({
                                                            ...student,
                                                            guardianName: student.guardian?.name || '',
                                                            guardianEmail: student.guardian?.email || '',
                                                            guardianPhone: student.guardian?.phone || ''
                                                        });
                                                        setShowEditStudentModal(true);
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteStudent(student.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
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

            {/* Add Passenger Modal */}
            {showAddStudentModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-lg  animate-in zoom-in-95 duration-200">
                        <h2 className="text-2xl  text-slate-900 mb-6 tracking-tight">Register New {terms.passenger}</h2>
                        <form onSubmit={handleCreateStudent} className="space-y-4">
                            <div>
                                <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Full Name</label>
                                <input required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-black outline-none transition-all" value={newStudent.name} onChange={e => setNewStudent({ ...newStudent, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Home Address / Landmark</label>
                                <input required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-black outline-none transition-all" value={newStudent.address} onChange={e => setNewStudent({ ...newStudent, address: e.target.value })} />
                            </div>
                            <div className="pt-4 border-t border-slate-100">
                                <p className="text-[10px] text-slate-900 font-black uppercase tracking-widest mb-4">{terms.guardian}/Guardian Details</p>
                                <div className="space-y-4">
                                    <input placeholder={`${terms.guardian} Name`} required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-black outline-none transition-all" value={newStudent.guardianName} onChange={e => setNewStudent({ ...newStudent, guardianName: e.target.value })} />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input type="email" placeholder="Email Address" required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-black outline-none transition-all" value={newStudent.guardianEmail} onChange={e => setNewStudent({ ...newStudent, guardianEmail: e.target.value })} />
                                        <input placeholder="Phone Number" required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-black outline-none transition-all" value={newStudent.guardianPhone} onChange={e => setNewStudent({ ...newStudent, guardianPhone: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowAddStudentModal(false)} className="flex-1 py-3 rounded-xl  text-slate-500 hover:bg-slate-50 transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 py-3 rounded-xl  text-white bg-black hover:bg-slate-800 transition-colors  -200">Register</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Student Modal */}
            {showEditStudentModal && selectedStudent && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-lg  animate-in zoom-in-95 duration-200">
                        <h2 className="text-2xl  text-slate-900 mb-6 tracking-tight">Edit {terms.passenger}</h2>
                        <form onSubmit={handleUpdateStudent} className="space-y-4">
                            <div>
                                <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Full Name</label>
                                <input required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-black outline-none transition-all" value={selectedStudent.name} onChange={e => setSelectedStudent({ ...selectedStudent, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Home Address</label>
                                <input required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-black outline-none transition-all" value={selectedStudent.address} onChange={e => setSelectedStudent({ ...selectedStudent, address: e.target.value })} />
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                <p className="text-[10px] text-slate-900 font-black uppercase tracking-widest mb-4">{terms.guardian} Details</p>
                                <div className="space-y-4">
                                    <input placeholder={`${terms.guardian} Name`} required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-black outline-none transition-all" value={selectedStudent.guardianName} onChange={e => setSelectedStudent({ ...selectedStudent, guardianName: e.target.value })} />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input type="email" placeholder="Email Address" required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-black outline-none transition-all" value={selectedStudent.guardianEmail} onChange={e => setSelectedStudent({ ...selectedStudent, guardianEmail: e.target.value })} />
                                        <input placeholder="Phone Number" required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-black outline-none transition-all" value={selectedStudent.guardianPhone} onChange={e => setSelectedStudent({ ...selectedStudent, guardianPhone: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowEditStudentModal(false)} className="flex-1 py-3 rounded-xl  text-slate-500 hover:bg-slate-50 transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 py-3 rounded-xl  text-white bg-black hover:bg-slate-800 transition-colors  -200">Update Profile</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
