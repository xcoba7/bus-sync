'use client';

import { useDriver } from '../DriverContext';
import { Truck, Calendar, AlertTriangle, Shield, Info, Wrench, FileText } from 'lucide-react';

export default function VehicleInfo() {
    const { vehicleInfo } = useDriver();

    if (!vehicleInfo) {
        return (
            <div className=" rounded-2xl p-12 border border-slate-200 text-center">
                <Truck className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                <p className="text-slate-400">No vehicle assigned</p>
            </div>
        );
    }

    const isExpiryNear = (date) => {
        if (!date) return false;
        const daysUntilExpiry = Math.floor((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry < 30 && daysUntilExpiry > 0;
    };

    const isExpired = (date) => {
        if (!date) return false;
        return new Date(date) < new Date();
    };

    const formatDate = (date) => {
        if (!date) return 'Not set';
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className="space-y-8">
            {/* Vehicle Overview */}
            <div className="rounded-2xl p-8 border border-slate-200">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h2 className="text-2xl  flex items-center gap-3 mb-2">
                            {vehicleInfo.model || 'Bus'} {vehicleInfo.year || ''}
                        </h2>
                        <p className="text-black">Vehicle Information</p>
                    </div>
                    <div className={`px-4 py-2 rounded-xl text-sm  uppercase ${vehicleInfo.status === 'ACTIVE' ? 'bg-emerald-500 text-white' :
                            vehicleInfo.status === 'MAINTENANCE' ? 'bg-orange-500 text-white' :
                                'bg-red-500 text-white'
                        }`}>
                        {vehicleInfo.status}
                    </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Bus Number</p>
                            <p className="text-lg ">{vehicleInfo.busNumber}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">License Plate</p>
                            <p className="text-lg  font-mono">{vehicleInfo.licensePlate}</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Capacity</p>
                            <p className="text-lg ">{vehicleInfo.capacity} Passengers</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Organization</p>
                            <p className="text-lg ">{vehicleInfo.organization?.name || 'Unknown'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Maintenance Schedule */}
            <div className="rounded-3xl p-8 border border-slate-200">
                <h3 className="text-xl  mb-6 flex items-center gap-3">
                    <Wrench className="w-6 h-6 text-black" />
                    Maintenance Schedule
                </h3>
                <div className="grid sm:grid-cols-2 gap-6">
                    <div className="bg-white/5 rounded-xl p-6">
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Last Maintenance</p>
                        <p className="text-lg ">{formatDate(vehicleInfo.lastMaintenanceDate)}</p>
                    </div>
                    <div className={`rounded-xl p-6 ${isExpired(vehicleInfo.nextMaintenanceDue) ? 'bg-red-500/20 border border-red-500' :
                            isExpiryNear(vehicleInfo.nextMaintenanceDue) ? 'bg-orange-500/20 border border-orange-500' :
                                'bg-white/5'
                        }`}>
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Next Maintenance Due</p>
                        <p className="text-lg ">{formatDate(vehicleInfo.nextMaintenanceDue)}</p>
                        {isExpired(vehicleInfo.nextMaintenanceDue) && (
                            <p className="text-xs text-red-400 mt-2 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                Overdue!
                            </p>
                        )}
                        {isExpiryNear(vehicleInfo.nextMaintenanceDue) && (
                            <p className="text-xs text-orange-400 mt-2 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                Due soon
                            </p>
                        )}
                    </div>
                </div>
                {vehicleInfo.maintenanceNotes && (
                    <div className="mt-6 bg-white/5 rounded-xl p-4">
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Maintenance Notes</p>
                        <p className="text-sm">{vehicleInfo.maintenanceNotes}</p>
                    </div>
                )}
            </div>

            {/* Insurance & Registration */}
            <div className="rounded-3xl p-8 border border-slate-200">
                <h3 className="text-xl  mb-6 flex items-center gap-3">
                    <Shield className="w-6 h-6 text-black" />
                    Insurance & Registration
                </h3>
                <div className="grid sm:grid-cols-2 gap-6">
                    <div className={`rounded-xl p-6 ${isExpired(vehicleInfo.insuranceExpiry) ? 'bg-red-500/20 border border-red-500' :
                            isExpiryNear(vehicleInfo.insuranceExpiry) ? 'bg-orange-500/20 border border-orange-500' :
                                'bg-white/5'
                        }`}>
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Insurance Expiry</p>
                        <p className="text-lg ">{formatDate(vehicleInfo.insuranceExpiry)}</p>
                        {isExpired(vehicleInfo.insuranceExpiry) && (
                            <p className="text-xs text-red-400 mt-2 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                Expired!
                            </p>
                        )}
                        {isExpiryNear(vehicleInfo.insuranceExpiry) && (
                            <p className="text-xs text-orange-400 mt-2 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                Expiring soon
                            </p>
                        )}
                    </div>
                    <div className={`rounded-xl p-6 ${isExpired(vehicleInfo.registrationExpiry) ? 'bg-red-500/20 border border-red-500' :
                            isExpiryNear(vehicleInfo.registrationExpiry) ? 'bg-orange-500/20 border border-orange-500' :
                                'bg-white/5'
                        }`}>
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Registration Expiry</p>
                        <p className="text-lg ">{formatDate(vehicleInfo.registrationExpiry)}</p>
                        {isExpired(vehicleInfo.registrationExpiry) && (
                            <p className="text-xs text-red-400 mt-2 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                Expired!
                            </p>
                        )}
                        {isExpiryNear(vehicleInfo.registrationExpiry) && (
                            <p className="text-xs text-orange-400 mt-2 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                Expiring soon
                            </p>
                        )}
                    </div>
                </div>
            </div>
            
        </div>
    );
}
