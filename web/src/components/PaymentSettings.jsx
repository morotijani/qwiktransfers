import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';

const PaymentSettings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // GHS (Momo) State
    const [ghsDetails, setGhsDetails] = useState({ number: '', name: '' });
    const [ghsActive, setGhsActive] = useState(true);

    // CAD (Interac) State
    const [cadDetails, setCadDetails] = useState({ email: '', name: '' });
    const [cadActive, setCadActive] = useState(true);

    // Rate State
    const [rateSettings, setRateSettings] = useState({
        use_api: false,
        spread: 5.0,
        manual_rate_cad_ghs: 10.0,
        market_rate_cad_ghs: null
    });

    // Tiered Limits State
    const [limits, setLimits] = useState({
        level1: 50,
        level2: 500,
        level3: 5000
    });

    useEffect(() => {
        fetchPaymentMethods();
        fetchRateSettings();
        fetchSystemConfig();
    }, []);

    const fetchPaymentMethods = async () => {
        try {
            const res = await api.get('/system/payment-methods');
            const methods = res.data;

            const ghs = methods.find(m => m.type === 'momo-ghs');
            if (ghs) {
                const details = typeof ghs.details === 'string' ? JSON.parse(ghs.details) : ghs.details;
                setGhsDetails(details || { number: '', name: '' });
                setGhsActive(ghs.is_active);
            }

            const cad = methods.find(m => m.type === 'interac-cad');
            if (cad) {
                const details = typeof cad.details === 'string' ? JSON.parse(cad.details) : cad.details;
                setCadDetails(details || { email: '', name: '' });
                setCadActive(cad.is_active);
            }
        } catch (error) {
            console.error('Failed to fetch payment methods', error);
            toast.error('Could not load payment settings');
        } finally {
            setLoading(false);
        }
    };

    const fetchRateSettings = async () => {
        try {
            const res = await api.get('/rates');
            setRateSettings({
                use_api: res.data.use_api,
                spread: res.data.spread,
                manual_rate_cad_ghs: parseFloat(res.data.manual_rate_cad_ghs || (1 / res.data.rate)).toFixed(2),
                market_rate_cad_ghs: res.data.market_rate_cad_ghs
            });
        } catch (error) {
            console.error('Failed to fetch rate settings');
        }
    };

    const fetchSystemConfig = async () => {
        try {
            const res = await api.get('/system/config');
            if (res.data.tiered_limits) {
                setLimits(res.data.tiered_limits);
            }
        } catch (error) {
            console.error('Failed to fetch system config');
        }
    };

    const handleSaveGHS = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/system/payment-methods', {
                type: 'momo-ghs',
                currency: 'GHS',
                details: JSON.stringify(ghsDetails),
                is_active: ghsActive
            });
            toast.success('GHS Payment Details Updated');
        } catch (error) {
            toast.error('Failed to update GHS details');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveCAD = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/system/payment-methods', {
                type: 'interac-cad',
                currency: 'CAD',
                details: JSON.stringify(cadDetails),
                is_active: cadActive
            });
            toast.success('CAD Payment Details Updated');
        } catch (error) {
            toast.error('Failed to update CAD details');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveRateSettings = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Send as expected by backend
            await api.patch('/rates/settings', {
                use_api: rateSettings.use_api,
                spread: rateSettings.spread,
                manual_rate: rateSettings.manual_rate_cad_ghs
            });
            toast.success('Exchange Rate Settings Updated');
            fetchRateSettings();
        } catch (error) {
            toast.error('Failed to update rate settings');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveLimits = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/system/config', {
                key: 'tiered_limits',
                value: limits
            });
            toast.success('Tiered Limits Updated');
        } catch (error) {
            toast.error('Failed to update tiered limits');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="spinner"></div>;

    const calculatedCustomerRate = rateSettings.manual_rate_cad_ghs ? (1 / rateSettings.manual_rate_cad_ghs).toFixed(6) : '0.000000';

    return (
        <div style={{ maxWidth: '800px' }}>
            {/* Toggle Switch CSS */}
            <style>
                {`
                    .toggle-container {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        margin-bottom: 24px;
                        padding: 12px;
                        background: var(--accent-peach);
                        border-radius: 12px;
                        width: fit-content;
                    }
                    .switch {
                        position: relative;
                        display: inline-block;
                        width: 50px;
                        height: 26px;
                    }
                    .switch input {
                        opacity: 0;
                        width: 0;
                        height: 0;
                    }
                    .slider {
                        position: absolute;
                        cursor: pointer;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background-color: #ccc;
                        transition: .4s;
                        border-radius: 34px;
                    }
                    .slider:before {
                        position: absolute;
                        content: "";
                        height: 18px;
                        width: 18px;
                        left: 4px;
                        bottom: 4px;
                        background-color: white;
                        transition: .4s;
                        border-radius: 50%;
                    }
                    input:checked + .slider {
                        background-color: var(--primary);
                    }
                    input:checked + .slider:before {
                        transform: translateX(24px);
                    }
                    .market-rate-card {
                        background: var(--text-deep-brown);
                        color: #white;
                        padding: 16px;
                        border-radius: 12px;
                        margin-bottom: 24px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        color: #fff;
                    }
                `}
            </style>

            <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Payment & Rate Settings</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
                Manage account details and exchange rates for the platform.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
                {/* Rate Configuration Section */}
                <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '24px' }}>Exchange Rate Configuration</h3>

                    {/* Market Rate Reference Card */}
                    <div className="market-rate-card fade-in">
                        <div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.8, fontWeight: 700, textTransform: 'uppercase' }}>Live Market Rate</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>1 CAD = {rateSettings.market_rate_cad_ghs || '...'} GHS</div>
                        </div>
                        <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '0.8rem' }}>
                            {rateSettings.use_api ? 'Currently Syncing' : 'Market Reference Only'}
                        </div>
                    </div>

                    <form onSubmit={handleSaveRateSettings}>
                        <div className="toggle-container">
                            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: rateSettings.use_api ? 'var(--text-muted)' : 'var(--text-deep-brown)' }}>Manual Rate</span>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={rateSettings.use_api}
                                    onChange={(e) => setRateSettings({ ...rateSettings, use_api: e.target.checked })}
                                />
                                <span className="slider"></span>
                            </label>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: rateSettings.use_api ? 'var(--text-deep-brown)' : 'var(--text-muted)' }}>Market API Rate</span>
                        </div>

                        {rateSettings.use_api ? (
                            <div className="form-group fade-in">
                                <label>Spread / Fee Percentage (%)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={rateSettings.spread}
                                    onChange={(e) => setRateSettings({ ...rateSettings, spread: parseFloat(e.target.value) })}
                                    placeholder="e.g. 5.0"
                                />
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                    The spread is added to the market rate (1 CAD = {rateSettings.market_rate_cad_ghs} GHS + Spread).
                                </p>
                            </div>
                        ) : (
                            <div className="form-group fade-in">
                                <label>Fixed Rate (1 CAD = ? GHS)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={rateSettings.manual_rate_cad_ghs}
                                    onChange={(e) => setRateSettings({ ...rateSettings, manual_rate_cad_ghs: parseFloat(e.target.value) })}
                                    placeholder="e.g. 10.50"
                                />
                                <div style={{ marginTop: '12px', padding: '12px', background: 'var(--accent-peach)', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>CALCULATED SYSTEM RATE</div>
                                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary)' }}>
                                        1 GHS = {calculatedCustomerRate} CAD
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
                                        This is the value used to convert customer transfers.
                                    </p>
                                </div>
                            </div>
                        )}

                        <button type="submit" className="btn-primary" disabled={saving} style={{ width: 'auto', padding: '12px 32px', marginTop: '16px' }}>
                            Update Rate Configuration
                        </button>
                    </form>
                </div>

                {/* Tiered Limits Section */}
                <div className="card" style={{ borderLeft: '4px solid #6366f1' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '24px' }}>User Tiered Limits (Daily)</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                        Set the daily transaction limits for users based on their verification level. All values are in reference CAD/USD.
                    </p>
                    <form onSubmit={handleSaveLimits}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                            <div className="form-group">
                                <label>Level 1 (Unverified Email)</label>
                                <input
                                    type="number"
                                    value={limits.level1}
                                    onChange={(e) => setLimits({ ...limits, level1: parseInt(e.target.value) })}
                                    placeholder="$50"
                                />
                            </div>
                            <div className="form-group">
                                <label>Level 2 (Verified Email)</label>
                                <input
                                    type="number"
                                    value={limits.level2}
                                    onChange={(e) => setLimits({ ...limits, level2: parseInt(e.target.value) })}
                                    placeholder="$500"
                                />
                            </div>
                            <div className="form-group">
                                <label>Level 3 (Verified KYC)</label>
                                <input
                                    type="number"
                                    value={limits.level3}
                                    onChange={(e) => setLimits({ ...limits, level3: parseInt(e.target.value) })}
                                    placeholder="$5000"
                                />
                            </div>
                        </div>
                        <button type="submit" className="btn-primary" disabled={saving} style={{ width: 'auto', padding: '12px 32px', marginTop: '16px', background: '#6366f1' }}>
                            Save Tiered Limits
                        </button>
                    </form>
                </div>

                {/* GHS Section */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '1.1rem', margin: 0 }}>GHS Receiving Account (Momo)</h3>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={ghsActive}
                                onChange={(e) => setGhsActive(e.target.checked)}
                            />
                            Active
                        </label>
                    </div>
                    <form onSubmit={handleSaveGHS}>
                        <div className="form-group">
                            <label>Merchant / Agent Name</label>
                            <input
                                type="text"
                                value={ghsDetails.name}
                                onChange={(e) => setGhsDetails({ ...ghsDetails, name: e.target.value })}
                                placeholder="e.g. Qwiktransfers Limited"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Momo Number</label>
                            <input
                                type="text"
                                value={ghsDetails.number}
                                onChange={(e) => setGhsDetails({ ...ghsDetails, number: e.target.value })}
                                placeholder="e.g. 055 123 4567"
                                required
                            />
                        </div>
                        <button type="submit" className="btn-primary" disabled={saving} style={{ width: 'auto', padding: '10px 24px' }}>
                            Save GHS Details
                        </button>
                    </form>
                </div>

                {/* CAD Section */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '1.1rem', margin: 0 }}>CAD Receiving Account (Interac)</h3>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={cadActive}
                                onChange={(e) => setCadActive(e.target.checked)}
                            />
                            Active
                        </label>
                    </div>
                    <form onSubmit={handleSaveCAD}>
                        <div className="form-group">
                            <label>Account Name</label>
                            <input
                                type="text"
                                value={cadDetails.name}
                                onChange={(e) => setCadDetails({ ...cadDetails, name: e.target.value })}
                                placeholder="e.g. Qwiktransfers Canada"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Interac Email</label>
                            <input
                                type="email"
                                value={cadDetails.email}
                                onChange={(e) => setCadDetails({ ...cadDetails, email: e.target.value })}
                                placeholder="e.g. pay@qwiktransfers.ca"
                                required
                            />
                        </div>
                        <button type="submit" className="btn-primary" disabled={saving} style={{ width: 'auto', padding: '10px 24px' }}>
                            Save CAD Details
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PaymentSettings;
