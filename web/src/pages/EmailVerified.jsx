import React, { useEffect, useState, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import api from '../services/api';

const EmailVerified = () => {
    const [status, setStatus] = useState('verifying'); // verifying, success, already_verified, expired, invalid
    const [errorMsg, setErrorMsg] = useState('');
    const location = useLocation();
    const query = new URLSearchParams(location.search);
    const token = query.get('token');
    const email = query.get('email');
    const hasRun = useRef(false);

    useEffect(() => {
        if (hasRun.current) return;

        const verify = async () => {
            hasRun.current = true;
            try {
                const response = await api.get(`/auth/verify-email?token=${token}&email=${email}`);
                // Response status can be 'success' or 'already_verified'
                setStatus(response.data.status);
            } catch (error) {
                const errStatus = error.response?.data?.status;
                if (errStatus === 'expired') {
                    setStatus('expired');
                } else if (errStatus === 'already_verified') {
                    setStatus('already_verified');
                } else {
                    setStatus('invalid');
                }
                setErrorMsg(error.response?.data?.error || 'Verification failed');
            }
        };
        if (token) verify();
        else setStatus('invalid');
    }, [token, email]);

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px' }}>
            <div className="card" style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
                {status === 'verifying' && <h2>Verifying your email...</h2>}

                {(status === 'success' || status === 'already_verified') && (
                    <>
                        <div style={{ fontSize: '4rem', marginBottom: '24px' }}>✅</div>
                        <h1 style={{ marginBottom: '16px' }}>
                            {status === 'already_verified' ? 'Already Verified!' : 'Email Verified!'}
                        </h1>
                        <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '32px' }}>
                            {status === 'already_verified'
                                ? 'Your email was already successfully verified. You can proceed to log into your account.'
                                : 'Your email has been successfully verified. You can now access all features of Qwiktransfers.'}
                        </p>
                        <Link to="/login" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>Finally Login</Link>
                    </>
                )}

                {status === 'expired' && (
                    <>
                        <div style={{ fontSize: '4rem', marginBottom: '24px' }}>⏳</div>
                        <h1 style={{ marginBottom: '16px' }}>Link Expired</h1>
                        <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '32px' }}>
                            The verification link has expired. Verification links are only valid for 24 hours.
                        </p>
                        <Link to="/resend-verification" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>Resend Verification Link</Link>
                    </>
                )}

                {status === 'invalid' && (
                    <>
                        <div style={{ fontSize: '4rem', marginBottom: '24px' }}>❌</div>
                        <h1 style={{ marginBottom: '16px' }}>Invalid Link</h1>
                        <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '32px' }}>
                            The verification link is invalid. Please make sure you copied the correct URL from your email.
                        </p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <Link to="/resend-verification" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>Resend Link</Link>
                            <Link to="/register" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block', background: 'transparent', color: 'var(--text-deep-brown)', border: '1px solid #ddd' }}>Sign Up</Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default EmailVerified;
