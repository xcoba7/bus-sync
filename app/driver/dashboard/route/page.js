'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import MapComponent from '@/components/MapComponent';
import {
    Navigation,
    Users,
    Play,
    Square,
    Calendar,
    CheckCircle2, BusFront
} from 'lucide-react';
import { useDriver } from '../DriverContext';

export default function RouteNavigation() {
    const {
        route, students, activeTrip, scheduledTrips, fetchInitialData
    } = useDriver();

    const [totalRouteDistance, setTotalRouteDistance] = useState(0); // From Google Maps

    useEffect(() => {
        fetchInitialData();
    }, []);

    // Callback to receive route distance from Google Maps
    const handleDirectionsLoaded = (distanceData) => {
        setTotalRouteDistance(distanceData.distanceKm);
    };

    const stopTrip = async () => {
        if (!confirm('End this trip? This will notify all parents that the trip has been completed.')) {
            return;
        }

        try {
            const response = await fetch('/api/driver/trip', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    distanceCovered: parseFloat(totalRouteDistance.toFixed(2))
                })
            });

            if (response.ok) {
                alert(`Trip ended successfully! Distance covered: ${totalRouteDistance.toFixed(2)} km`);
                fetchInitialData();
            } else {
                const data = await response.json();
                alert(`Error ending trip: ${data.error}`);
            }
        } catch (error) {
            console.error('Failed to end trip:', error);
            alert('Failed to end trip. Please try again.');
        }
    };

    const startTrip = async (tripId) => {
        try {
            const response = await fetch('/api/driver/trip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tripId })
            });
            if (response.ok) {
                fetchInitialData();
                alert('Trip started successfully! Parents have been notified.');
            } else {
                const data = await response.json();
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            alert('Failed to start trip');
        }
    };

    const currentPos = route?.stops?.[0] || { lat: 9.0765, lng: 7.3986 };
    const sortedStudents = [...students].sort((a, b) => {
        const distA = Math.sqrt(Math.pow(a.dropoffLat - currentPos.lat, 2) + Math.pow(a.dropoffLng - currentPos.lng, 2));
        const distB = Math.sqrt(Math.pow(b.dropoffLat - currentPos.lat, 2) + Math.pow(b.dropoffLng - currentPos.lng, 2));
        return distA - distB;
    });

    const boardedCount = students.filter(s =>
        s.attendanceRecords?.some(a => a.tripId === activeTrip?.id && a.boardedAt)
    ).length;

    return (
        <div className="space-y-6 -mt-10">
            {/* Active Trip Component */}
            {activeTrip ? (
                <div className=" overflow-hidden">
                    <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h2 className="text-2xl  mb-2">{route?.name}</h2>
                                <div className="flex items-center gap-4 text-sm opacity-90">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        <span>{boardedCount}/{students.length} Boarded</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Navigation className="w-4 h-4" />
                                        <span>{activeTrip?.status === 'ONGOING' ? 'In Transit' : 'Ready to Start'}</span>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="p-6 -mt-10">
                        <div className="flex gap-4 w-full">
                            <Link
                                href="/driver/dashboard/attendance"
                                className={`${activeTrip?.status === 'ONGOING' && "hidden"} border border-slate-200 hover:border-slate-400 flex items-center justify-center gap-2 px-2 py-4 rounded-2xl  text-sm max-sm:text-xs uppercase transition-all`}
                            >
                                Manage Attendance
                            </Link>
                            <button
                                onClick={activeTrip?.status === 'ONGOING' ? stopTrip : () => startTrip(activeTrip?.id)}
                                className={`flex text-white bg-black hover:bg-slate-800 items-center justify-center gap-2 px-6 py-4 rounded-2xl  text-sm uppercase tracking-wider transition-all`}
                            >
                                {activeTrip?.status === 'ONGOING' ? (
                                    <>
                                        End Trip
                                    </>
                                ) : (
                                    <>
                                        Start Trip
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                /* No Active Trip - Show Scheduled Trips */
                <div className="">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Scheduled Trips
                    </h3>
                    <div className="space-y-3">
                        {scheduledTrips.length > 0 ? (
                            scheduledTrips.map(trip => (
                                <div key={trip.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <p className=" text-lg">{trip.route.name}</p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                Scheduled: {new Date(trip.scheduledStart).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => startTrip(trip.id)}
                                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl  text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                                    >
                                        <Play className="w-4 h-4" />
                                        Start Trip
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl">
                                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p className="text-sm">No trips scheduled</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Map View */}
            <div className="rounded-[2rem] overflow-hidden border border-slate-200 shadow-lg">
                <div className="absolute top-4 left-4 right-4 z-10 flex justify-between gap-2 pointer-events-none">
                    <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl text-[10px]  uppercase tracking-widest flex items-center gap-2 border border-white/10 pointer-events-auto text-white">
                        <Navigation className="w-3 h-3 text-emerald-400 animate-pulse" />
                        GPS: LIVE
                    </div>
                    {activeTrip && (
                        <div className="bg-black backdrop-blur-md px-4 py-2 rounded-2xl text-[10px]  uppercase tracking-widest flex items-center gap-2 border border-white/10 pointer-events-auto text-white">
                            <CheckCircle2 className="w-3 h-3" />
                            {boardedCount}/{students.length} Passengers
                        </div>
                    )}
                </div>
                <div className="h-[70vh] w-full relative">
                    <MapComponent
                        center={route?.stops?.[0] || { lat: 9.0765, lng: 7.3986 }}
                        zoom={14}
                        showDirections={activeTrip && route?.stops?.length >= 2}
                        origin={route?.stops?.[0]}
                        destination={route?.stops?.[route.stops.length - 1]}
                        waypoints={route?.stops?.slice(1, -1) || []}
                        onDirectionsLoaded={handleDirectionsLoaded}
                        markers={[
                            {
                                lat: currentPos.lat, lng: currentPos.lng,
                                title: "BUS",
                                icon: {
                                    // Bus icon SVG path
                                    url: "/bus.png",
                                    scaledSize: { width: 100, height: 100 },
                                    scale: 1,
                                    strokeWeight: 2,
                                    strokeColor: "#ffffff",
                                    anchor: { x: 12, y: 12 }
                                }
                            },
                            // Only show route stops when there's an active trip
                            ...(activeTrip && route?.stops ? route.stops
                                .filter(stop => stop.lat && stop.lng)
                                .map((stop, idx) => {
                                    const isFirst = idx === 0;
                                    const isLast = idx === route.stops.length - 1;

                                    // Different colors: Green for start, Red for end, Blue for student stops
                                    let markerColor = '#3B82F6'; // Blue for student stops
                                    if (isFirst) markerColor = '#000000'; // Green for school departure
                                    if (isLast) markerColor = '#000000'; // Red for school return

                                    return {
                                        lat: stop.lat,
                                        lng: stop.lng,
                                        title: stop.stopName || `Stop ${idx + 1}`,
                                        label: {
                                            text: isFirst || isLast ? '.' : (idx + 1).toString(),
                                            color: '#ffffff',
                                            fontSize: '12px',
                                            fontWeight: 'bold'
                                        },
                                        icon: {
                                            path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
                                            scale: 10,
                                            fillColor: markerColor,
                                            fillOpacity: 1,
                                            strokeColor: '#ffffff',
                                            strokeWeight: 2
                                        }
                                    };
                                }) : [])
                        ]}
                    />
                </div>
            </div>
        </div>
    );
}
