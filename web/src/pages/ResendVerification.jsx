import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const ResendVerification = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        setErrorMsg('');
        try {
            await api.post('/auth/resend-verification', { email });
            setStatus('success');
        } catch (error) {
            setStatus('error');
            setErrorMsg(error.response?.data?.error || 'Failed to resend verification link');
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px' }}>
            <div className="card" style={{ maxWidth: '440px', width: '90%', textAlign: 'center' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Resend Verification</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Enter your email address to receive a new verification link.</p>

                {status === 'success' ? (
                    <div style={{ background: '#f6fff6', border: '1px solid #c3e6cb', color: '#155724', padding: '20px', borderRadius: '8px', marginBottom: '24px' }}>
                        <p style={{ margin: 0, fontWeight: 600 }}>Success!</p>
                        <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem' }}>A new verification link has been sent to your email. Please check your inbox (and spam folder).</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
                        {status === 'error' && (
                            <p style={{ color: 'var(--danger)', marginBottom: '16px', fontWeight: 600 }}>{errorMsg}</p>
                        )}
                        <div className="form-group" style={{ marginBottom: '32px' }}>
                            <label>Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="email@example.com"
                                required
                            />
                        </div>
                        <button type="submit" className="btn-primary" disabled={status === 'loading'}>
                            {status === 'loading' ? 'Sending...' : 'Send Verification Link'}
                        </button>
                    </form>
                )}

                <p style={{ marginTop: '32px', color: 'var(--text-muted)' }}>
                    Remembered your password? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>Back to login</Link>
                </p>
                <p style={{ marginTop: '8px', color: 'var(--text-muted)' }}>
                    New here? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>Create Account</Link>
                </p>
            </div>
        </div>
    );
};

export default ResendVerification;
