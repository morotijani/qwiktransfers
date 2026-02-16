import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const AdminProfile = () => {
    const { user, refreshProfile } = useAuth();
    const [fullName, setFullName] = useState(user?.full_name || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });

    useEffect(() => {
        if (user) {
            setFullName(user.full_name || '');
            setPhone(user.phone || '');
        }
    }, [user]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.patch('/auth/profile', { full_name: fullName, phone });
            setMsg({ type: 'success', text: 'Profile updated successfully!' });
            if (refreshProfile) await refreshProfile();
        } catch (error) {
            setMsg({ type: 'error', text: 'Failed to update profile' });
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/auth/change-password', { currentPassword, newPassword });
            setMsg({ type: 'success', text: 'Password changed successfully!' });
            setCurrentPassword('');
            setNewPassword('');
        } catch (error) {
            setMsg({ type: 'error', text: error.response?.data?.error || 'Failed to change password' });
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = async (file) => {
        if (!file) return;
        const formData = new FormData();
        formData.append('avatar', file);
        setLoading(true);
        try {
            await api.post('/auth/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMsg({ type: 'success', text: 'Avatar updated!' });
            if (refreshProfile) await refreshProfile();
        } catch (error) {
            setMsg({ type: 'error', text: 'Avatar upload failed' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '800px' }}>
            <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Admin Profile</h2>
                <p style={{ color: 'var(--text-muted)' }}>Manage your administrator account details.</p>
            </div>

            {msg.text && (
                <div style={{
                    padding: '16px',
                    borderRadius: '8px',
                    marginBottom: '24px',
                    background: msg.type === 'success' ? 'var(--accent-peach)' : 'var(--danger)',
                    color: msg.type === 'success' ? 'var(--primary)' : '#fff',
                    fontWeight: 600,
                    border: '1px solid var(--border-color)'
                }}>
                    {msg.text}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                {/* Avatar Section */}
                <section className="card" style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                    <div style={{ position: 'relative' }}>
                        <img
                            src={user?.profile_picture ? `http://localhost:5000${user.profile_picture}` : 'https://via.placeholder.com/100'}
                            alt="Profile"
                            style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--accent-peach)' }}
                        />
                        <input
                            type="file"
                            onChange={(e) => handleAvatarUpload(e.target.files[0])}
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                        />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>Profile Picture</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>Click the image to upload a new one.</p>
                    </div>
                </section>

                {/* Personal Info */}
                <section className="card">
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '24px' }}>Personal Information</h3>
                    <form onSubmit={handleUpdateProfile}>
                        <div className="form-group">
                            <label>Email Address (Immutable)</label>
                            <input type="text" value={user?.email || ''} readOnly style={{ background: 'var(--accent-peach)', cursor: 'not-allowed', opacity: 0.8 }} />
                        </div>
                        <div className="form-group">
                            <label>Full Name</label>
                            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full Name" />
                        </div>
                        <div className="form-group" style={{ marginBottom: '32px' }}>
                            <label>Phone Number</label>
                            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+233..." />
                        </div>
                        <button type="submit" className="btn-primary" disabled={loading} style={{ width: 'auto', padding: '12px 32px' }}>
                            {loading ? 'Saving...' : 'Update Profile'}
                        </button>
                    </form>
                </section>

                {/* Security */}
                <section className="card">
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '24px' }}>Security</h3>
                    <form onSubmit={handleChangePassword}>
                        <div className="form-group">
                            <label>Current Password</label>
                            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" required />
                        </div>
                        <div className="form-group" style={{ marginBottom: '32px' }}>
                            <label>New Password</label>
                            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" required />
                        </div>
                        <button type="submit" className="btn-primary" disabled={loading} style={{ width: 'auto', padding: '12px 32px' }}>
                            {loading ? 'Updating...' : 'Change Password'}
                        </button>
                    </form>
                </section>
            </div>
        </div>
    );
};

export default AdminProfile;
