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

    useEffect(() => {
        fetchPaymentMethods();
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

    if (loading) return <div className="spinner"></div>;

    return (
        <div style={{ maxWidth: '800px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Payment Settings</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
                Manage the account details shown to customers when they initiate a transfer.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
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
