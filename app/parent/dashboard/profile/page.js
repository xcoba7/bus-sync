'use client';

import { useParentDashboard } from '../ParentDashboardContext';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { User, Mail, Phone, Lock, Save, X, Edit, Camera, CheckCircle, AlertCircle } from 'lucide-react';

export default function ParentProfile() {
    const { profile, setProfile } = useParentDashboard();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        if (profile) {
            setFormData(prev => ({
                ...prev,
                name: profile.name,
                email: profile.email,
                phone: profile.phone || ''
            }));
        }
    }, [profile]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate password fields
        if (formData.newPassword) {
            if (!formData.currentPassword) {
                setMessage({ type: 'error', text: 'Current password is required to set a new password' });
                return;
            }
            if (formData.newPassword !== formData.confirmPassword) {
                setMessage({ type: 'error', text: 'New passwords do not match' });
                return;
            }
            if (formData.newPassword.length < 6) {
                setMessage({ type: 'error', text: 'New password must be at least 6 characters' });
                return;
            }
        }

        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const updateData = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone
            };

            if (formData.newPassword) {
                updateData.currentPassword = formData.currentPassword;
                updateData.newPassword = formData.newPassword;
            }

            const response = await fetch('/api/parent/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });

            const data = await response.json();

            if (response.ok) {
                setProfile(data.profile);
                setFormData({
                    ...formData,
                    name: data.profile.name,
                    email: data.profile.email,
                    phone: data.profile.phone || '',
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                setEditing(false);
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to update profile' });
            }
        } catch (error) {
            console.error('Failed to update profile:', error);
            setMessage({ type: 'error', text: 'An error occurred while updating profile' });
        } finally {
            setSaving(false);
        }
    };
    const handleCancel = () => {
        if (profile) {
            setFormData({
                name: profile.name,
                email: profile.email,
                phone: profile.phone || '',
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        }
        setEditing(false);
        setMessage({ type: '', text: '' });
    };

    if (loading) return null;

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl  text-black tracking-tight">Account Settings</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage your personal information and security preferences</p>
                </div>
                {!editing && (
                    <button
                        onClick={() => setEditing(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-all  "
                    >
                        <Edit className="w-4 h-4" />
                        Edit Profile
                    </button>
                )}
            </div>

            {/* Message Alert */}
            {message.text && (
                <div className={`mb-6 p-4 rounded-2xl flex items-start gap-3 animation-in fade-in slide-in-from-top-2 ${message.type === 'success'
                    ? 'bg-green-50 text-green-800'
                    : 'bg-red-50 text-red-800'
                    }`}>
                    {message.type === 'success' ? (
                        <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    ) : (
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    )}
                    <p className="font-medium text-sm">{message.text}</p>
                </div>
            )}

            <div className="grid md:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="md:col-span-1">
                    <div className="bg-white rounded-3xl p-6 border border-slate-200  sticky top-28">
                        <div className="flex flex-col items-center text-center">
                            <div className="relative mb-4">
                                <div className="w-28 h-28 bg-gray-50 rounded-full flex items-center justify-center text-black border-4 border-white ">
                                    {profile?.profileImage ? (
                                        <img src={profile.profileImage} alt="Profile" className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        <span className="text-3xl ">{profile?.name?.charAt(0)}</span>
                                    )}
                                </div>
                                {editing && (
                                    <button className="absolute bottom-0 right-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors shadow-md">
                                        <Camera className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <h2 className="text-lg  text-black">{profile?.name}</h2>
                            <p className="text-sm text-gray-500 mb-6">{profile?.email}</p>

                            <div className="w-full space-y-3 pt-6 border-t border-slate-200 text-left">
                                <div>
                                    <p className="text-xs  text-gray-400 uppercase tracking-widest">Type</p>
                                    <p className="text-sm font-semibold text-black mt-0.5">Parent Account</p>
                                </div>
                                <div>
                                    <p className="text-xs  text-gray-400 uppercase tracking-widest">Joined</p>
                                    <p className="text-sm font-semibold text-black mt-0.5">
                                        {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString(undefined, {
                                            year: 'numeric',
                                            month: 'long'
                                        }) : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Edit Form */}
                <div className="md:col-span-2 space-y-6">
                    <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 border border-slate-200 min-h-full  space-y-8">
                        {/* Personal Details */}
                        <div>
                            <h3 className="text-sm  text-black border-b border-slate-200 pb-4 mb-6">Personal Details</h3>
                            <div className="space-y-5">
                                <div className="grid md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs  text-gray-500 uppercase tracking-wider mb-2">Full Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            disabled={!editing}
                                            placeholder={profile?.name || 'Enter your full name'}
                                            className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-black focus:ring-0 transition-all text-sm text-black disabled:cursor-not-allowed"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs  text-gray-500 uppercase tracking-wider mb-2">Phone</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            disabled={!editing}
                                            className="text-black w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-black focus:ring-0 transition-all text-sm disabled:cursor-not-allowed"
                                            placeholder="+1 (555) 000-0000"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs  text-gray-500 uppercase tracking-wider mb-2">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            disabled={!editing}
                                            className="text-black w-full pl-10 pr-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-black focus:ring-0 transition-all text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Security */}
                        {editing && (
                            <div>
                                <h3 className="text-sm  text-black border-b border-slate-200 pb-4 mb-6 pt-2">Security</h3>
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-xs  text-gray-500 uppercase tracking-wider mb-2">Current Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="password"
                                                name="currentPassword"
                                                value={formData.currentPassword}
                                                onChange={handleChange}
                                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-black focus:ring-0 transition-all text-sm font-medium"
                                                placeholder="Enter to change password"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-xs  text-gray-500 uppercase tracking-wider mb-2">New Password</label>
                                            <input
                                                type="password"
                                                name="newPassword"
                                                value={formData.newPassword}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-black focus:ring-0 transition-all text-sm font-medium"
                                                placeholder="Min. 6 characters"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs  text-gray-500 uppercase tracking-wider mb-2">Confirm Password</label>
                                            <input
                                                type="password"
                                                name="confirmPassword"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-black focus:ring-0 transition-all text-sm font-medium"
                                                placeholder="Repeat new password"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        {editing && (
                            <div className="flex gap-4 pt-4 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    disabled={saving}
                                    className="px-6 py-3 border border-slate-200 text-gray-600 text-sm  rounded-xl hover:border-slate-500  transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 px-6 py-3 bg-black text-white text-sm  rounded-xl hover:bg-gray-800 transition-all   disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                    {saving ? 'Saving Changes...' : 'Save Changes'}
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}
