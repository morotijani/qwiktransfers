import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const countryCodes = {
    'Ghana': '+233',
    'Canada': '+1',
    // 'Nigeria': '+234',
    // 'USA': '+1',
    // 'UK': '+44'
};

const Register = () => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [country, setCountry] = useState('Ghana');
    const [pin, setPin] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleNext = (e) => {
        e.preventDefault();
        setError('');

        // Simple phone validation
        const code = countryCodes[country];
        if (!phone.startsWith(code)) {
            setError(`Phone number must start with ${code} for ${country}`);
            return;
        }
        if (phone.length < 10) {
            setError('Please enter a valid phone number');
            return;
        }

        setStep(2);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        if (pin.length !== 4) {
            setError('PIN must be exactly 4 digits');
            return;
        }

        setLoading(true);
        try {
            await register({
                email,
                password,
                full_name: fullName,
                phone,
                country,
                pin
            });
            navigate('/register-success', { state: { email } });
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed. Try a different email.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px' }}>
            <div className="card" style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>QWIK</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
                    {step === 1 ? 'Personal Information' : 'Account Security'}
                </p>

                {error && <p style={{ color: 'var(--danger)', marginBottom: '16px', fontWeight: 600 }}>{error}</p>}

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '32px' }}>
                    <div style={{ width: '40px', height: '4px', background: step >= 1 ? 'var(--primary)' : '#ddd', borderRadius: '2px' }}></div>
                    <div style={{ width: '40px', height: '4px', background: step >= 2 ? 'var(--primary)' : '#ddd', borderRadius: '2px' }}></div>
                </div>

                <form onSubmit={step === 1 ? handleNext : handleSubmit} style={{ textAlign: 'left' }}>
                    {step === 1 ? (
                        <>
                            <div className="form-group">
                                <label>Full Name</label>
                                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Hamza Ibrahim" required />
                            </div>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" required />
                            </div>
                            <div className="form-group">
                                <label>Your Country</label>
                                <select value={country} onChange={(e) => {
                                    setCountry(e.target.value);
                                    setPhone(countryCodes[e.target.value]);
                                }}>
                                    {Object.keys(countryCodes).map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="form-group" style={{ marginBottom: '32px' }}>
                                <label>Phone Number</label>
                                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={countryCodes[country]} required />
                            </div>
                            <button type="submit" className="btn-primary">Next Step</button>
                        </>
                    ) : (
                        <>
                            <div className="form-group">
                                <label>Password</label>
                                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 6 characters" required />
                            </div>
                            <div className="form-group" style={{ marginBottom: '32px' }}>
                                <label>4-Digit Transaction PIN</label>
                                <input
                                    type="password"
                                    maxLength="4"
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                    placeholder="••••"
                                    required
                                />
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>Used to authorize transfers and uploads.</p>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button type="button" onClick={() => setStep(1)} className="btn-primary" style={{ background: 'transparent', color: 'var(--text-deep-brown)', border: '1px solid var(--border-color)' }}>Back</button>
                                <button type="submit" className="btn-primary" disabled={loading}>
                                    {loading ? 'Creating Account...' : 'Complete Registration'}
                                </button>
                            </div>
                        </>
                    )}
                </form>

                <p style={{ marginTop: '32px', color: 'var(--text-muted)' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>Sign in</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
