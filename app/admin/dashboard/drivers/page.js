'use client';

import { useState } from 'react';
import { useDashboard } from '../DashboardContext';

export default function DriversPage() {
    const { driversList, fetchResources } = useDashboard();

    // Modal State
    const [showAddDriverModal, setShowAddDriverModal] = useState(false);
    const [showEditDriverModal, setShowEditDriverModal] = useState(false);
    const [newDriver, setNewDriver] = useState({ name: '', email: '', phone: '', password: '', licenseNumber: '', emergencyContact: '' });
    const [selectedDriver, setSelectedDriver] = useState(null);

    const handleCreateDriver = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/drivers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newDriver),
            });
            if (res.ok) {
                alert('Driver registered successfully');
                setShowAddDriverModal(false);
                setNewDriver({ name: '', email: '', phone: '', password: '', licenseNumber: '', emergencyContact: '' });
                fetchResources();
            } else {
                const err = await res.json();
                alert(`Error: ${err.error}`);
            }
        } catch (error) {
            alert('Failed to register driver');
        }
    };

    const handleUpdateDriver = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`/api/admin/drivers/${selectedDriver.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: selectedDriver.user.name,
                    phone: selectedDriver.user.phone,
                    licenseNumber: selectedDriver.licenseNumber,
                    emergencyContact: selectedDriver.emergencyContact
                }),
            });
            if (res.ok) {
                alert('Driver updated successfully');
                setShowEditDriverModal(false);
                fetchResources();
            } else {
                alert('Failed to update driver');
            }
        } catch (e) {
            alert('Error updating driver');
        }
    };

    const handleDeleteDriver = async (id) => {
        if (!confirm('Are you sure? This will delete the driver and their user account.')) return;
        try {
            const res = await fetch(`/api/admin/drivers/${id}`, { method: 'DELETE' });
            if (res.ok) {
                await fetchResources();
            } else {
                alert('Failed to delete driver');
            }
        } catch (e) {
            alert('Error deleting driver');
        }
    };

    console.log(driversList)
    return (
        <div className="space-y-6 lg:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center px-2">
                <div>
                    <h2 className="text-2xl  text-slate-900 tracking-tight">Personnel Management</h2>
                    <p className="text-xs text-slate-400  uppercase tracking-widest mt-1">Operational Staff Control</p>
                </div>
                <button
                    onClick={() => setShowAddDriverModal(true)}
                    className="bg-black text-white px-6 py-3 rounded-lg  text-sm hover:bg-slate-800 transition-colors flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                    Register Driver
                </button>
            </div>

            <div className="bg-white rounded-[2.5rem] lg:rounded-[3rem] border border-slate-50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-50">
                                <th className="p-6 lg:p-8 text-[10px]  text-slate-400 uppercase tracking-widest">Driver Detail</th>
                                <th className="p-6 lg:p-8 text-[10px]  text-slate-400 uppercase tracking-widest">Credentials</th>
                                <th className="p-6 lg:p-8 text-[10px]  text-slate-400 uppercase tracking-widest">Emergency Contact</th>
                                <th className="p-6 lg:p-8 text-[10px]  text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {driversList.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="p-20 text-center opacity-30 italic  text-slate-400 text-sm">No operational staff records found</td>
                                </tr>
                            ) : (
                                driversList.map(driver => (
                                    <tr key={driver.id} className="group hover:bg-slate-50/30 transition-colors">
                                        <td className="p-6 lg:p-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 lg:w-12 h-10 lg:h-12 bg-slate-900 rounded-lg flex items-center justify-center text-white transition-transform group-hover:scale-110">
                                                    {driver.user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm  text-slate-900">{driver.user.name}</p>
                                                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">{driver.user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6 lg:p-8">
                                            <div>
                                                <p className="text-xs  text-slate-600">{driver.licenseNumber}</p>
                                                <p className="text-[10px] text-indigo-400 uppercase tracking-widest mt-1">VALID LICENSE</p>
                                            </div>
                                        </td>
                                        <td className="p-6 lg:p-8">
                                            {
                                                driver.emergencyContact ? (<p className="text-xs text-slate-600">{driver.emergencyContact}</p>)
                                                    : (<p className="text-xs inline-block mx-auto bg-slate-200 rounded-lg px-4 py-1 text-center text-slate-600">null</p>)
                                            }
                                        </td>
                                        <td className="p-6 lg:p-8 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => { setSelectedDriver(driver); setShowEditDriverModal(true); }}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteDriver(driver.id)}
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

            {/* Add Driver Modal */}
            {showAddDriverModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-lg  animate-in zoom-in-95 duration-200">
                        <h2 className="text-2xl  text-slate-900 mb-6 tracking-tight">Register New Driver</h2>
                        <form onSubmit={handleCreateDriver} className="space-y-4">
                            <div>
                                <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Full Name</label>
                                <input required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-black outline-none transition-all" value={newDriver.name} onChange={e => setNewDriver({ ...newDriver, name: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Email Address</label>
                                    <input type="email" required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-black outline-none transition-all" value={newDriver.email} onChange={e => setNewDriver({ ...newDriver, email: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Phone Number</label>
                                    <input required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-black outline-none transition-all" value={newDriver.phone} onChange={e => setNewDriver({ ...newDriver, phone: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Initial Password</label>
                                <input type="password" required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-black outline-none transition-all" value={newDriver.password} onChange={e => setNewDriver({ ...newDriver, password: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">License Number</label>
                                    <input required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-black outline-none transition-all" value={newDriver.licenseNumber} onChange={e => setNewDriver({ ...newDriver, licenseNumber: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Emergency Contact</label>
                                    <input required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-black outline-none transition-all" value={newDriver.emergencyContact} onChange={e => setNewDriver({ ...newDriver, emergencyContact: e.target.value })} />
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowAddDriverModal(false)} className="flex-1 py-3 rounded-xl  text-slate-500 hover:bg-slate-50 transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 py-3 rounded-xl  text-white bg-black hover:bg-slate-800 transition-colors  -200">Register Driver</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Driver Modal */}
            {showEditDriverModal && selectedDriver && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-lg  animate-in zoom-in-95 duration-200">
                        <h2 className="text-2xl  text-slate-900 mb-6 tracking-tight">Edit Driver</h2>
                        <form onSubmit={handleUpdateDriver} className="space-y-4">
                            <div>
                                <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Full Name</label>
                                <input required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-black outline-none transition-all" value={selectedDriver.user.name} onChange={e => setSelectedDriver({ ...selectedDriver, user: { ...selectedDriver.user, name: e.target.value } })} />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Phone Number</label>
                                <input required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-black outline-none transition-all" value={selectedDriver.user.phone || ''} onChange={e => setSelectedDriver({ ...selectedDriver, user: { ...selectedDriver.user, phone: e.target.value } })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">License Number</label>
                                    <input required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-black outline-none transition-all" value={selectedDriver.licenseNumber || ''} onChange={e => setSelectedDriver({ ...selectedDriver, licenseNumber: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Emergency Contact</label>
                                    <input required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-black outline-none transition-all" value={selectedDriver.emergencyContact || ''} onChange={e => setSelectedDriver({ ...selectedDriver, emergencyContact: e.target.value })} />
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowEditDriverModal(false)} className="flex-1 py-3 rounded-xl  text-slate-500 hover:bg-slate-50 transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 py-3 rounded-xl  text-white bg-black hover:bg-slate-800 transition-colors  -200">Update Driver</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
