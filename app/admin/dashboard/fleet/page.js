'use client';

import { useState } from 'react';
import { useDashboard } from '../DashboardContext';
import { AlertTriangle, BusFront, X } from 'lucide-react';

export default function FleetPage() {
    const { busesList, driversList, fetchResources } = useDashboard();

    // Modal State
    const [showAddBusModal, setShowAddBusModal] = useState(false);
    const [showEditBusModal, setShowEditBusModal] = useState(false);
    const [showDriverConflictModal, setShowDriverConflictModal] = useState(false);
    const [driverConflictInfo, setDriverConflictInfo] = useState(null);
    const [pendingDriverChange, setPendingDriverChange] = useState(null);
    const [newBus, setNewBus] = useState({ busNumber: '', licensePlate: '', capacity: '', model: '', year: '', driverId: '' });
    const [selectedBus, setSelectedBus] = useState(null);

    const handleDriverSelect = (driverId, isEditMode = false) => {
        if (!driverId) {
            if (isEditMode) {
                setSelectedBus({ ...selectedBus, driverId: '' });
            } else {
                setNewBus({ ...newBus, driverId: '' });
            }
            return;
        }

        // Check if driver is already assigned to another bus
        const driverBus = busesList.find(bus =>
            bus.driverId === driverId && (!isEditMode || bus.id !== selectedBus?.id)
        );

        if (driverBus) {
            // Show conflict modal - driver cannot be assigned to multiple buses
            setDriverConflictInfo({
                driverName: driversList.find(d => d.id === driverId)?.user?.name,
                currentBus: driverBus.busNumber,
                targetBus: isEditMode ? selectedBus.busNumber : 'new bus'
            });
            setShowDriverConflictModal(true);
        } else {
            // No conflict, assign directly
            if (isEditMode) {
                setSelectedBus({ ...selectedBus, driverId });
            } else {
                setNewBus({ ...newBus, driverId });
            }
        }
    };

    const closeDriverConflictModal = () => {
        setShowDriverConflictModal(false);
        setDriverConflictInfo(null);
    };

    const handleCreateBus = async (e) => {
        e.preventDefault();

        try {
            const res = await fetch('/api/admin/buses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newBus),
            });
            if (res.ok) {
                alert('Bus added successfully');
                setShowAddBusModal(false);
                setNewBus({ busNumber: '', licensePlate: '', capacity: '', model: '', year: '', driverId: '' });
                fetchResources();
            } else {
                const err = await res.json();
                alert(`Error: ${err.error}`);
            }
        } catch (error) {
            alert('Failed to add bus');
        }
    };

    const handleUpdateBus = async (e) => {
        e.preventDefault();

        try {
            const res = await fetch(`/api/admin/buses/${selectedBus.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(selectedBus),
            });
            if (res.ok) {
                alert('Bus updated successfully');
                setShowEditBusModal(false);
                fetchResources();
            } else {
                alert('Failed to update bus');
            }
        } catch (e) {
            alert('Error updating bus');
        }
    };

    const handleDeleteBus = async (id) => {
        if (!confirm('Are you sure? This will delete the bus permanently.')) return;
        try {
            const res = await fetch(`/api/admin/buses/${id}`, { method: 'DELETE' });
            if (res.ok) {
                await fetchResources();
            } else {
                alert('Failed to delete bus');
            }
        } catch (e) {
            alert('Error deleting bus');
        }
    };

    return (
        <div className="space-y-6 lg:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-[2.5rem] lg:rounded-[3rem] border border-slate-50 overflow-hidden">
                <div className="p-6 lg:p-8 border-b border-slate-50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div>
                            <h2 className="text-2xl text-slate-900 tracking-tight">Fleet Management</h2>
                            <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Buses and Fleet Management</p>
                        </div>
                        <button
                            onClick={() => setShowAddBusModal(true)}
                            className="bg-black text-white px-4 py-3 rounded-lg text-sm hover:bg-slate-800 transition-colors flex items-center gap-2 whitespace-nowrap"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                            </svg>
                            Add New Bus
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-50">
                                <th className="p-6 lg:p-8 text-[10px] text-slate-400 uppercase tracking-widest">Bus Details</th>
                                <th className="p-6 lg:p-8 text-[10px] text-slate-400 uppercase tracking-widest">License Plate</th>
                                <th className="p-6 lg:p-8 text-[10px] text-slate-400 uppercase tracking-widest">Capacity</th>
                                <th className="p-6 lg:p-8 text-[10px] text-slate-400 uppercase tracking-widest">Assigned Driver</th>
                                <th className="p-6 lg:p-8 text-[10px] text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {busesList.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-20 text-center opacity-30 italic text-slate-400 text-sm">No fleet units registered in this organization</td>
                                </tr>
                            ) : (
                                busesList.map(bus => (
                                    <tr key={bus.id} className="group hover:bg-slate-50/30 transition-colors">
                                        <td className="p-6 lg:p-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 lg:w-12 h-10 lg:h-12 bg-slate-900 rounded-lg flex items-center justify-center text-white transition-transform group-hover:scale-110">
                                                    <BusFront className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-slate-900">{bus.busNumber}</p>
                                                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">{bus.model} • {bus.year}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6 lg:p-8">
                                            <p className="text-xs text-slate-600">{bus.licensePlate}</p>
                                        </td>
                                        <td className="p-6 lg:p-8">
                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full">
                                                <span className="text-xs text-slate-700">{bus.capacity} Seats</span>
                                            </div>
                                        </td>
                                        <td className="p-6 lg:p-8">
                                            {bus.driver?.user?.name ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    <span className="text-xs text-slate-900">{bus.driver.user.name}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs inline-block bg-slate-200 rounded-lg px-4 py-1 text-slate-600">Unassigned</span>
                                            )}
                                        </td>
                                        <td className="p-6 lg:p-8 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => { setSelectedBus(bus); setShowEditBusModal(true); }}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteBus(bus.id)}
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

            {/* Add Bus Modal */}
            {showAddBusModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-lg  animate-in zoom-in-95 duration-200">
                        <h2 className="text-2xl  text-slate-900 mb-6 tracking-tight">Add New Fleet Unit</h2>
                        <form onSubmit={handleCreateBus} className="space-y-4">
                            <div>
                                <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Fleet ID / Bus Number</label>
                                <input required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-black outline-none transition-all" value={newBus.busNumber} onChange={e => setNewBus({ ...newBus, busNumber: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">License Plate</label>
                                    <input required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-black outline-none transition-all" value={newBus.licensePlate} onChange={e => setNewBus({ ...newBus, licensePlate: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Capacity</label>
                                    <input type="number" required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-black outline-none transition-all" value={newBus.capacity} onChange={e => setNewBus({ ...newBus, capacity: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Make / Model</label>
                                    <input required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-black outline-none transition-all" value={newBus.model} onChange={e => setNewBus({ ...newBus, model: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Manufacturing Year</label>
                                    <input required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-black outline-none transition-all" value={newBus.year} onChange={e => setNewBus({ ...newBus, year: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Primary Driver Assignment</label>
                                <select
                                    className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-black outline-none transition-all appearance-none"
                                    value={newBus.driverId}
                                    onChange={e => handleDriverSelect(e.target.value, false)}
                                >
                                    <option value="">Select a Driver (Optional)</option>
                                    {driversList.map(driver => {
                                        const assignedBus = busesList.find(bus => bus.driverId === driver.id);
                                        return (
                                            <option key={driver.id} value={driver.id}>
                                                {driver.user.name}{assignedBus ? ` (Assigned to ${assignedBus.busNumber})` : ''}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowAddBusModal(false)} className="flex-1 py-3 rounded-xl  text-slate-500 hover:bg-slate-50 transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 py-3 rounded-xl  text-white bg-black hover:bg-slate-800 transition-colors  -200">Add Bus</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Bus Modal */}
            {showEditBusModal && selectedBus && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-lg  animate-in zoom-in-95 duration-200">
                        <h2 className="text-2xl  text-slate-900 mb-6 tracking-tight">Edit Unit {selectedBus.busNumber}</h2>
                        <form onSubmit={handleUpdateBus} className="space-y-4">
                            <div>
                                <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Fleet ID</label>
                                <input required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-black outline-none transition-all" value={selectedBus.busNumber} onChange={e => setSelectedBus({ ...selectedBus, busNumber: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">License Plate</label>
                                    <input required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-black outline-none transition-all" value={selectedBus.licensePlate} onChange={e => setSelectedBus({ ...selectedBus, licensePlate: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Capacity</label>
                                    <input type="number" required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-black outline-none transition-all" value={selectedBus.capacity} onChange={e => setSelectedBus({ ...selectedBus, capacity: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Make / Model</label>
                                    <input required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-black outline-none transition-all" value={selectedBus.model} onChange={e => setSelectedBus({ ...selectedBus, model: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Manufacturing Year</label>
                                    <input required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-black outline-none transition-all" value={selectedBus.year} onChange={e => setSelectedBus({ ...selectedBus, year: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Driver Assignment</label>
                                <select
                                    className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-black outline-none transition-all appearance-none"
                                    value={selectedBus.driverId || ''}
                                    onChange={e => handleDriverSelect(e.target.value, true)}
                                >
                                    <option value="">No Driver</option>
                                    {driversList.map(driver => {
                                        const assignedBus = busesList.find(bus => bus.driverId === driver.id);
                                        return (
                                            <option key={driver.id} value={driver.id}>
                                                {driver.user.name}{assignedBus ? ` (Assigned to ${assignedBus.busNumber})` : ''}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowEditBusModal(false)} className="flex-1 py-3 rounded-xl  text-slate-500 hover:bg-slate-50 transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 py-3 rounded-xl  text-white bg-black hover:bg-slate-800 transition-colors  -200">Update Unit</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Driver Conflict Modal */}
            {showDriverConflictModal && driverConflictInfo && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-md animate-in zoom-in-95 duration-200 shadow-2xl">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Driver Already Assigned</h3>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    <span className="font-semibold text-slate-900">{driverConflictInfo.driverName}</span> is currently assigned to <span className="font-semibold text-slate-900">{driverConflictInfo.currentBus}</span>.
                                </p>
                            </div>
                        </div>

                        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
                            <p className="text-sm text-red-900 font-semibold mb-2">One Bus Per Driver Policy</p>
                            <p className="text-xs text-red-700">
                                A driver can only be assigned to one bus at a time. Please unassign this driver from <span className="font-semibold">{driverConflictInfo.currentBus}</span> first before assigning to {driverConflictInfo.targetBus}.
                            </p>
                        </div>

                        <button
                            onClick={closeDriverConflictModal}
                            className="w-full py-3 px-4 rounded-xl bg-black text-white hover:bg-slate-800 transition-colors font-medium"
                        >
                            OK, Got It
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
