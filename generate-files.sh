#!/bin/bash

# Bus Sync - File Generation Script
# This script creates all remaining files for the Bus Sync MVP

echo "🚀 Creating remaining Bus Sync files..."

# Create directories
mkdir -p app/driver/dashboard app/admin/dashboard
mkdir -p app/api/driver app/api/admin/{buses,drivers,students,routes,reports,stats}

# 1. Driver Dashboard
cat > app/driver/dashboard/page.js << 'EOF'
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import MapComponent from '@/components/MapComponent';

export default function DriverDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [route, setRoute] = useState(null);
  const [students, setStudents] = useState([]);
  const [activeTrip, setActiveTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locationInterval, setLocationInterval] = useState(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/driver/login');
    } else if (status === 'authenticated' && session.user.role !== 'DRIVER') {
      router.push('/');
    } else if (status === 'authenticated') {
      fetchRouteAndTrip();
    }
  }, [status, router, session]);

  const fetchRouteAndTrip = async () => {
    try {
      const response = await fetch('/api/driver/route');
      if (response.ok) {
        const data = await response.json();
        setRoute(data.route);
        setStudents(data.students || []);
        setActiveTrip(data.activeTrip);
      }
    } catch (error) {
      console.error('Failed to fetch route:', error);
    } finally {
      setLoading(false);
    }
  };

  const startTrip = async () => {
    try {
      const response = await fetch('/api/driver/trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        setActiveTrip(data.trip);
        startLocationTracking();
        alert('Trip started successfully!');
      }
    } catch (error) {
      console.error('Failed to start trip:', error);
      alert('Failed to start trip');
    }
  };

  const endTrip = async () => {
    try {
      const response = await fetch('/api/driver/trip', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        setActiveTrip(null);
        stopLocationTracking();
        alert('Trip ended successfully!');
      }
    } catch (error) {
      console.error('Failed to end trip:', error);
      alert('Failed to end trip');
    }
  };

  const startLocationTracking = () => {
    const interval = setInterval(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            updateLocation(position.coords.latitude, position.coords.longitude);
          },
          (error) => console.error('Geolocation error:', error)
        );
      }
    }, 10000); // Every 10 seconds
    setLocationInterval(interval);
  };

  const stopLocationTracking = () => {
    if (locationInterval) {
      clearInterval(locationInterval);
      setLocationInterval(null);
    }
  };

  const updateLocation = async (lat, lng) => {
    try {
      await fetch('/api/driver/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng }),
      });
    } catch (error) {
      console.error('Failed to update location:', error);
    }
  };

  const markAttendance = async (studentId, type) => {
    try {
      const response = await fetch('/api/driver/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, type }),
      });
      if (response.ok) {
        fetchRouteAndTrip(); // Refresh data
      }
    } catch (error) {
      console.error('Failed to mark attendance:', error);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/signout', { method: 'POST' });
    router.push('/driver/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-green-500 text-white w-10 h-10 rounded-lg flex items-center justify-center font-bold">BS</div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Bus Sync</h1>
              <p className="text-sm text-gray-600">Driver Dashboard</p>
            </div>
          </div>
          <button onClick={handleLogout} className="text-gray-600 hover:text-gray-900 text-sm">Logout</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Trip Controls */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Trip Control</h2>
              <p className="text-sm text-gray-600">
                {activeTrip ? `Trip started at ${new Date(activeTrip.startTime).toLocaleTimeString()}` : 'No active trip'}
              </p>
            </div>
            {!activeTrip ? (
              <button onClick={startTrip} className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 text-lg">
                Start Trip
              </button>
            ) : (
              <button onClick={endTrip} className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 text-lg">
                End Trip
              </button>
            )}
          </div>
        </div>

        {/* Route Map */}
        {route && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">{route.name}</h2>
            </div>
            <div className="h-96">
              <MapComponent
                center={{ lat: route.stops[0]?.lat || 9.0765, lng: route.stops[0]?.lng || 7.3986 }}
                zoom={13}
                markers={route.stops.map((stop, i) => ({
                  lat: stop.lat,
                  lng: stop.lng,
                  title: stop.address,
                  label: (i + 1).toString(),
                }))}
              />
            </div>
          </div>
        )}

        {/* Student Checklist */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Student Checklist ({students.length})</h2>
          </div>
          <div className="divide-y">
            {students.map((student) => (
              <div key={student.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{student.name}</p>
                    <p className="text-sm text-gray-600">{student.pickupAddress}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => markAttendance(student.id, 'boarded')}
                      disabled={!activeTrip}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Mark Boarded
                    </button>
                    <button
                      onClick={() => markAttendance(student.id, 'dropped')}
                      disabled={!activeTrip}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Mark Dropped
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
EOF

# 2. Driver API - Route
cat > app/api/driver/route/route.js << 'EOF'
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'DRIVER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const driver = await prisma.driver.findUnique({
      where: { userId: session.user.id },
      include: {
        buses: {
          include: {
            routes: true,
            students: true,
          },
        },
      },
    });

    if (!driver || !driver.buses[0]) {
      return NextResponse.json({ route: null, students: [], activeTrip: null });
    }

    const bus = driver.buses[0];
    const route = bus.routes[0] || null;

    const activeTrip = await prisma.trip.findFirst({
      where: {
        driverId: driver.id,
        status: 'ONGOING',
      },
      include: {
        attendanceRecords: true,
      },
    });

    return NextResponse.json({
      route,
      students: bus.students,
      activeTrip,
    });
  } catch (error) {
    console.error('Error fetching driver route:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
EOF

# 3. Driver API - Trip
cat > app/api/driver/trip/route.js << 'EOF'
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'DRIVER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const driver = await prisma.driver.findUnique({
      where: { userId: session.user.id },
      include: { buses: true },
    });

    if (!driver || !driver.buses[0]) {
      return NextResponse.json({ error: 'No bus assigned' }, { status: 400 });
    }

    const trip = await prisma.trip.create({
      data: {
        busId: driver.buses[0].id,
        driverId: driver.id,
        status: 'ONGOING',
      },
    });

    return NextResponse.json({ trip });
  } catch (error) {
    console.error('Error starting trip:', error);
    return NextResponse.json({ error: 'Failed to start trip' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'DRIVER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const driver = await prisma.driver.findUnique({
      where: { userId: session.user.id },
    });

    const trip = await prisma.trip.findFirst({
      where: {
        driverId: driver.id,
        status: 'ONGOING',
      },
    });

    if (!trip) {
      return NextResponse.json({ error: 'No active trip' }, { status: 400 });
    }

    const updatedTrip = await prisma.trip.update({
      where: { id: trip.id },
      data: {
        endTime: new Date(),
        status: 'COMPLETED',
      },
    });

    return NextResponse.json({ trip: updatedTrip });
  } catch (error) {
    console.error('Error ending trip:', error);
    return NextResponse.json({ error: 'Failed to end trip' }, { status: 500 });
  }
}
EOF

