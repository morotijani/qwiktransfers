import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Link } from 'react-router-dom';

const UserDashboard = () => {
    const { user, logout, refreshProfile } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [amount, setAmount] = useState('');
    const [recipientType, setRecipientType] = useState('momo');
    const [recipientName, setRecipientName] = useState('');
    const [recipientAccount, setRecipientAccount] = useState('');
    const [fromCurrency, setFromCurrency] = useState('GHS');
    const [toCurrency, setToCurrency] = useState('CAD');
    const [rate, setRate] = useState(0.09);
    const [loading, setLoading] = useState(false);
    const [isGlobalLoading, setIsGlobalLoading] = useState(false);

    // New Multi-step States
    const [formStep, setFormStep] = useState(1);
    const [bankName, setBankName] = useState('');
    const [momoProvider, setMomoProvider] = useState('');
    const [note, setNote] = useState('');
    const [adminReference, setAdminReference] = useState('');

    // Canada specific fields
    const [transitNumber, setTransitNumber] = useState('');
    const [institutionNumber, setInstitutionNumber] = useState('');
    const [interacEmail, setInteracEmail] = useState('');

    // PIN Modal States
    const [showPinModal, setShowPinModal] = useState(false);
    const [pin, setPin] = useState('');
    const [pinAction, setPinAction] = useState(null); // { type: 'send' | 'upload', data: any }

    // Details Modal States
    const [selectedTx, setSelectedTx] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    const momoProviders = [
        { id: 'mtn', name: 'MTN Momo', color: '#FFCC00', textColor: '#000' },
        { id: 'telecel', name: 'Telecel Cash', color: '#E60000', textColor: '#fff' },
        { id: 'airteltigo', name: 'AirtelTigo Money', color: '#003399', textColor: '#fff' }
    ];

    const ghanaBanks = [
        'GCB Bank', 'Ecobank Ghana', 'Absa Bank', 'Zenith Bank', 'Standard Chartered', 'Fidelity Bank', 'Stanbic Bank', 'ADB Bank'
    ];

    useEffect(() => {
        fetchTransactions();
        fetchRate();
    }, []);

    // Reset recipient details when destination currency changes
    useEffect(() => {
        if (toCurrency === 'CAD') {
            setRecipientType('interac'); // Default for Canada
        } else {
            setRecipientType('momo'); // Default for Ghana
        }
    }, [toCurrency]);

    const fetchRate = async () => {
        try {
            const res = await api.get('/rates');
            setRate(res.data.rate);
        } catch (error) {
            console.error('Failed to fetch rate', error);
        }
    };

    const fetchTransactions = async () => {
        try {
            const res = await api.get('/transactions');
            setTransactions(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCurrencySwitch = () => {
        const tempFrom = fromCurrency;
        const tempTo = toCurrency;
        setFromCurrency(tempTo);
        setToCurrency(tempFrom);
        setRate(1 / rate);
        setFormStep(1); // Reset step if currency changes
    };

    const generateReference = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let result = 'QW-';
        for (let i = 0; i < 5; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    const nextStep = () => {
        if (formStep === 1) {
            if (!amount || amount <= 0) return alert('Please enter a valid amount');
            setFormStep(2);
        } else if (formStep === 2) {
            if (!recipientName) return alert('Please enter recipient name');

            if (toCurrency === 'CAD') {
                if (recipientType === 'bank' && (!recipientAccount || !transitNumber || !institutionNumber)) {
                    return alert('Please fill in all bank details');
                }
                if (recipientType === 'interac' && !interacEmail) {
                    return alert('Please enter Interac email');
                }
            } else { // GHS
                if (recipientType === 'momo' && (!recipientAccount || !momoProvider)) {
                    return alert('Please fill in Momo details');
                }
                if (recipientType === 'bank' && (!recipientAccount || !bankName)) {
                    return alert('Please fill in bank details');
                }
            }

            setAdminReference(generateReference());
            setFormStep(3);
        }
    };

    const prevStep = () => setFormStep(formStep - 1);

    const handlePinSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/auth/verify-pin', { pin });
            setShowPinModal(false);
            setPin('');
            setIsGlobalLoading(true); // Start processing loader AFTER pin vanishes

            if (pinAction.type === 'send') {
                await executeSend();
            } else if (pinAction.type === 'upload') {
                await executeUpload(pinAction.data.txId, pinAction.data.file);
            }
        } catch (error) {
            alert(error.response?.data?.error || 'PIN Verification Failed');
        } finally {
            setLoading(false);
            setIsGlobalLoading(false); // Stop processing loader
        }
    };

    const handleSend = (e) => {
        e.preventDefault();
        setPinAction({ type: 'send' });
        setShowPinModal(true);
    };

    const executeSend = async () => {
        try {
            await api.post('/transactions', {
                amount_sent: amount,
                type: `${fromCurrency}-${toCurrency}`,
                recipient_details: {
                    type: recipientType,
                    name: recipientName,
                    account: recipientAccount,
                    bank_name: bankName,
                    momo_provider: momoProvider,
                    transit_number: transitNumber,
                    institution_number: institutionNumber,
                    interac_email: interacEmail,
                    note: note,
                    admin_reference: adminReference
                }
            });
            // Reset form
            setAmount('');
            setRecipientName('');
            setRecipientAccount('');
            setBankName('');
            setMomoProvider('');
            setTransitNumber('');
            setInstitutionNumber('');
            setInteracEmail('');
            setNote('');
            setFormStep(1);
            fetchTransactions();
            alert('Transfer Initiated!');
        } catch (error) {
            alert('Failed to send request');
        }
    };

    const handleUploadProof = (txId, file) => {
        if (!file) return;
        setPinAction({ type: 'upload', data: { txId, file } });
        setShowPinModal(true);
    };

    const executeUpload = async (txId, file) => {
        const formData = new FormData();
        formData.append('proof', file);
        try {
            await api.post(`/transactions/${txId}/upload-proof`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            fetchTransactions();
            alert('Proof uploaded!');
        } catch (error) {
            alert('Failed to upload proof');
        }
    };

    const handleKYCUpload = async (file) => {
        if (!file) return;
        const formData = new FormData();
        formData.append('document', file);
        setLoading(true);
        try {
            await api.post('/auth/kyc', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('KYC Document uploaded!');
            if (refreshProfile) refreshProfile();
        } catch (error) {
            alert('KYC Upload failed');
        } finally {
            setLoading(false);
        }
    };

    const openDetails = (tx) => {
        setSelectedTx(tx);
        setShowDetailsModal(true);
    };

    return (
        <div className="dashboard-container">
            {isGlobalLoading && (
                <div className="processing-overlay">
                    <div className="spinner"></div>
                    <h2 style={{ fontSize: '1.2rem', color: 'var(--text-deep-brown)' }}>Processing your request...</h2>
                    <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Please do not refresh the page.</p>
                </div>
            )}

            <header>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>QWIK</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {user?.profile_picture && (
                            <img
                                src={`http://localhost:5000${user.profile_picture}`}
                                alt="Avatar"
                                style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid var(--accent-peach)' }}
                            />
                        )}
                        <Link to="/profile" style={{ textDecoration: 'none', color: 'inherit', textAlign: 'right' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.full_name || user?.email}</div>
                            <div style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                color: user?.kyc_status === 'verified' ? 'var(--success)' : 'var(--warning)',
                                textTransform: 'uppercase'
                            }}>
                                {user?.kyc_status || 'Unverified'}
                            </div>
                        </Link>
                    </div>
                    <button
                        onClick={logout}
                        style={{
                            background: 'transparent',
                            border: '1px solid var(--border-color)',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            color: 'var(--text-deep-brown)'
                        }}
                    >
                        Sign Out
                    </button>
                </div>
            </header>

            <main style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 460px) 1fr', gap: '48px', alignItems: 'start' }}>
                <aside style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <section className="card" style={{ position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '1.1rem' }}>Send Money</h2>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, background: 'var(--accent-peach)', padding: '4px 10px', borderRadius: '20px' }}>
                                Step {formStep} of 3
                            </span>
                        </div>

                        {formStep === 1 && (
                            <div className="fade-in">
                                <div className="form-group">
                                    <label>You send</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="0.00"
                                            style={{ paddingRight: '60px', fontSize: '1.25rem', fontWeight: 600 }}
                                            required
                                        />
                                        <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--text-muted)' }}>{fromCurrency}</span>
                                    </div>
                                </div>

                                <div style={{ textAlign: 'center', margin: '-10px 0 10px 0' }}>
                                    <button type="button" onClick={handleCurrencySwitch} style={{ background: 'var(--accent-peach)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        ⇅
                                    </button>
                                </div>

                                <div className="form-group">
                                    <label>Recipient gets</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="text"
                                            value={amount ? (amount * rate).toFixed(2) : '0.00'}
                                            readOnly
                                            style={{ paddingRight: '60px', background: '#f9f9f9', fontSize: '1.25rem', fontWeight: 600 }}
                                        />
                                        <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--text-muted)' }}>{toCurrency}</span>
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', fontWeight: 500 }}>
                                        Exchange Rate: 1 {fromCurrency} = {rate.toFixed(4)} {toCurrency}
                                    </p>
                                </div>

                                <div className="form-group">
                                    <label>Note / Reference (Optional)</label>
                                    <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="What is this for?" />
                                </div>

                                <button onClick={nextStep} className="btn-primary" style={{ marginTop: '12px' }}>Next: Recipient Details</button>
                            </div>
                        )}

                        {formStep === 2 && (
                            <div className="fade-in">
                                <div className="form-group">
                                    <label>Recipient Method</label>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        {toCurrency === 'GHS' ? (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => setRecipientType('momo')}
                                                    className={recipientType === 'momo' ? 'btn-primary' : 'btn-outline'}
                                                    style={{ flex: 1, padding: '12px', fontSize: '0.85rem' }}
                                                >
                                                    Mobile Money
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setRecipientType('bank')}
                                                    className={recipientType === 'bank' ? 'btn-primary' : 'btn-outline'}
                                                    style={{ flex: 1, padding: '12px', fontSize: '0.85rem' }}
                                                >
                                                    Bank Transfer
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => setRecipientType('interac')}
                                                    className={recipientType === 'interac' ? 'btn-primary' : 'btn-outline'}
                                                    style={{ flex: 1, padding: '12px', fontSize: '0.85rem' }}
                                                >
                                                    Interac e-Transfer
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setRecipientType('bank')}
                                                    className={recipientType === 'bank' ? 'btn-primary' : 'btn-outline'}
                                                    style={{ flex: 1, padding: '12px', fontSize: '0.85rem' }}
                                                >
                                                    Bank Transfer
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Recipient Full Name</label>
                                    <input type="text" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Full Name" required />
                                </div>

                                {toCurrency === 'CAD' ? (
                                    recipientType === 'bank' ? (
                                        <div className="fade-in">
                                            <div className="form-group">
                                                <label>Account Number</label>
                                                <input type="text" value={recipientAccount} onChange={(e) => setRecipientAccount(e.target.value)} placeholder="Account Number" required />
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                                <div className="form-group">
                                                    <label>Transit #</label>
                                                    <input type="text" value={transitNumber} onChange={(e) => setTransitNumber(e.target.value)} placeholder="5 digits" maxLength="5" required />
                                                </div>
                                                <div className="form-group">
                                                    <label>Institution #</label>
                                                    <input type="text" value={institutionNumber} onChange={(e) => setInstitutionNumber(e.target.value)} placeholder="3 digits" maxLength="3" required />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="form-group fade-in">
                                            <label>Interac Email</label>
                                            <input type="email" value={interacEmail} onChange={(e) => setInteracEmail(e.target.value)} placeholder="recipient@email.com" required />
                                        </div>
                                    )
                                ) : ( // GHS
                                    recipientType === 'momo' ? (
                                        <div className="fade-in">
                                            <div className="form-group">
                                                <label>Select Momo Provider</label>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                                                    {momoProviders.map(provider => (
                                                        <button
                                                            key={provider.id}
                                                            type="button"
                                                            onClick={() => setMomoProvider(provider.name)}
                                                            style={{
                                                                background: momoProvider === provider.name ? provider.color : '#fff',
                                                                color: momoProvider === provider.name ? provider.textColor : 'var(--text-deep-brown)',
                                                                border: `2px solid ${momoProvider === provider.name ? provider.color : '#eee'}`,
                                                                padding: '12px 4px',
                                                                borderRadius: '8px',
                                                                cursor: 'pointer',
                                                                fontSize: '0.7rem',
                                                                fontWeight: 800,
                                                                transition: 'all 0.2s'
                                                            }}
                                                        >
                                                            {provider.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="form-group">
                                                <label>Momo Number</label>
                                                <input type="text" value={recipientAccount} onChange={(e) => setRecipientAccount(e.target.value)} placeholder="024XXXXXXX" required />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="fade-in">
                                            <div className="form-group">
                                                <label>Select Bank</label>
                                                <select value={bankName} onChange={(e) => setBankName(e.target.value)} required>
                                                    <option value="">Choose a bank...</option>
                                                    {ghanaBanks.map(bank => <option key={bank} value={bank}>{bank}</option>)}
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label>Account Number</label>
                                                <input type="text" value={recipientAccount} onChange={(e) => setRecipientAccount(e.target.value)} placeholder="Account Number" required />
                                            </div>
                                        </div>
                                    )
                                )}

                                <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                                    <button onClick={prevStep} className="btn-outline" style={{ flex: 0.5 }}>Back</button>
                                    <button onClick={nextStep} className="btn-primary" style={{ flex: 1 }}>Next: Review & Pay</button>
                                </div>
                            </div>
                        )}

                        {formStep === 3 && (
                            <div className="fade-in">
                                <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
                                    <h3 style={{ fontSize: '0.9rem', marginBottom: '16px', color: 'var(--text-muted)' }}>Transfer Summary</h3>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span>Amount:</span>
                                        <span style={{ fontWeight: 700 }}>{amount} {fromCurrency}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span>Recipient Gets:</span>
                                        <span style={{ fontWeight: 700, color: 'var(--success)' }}>{(amount * rate).toFixed(2)} {toCurrency}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span>To:</span>
                                        <span style={{ fontWeight: 700 }}>{recipientName}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Via:</span>
                                        <span style={{ fontWeight: 700 }}>
                                            {toCurrency === 'CAD'
                                                ? (recipientType === 'bank' ? bankName || 'Bank Transfer' : 'Interac e-Transfer')
                                                : (recipientType === 'momo' ? momoProvider : bankName || 'Bank Transfer')}
                                        </span>
                                    </div>
                                </div>

                                <div style={{ background: 'var(--text-deep-brown)', color: '#fff', padding: '24px', borderRadius: '12px', marginBottom: '24px' }}>
                                    <h3 style={{ fontSize: '0.9rem', marginBottom: '16px', color: 'var(--accent-peach)' }}>Payment Instructions</h3>
                                    <p style={{ fontSize: '0.8rem', opacity: 0.9, marginBottom: '16px' }}>
                                        Please send <strong>{amount} {fromCurrency}</strong> to the following admin account:
                                    </p>

                                    {fromCurrency === 'GHS' ? (
                                        <div style={{ fontSize: '0.9rem', marginBottom: '16px' }}>
                                            <div style={{ marginBottom: '4px' }}><strong>MTN Momo:</strong> 055 123 4567</div>
                                            <div><strong>Name:</strong> Qwiktransfers Limited</div>
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: '0.9rem', marginBottom: '16px' }}>
                                            <div style={{ marginBottom: '4px' }}><strong>Interac e-Transfer:</strong> pay@qwiktransfers.ca</div>
                                            <div><strong>Name:</strong> Qwiktransfers Canada</div>
                                        </div>
                                    )}

                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
                                        <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.7, display: 'block', marginBottom: '4px' }}>Payment Reference</label>
                                        <div style={{
                                            background: 'rgba(255,255,255,0.1)',
                                            padding: '12px',
                                            borderRadius: '6px',
                                            textAlign: 'center',
                                            fontSize: '1.25rem',
                                            fontWeight: 800,
                                            letterSpacing: '2px',
                                            color: 'var(--accent-peach)',
                                            border: '1px dashed rgba(255,255,255,0.3)'
                                        }}>
                                            {adminReference}
                                        </div>
                                        <p style={{ fontSize: '0.7rem', marginTop: '8px', textAlign: 'center', opacity: 0.7 }}>
                                            Include this code in your transfer for faster tracking.
                                        </p>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button onClick={prevStep} className="btn-outline" style={{ flex: 0.5 }}>Back</button>
                                    <button onClick={handleSend} className="btn-primary" style={{ flex: 1 }}>Confirm & Send</button>
                                </div>
                            </div>
                        )}
                    </section>

                    {user?.kyc_status !== 'verified' && (
                        <div className="card" style={{ border: '2px solid var(--warning)', padding: '24px' }}>
                            <h3 style={{ fontSize: '0.95rem', marginBottom: '8px' }}>Identity Verification</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Verify your identity to increase limits and speed up transfers.</p>
                            <div style={{ position: 'relative' }}>
                                <input type="file" onChange={(e) => handleKYCUpload(e.target.files[0])} style={{ position: 'absolute', opacity: 0, width: '100%', cursor: 'pointer', height: '100%' }} />
                                <button className="btn-primary" style={{ background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)', padding: '10px' }}>Upload ID Document</button>
                            </div>
                        </div>
                    )}
                </aside>

                <section className="card" style={{ padding: '0', overflow: 'hidden' }}>
                    <div style={{ padding: '32px' }}>
                        <h2 style={{ fontSize: '1.1rem' }}>Transaction History</h2>
                    </div>
                    {transactions.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '48px' }}>No transactions found.</p>
                    ) : (
                        <table style={{ marginTop: '0' }}>
                            <thead>
                                <tr>
                                    <th>Recipient</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((tx) => (
                                    <tr key={tx.id} onClick={() => openDetails(tx)} style={{ cursor: 'pointer' }}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{tx.recipient_details?.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {tx.recipient_details?.momo_provider || tx.recipient_details?.bank_name || tx.recipient_details?.type} • {tx.recipient_details?.account || tx.recipient_details?.interac_email}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 700 }}>{tx.amount_received} {tx.type.split('-')[1]}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tx.amount_sent} {tx.type.split('-')[0]}</div>
                                        </td>
                                        <td>
                                            <span className={`badge badge-${tx.status}`}>
                                                {tx.status}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                                            {tx.status === 'pending' && !tx.proof_url && (
                                                <div style={{ position: 'relative', display: 'inline-block' }}>
                                                    <input
                                                        type="file"
                                                        onChange={(e) => handleUploadProof(tx.id, e.target.files[0])}
                                                        style={{ position: 'absolute', opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                                                    />
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}>Upload Proof</span>
                                                </div>
                                            )}
                                            {tx.proof_url && (
                                                <a href={`http://localhost:5000${tx.proof_url}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>
                                                    View Proof
                                                </a>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </section>
            </main>

            {showPinModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ maxWidth: '360px', width: '90%', textAlign: 'center' }}>
                        <h3 style={{ marginBottom: '16px' }}>Verify Transaction</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>Enter your 4-digit security PIN to proceed.</p>
                        <form onSubmit={handlePinSubmit}>
                            <input
                                type="password"
                                maxLength="4"
                                value={pin}
                                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                style={{ textAlign: 'center', fontSize: '2rem', letterSpacing: '12px', marginBottom: '24px' }}
                                placeholder="••••"
                                autoFocus
                                required
                            />
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button type="button" onClick={() => setShowPinModal(false)} className="btn-primary" style={{ background: 'transparent', color: 'var(--text-deep-brown)', border: '1px solid var(--border-color)' }}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={loading}>
                                    {loading ? 'Verifying...' : 'Verify'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showDetailsModal && selectedTx && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <div className="card fade-in" style={{ maxWidth: '440px', width: '90%', padding: '0', overflow: 'hidden' }}>
                        <div style={{ padding: '24px', background: 'var(--text-deep-brown)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '1rem' }}>Transaction Details</h3>
                            <button onClick={() => setShowDetailsModal(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                        </div>

                        <div style={{ padding: '32px' }}>
                            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-deep-brown)' }}>
                                    {selectedTx.amount_received} {selectedTx.type.split('-')[1]}
                                </div>
                                <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{selectedTx.amount_sent} {selectedTx.type.split('-')[0]} Sent</div>
                                <span className={`badge badge-${selectedTx.status}`} style={{ marginTop: '12px', display: 'inline-block' }}>{selectedTx.status}</span>
                            </div>

                            <div style={{ display: 'grid', gap: '16px', fontSize: '0.9rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', paddingBottom: '12px' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Recipient</span>
                                    <span style={{ fontWeight: 700 }}>{selectedTx.recipient_details?.name}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', paddingBottom: '12px' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Method</span>
                                    <span style={{ fontWeight: 700, textTransform: 'capitalize' }}>{selectedTx.recipient_details?.type.replace('_', ' ')}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', paddingBottom: '12px' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>{selectedTx.recipient_details?.type === 'bank' ? 'Account' : 'Wallet / Email'}</span>
                                    <span style={{ fontWeight: 700 }}>{selectedTx.recipient_details?.account || selectedTx.recipient_details?.interac_email}</span>
                                </div>
                                {selectedTx.recipient_details?.momo_provider && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', paddingBottom: '12px' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Provider</span>
                                        <span style={{ fontWeight: 700 }}>{selectedTx.recipient_details.momo_provider}</span>
                                    </div>
                                )}
                                {selectedTx.recipient_details?.bank_name && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', paddingBottom: '12px' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Bank</span>
                                        <span style={{ fontWeight: 700 }}>{selectedTx.recipient_details.bank_name}</span>
                                    </div>
                                )}
                                {selectedTx.recipient_details?.note && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', paddingBottom: '12px' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Note</span>
                                        <span style={{ fontWeight: 700 }}>{selectedTx.recipient_details.note}</span>
                                    </div>
                                )}
                                <div style={{ marginTop: '16px', padding: '16px', background: 'var(--accent-peach)', borderRadius: '8px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-deep-brown)', opacity: 0.7, marginBottom: '4px' }}>Admin Payment Reference</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-deep-brown)', letterSpacing: '1px' }}>
                                        {selectedTx.recipient_details?.admin_reference || 'N/A'}
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: '32px' }}>
                                <button onClick={() => setShowDetailsModal(false)} className="btn-primary">Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserDashboard;
