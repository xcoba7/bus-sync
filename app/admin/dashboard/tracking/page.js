'use client';

import { useDashboard } from '../DashboardContext';
import MapComponent from '@/components/MapComponent';
import { Bus, Navigation } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function TrackingPage() {
    const { activeBuses, busesList } = useDashboard();
    const [activeTrips, setActiveTrips] = useState([]);
    const [routeMetrics, setRouteMetrics] = useState({});

    // Fetch active trips with route information
    useEffect(() => {
        const fetchActiveTrips = async () => {
            try {
                const response = await fetch('/api/admin/trips/active');
                if (response.ok) {
                    const data = await response.json();
                    setActiveTrips(data.trips || []);
                }
            } catch (error) {
                console.error('Failed to fetch active trips:', error);
            }
        };

        fetchActiveTrips();
        const interval = setInterval(fetchActiveTrips, 10000); // Refresh every 10 seconds
        return () => clearInterval(interval);
    }, []);

    // Create markers for all buses with current location
    const busMarkers = activeBuses
        .filter(bus => bus.currentLat && bus.currentLng)
        .map(bus => ({
            lat: bus.currentLat,
            lng: bus.currentLng,
            title: `Bus ${bus.busNumber}`,
            label: {
                text: bus.busNumber,
                color: 'white',
                fontWeight: 'bold',
                fontSize: '11px'
            },
            icon: {
                // Bus icon SVG path
                path: 'M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z',
                fillColor: '#000000',
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: '#ffffff',
                scale: 1.8,
                anchor: { x: 12, y: 12 }
            },
        }));

    // Add route stop markers for active trips
    const stopMarkers = activeTrips.flatMap(trip =>
        trip.route?.stops?.filter(stop => stop.lat && stop.lng).map((stop, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === trip.route.stops.length - 1;

            let markerColor = '#3B82F6'; // Blue for student stops
            if (isFirst) markerColor = '#10B981'; // Green for school departure
            if (isLast) markerColor = '#EF4444'; // Red for school return

            return {
                lat: stop.lat,
                lng: stop.lng,
                title: stop.stopName || `Stop ${idx + 1}`,
                label: {
                    text: isFirst || isLast ? '.' : (idx + 1).toString(),
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: 'bold'
                },
                icon: {
                    path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
                    scale: 8,
                    fillColor: markerColor,
                    fillOpacity: 1,
                    strokeColor: '#ffffff',
                    strokeWeight: 2
                }
            };
        }) || []
    );

    const allMarkers = [...busMarkers, ...stopMarkers];

    // For showing directions, get the first active trip with route
    const tripWithRoute = activeTrips.find(trip => trip.route?.stops?.length >= 2);

    // Calculate center point (average of all bus locations or default)
    const center = busMarkers.length > 0
        ? {
            lat: busMarkers.reduce((sum, m) => sum + m.lat, 0) / busMarkers.length,
            lng: busMarkers.reduce((sum, m) => sum + m.lng, 0) / busMarkers.length
        }
        : { lat: 9.0765, lng: 7.3986 };

    return (
        <div className="space-y-6 lg:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
            <div className="flex-1 bg-white rounded-xl border border-slate-50 overflow-hidden shadow-inner relative min-h-[500px]">
                <MapComponent
                    center={center}
                    zoom={activeBuses.length > 1 ? 12 : 14}
                    markers={allMarkers}
                    showDirections={tripWithRoute && tripWithRoute.route?.stops?.length >= 2}
                    origin={tripWithRoute?.route?.stops?.[0]}
                    destination={tripWithRoute?.route?.stops?.[tripWithRoute.route.stops.length - 1]}
                    waypoints={tripWithRoute?.route?.stops?.slice(1, -1) || []}
                    onDirectionsLoaded={(metrics) => {
                        if (tripWithRoute) {
                            setRouteMetrics(prev => ({
                                ...prev,
                                [tripWithRoute.id]: metrics
                            }));
                        }
                    }}
                />

                {/* Overlay Stats */}
                <div className="absolute top-6 left-6 flex gap-4 flex-wrap">
                    <div className="bg-black/80 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 shadow-xl">
                        <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest">Active Buses</p>
                        <div className="flex items-center gap-2 mt-1">
                            <Bus className="w-5 h-5 text-white" />
                            <p className="text-2xl font-black text-white">{activeBuses.length}</p>
                        </div>
                    </div>
                    <div className="bg-black/80 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 shadow-xl">
                        <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest">Total Fleet</p>
                        <p className="text-2xl font-black text-white">{busesList.length}</p>
                    </div>
                    <div className="bg-black/80 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 shadow-xl">
                        <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest">Status</p>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <Navigation className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-bold text-emerald-400 uppercase">Live GPS</span>
                        </div>
                    </div>
                </div>

                {/* Bus List Overlay */}
                {activeBuses.length > 0 && (
                    <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xl max-w-xs">
                        <div className="p-4 border-b border-slate-200">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">Active Buses</h3>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                            {activeBuses.map(bus => (
                                <div key={bus.id} className="p-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                                                <Bus className="w-4 h-4 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{bus.busNumber}</p>
                                                <p className="text-xs text-slate-500">{bus.model || 'Bus'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-xs text-emerald-600 font-bold">Live</span>
                                        </div>
                                    </div>

                                    {/* Progress Metrics */}
                                    {activeTrips.find(t => t.busId === bus.id) && (
                                        <div className="mt-2 pl-10">
                                            {routeMetrics[activeTrips.find(t => t.busId === bus.id).id] ? (
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-[10px] text-slate-500">
                                                        <span>ETA: {routeMetrics[activeTrips.find(t => t.busId === bus.id).id].durationMinutes} mins</span>
                                                        <span>{routeMetrics[activeTrips.find(t => t.busId === bus.id).id].distanceKm} km</span>
                                                    </div>
                                                    <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-blue-500 transition-all duration-1000"
                                                            style={{
                                                                width: `${Math.min(100, Math.max(5, (activeTrips.find(t => t.busId === bus.id).attendanceRecords?.filter(a => a.boardedAt).length / Math.max(1, activeTrips.find(t => t.busId === bus.id).route?._count?.passengers || 1)) * 100))}%`
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-[10px] text-slate-400 italic">Calculating route...</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* No Active Buses Message */}
                {activeBuses.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm">
                        <div className="text-center p-8">
                            <Bus className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-slate-700 mb-2">No Active Buses</h3>
                            <p className="text-sm text-slate-500">Buses will appear here when trips are in progress</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
