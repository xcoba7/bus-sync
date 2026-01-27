'use client';

import { useState, useEffect } from 'react';
import { useDriver } from '../DriverContext';
import { User, Phone, Mail, CreditCard, Calendar, AlertCircle, Camera, Save, Lock } from 'lucide-react';

export default function DriverProfile() {
    const { driverProfile, setDriverProfile, session } = useDriver();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    // Form states
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [licenseNumber, setLicenseNumber] = useState('');
    const [licenseExpiry, setLicenseExpiry] = useState('');
    const [emergencyContact, setEmergencyContact] = useState('');
    const [profileImage, setProfileImage] = useState('');
    const [imagePreview, setImagePreview] = useState('');

    // Password change states
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);

    useEffect(() => {
        if (driverProfile) {
            setName(driverProfile.name || '');
            setPhone(driverProfile.phone || '');
            setLicenseNumber(driverProfile.licenseNumber || '');
            setLicenseExpiry(driverProfile.licenseExpiry ? new Date(driverProfile.licenseExpiry).toISOString().split('T')[0] : '');
            setEmergencyContact(driverProfile.emergencyContact || '');
            setProfileImage(driverProfile.profileImage || '');
            setImagePreview(driverProfile.profileImage || '');
        }
    }, [driverProfile]);
    
    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('Image size must be less than 5MB');
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select a valid image file');
            return;
        }

        // Preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);

        // Upload
        const formData = new FormData();
        formData.append('profileImage', file);

        try {
            setLoading(true);
            const response = await fetch('/api/driver/profile/picture', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setProfileImage(data.imageUrl);
                setSuccess('Profile picture updated successfully');
                setTimeout(() => setSuccess(''), 3000);
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to upload image');
            }
        } catch (err) {
            setError('Failed to upload image');
        } finally {
            setLoading(false);
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch('/api/driver/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    phone,
                    licenseNumber,
                    licenseExpiry,
                    emergencyContact
                })
            });

            if (response.ok) {
                const data = await response.json();
                setDriverProfile(data.profile);
                setSuccess('Profile updated successfully');
                setTimeout(() => setSuccess(''), 3000);
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to update profile');
            }
        } catch (err) {
            setError('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPasswordLoading(true);
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            setPasswordLoading(false);
            return;
        }

        if (newPassword.length < 6) {
            setError('New password must be at least 6 characters');
            setPasswordLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/driver/profile/password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });

            if (response.ok) {
                setSuccess('Password changed successfully');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setTimeout(() => setSuccess(''), 3000);
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to change password');
            }
        } catch (err) {
            setError('Failed to change password');
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Success/Error Messages */}
            {success && (
                <div className="bg-black/20 border border-black text-black p-4 rounded-2xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5" />
                    <span>{success}</span>
                </div>
            )}
            {error && (
                <div className="bg-red-500/20 border border-red-500 text-red-500 p-4 rounded-2xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5" />
                    <span>{error}</span>
                </div>
            )}

            {/* Profile Picture */}
            <div className=" rounded-[2.5rem] p-8 border border-slate-200">
                <h2 className="text-xl  mb-6 flex items-center gap-3">
                    Profile Picture
                </h2>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="w-32 h-32 rounded-full bg-slate-700 overflow-hidden relative group">
                        {imagePreview ? (
                            <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl  text-slate-500">
                                {session?.user?.name?.charAt(0) || 'D'}
                            </div>
                        )}
                        <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                            />
                        </label>
                    </div>
                    <div className="flex-1">
                        <p className="text-sm  mb-2">Click on the image to change your profile picture</p>
                        <p className="text-xs text-slate-500">Maximum file size: 5MB. Accepted formats: JPG, PNG, GIF</p>
                    </div>
                </div>
            </div>

            {/* Personal Information */}
            <form onSubmit={handleProfileUpdate} className="rounded-[2.5rem] p-8">
                <h2 className="text-xl  mb-6 flex items-center gap-3">
                    Personal Information
                </h2>
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm  text-black mb-2 uppercase tracking-wider">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full border-slate-200 border rounded-xl px-12 py-3  placeholder-slate-500 focus:outline-none focus:border-black transition-colors"
                                placeholder="Enter your full name"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm   mb-2 uppercase tracking-wider">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                type="email"
                                value={session?.user?.email || ''}
                                className="w-full border-slate-200 border rounded-xl px-12 py-3 text-slate-500 cursor-not-allowed"
                                disabled
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Email cannot be changed</p>
                    </div>

                    <div>
                        <label className="block text-sm   mb-2 uppercase tracking-wider">Phone Number</label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full border-slate-200 border rounded-xl px-12 py-3  placeholder-slate-500 focus:outline-none focus:border-black transition-colors"
                                placeholder="Enter your phone number"
                            />
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm   mb-2 uppercase tracking-wider">License Number</label>
                            <div className="relative">
                                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="text"
                                    value={licenseNumber}
                                    onChange={(e) => setLicenseNumber(e.target.value)}
                                    className="w-full border border-slate-200 rounded-xl px-12 py-3  placeholder-slate-500 focus:outline-none focus:border-black transition-colors"
                                    placeholder="License number"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm   mb-2 uppercase tracking-wider">License Expiry</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="date"
                                    value={licenseExpiry}
                                    onChange={(e) => setLicenseExpiry(e.target.value)}
                                    className="w-full border border-slate-200 rounded-xl px-12 py-3  placeholder-slate-500 focus:outline-none focus:border-black transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm   mb-2 uppercase tracking-wider">Emergency Contact</label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                type="tel"
                                value={emergencyContact}
                                onChange={(e) => setEmergencyContact(e.target.value)}
                                className="w-full border border-slate-200 rounded-xl px-12 py-3  placeholder-slate-500 focus:outline-none focus:border-black transition-colors"
                                placeholder="Emergency contact number"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full border border-slate-200 hover:border-slate-400   py-4 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>

            {/* Password Change */}
            <form onSubmit={handlePasswordChange} className="rounded-[2.5rem] p-8 border border-slate-200">
                <h2 className="text-xl  mb-6 flex items-center gap-3">
                    Change Password
                </h2>
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm   mb-2 uppercase tracking-wider">Current Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full border border-slate-200 rounded-xl px-12 py-3  placeholder-slate-500 focus:outline-none focus:border-black transition-colors"
                                placeholder="Enter current password"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm   mb-2 uppercase tracking-wider">New Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full border border-slate-200 rounded-xl px-12 py-3  placeholder-slate-500 focus:outline-none focus:border-black transition-colors"
                                placeholder="Enter new password"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm   mb-2 uppercase tracking-wider">Confirm New Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full border border-slate-200 rounded-xl px-12 py-3  placeholder-slate-500 focus:outline-none focus:border-black transition-colors"
                                placeholder="Confirm new password"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={passwordLoading}
                        className="w-full border border-slate-200 hover:border-slate-400 py-4 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {passwordLoading ? 'Changing...' : 'Change Password'}
                    </button>
                </div>
            </form>
        </div>
    );
}
