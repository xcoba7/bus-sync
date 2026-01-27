'use client';

import { useState } from 'react';
import { useDashboard } from '../DashboardContext';

export default function RoutesPage() {
    const { routesList, busesList, fetchResources } = useDashboard();

    // Modal State
    const [showAddRouteModal, setShowAddRouteModal] = useState(false);
    const [showEditRouteModal, setShowEditRouteModal] = useState(false);
    const [newRoute, setNewRoute] = useState({ name: '', description: '', busId: '', startTime: '07:00', endTime: '', operatingDays: [], routeType: 'FIXED', autoGenerateStops: true });
    const [selectedRoute, setSelectedRoute] = useState(null);

    const handleCreateRoute = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/routes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newRoute),
            });
            if (res.ok) {
                alert('Route created successfully');
                setShowAddRouteModal(false);
                setNewRoute({ name: '', description: '', busId: '', startTime: '07:00', endTime: '', operatingDays: [], routeType: 'FIXED', autoGenerateStops: true });
                fetchResources();
            } else {
                const err = await res.json();
                alert(`Error: ${err.error}`);
            }
        } catch (error) {
            alert('Failed to create route');
        }
    };

    const handleUpdateRoute = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`/api/admin/routes/${selectedRoute.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(selectedRoute),
            });
            if (res.ok) {
                alert('Route updated successfully');
                setShowEditRouteModal(false);
                fetchResources();
            } else {
                alert('Failed to update route');
            }
        } catch (e) {
            alert('Error updating route');
        }
    };

    const handleDeleteRoute = async (id) => {
        if (!confirm('Are you sure? This will delete the route permanently.')) return;
        try {
            const res = await fetch(`/api/admin/routes/${id}`, { method: 'DELETE' });
            if (res.ok) {
                await fetchResources();
            } else {
                alert('Failed to delete route');
            }
        } catch (e) {
            alert('Error deleting route');
        }
    };

    return (
        <div className="space-y-6 lg:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl  text-slate-900 tracking-tight">Route Management</h2>
                    <p className="text-xs text-slate-400  uppercase tracking-widest mt-1">Configure Transit Pathways</p>
                </div>
                <button
                    onClick={() => setShowAddRouteModal(true)}
                    className="bg-black text-white px-6 py-3 rounded-lg  text-sm hover:bg-slate-800 transition-colors flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Route
                </button>
            </div>

            <div className="bg-white rounded-[2.5rem] lg:rounded-[3rem] border border-slate-50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-50">
                                <th className="p-6 lg:p-8 text-[10px]  text-slate-400 uppercase tracking-widest">Route Details</th>
                                <th className="p-6 lg:p-8 text-[10px]  text-slate-400 uppercase tracking-widest">Bus Assignment</th>
                                <th className="p-6 lg:p-8 text-[10px]  text-slate-400 uppercase tracking-widest">Stops</th>
                                <th className="p-6 lg:p-8 text-[10px]  text-slate-400 uppercase tracking-widest">Schedule</th>
                                <th className="p-6 lg:p-8 text-[10px]  text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {routesList.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-20 text-center opacity-30 italic  text-slate-400 text-sm">No transit routes defined yet</td>
                                </tr>
                            ) : (
                                routesList.map(route => (
                                    <tr key={route.id} className="group hover:bg-slate-50/30 transition-colors">
                                        <td className="p-6 lg:p-8">
                                            <div>
                                                <p className="text-sm  text-slate-900">{route.name}</p>
                                                <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{route.description || 'No description provided'}</p>
                                            </div>
                                        </td>
                                        <td className="p-6 lg:p-8">
                                            {route.bus ? (
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-black rounded flex items-center justify-center text-[10px] text-white">
                                                        UNIT
                                                    </div>
                                                    <div>
                                                        <p className="text-xs  text-slate-900">{route.bus.busNumber}</p>
                                                        <p className="text-[9px] text-slate-400 uppercase tracking-widest">{route.bus.licensePlate}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-amber-500  uppercase tracking-widest">Unassigned</span>
                                            )}
                                        </td>
                                        <td className="p-6 lg:p-8">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs  text-slate-900">{route.stops?.length || 0}</span>
                                                <span className="text-[10px] text-slate-400 uppercase tracking-widest">Checkpoints</span>
                                            </div>
                                        </td>
                                        <td className="p-6 lg:p-8">
                                            <div className="text-xs  text-slate-900">
                                                {route.startTime} - {route.endTime}
                                            </div>
                                            <div className="flex gap-1 mt-1">
                                                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
                                                    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                                                    const isActive = (route.operatingDays || []).includes(days[i]);
                                                    return (
                                                        <span key={i} className={`text-[8px] w-4 h-4 rounded-full flex items-center justify-center ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                            {day}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </td>
                                        <td className="p-6 lg:p-8 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => { setSelectedRoute(route); setShowEditRouteModal(true); }}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteRoute(route.id)}
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

            {/* Add Route Modal */}
            {showAddRouteModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-2xl  animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
                        <h2 className="text-2xl  text-slate-900 mb-6 tracking-tight">Create New Route</h2>
                        <form onSubmit={handleCreateRoute} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Route Name</label>
                                    <input required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-black outline-none transition-all" value={newRoute.name} onChange={e => setNewRoute({ ...newRoute, name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Bus Assignment</label>
                                    <select required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-black outline-none transition-all appearance-none" value={newRoute.busId} onChange={e => setNewRoute({ ...newRoute, busId: e.target.value })}>
                                        <option value="">Select a Bus</option>
                                        {busesList.map(bus => (
                                            <option key={bus.id} value={bus.id}>{bus.busNumber} ({bus.licensePlate})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                                <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-blue-900 mb-1">Auto-Generated Stops</p>
                                        <p className="text-xs text-blue-700">
                                            Route stops will be automatically generated from passengers assigned to the selected bus.
                                            The system will optimize the route order using Google Maps.
                                        </p>
                                        {newRoute.busId && (
                                            <p className="text-xs text-blue-900 font-bold mt-2">
                                                {busesList.find(b => b.id === newRoute.busId)?._count?.passengers || 0} passengers assigned to this bus
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                                <div>
                                    <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Start Time (Daily)</label>
                                    <input type="time" required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-black outline-none transition-all" value={newRoute.startTime} onChange={e => setNewRoute({ ...newRoute, startTime: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">End Time (Daily)</label>
                                    <input type="time" required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-black outline-none transition-all" value={newRoute.endTime} onChange={e => setNewRoute({ ...newRoute, endTime: e.target.value })} />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Operating Days</label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                        <button
                                            key={day}
                                            type="button"
                                            onClick={() => {
                                                const currentDays = newRoute.operatingDays || [];
                                                const days = currentDays.includes(day)
                                                    ? currentDays.filter(d => d !== day)
                                                    : [...currentDays, day];
                                                setNewRoute({ ...newRoute, operatingDays: days });
                                            }}
                                            className={`px-4 py-2 rounded-xl text-xs  transition-all ${(newRoute.operatingDays || []).includes(day) ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                                        >
                                            {day}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-4 pt-6">
                                <button type="button" onClick={() => setShowAddRouteModal(false)} className="flex-1 py-3 rounded-xl  text-slate-500 hover:bg-slate-50 transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 py-3 rounded-xl  text-white bg-black hover:bg-slate-800 transition-colors  -200">Create Route</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Route Modal */}
            {showEditRouteModal && selectedRoute && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-2xl  animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
                        <h2 className="text-2xl  text-slate-900 mb-6 tracking-tight">Edit Route: {selectedRoute.name}</h2>
                        <form onSubmit={handleUpdateRoute} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Route Name</label>
                                    <input required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-black outline-none transition-all" value={selectedRoute.name} onChange={e => setSelectedRoute({ ...selectedRoute, name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Bus Assignment</label>
                                    <select required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-black outline-none transition-all appearance-none" value={selectedRoute.busId} onChange={e => setSelectedRoute({ ...selectedRoute, busId: e.target.value })}>
                                        <option value="">Select a Bus</option>
                                        {busesList.map(bus => (
                                            <option key={bus.id} value={bus.id}>{bus.busNumber} ({bus.licensePlate})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Route Stops (Sequential)</label>
                                <div className="space-y-3 mt-2">
                                    {selectedRoute.stops.map((stop, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <input placeholder="Stop Name" className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-3 text-sm" value={stop.name} onChange={e => {
                                                const newStops = [...selectedRoute.stops];
                                                newStops[idx].name = e.target.value;
                                                setSelectedRoute({ ...selectedRoute, stops: newStops });
                                            }} />
                                            <input placeholder="Address/Location" className="flex-[2] bg-slate-50 border-none rounded-xl px-4 py-3 text-sm" value={stop.address} onChange={e => {
                                                const newStops = [...selectedRoute.stops];
                                                newStops[idx].address = e.target.value;
                                                setSelectedRoute({ ...selectedRoute, stops: newStops });
                                            }} />
                                            {selectedRoute.stops.length > 1 && (
                                                <button type="button" onClick={() => setSelectedRoute({ ...selectedRoute, stops: selectedRoute.stops.filter((_, i) => i !== idx) })} className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors">✕</button>
                                            )}
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => setSelectedRoute({ ...selectedRoute, stops: [...selectedRoute.stops, { name: '', address: '' }] })} className="text-xs  text-indigo-600 hover:text-indigo-700">+ Add Another Stop</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                                <div>
                                    <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Start Time (Daily)</label>
                                    <input type="time" required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-black outline-none transition-all" value={selectedRoute.startTime} onChange={e => setSelectedRoute({ ...selectedRoute, startTime: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">End Time (Daily)</label>
                                    <input type="time" required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-black outline-none transition-all" value={selectedRoute.endTime} onChange={e => setSelectedRoute({ ...selectedRoute, endTime: e.target.value })} />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Operating Days</label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                        <button
                                            key={day}
                                            type="button"
                                            onClick={() => {
                                                const currentDays = selectedRoute.operatingDays || [];
                                                const days = currentDays.includes(day)
                                                    ? currentDays.filter(d => d !== day)
                                                    : [...currentDays, day];
                                                setSelectedRoute({ ...selectedRoute, operatingDays: days });
                                            }}
                                            className={`px-4 py-2 rounded-xl text-xs  transition-all ${(selectedRoute.operatingDays || []).includes(day) ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                                        >
                                            {day}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-4 pt-6">
                                <button type="button" onClick={() => setShowEditRouteModal(false)} className="flex-1 py-3 rounded-xl  text-slate-500 hover:bg-slate-50 transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 py-3 rounded-xl  text-white bg-black hover:bg-slate-800 transition-colors ">Update Route</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