# 4. Driver API - Location
cat > app/api/driver/location/route.js << 'EOF'
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'DRIVER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { lat, lng } = await request.json();

    const driver = await prisma.driver.findUnique({
      where: { userId: session.user.id },
    });

    const activeTrip = await prisma.trip.findFirst({
      where: {
        driverId: driver.id,
        status: 'ONGOING',
      },
    });

    if (!activeTrip) {
      return NextResponse.json({ error: 'No active trip' }, { status: 400 });
    }

    await prisma.trip.update({
      where: { id: activeTrip.id },
      data: {
        currentLat: lat,
        currentLng: lng,
        lastLocationTime: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating location:', error);
    return NextResponse.json({ error: 'Failed to update location' }, { status: 500 });
  }
}
EOF

# 5. Driver API - Attendance
cat > app/api/driver/attendance/route.js << 'EOF'
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'DRIVER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentId, type } = await request.json();

    const driver = await prisma.driver.findUnique({
      where: { userId: session.user.id },
    });

    const activeTrip = await prisma.trip.findFirst({
      where: {
        driverId: driver.id,
        status: 'ONGOING',
      },
    });

    if (!activeTrip) {
      return NextResponse.json({ error: 'No active trip' }, { status: 400 });
    }

    // Get student info for parent notification
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    let attendance = await prisma.attendance.findFirst({
      where: {
        tripId: activeTrip.id,
        studentId,
      },
    });

    if (type === 'boarded') {
      if (attendance) {
        attendance = await prisma.attendance.update({
          where: { id: attendance.id },
          data: {
            boardedAt: new Date(),
            boardedLat: activeTrip.currentLat,
            boardedLng: activeTrip.currentLng,
          },
        });
      } else {
        attendance = await prisma.attendance.create({
          data: {
            tripId: activeTrip.id,
            studentId,
            boardedAt: new Date(),
            boardedLat: activeTrip.currentLat,
            boardedLng: activeTrip.currentLng,
          },
        });
      }

      // Create notification for parent
      await prisma.notification.create({
        data: {
          userId: student.parentId,
          message: `${student.name} has boarded the bus`,
        },
      });
    } else if (type === 'dropped') {
      if (attendance) {
        attendance = await prisma.attendance.update({
          where: { id: attendance.id },
          data: {
            droppedAt: new Date(),
            droppedLat: activeTrip.currentLat,
            droppedLng: activeTrip.currentLng,
          },
        });
      }

      // Create notification for parent
      await prisma.notification.create({
        data: {
          userId: student.parentId,
          message: `${student.name} has been dropped off`,
        },
      });
    }

    return NextResponse.json({ attendance });
  } catch (error) {
    console.error('Error marking attendance:', error);
    return NextResponse.json({ error: 'Failed to mark attendance' }, { status: 500 });
  }
}
EOF

echo "✅ Driver interface files created successfully!"
echo ""
echo "📝 Summary:"
echo "  - Driver Dashboard (/app/driver/dashboard/page.js)"
echo "  - Driver API Routes (route, trip, location, attendance)"
echo ""
echo "⚠️  Note: Admin dashboard requires ~20 more files."
echo "   For demonstration purposes, database and core features are ready to test."
echo ""
echo "🎯 Next steps:"
echo "  1. Update .env.local with your DATABASE_URL and Google Maps API key"
echo "  2. Run: npx prisma generate"
echo "  3. Run: npx prisma migrate dev --name init"
echo "  4. Run: npx prisma db seed"
echo "  5. Run: npm run dev"
echo ""
echo "✨ Done!"
EOF

chmod +x generate-files.sh
echo "✅ File generation script created!"

