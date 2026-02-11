import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-hot-toast';

const VendorDashboard = () => {
    const { user, logout, refreshProfile } = useAuth();
    const [isOnline, setIsOnline] = useState(user?.is_online || false);
    const [pool, setPool] = useState([]);
    const [myTransactions, setMyTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('pool');

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => {
            if (isOnline) fetchPool();
        }, 5000); // Poll every 5 seconds for new transactions
        return () => clearInterval(interval);
    }, [isOnline]);

    const fetchData = async () => {
        setLoading(true);
        await Promise.all([fetchPool(), fetchMyTransactions()]);
        setLoading(false);
    };

    const fetchPool = async () => {
        try {
            const res = await api.get('/vendor/pool');
            setPool(res.data);
        } catch (error) {
            console.error('Pool fetch error:', error);
        }
    };

    const fetchMyTransactions = async () => {
        try {
            const res = await api.get('/vendor/transactions');
            setMyTransactions(res.data);
        } catch (error) {
            console.error('My transactions fetch error:', error);
        }
    };

    const toggleStatus = async () => {
        try {
            const res = await api.post('/vendor/toggle-status');
            setIsOnline(res.data.is_online);
            toast.success(res.data.is_online ? "You are now ONLINE" : "You are now OFFLINE");
            refreshProfile();
        } catch (error) {
            toast.error("Failed to toggle status");
        }
    };

    const acceptTransaction = async (transactionId) => {
        try {
            await api.post('/vendor/accept', { transactionId });
            toast.success("Transaction claimed!");
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to claim transaction");
        }
    };

    const completeTransaction = async (transactionId) => {
        try {
            await api.post('/vendor/complete', { transactionId });
            toast.success("Transaction marked as completed");
            fetchData();
        } catch (error) {
            toast.error("Failed to complete transaction");
        }
    };

    return (
        <div className="dashboard-container">
            <header style={{ borderBottom: '1px solid var(--border-color)', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>QWIK<span style={{ fontWeight: 400, opacity: 0.6 }}>VENDOR</span></h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f5f5f5', padding: '6px 16px', borderRadius: '20px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: isOnline ? 'var(--success)' : '#ccc' }}></div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: isOnline ? 'var(--text-deep-brown)' : 'var(--text-muted)' }}>
                            {isOnline ? 'ONLINE' : 'OFFLINE'}
                        </span>
                        <button
                            onClick={toggleStatus}
                            style={{ marginLeft: '12px', padding: '4px 12px', borderRadius: '12px', border: 'none', background: isOnline ? 'var(--danger)' : 'var(--primary)', color: '#fff', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                            Go {isOnline ? 'Offline' : 'Online'}
                        </button>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{user?.full_name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Verified Vendor</div>
                    </div>
                    <button onClick={logout} className="btn-secondary" style={{ padding: '8px 16px' }}>Sign Out</button>
                </div>
            </header>

            <main>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                    <button
                        onClick={() => setActiveTab('pool')}
                        style={{ padding: '10px 24px', borderRadius: '12px', border: 'none', background: activeTab === 'pool' ? 'var(--text-deep-brown)' : '#fff', color: activeTab === 'pool' ? '#fff' : 'var(--text-deep-brown)', fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}
                    >
                        Available Pool ({pool.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('my')}
                        style={{ padding: '10px 24px', borderRadius: '12px', border: 'none', background: activeTab === 'my' ? 'var(--text-deep-brown)' : '#fff', color: activeTab === 'my' ? '#fff' : 'var(--text-deep-brown)', fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}
                    >
                        My Active Transfers ({myTransactions.filter(tx => tx.status === 'processing').length})
                    </button>
                </div>

                {!isOnline && (
                    <div className="card" style={{ textAlign: 'center', padding: '60px', background: 'var(--accent-peach)', border: 'none' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>💤</div>
                        <h2 style={{ color: 'var(--text-deep-brown)' }}>You are currently Offline</h2>
                        <p style={{ color: 'var(--text-deep-brown)', opacity: 0.7 }}>Go online to start receiving and processing client transactions.</p>
                        <button onClick={toggleStatus} className="btn-primary" style={{ marginTop: '24px' }}>Go Online Now</button>
                    </div>
                )}

                {isOnline && activeTab === 'pool' && (
                    <div className="card" style={{ padding: '0' }}>
                        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)' }}>
                            <h3 style={{ margin: 0 }}>Dispatch Pool</h3>
                            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>First come, first served. Claim transactions quickly!</p>
                        </div>
                        <table style={{ margin: 0 }}>
                            <thead>
                                <tr>
                                    <th>Patient/User</th>
                                    <th>Amount</th>
                                    <th>Destination</th>
                                    <th style={{ textAlign: 'right' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pool.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No pending transactions in the pool. Waiting for customers...</td>
                                    </tr>
                                ) : (
                                    pool.map(tx => (
                                        <tr key={tx.id}>
                                            <td>
                                                <div style={{ fontWeight: 700 }}>{tx.user?.full_name}</div>
                                                <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{tx.user?.email}</div>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{tx.amount_sent} GHS</div>
                                                <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Wait: {tx.amount_received} CAD</div>
                                            </td>
                                            <td>
                                                <div style={{ fontSize: '0.85rem' }}>{tx.recipient_details?.bank_name}</div>
                                                <div style={{ fontWeight: 600 }}>{tx.recipient_details?.phone}</div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button
                                                    onClick={() => acceptTransaction(tx.id)}
                                                    className="btn-primary"
                                                    style={{ padding: '8px 20px', fontSize: '0.85rem' }}
                                                >
                                                    Claim & Process
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {isOnline && activeTab === 'my' && (
                    <div className="card" style={{ padding: '0' }}>
                        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)' }}>
                            <h3 style={{ margin: 0 }}>Handled by me</h3>
                        </div>
                        <table style={{ margin: 0 }}>
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {myTransactions.map(tx => (
                                    <tr key={tx.id}>
                                        <td>
                                            <div style={{ fontWeight: 700 }}>{tx.user?.full_name}</div>
                                            <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{new Date(tx.createdAt).toLocaleString()}</div>
                                        </td>
                                        <td>{tx.amount_sent} GHS</td>
                                        <td><span className={`badge badge-${tx.status}`}>{tx.status.toUpperCase()}</span></td>
                                        <td style={{ textAlign: 'right' }}>
                                            {tx.status === 'processing' && (
                                                <button
                                                    onClick={() => completeTransaction(tx.id)}
                                                    style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--success)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                                                >
                                                    Mark Completed
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
};

export default VendorDashboard;
