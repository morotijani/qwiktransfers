import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const RegisterSuccess = () => {
    const location = useLocation();
    const email = location.state?.email || 'your email address';

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px' }}>
            <div className="card" style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
                <div style={{ fontSize: '4rem', marginBottom: '24px' }}>🎉</div>
                <h1 style={{ marginBottom: '16px' }}>Congratulations!</h1>
                <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '16px' }}>
                    Your account has been created successfully. We've sent a verification email to:
                </p>
                <p style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-deep-brown)', marginBottom: '24px' }}>
                    {email}
                </p>
                <div style={{ background: '#fff', border: '1px solid #eee', padding: '16px', borderRadius: '8px', marginBottom: '32px' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                        <strong style={{ color: 'var(--danger)' }}>Note:</strong> The verification link will expire in <span style={{ fontWeight: 700 }}>24 hours</span>. Please verify your account soon to enjoy all Qwiktransfers benefits.
                    </p>
                </div>
                <Link to="/login" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>Go to Login</Link>
                <p style={{ marginTop: '24px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Didn't receive an email? Check your spam folder or contact support.
                </p>
            </div>
        </div>
    );
};

export default RegisterSuccess;
