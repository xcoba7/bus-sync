'use client';

import { useEffect, useState } from 'react';
import { GoogleMap, useLoadScript, Marker, DirectionsRenderer } from '@react-google-maps/api';

const containerStyle = {
    width: '100%',
    height: '100%',
};

const defaultCenter = {
    lat: 9.0765,
    lng: 7.3986,
};

export default function MapComponent({
    center = defaultCenter,
    zoom = 13,
    markers = [],
    showDirections = false,
    origin = null,
    destination = null,
    waypoints = [],
    onDirectionsLoaded = null, // Callback to pass distance data
}) {
    const [directions, setDirections] = useState(null);
    
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    });

    useEffect(() => {
        if (showDirections && origin && destination && window.google?.maps?.DirectionsService) {
            const directionsService = new window.google.maps.DirectionsService();

            const waypointsFormatted = waypoints.map(point => ({
                location: { lat: point.lat, lng: point.lng },
                stopover: true,
            }));

            directionsService.route(
                {
                    origin: { lat: origin.lat, lng: origin.lng },
                    destination: { lat: destination.lat, lng: destination.lng },
                    waypoints: waypointsFormatted,
                    travelMode: window.google.maps.TravelMode.DRIVING,
                },
                (result, status) => {
                    if (status === window.google.maps.DirectionsStatus.OK) {
                        setDirections(result);

                        // Calculate total distance from all legs
                        if (onDirectionsLoaded && result.routes[0]) {
                            const totalDistance = result.routes[0].legs.reduce((sum, leg) => {
                                return sum + (leg.distance?.value || 0); // distance in meters
                            }, 0);

                            // Pass distance in kilometers
                            onDirectionsLoaded({
                                distanceKm: totalDistance / 1000,
                                distanceMeters: totalDistance
                            });
                        }
                    } else {
                        console.error('Directions request failed:', status);
                    }
                }
            );
        }
    }, [showDirections, origin, destination, waypoints, onDirectionsLoaded]);

    if (loadError) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <div className="text-center p-6">
                    <p className="text-gray-600">Error loading maps</p>
                    <p className="text-sm text-gray-500 mt-2">
                        Please check your Google Maps API configuration
                    </p>
                </div>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <div className="text-center p-6">
                    <p className="text-gray-600">Loading maps...</p>
                </div>
            </div>
        );
    }

    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <div className="text-center p-6">
                    <p className="text-gray-600">Google Maps API key not configured</p>
                    <p className="text-sm text-gray-500 mt-2">
                        Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file
                    </p>
                </div>
            </div>
        );
    }

    return (
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={zoom}
            options={{
                zoomControl: true,
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: true,
            }}
        >
            {/* Render markers */}
            {markers.map((marker, index) => (
                <Marker
                    key={index}
                    position={{ lat: marker.lat, lng: marker.lng }}
                    title={marker.title}
                    label={marker.label}
                    icon={marker.icon}
                />
            ))}

            {/* Render directions */}
            {showDirections && directions && (
                <DirectionsRenderer
                    directions={directions}
                    options={{
                        suppressMarkers: true,
                        polylineOptions: {
                            strokeColor: '#3B82F6', // Blue color
                            strokeWeight: 5,
                            strokeOpacity: 0.8,
                        },
                    }}
                />
            )}
        </GoogleMap>
    );
}
