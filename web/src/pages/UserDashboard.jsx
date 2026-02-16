import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import ThemeSwitcher from '../components/ThemeSwitcher';

const UserDashboard = () => {
    const { user, logout, refreshProfile } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user && user.role === 'admin') {
            navigate('/admin');
        }
    }, [user, navigate]);

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
    const [isHistoryLoading, setIsHistoryLoading] = useState(true);

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
    const [previewImage, setPreviewImage] = useState('');
    const [previewDate, setPreviewDate] = useState(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);

    // Pagination & Search States
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalTransactions, setTotalTransactions] = useState(0);

    // Export States
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportDates, setExportDates] = useState({ start: '', end: '' });

    // Payment Methods State
    const [ghsPaymentMethod, setGhsPaymentMethod] = useState(null);
    const [cadPaymentMethod, setCadPaymentMethod] = useState(null);

    useEffect(() => {
        fetchPaymentMethods();
    }, []);

    const fetchPaymentMethods = async () => {
        try {
            const res = await api.get('/system/payment-methods');
            const methods = res.data;
            const ghs = methods.find(m => m.type === 'momo-ghs');
            const cad = methods.find(m => m.type === 'interac-cad');

            if (ghs) setGhsPaymentMethod(typeof ghs.details === 'string' ? JSON.parse(ghs.details) : ghs.details);
            if (cad) setCadPaymentMethod(typeof cad.details === 'string' ? JSON.parse(cad.details) : cad.details);
        } catch (error) {
            console.error('Failed to fetch payment methods');
        }
    };

    const isValidEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

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
    }, [page, search]);

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
        setIsHistoryLoading(true);
        try {
            const res = await api.get(`/transactions?page=${page}&limit=10&search=${search}`);
            setTransactions(res.data.transactions);
            setTotalPages(res.data.pages);
            setTotalTransactions(res.data.total);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load transaction history');
        } finally {
            setIsHistoryLoading(false);
        }
    };

    const handleCancelTransaction = (id) => {
        setPinAction({ type: 'cancel', data: id });
        setShowPinModal(true);
    };

    const executeCancel = async (id) => {
        try {
            await api.patch(`/transactions/${id}/cancel`);
            toast.success('Transaction cancelled successfully');
            fetchTransactions();
            setShowDetailsModal(false);
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to cancel transaction');
        }
    };

    const handleExport = async () => {
        try {
            const url = exportDates.start && exportDates.end
                ? `/transactions/export?startDate=${exportDates.start}&endDate=${exportDates.end}`
                : '/transactions/export';

            const response = await api.get(url, { responseType: 'blob' });
            const blob = new Blob([response.data], { type: 'text/csv' });
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', `transactions-${new Date().getTime()}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            setShowExportModal(false);
            toast.success('Export started!');
        } catch (error) {
            toast.error('Failed to export transactions');
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
            if (!amount || amount <= 0) return toast.error('Please enter a valid amount');
            setFormStep(2);
        } else if (formStep === 2) {
            if (!recipientName) return toast.error('Please enter recipient name');

            if (toCurrency === 'CAD') {
                if (recipientType === 'bank' && (!recipientAccount || !transitNumber || !institutionNumber)) {
                    return toast.error('Please fill in all bank details');
                }
                if (recipientType === 'interac' && !interacEmail) {
                    return toast.error('Please enter Interac email');
                }
                if (recipientType === 'interac' && !isValidEmail(interacEmail)) {
                    return toast.error('Please enter a valid Interac email');
                }
            } else { // GHS
                if (recipientType === 'momo' && (!recipientAccount || !momoProvider)) {
                    return toast.error('Please fill in Momo details');
                }
                if (recipientType === 'bank' && (!recipientAccount || !bankName)) {
                    return toast.error('Please fill in bank details');
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
            } else if (pinAction.type === 'cancel') {
                await executeCancel(pinAction.data);
            }
        } catch (error) {
            toast.error(error.response?.data?.error || 'PIN Verification Failed');
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
            toast.success('Transfer Initiated!');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to send request');
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
            toast.success('Proof uploaded!');
        } catch (error) {
            toast.error('Failed to upload proof');
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
            toast.success('KYC Document uploaded!');
            if (refreshProfile) refreshProfile();
        } catch (error) {
            toast.error('KYC Upload failed');
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
                    <nav style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                        <Link to="/kyc" style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-deep-brown)', textDecoration: 'none' }}>
                            {user?.kyc_status === 'verified' ? '✓ Verified' : 'Verify ID'}
                        </Link>
                    </nav>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <ThemeSwitcher />
                        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {user?.profile_picture && (
                                <img
                                    src={`http://localhost:5000${user.profile_picture}`}
                                    alt="Avatar"
                                    style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid var(--accent-peach)' }}
                                />
                            )}
                            <Link to="/profile" style={{ textDecoration: 'none', color: 'inherit', textAlign: 'right', display: 'none' }}>
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
                            {/* Mobile profile link - icon only or simpler */}
                            <Link to="/profile" className="desktop-only" style={{ textDecoration: 'none', color: 'inherit', textAlign: 'right' }}>
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

            <main className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 460px) 1fr', gap: '32px', alignItems: 'start' }}>
                <aside style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Verification & Limits Section */}
                    <section className="card" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Verification Status</h3>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {user?.is_email_verified ? (
                                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#059669', background: '#d1fae5', padding: '2px 8px', borderRadius: '4px' }}>EMAIL ✓</span>
                                ) : (
                                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#dc2626', background: '#fee2e2', padding: '2px 8px', borderRadius: '4px' }}>EMAIL ⚠</span>
                                )}
                                {user?.kyc_status === 'verified' ? (
                                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#059669', background: '#d1fae5', padding: '2px 8px', borderRadius: '4px' }}>ID ✓</span>
                                ) : (
                                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#d97706', background: '#fef3c7', padding: '2px 8px', borderRadius: '4px' }}>ID {user?.kyc_status?.toUpperCase()}</span>
                                )}
                            </div>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
                                <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>${user?.limits?.daily || 50} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Daily Limit</span></span>
                                <Link to="/kyc" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', textDecoration: 'none' }}>Increase Limit</Link>
                            </div>
                            <div style={{ height: '8px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%',
                                    width: user?.limits ? '10%' : '0%', // This would ideally be calculated from current usage
                                    background: 'var(--primary)',
                                    borderRadius: '4px'
                                }}></div>
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                                {!user?.is_email_verified && "Verify your email to increase limit to $500."}
                                {user?.is_email_verified && user?.kyc_status !== 'verified' && "Complete KYC to increase limit to $5,000."}
                                {user?.kyc_status === 'verified' && "You have the maximum daily limit."}
                            </p>
                        </div>
                    </section>

                    <section className="card" style={{ position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <div>
                                <h2 style={{ fontSize: '1.1rem', marginBottom: '2px' }}>Send Money</h2>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Sending {fromCurrency} to {toCurrency}</p>
                            </div>
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
                                            <div style={{ marginBottom: '4px' }}><strong>MTN Momo:</strong> {ghsPaymentMethod?.number || '055 123 4567'}</div>
                                            <div><strong>Name:</strong> {ghsPaymentMethod?.name || 'Qwiktransfers Limited'}</div>
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: '0.9rem', marginBottom: '16px' }}>
                                            <div style={{ marginBottom: '4px' }}><strong>Interac e-Transfer:</strong> {cadPaymentMethod?.email || 'pay@qwiktransfers.ca'}</div>
                                            <div><strong>Name:</strong> {cadPaymentMethod?.name || 'Qwiktransfers Canada'}</div>
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

                <section className="card" style={{ padding: '0', overflow: 'hidden', minHeight: '400px' }}>
                    <div style={{ padding: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Transaction History</h2>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                    style={{ padding: '8px 12px 8px 32px', borderRadius: '8px', border: '1px solid #eee', fontSize: '0.85rem' }}
                                />
                                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>🔍</span>
                            </div>
                            <button
                                onClick={() => setShowExportModal(true)}
                                className="btn-outline"
                                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                            >
                                ⬇ Export CSV
                            </button>
                        </div>
                    </div>
                    {isHistoryLoading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0' }}>
                            <div className="spinner"></div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '16px' }}>Loading transactions...</p>
                        </div>
                    ) : transactions.length === 0 ? (
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
                                                        accept="image/*,.pdf"
                                                        onChange={(e) => handleUploadProof(tx.id, e.target.files[0])}
                                                        style={{ position: 'absolute', opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                                                    />
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}>Upload Proof</span>
                                                </div>
                                            )}
                                            {tx.proof_url && (
                                                <span
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setPreviewImage(`http://localhost:5000${tx.proof_url}`);
                                                        setPreviewDate(tx.proof_uploaded_at);
                                                        setShowPreviewModal(true);
                                                    }}
                                                    style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}
                                                >
                                                    View Proof
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {!isHistoryLoading && totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px', padding: '16px 0', borderTop: '1px solid #f0f0f0' }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                Showing page {page} of {totalPages} ({totalTransactions} transactions)
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage(page - 1)}
                                    className="btn-outline"
                                    style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                                >
                                    Previous
                                </button>
                                <button
                                    disabled={page === totalPages}
                                    onClick={() => setPage(page + 1)}
                                    className="btn-outline"
                                    style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
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
                                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-deep-brown)', wordBreak: 'break-all' }}>
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
                                    <>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', paddingBottom: '12px' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>Bank</span>
                                            <span style={{ fontWeight: 700 }}>{selectedTx.recipient_details.bank_name}</span>
                                        </div>
                                        {selectedTx.recipient_details.transit_number && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', paddingBottom: '12px' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>Transit #</span>
                                                <span style={{ fontWeight: 700 }}>{selectedTx.recipient_details.transit_number}</span>
                                            </div>
                                        )}
                                        {selectedTx.recipient_details.institution_number && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', paddingBottom: '12px' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>Institution #</span>
                                                <span style={{ fontWeight: 700 }}>{selectedTx.recipient_details.institution_number}</span>
                                            </div>
                                        )}
                                    </>
                                )}
                                {selectedTx.recipient_details?.note && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', paddingBottom: '12px' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Note</span>
                                        <span style={{ fontWeight: 700 }}>{selectedTx.recipient_details.note}</span>
                                    </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', paddingBottom: '12px' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Initiated At</span>
                                    <span style={{ fontWeight: 700 }}>
                                        {new Date(selectedTx.createdAt).toLocaleString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                            hour: 'numeric',
                                            minute: 'numeric',
                                            hour12: true
                                        })}
                                    </span>
                                </div>
                                {selectedTx.sent_at && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', paddingBottom: '12px' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Sent Date</span>
                                        <span style={{ fontWeight: 700, color: 'var(--success)' }}>
                                            {new Date(selectedTx.sent_at).toLocaleString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                                hour: 'numeric',
                                                minute: 'numeric',
                                                hour12: true
                                            })}
                                        </span>
                                    </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', paddingBottom: '12px' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Rate</span>
                                    <span style={{ fontWeight: 700 }}>1 {selectedTx.type.split('-')[0]} = {(selectedTx.amount_received / selectedTx.amount_sent).toFixed(4)} {selectedTx.type.split('-')[1]}</span>
                                </div>
                                <div style={{ marginTop: '16px', padding: '16px', background: 'var(--accent-peach)', borderRadius: '8px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-deep-brown)', opacity: 0.7, marginBottom: '4px' }}>Admin Payment Reference</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-deep-brown)', letterSpacing: '1px' }}>
                                        {selectedTx.recipient_details?.admin_reference || 'N/A'}
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
                                <button onClick={() => setShowDetailsModal(false)} className="btn-primary" style={{ background: '#f0f0f0', border: 'none', color: 'var(--text-deep-brown)' }}>Close</button>
                                {selectedTx.status === 'pending' && !selectedTx.proof_url && (
                                    <button
                                        onClick={() => handleCancelTransaction(selectedTx.id)}
                                        className="btn-primary"
                                        style={{ background: '#fee2e2', color: '#dc2626', border: 'none' }}
                                    >
                                        Cancel Transaction
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {showPreviewModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(10px)' }}>
                    <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }} className="fade-in">
                        <button
                            onClick={() => setShowPreviewModal(false)}
                            style={{ position: 'absolute', top: '-40px', right: '-40px', background: 'white', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontWeight: 800, fontSize: '1.2rem' }}
                        >
                            &times;
                        </button>
                        {previewImage.endsWith('.pdf') ? (
                            <iframe src={previewImage} style={{ width: '80vw', height: '80vh', border: 'none', borderRadius: '12px' }} title="Proof PDF"></iframe>
                        ) : (
                            <img
                                src={previewImage}
                                alt="Payment Proof"
                                style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
                            />
                        )}
                        {previewDate && (
                            <div style={{ position: 'absolute', bottom: '-40px', left: 0, width: '100%', textAlign: 'center', color: 'white', fontWeight: 600 }}>
                                Uploaded on: {new Date(previewDate).toLocaleString('en-US', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: 'numeric',
                                    minute: 'numeric',
                                    hour12: true
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showExportModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ maxWidth: '400px', width: '90%' }}>
                        <h3 style={{ marginBottom: '8px' }}>Export Transactions</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>Download your transaction history as a CSV file.</p>

                        <div className="form-group">
                            <label>Start Date (Optional)</label>
                            <input
                                type="date"
                                value={exportDates.start}
                                onChange={(e) => setExportDates({ ...exportDates, start: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>End Date (Optional)</label>
                            <input
                                type="date"
                                value={exportDates.end}
                                onChange={(e) => setExportDates({ ...exportDates, end: e.target.value })}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                            <button onClick={() => setShowExportModal(false)} className="btn-outline" style={{ flex: 1 }}>Cancel</button>
                            <button onClick={handleExport} className="btn-primary" style={{ flex: 1 }}>Download CSV</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserDashboard;
