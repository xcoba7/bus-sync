'use client';

import { useState } from 'react';
import {
    Building2,
    Edit,
    Trash2,
    X,
    Save,
    Loader2,
    CheckCircle,
    AlertCircle
} from 'lucide-react';
import { useDashboard } from '../DashboardContext';

export default function OrganizationsPage() {
    const { organizations, fetchOrganizations, fetchStats } = useDashboard();
    const [editingOrg, setEditingOrg] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [formData, setFormData] = useState({});

    const handleEdit = async (org) => {
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await fetch(`/api/super-admin/organizations/${org.id}`);
            if (res.ok) {
                const data = await res.json();
                setFormData({
                    name: data.organization.name || '',
                    type: data.organization.type || 'OTHER',
                    email: data.organization.email || '',
                    phone: data.organization.phone || '',
                    address: data.organization.address || '',
                    subscriptionPlan: data.organization.subscriptionPlan || 'FREE',
                    subscriptionStatus: data.organization.subscriptionStatus || 'TRIAL',
                    maxBuses: data.organization.maxBuses || 5,
                    maxStudents: data.organization.maxStudents || 100,
                    maxDrivers: data.organization.maxDrivers || 10,
                    maxAdmins: data.organization.maxAdmins || 2,
                    hasSmsNotifications: data.organization.hasSmsNotifications || false,
                    hasAdvancedAnalytics: data.organization.hasAdvancedAnalytics || false,
                    hasWhiteLabel: data.organization.hasWhiteLabel || false,
                    hasApiAccess: data.organization.hasApiAccess || false,
                    isActive: data.organization.isActive ?? true
                });
                setEditingOrg(data.organization);
            } else {
                setMessage({ type: 'error', text: 'Failed to load organization details' });
            }
        } catch (error) {
            console.error('Error loading organization:', error);
            setMessage({ type: 'error', text: 'An error occurred' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name?.trim()) {
            setMessage({ type: 'error', text: 'Organization name is required' });
            return;
        }

        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await fetch(`/api/super-admin/organizations/${editingOrg.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    organizationType: formData.type,
                    email: formData.email,
                    phone: formData.phone,
                    address: formData.address,
                    subscriptionPlan: formData.subscriptionPlan,
                    subscriptionStatus: formData.subscriptionStatus,
                    maxBuses: parseInt(formData.maxBuses),
                    maxStudents: parseInt(formData.maxStudents),
                    maxDrivers: parseInt(formData.maxDrivers),
                    maxAdmins: parseInt(formData.maxAdmins),
                    hasSmsNotifications: formData.hasSmsNotifications,
                    hasAdvancedAnalytics: formData.hasAdvancedAnalytics,
                    hasWhiteLabel: formData.hasWhiteLabel,
                    hasApiAccess: formData.hasApiAccess,
                    isActive: formData.isActive
                })
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Organization updated successfully!' });
                await fetchOrganizations();
                await fetchStats();
                setTimeout(() => {
                    setEditingOrg(null);
                    setMessage({ type: '', text: '' });
                }, 1500);
            } else {
                const data = await res.json();
                setMessage({ type: 'error', text: data.error || 'Failed to update organization' });
            }
        } catch (error) {
            console.error('Error updating organization:', error);
            setMessage({ type: 'error', text: 'An error occurred while updating' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure? This will delete the organization and all its data.')) return;

        try {
            const res = await fetch(`/api/super-admin/organizations/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setMessage({ type: 'success', text: 'Organization deleted successfully' });
                await fetchOrganizations();
                await fetchStats();
                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            } else {
                setMessage({ type: 'error', text: 'Failed to delete organization' });
            }
        } catch (error) {
            console.error('Error deleting organization:', error);
            setMessage({ type: 'error', text: 'An error occurred' });
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl  text-black">Organizations</h2>
                    <p className="text-[10px] text-black  uppercase tracking-widest mt-1">Organization Management</p>
                </div>
            </div>

            {/* Message Alert */}
            {message.text && (
                <div className={`p-4 rounded-2xl border flex items-center gap-3 ${message.type === 'success'
                        ? 'bg-green-50 border-green-200 text-green-800'
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}>
                    {message.type === 'success' ? (
                        <CheckCircle className="w-5 h-5" />
                    ) : (
                        <AlertCircle className="w-5 h-5" />
                    )}
                    <p className="">{message.text}</p>
                </div>
            )}

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100 overflow-hidden">
                <table className="w-full text-left truncate">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-8 py-5 text-[10px]  text-black uppercase tracking-widest">Name</th>
                            <th className="px-8 py-5 text-[10px]  text-black uppercase tracking-widest">Plan</th>
                            <th className="px-8 py-5 text-[10px]  text-black uppercase tracking-widest">Type</th>
                            <th className="px-8 py-5 text-[10px]  text-black uppercase tracking-widest">Users</th>
                            <th className="px-8 py-5 text-[10px]  text-black uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {organizations.map(org => (
                            <tr key={org.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-8 py-6 text-black  tracking-tight">{org.name}</td>
                                <td className="px-8 py-6">
                                    <span className={`px-3 py-1 rounded-full text-[10px]  uppercase tracking-tighter ${org.subscriptionPlan === 'ENTERPRISE' ? 'bg-indigo-100 text-indigo-700' :
                                            org.subscriptionPlan === 'PROFESSIONAL' ? 'bg-blue-100 text-blue-700' :
                                                org.subscriptionPlan === 'BASIC' ? 'bg-green-100 text-green-700' :
                                                    'bg-slate-100 text-slate-500'
                                        }`}>
                                        {org.subscriptionPlan || 'FREE'}
                                    </span>
                                </td>
                                <td className="px-8 py-6">
                                    <span className="text-[10px]  uppercase text-black tracking-widest">{org.type}</span>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-2">
                                        <span className="text-black ">{org._count?.users || 0}</span>
                                        <span className="text-[9px] text-black  uppercase">Members</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleEdit(org)}
                                            className="p-3 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all flex items-center gap-2"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(org.id)}
                                            className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all flex items-center gap-2"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            {editingOrg && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl  text-black">Edit Organization</h3>
                                <p className="text-sm text-slate-500 mt-1">Update organization details and settings</p>
                            </div>
                            <button
                                onClick={() => {
                                    setEditingOrg(null);
                                    setMessage({ type: '', text: '' });
                                }}
                                className="p-2 text-black hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                                disabled={saving}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body - Scrollable */}
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] custom-scrollbar">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Basic Information */}
                                    <div>
                                        <h4 className="text-sm  text-slate-600 uppercase tracking-wider mb-4">Basic Information</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2">
                                                <label className="block text-sm  text-black mb-2">Organization Name *</label>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={formData.name || ''}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-black focus:outline-none "
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm  text-black mb-2">Type</label>
                                                <select
                                                    name="type"
                                                    value={formData.type || 'OTHER'}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-black focus:outline-none "
                                                >
                                                    <option value="SCHOOL">School</option>
                                                    <option value="CHURCH">Church</option>
                                                    <option value="COMPANY">Company</option>
                                                    <option value="CAMP">Camp</option>
                                                    <option value="UNIVERSITY">University</option>
                                                    <option value="HOTEL">Hotel</option>
                                                    <option value="TRANSPORTATION_SERVICE">Transportation Service</option>
                                                    <option value="OTHER">Other</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm  text-black mb-2">Email</label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={formData.email || ''}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-black focus:outline-none "
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm  text-black mb-2">Phone</label>
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    value={formData.phone || ''}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-black focus:outline-none "
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-sm  text-black mb-2">Address</label>
                                                <input
                                                    type="text"
                                                    name="address"
                                                    value={formData.address || ''}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-black focus:outline-none "
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Subscription Details */}
                                    <div className="pt-6 border-t border-slate-200">
                                        <h4 className="text-sm  text-slate-600 uppercase tracking-wider mb-4">Subscription</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm  text-black mb-2">Plan</label>
                                                <select
                                                    name="subscriptionPlan"
                                                    value={formData.subscriptionPlan || 'FREE'}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-black focus:outline-none "
                                                >
                                                    <option value="FREE">Free</option>
                                                    <option value="BASIC">Basic</option>
                                                    <option value="PROFESSIONAL">Professional</option>
                                                    <option value="ENTERPRISE">Enterprise</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm  text-black mb-2">Status</label>
                                                <select
                                                    name="subscriptionStatus"
                                                    value={formData.subscriptionStatus || 'TRIAL'}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-black focus:outline-none "
                                                >
                                                    <option value="TRIAL">Trial</option>
                                                    <option value="ACTIVE">Active</option>
                                                    <option value="SUSPENDED">Suspended</option>
                                                    <option value="CANCELLED">Cancelled</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Plan Limits */}
                                    <div className="pt-6 border-t border-slate-200">
                                        <h4 className="text-sm  text-slate-600 uppercase tracking-wider mb-4">Plan Limits</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm  text-black mb-2">Max Buses</label>
                                                <input
                                                    type="number"
                                                    name="maxBuses"
                                                    value={formData.maxBuses || 5}
                                                    onChange={handleChange}
                                                    min="1"
                                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-black focus:outline-none "
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm  text-black mb-2">Max Students</label>
                                                <input
                                                    type="number"
                                                    name="maxStudents"
                                                    value={formData.maxStudents || 100}
                                                    onChange={handleChange}
                                                    min="1"
                                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-black focus:outline-none "
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm  text-black mb-2">Max Drivers</label>
                                                <input
                                                    type="number"
                                                    name="maxDrivers"
                                                    value={formData.maxDrivers || 10}
                                                    onChange={handleChange}
                                                    min="1"
                                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-black focus:outline-none "
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm  text-black mb-2">Max Admins</label>
                                                <input
                                                    type="number"
                                                    name="maxAdmins"
                                                    value={formData.maxAdmins || 2}
                                                    onChange={handleChange}
                                                    min="1"
                                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-black focus:outline-none "
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Feature Flags */}
                                    <div className="pt-6 border-t border-slate-200">
                                        <h4 className="text-sm  text-slate-600 uppercase tracking-wider mb-4">Features</h4>
                                        <div className="space-y-3">
                                            <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    name="hasSmsNotifications"
                                                    checked={formData.hasSmsNotifications || false}
                                                    onChange={handleChange}
                                                    className="w-5 h-5 rounded border-slate-300"
                                                />
                                                <span className=" text-black">SMS Notifications</span>
                                            </label>
                                            <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    name="hasAdvancedAnalytics"
                                                    checked={formData.hasAdvancedAnalytics || false}
                                                    onChange={handleChange}
                                                    className="w-5 h-5 rounded border-slate-300"
                                                />
                                                <span className=" text-black">Advanced Analytics</span>
                                            </label>
                                            <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    name="hasWhiteLabel"
                                                    checked={formData.hasWhiteLabel || false}
                                                    onChange={handleChange}
                                                    className="w-5 h-5 rounded border-slate-300"
                                                />
                                                <span className=" text-black">White Label</span>
                                            </label>
                                            <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    name="hasApiAccess"
                                                    checked={formData.hasApiAccess || false}
                                                    onChange={handleChange}
                                                    className="w-5 h-5 rounded border-slate-300"
                                                />
                                                <span className=" text-black">API Access</span>
                                            </label>
                                            <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    name="isActive"
                                                    checked={formData.isActive ?? true}
                                                    onChange={handleChange}
                                                    className="w-5 h-5 rounded border-slate-300"
                                                />
                                                <span className=" text-black">Organization Active</span>
                                            </label>
                                        </div>
                                    </div>
                                    
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-slate-200 flex items-center justify-between bg-slate-50">
                            {message.text && (
                                <div className={`flex items-center gap-2 text-sm  ${message.type === 'success' ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                    {message.type === 'success' ? (
                                        <CheckCircle className="w-4 h-4" />
                                    ) : (
                                        <AlertCircle className="w-4 h-4" />
                                    )}
                                    {message.text}
                                </div>
                            )}
                            <div className="flex gap-3 ml-auto">
                                <button
                                    onClick={() => {
                                        setEditingOrg(null);
                                        setMessage({ type: '', text: '' });
                                    }}
                                    disabled={saving}
                                    className="px-6 py-3 border border-slate-200 text-black rounded-xl hover:border-slate-400 hover:bg-white transition-all  disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving || !formData.name?.trim()}
                                    className="px-6 py-3 bg-black text-white rounded-xl hover:bg-slate-700 transition-all  disabled:opacity-50 flex items-center gap-2"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
