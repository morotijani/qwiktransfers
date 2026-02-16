import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import AdminSidebar from '../components/AdminSidebar';
import PaymentSettings from '../components/PaymentSettings';
import AdminProfile from '../components/AdminProfile';
import ThemeSwitcher from '../components/ThemeSwitcher';

const AdminDashboard = () => {
    const { logout } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [users, setUsers] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [tab, setTab] = useState('transactions'); // 'transactions', 'kyc', 'users', 'vendors'
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [adminStats, setAdminStats] = useState({ pendingTransactions: 0, pendingKYC: 0, successVolume: 0 });

    // Transactions Pagination & Filter
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalTransactions, setTotalTransactions] = useState(0);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // User/KYC Pagination & Search
    const [userPage, setUserPage] = useState(1);
    const [userTotalPages, setUserTotalPages] = useState(1);
    const [userSearch, setUserSearch] = useState('');
    const [loading, setLoading] = useState(false);

    // Selected items for Modals
    const [selectedTx, setSelectedTx] = useState(null);
    const [showTxModal, setShowTxModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [showAddVendorModal, setShowAddVendorModal] = useState(false);
    const [newVendor, setNewVendor] = useState({ email: '', full_name: '', phone: '', password: '' });

    // Preview Modal States
    const [previewImage, setPreviewImage] = useState('');
    const [previewDate, setPreviewDate] = useState(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);

    useEffect(() => {
        fetchStats();
        if (tab === 'transactions') {
            fetchTransactions();
        } else if (tab === 'kyc') {
            fetchUsersServerSide('pending');
        } else if (tab === 'users') {
            fetchUsersServerSide('');
        } else if (tab === 'vendors') {
            fetchVendors();
        }
    }, [page, search, statusFilter, userPage, userSearch, tab]);

    const fetchStats = async () => {
        try {
            const res = await api.get('/transactions/stats');
            setAdminStats(res.data);
        } catch (error) {
            console.error('Stats error:', error);
        }
    };

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/transactions?page=${page}&limit=10&search=${search}&status=${statusFilter}`);
            setTransactions(res.data.transactions);
            setTotalPages(res.data.pages);
            setTotalTransactions(res.data.total);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsersServerSide = async (kycStatus = '') => {
        setLoading(true);
        try {
            // Strictly fetch 'user' role for the Users tab
            const roleParam = tab === 'users' ? 'user' : '';
            const res = await api.get(`/auth/users?page=${userPage}&limit=10&search=${userSearch}&kycStatus=${kycStatus}&role=${roleParam}`);
            setUsers(res.data.users);
            setUserTotalPages(res.data.pages);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await api.patch(`/transactions/${id}/status`, { status });
            fetchTransactions();
            toast.success('Status updated!');
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const updateKYC = async (userId, status) => {
        try {
            await api.patch('/auth/kyc/status', { userId, status });
            fetchUsersServerSide();
            toast.success('KYC status updated!');
        } catch (error) {
            toast.error('Failed to update KYC');
        }
    };

    const fetchVendors = async () => {
        try {
            const res = await api.get('/auth/users', { params: { role: 'vendor' } });
            setVendors(res.data.users || []);
        } catch (error) {
            console.error('Fetch vendors error:', error);
        }
    };

    const fetchAvailableUsers = async () => {
        // Obsolete as we separate flows
    };

    const handleCreateVendor = async (e) => {
        e.preventDefault();
        try {
            await api.post('/auth/create-vendor', newVendor);
            toast.success('Vendor created successfully');
            fetchVendors();
            setShowAddVendorModal(false);
            setNewVendor({ email: '', full_name: '', phone: '', password: '' });
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to create vendor');
        }
    };

    const toggleStatus = async (userId) => {
        try {
            const res = await api.patch('/auth/toggle-status', { userId });
            toast.success(res.data.message);
            if (tab === 'users') fetchUsersServerSide();
            if (tab === 'vendors') fetchVendors();
            if (selectedUser && selectedUser.id === userId) {
                setSelectedUser({ ...selectedUser, is_active: res.data.is_active });
            }
        } catch (error) {
            toast.error('Failed to toggle status');
        }
    };

    const updateRole = async (userId, role) => {
        try {
            await api.patch('/auth/update-role', { userId, role });
            toast.success(`User role updated to ${role}`);
            if (tab === 'users') fetchUsersServerSide();
            if (tab === 'vendors') fetchVendors();
            setShowUserModal(false);
            setShowAddVendorModal(false);
        } catch (error) {
            toast.error('Failed to update role');
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-peach)', transition: 'background-color 0.3s ease' }}>
            {/* Mobile Header */}
            <div className="mobile-header">
                <button className="mobile-nav-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                    {sidebarOpen ? '✕' : '☰'}
                </button>
                <h1 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--primary)' }}>QWIK Admin</h1>
                <div style={{ width: '40px' }}></div> {/* Spacer */}
            </div>

            <AdminSidebar
                activeTab={tab}
                setActiveTab={(t) => { setTab(t); setSidebarOpen(false); }}
                logout={logout}
                isOpen={sidebarOpen}
                toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            />

            <main className="admin-main" style={{ flex: 1, padding: '40px', maxWidth: '1200px' }}>
                {tab === 'transactions' && (
                    <section className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '40px' }}>
                        <div className="card" style={{ padding: '24px', background: 'var(--text-deep-brown)', color: '#fff' }}>
                            <div style={{ fontSize: '0.75rem', opacity: 0.7, fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>Pending Transactions</div>
                            <div style={{ fontSize: '2rem', fontWeight: 800 }}>{adminStats.pendingTransactions}</div>
                        </div>
                        <div className="card" style={{ padding: '24px', background: '#fff' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>Pending KYC Reviews</div>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-deep-brown)' }}>{adminStats.pendingKYC}</div>
                        </div>
                        <div className="card" style={{ padding: '24px', background: '#fff' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>Total Success Volume</div>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#059669' }}>{adminStats.successVolume.toLocaleString()} <span style={{ fontSize: '1rem' }}>CAD</span></div>
                        </div>
                    </section>
                )}

                <div className="fade-in">
                    {['transactions', 'kyc', 'users', 'vendors'].includes(tab) && (
                        <>
                            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                                <div style={{ padding: '32px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h2 style={{ fontSize: '1.1rem', margin: 0 }}>
                                        {tab === 'transactions' ? 'Global Transaction Pool' : tab === 'kyc' ? 'Identity Verification Requests' : tab === 'vendors' ? 'Platform Vendors' : 'Manage Users'}
                                    </h2>
                                    {tab === 'transactions' ? (
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <select
                                                value={statusFilter}
                                                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                                                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.8rem', fontWeight: 600, background: 'var(--input-bg)', color: 'var(--text-deep-brown)' }}
                                            >
                                                <option value="all">All Status</option>
                                                <option value="pending">Pending</option>
                                                <option value="processing">Processing</option>
                                                <option value="sent">Sent</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    type="text"
                                                    placeholder="Search..."
                                                    value={search}
                                                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                                    style={{ padding: '6px 10px 6px 28px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.8rem', background: 'var(--input-bg)', color: 'var(--text-deep-brown)' }}
                                                />
                                                <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4, fontSize: '0.8rem' }}>🔍</span>
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                                {totalTransactions} total
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    type="text"
                                                    placeholder="Search Users..."
                                                    value={userSearch}
                                                    onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
                                                    style={{ padding: '6px 10px 6px 28px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.8rem', background: 'var(--input-bg)', color: 'var(--text-deep-brown)' }}
                                                />
                                                <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4, fontSize: '0.8rem' }}>🔍</span>
                                            </div>
                                            {tab === 'vendors' && (
                                                <button
                                                    onClick={() => { fetchAvailableUsers(); setShowAddVendorModal(true); }}
                                                    style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--primary)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                                >
                                                    <span style={{ fontSize: '1.2rem' }}>+</span> Add Vendor
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {tab === 'transactions' && (
                                    <table style={{ marginTop: '0' }}>
                                        <thead>
                                            <tr>
                                                <th>User / Recipient</th>
                                                <th>Amount</th>
                                                <th>Status</th>
                                                <th>Proof</th>
                                                <th style={{ textAlign: 'right' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {transactions.map((tx) => (
                                                <tr key={tx.id} onClick={() => { setSelectedTx(tx); setShowTxModal(true); }} style={{ cursor: 'pointer' }}>
                                                    <td>
                                                        <div style={{ fontWeight: 600 }}>{tx.user?.email}</div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                            → {tx.recipient_details?.name} | <span style={{ textTransform: 'uppercase', fontWeight: 700, fontSize: '0.7rem' }}>
                                                                {tx.recipient_details?.type === 'momo' ? (tx.recipient_details?.momo_provider || 'Momo') :
                                                                    tx.recipient_details?.type === 'bank' ? (tx.recipient_details?.bank_name || 'Bank') :
                                                                        tx.recipient_details?.type === 'interac' ? 'Interac' : 'Recipient'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontWeight: 700 }}>{tx.amount_received} {tx.type?.split('-')[1] || 'CAD'}</div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{tx.amount_sent} {tx.type?.split('-')[0] || 'GHS'}</div>
                                                    </td>
                                                    <td><span className={`badge badge-${tx.status}`}>{tx.status}</span></td>
                                                    <td>
                                                        {tx.proof_url ? (
                                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                <span
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setPreviewImage(`http://localhost:5000${tx.proof_url}`);
                                                                        setPreviewDate(tx.proof_uploaded_at || tx.updatedAt);
                                                                        setShowPreviewModal(true);
                                                                    }}
                                                                    style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}
                                                                >
                                                                    View Proof
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>None</span>
                                                        )}
                                                    </td>
                                                    <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                            {tx.status === 'pending' && <button onClick={() => updateStatus(tx.id, 'processing')} style={{ fontSize: '0.75rem', padding: '6px 12px', background: 'var(--warning)', border: 'none', borderRadius: '4px', fontWeight: 700, cursor: 'pointer' }}>Process</button>}
                                                            {tx.status === 'processing' && <button onClick={() => updateStatus(tx.id, 'sent')} style={{ fontSize: '0.75rem', padding: '6px 12px', background: 'var(--success)', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 700, cursor: 'pointer' }}>Confirm</button>}
                                                            {tx.status === 'sent' && <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--success)' }}>Complete</span>}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}

                                {tab === 'kyc' && (
                                    <table style={{ marginTop: '0' }}>
                                        <thead>
                                            <tr>
                                                <th>User</th>
                                                <th>Document Info</th>
                                                <th>Verification Files</th>
                                                <th>Status</th>
                                                <th style={{ textAlign: 'right' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map((u) => (
                                                <tr key={u.id}>
                                                    <td style={{ fontWeight: 600 }}>
                                                        {u.full_name}<br />
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>{u.email}</span>
                                                    </td>
                                                    <td>
                                                        {u.kyc_document_type ? (
                                                            <div style={{ fontSize: '0.85rem' }}>
                                                                <strong>{u.kyc_document_type.replace('_', ' ').toUpperCase()}</strong><br />
                                                                ID: {u.kyc_document_id}
                                                            </div>
                                                        ) : (
                                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No Details</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', gap: '12px' }}>
                                                            {u.kyc_front_url && (
                                                                <span
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setPreviewImage(`http://localhost:5000${u.kyc_front_url}`);
                                                                        setPreviewDate(u.updatedAt);
                                                                        setShowPreviewModal(true);
                                                                    }}
                                                                    style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}
                                                                >
                                                                    Front
                                                                </span>
                                                            )}
                                                            {u.kyc_back_url && (
                                                                <span
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setPreviewImage(`http://localhost:5000${u.kyc_back_url}`);
                                                                        setPreviewDate(u.updatedAt);
                                                                        setShowPreviewModal(true);
                                                                    }}
                                                                    style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}
                                                                >
                                                                    Back
                                                                </span>
                                                            )}
                                                            {!u.kyc_front_url && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>None</span>}
                                                        </div>
                                                    </td>
                                                    <td><span className={`badge badge-${u.kyc_status}`}>{u.kyc_status}</span></td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                            <button onClick={() => updateKYC(u.id, 'verified')} style={{ fontSize: '0.75rem', padding: '6px 12px', background: 'var(--success)', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 700, cursor: 'pointer' }}>Verify</button>
                                                            <button onClick={() => updateKYC(u.id, 'rejected')} style={{ fontSize: '0.75rem', padding: '6px 12px', background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 700, cursor: 'pointer' }}>Reject</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}

                                {tab === 'users' && (
                                    <table style={{ marginTop: '0' }}>
                                        <thead>
                                            <tr>
                                                <th>User</th>
                                                <th>Contact</th>
                                                <th>ID Level</th>
                                                <th>Balances</th>
                                                <th style={{ textAlign: 'right' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map((u) => (
                                                <tr key={u.id}>
                                                    <td style={{ fontWeight: 600 }}>
                                                        {u.full_name}<br />
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>Joined: {new Date(u.createdAt).toLocaleDateString()}</span>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontSize: '0.85rem' }}>{u.email}</div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.phone}</div>
                                                    </td>
                                                    <td><span className={`badge badge-${u.kyc_status}`}>{u.kyc_status}</span></td>
                                                    <td>
                                                        <div style={{ fontWeight: 700 }}>{parseFloat(u.balance_ghs).toFixed(2)} GHS</div>
                                                        <div style={{ fontWeight: 700 }}>{parseFloat(u.balance_cad).toFixed(2)} CAD</div>
                                                    </td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <button
                                                            onClick={() => { setSelectedUser(u); setShowUserModal(true); }}
                                                            style={{ fontSize: '0.75rem', padding: '6px 12px', background: 'var(--text-deep-brown)', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 700, cursor: 'pointer' }}
                                                        >
                                                            Manage
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}

                                {tab === 'vendors' && (
                                    <table style={{ marginTop: '0' }}>
                                        <thead>
                                            <tr>
                                                <th>Vendor</th>
                                                <th>Status</th>
                                                <th>Role</th>
                                                <th style={{ textAlign: 'right' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {vendors.map((v) => (
                                                <tr key={v.id}>
                                                    <td style={{ fontWeight: 600 }}>
                                                        {v.full_name}<br />
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.email}</span>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: v.is_online ? 'var(--success)' : '#ccc' }}></div>
                                                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{v.is_online ? 'Online' : 'Offline'}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${v.is_active ? 'badge-verified' : 'badge-rejected'}`} style={{ fontSize: '0.7rem' }}>
                                                            {v.is_active ? 'ACTIVE' : 'DISABLED'}
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                            <button
                                                                onClick={() => toggleStatus(v.id)}
                                                                style={{ fontSize: '0.75rem', padding: '6px 12px', background: v.is_active ? 'var(--danger)' : 'var(--success)', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 700, cursor: 'pointer' }}
                                                            >
                                                                {v.is_active ? 'Disable' : 'Enable'}
                                                            </button>
                                                            <button
                                                                onClick={() => { setSelectedUser(v); setShowUserModal(true); }}
                                                                style={{ fontSize: '0.75rem', padding: '6px 12px', background: 'var(--text-deep-brown)', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 700, cursor: 'pointer' }}
                                                            >
                                                                View
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {vendors.length === 0 && (
                                                <tr>
                                                    <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No vendors found on the platform.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            {/* Pagination */}
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
                                {tab === 'transactions' ? (
                                    Array.from({ length: totalPages }, (_, i) => (
                                        <button
                                            key={i + 1}
                                            onClick={() => setPage(i + 1)}
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: '4px',
                                                border: '1px solid var(--border-color)',
                                                background: page === i + 1 ? 'var(--primary)' : '#fff',
                                                color: page === i + 1 ? '#fff' : 'var(--text-deep-brown)',
                                                fontWeight: 700,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {i + 1}
                                        </button>
                                    ))
                                ) : (
                                    Array.from({ length: userTotalPages }, (_, i) => (
                                        <button
                                            key={i + 1}
                                            onClick={() => setUserPage(i + 1)}
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: '4px',
                                                border: '1px solid var(--border-color)',
                                                background: userPage === i + 1 ? 'var(--primary)' : '#fff',
                                                color: userPage === i + 1 ? '#fff' : 'var(--text-deep-brown)',
                                                fontWeight: 700,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {i + 1}
                                        </button>
                                    ))
                                )}
                            </div>
                        </>
                    )}

                    {tab === 'payment-settings' && <PaymentSettings />}
                    {tab === 'profile' && <AdminProfile />}
                </div>

                {/* Admin Transaction Details Modal */}
                {showTxModal && selectedTx && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                        <div className="card scale-in" style={{ width: '100%', maxWidth: '500px', padding: 0, overflow: 'hidden' }}>
                            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0 }}>Transaction Details</h3>
                                <button onClick={() => setShowTxModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                            </div>
                            <div style={{ padding: '24px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                                    <div>
                                        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>User</label>
                                        <div style={{ fontWeight: 700 }}>{selectedTx.user?.full_name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedTx.user?.email}</div>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>Status</label>
                                        <div style={{ marginTop: '4px' }}><span className={`badge badge-${selectedTx.status}`}>{selectedTx.status.toUpperCase()}</span></div>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>Initiated At</label>
                                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{new Date(selectedTx.createdAt).toLocaleString()}</div>
                                    </div>
                                    {selectedTx.sent_at && (
                                        <div>
                                            <label style={{ fontSize: '0.7rem', color: 'var(--success)', textTransform: 'uppercase', fontWeight: 800 }}>Sent Date</label>
                                            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--success)' }}>{new Date(selectedTx.sent_at).toLocaleString()}</div>
                                        </div>
                                    )}
                                </div>

                                <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
                                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, display: 'block', marginBottom: '8px' }}>Financial Summary</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Currency Pair</div>
                                            <div style={{ fontWeight: 700 }}>{selectedTx.type?.replace('-', ' ➔ ') || 'GHS ➔ CAD'}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Exchange Rate</div>
                                            <div style={{ fontWeight: 700 }}>1 {selectedTx.type?.split('-')[0]} = {(selectedTx.amount_received / selectedTx.amount_sent).toFixed(4)} {selectedTx.type?.split('-')[1]}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Amount Sent</div>
                                            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-deep-brown)' }}>{selectedTx.amount_sent} {selectedTx.type?.split('-')[0]}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>To Recipient</div>
                                            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>{selectedTx.amount_received} {selectedTx.type?.split('-')[1]}</div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ background: '#f9f9f9', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>Recipient Details</label>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 800, background: 'var(--text-deep-brown)', color: '#fff', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                                            {selectedTx.recipient_details?.type || 'Transfer'}
                                        </span>
                                    </div>

                                    <div style={{ display: 'grid', gap: '8px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Full Name:</span>
                                            <span style={{ fontWeight: 700 }}>{selectedTx.recipient_details?.name}</span>
                                        </div>

                                        {selectedTx.recipient_details?.type === 'momo' && (
                                            <>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Momo Provider:</span>
                                                    <span style={{ fontWeight: 700, textTransform: 'uppercase' }}>{selectedTx.recipient_details?.momo_provider}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Momo Number:</span>
                                                    <span style={{ fontWeight: 700 }}>{selectedTx.recipient_details?.phone || selectedTx.recipient_details?.account}</span>
                                                </div>
                                            </>
                                        )}

                                        {selectedTx.recipient_details?.type === 'bank' && (
                                            <>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Bank Name:</span>
                                                    <span style={{ fontWeight: 700 }}>{selectedTx.recipient_details?.bank_name}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Account Number:</span>
                                                    <span style={{ fontWeight: 700 }}>{selectedTx.recipient_details?.account}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Transit Number:</span>
                                                    <span style={{ fontWeight: 700 }}>{selectedTx.recipient_details?.transit_number}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Institution:</span>
                                                    <span style={{ fontWeight: 700 }}>{selectedTx.recipient_details?.institution_number}</span>
                                                </div>
                                            </>
                                        )}

                                        {selectedTx.recipient_details?.type === 'interac' && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Interac Email:</span>
                                                <span style={{ fontWeight: 700 }}>{selectedTx.recipient_details?.interac_email}</span>
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', paddingTop: '8px', borderTop: '1px solid #eee' }}>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Reference:</span>
                                            <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{selectedTx.recipient_details?.admin_reference || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>

                                {selectedTx.recipient_details?.note && (
                                    <div style={{ marginBottom: '24px' }}>
                                        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>User Note</label>
                                        <div style={{ fontSize: '0.9rem', fontStyle: 'italic', marginTop: '4px', background: '#fff', padding: '8px', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
                                            "{selectedTx.recipient_details?.note}"
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button
                                        onClick={() => setShowTxModal(false)}
                                        style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: '#fff', fontWeight: 700, cursor: 'pointer' }}
                                    >
                                        Close
                                    </button>
                                    {selectedTx.status === 'pending' && (
                                        <button
                                            onClick={() => { updateStatus(selectedTx.id, 'processing'); setShowTxModal(false); }}
                                            style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: 'var(--warning)', fontWeight: 700, cursor: 'pointer' }}
                                        >
                                            Start Processing
                                        </button>
                                    )}
                                    {selectedTx.status === 'processing' && (
                                        <button
                                            onClick={() => { updateStatus(selectedTx.id, 'sent'); setShowTxModal(false); }}
                                            style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: 'var(--success)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                                        >
                                            Mark as Sent
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Admin User Management Modal */}
                {showUserModal && selectedUser && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                        <div className="card scale-in" style={{ width: '100%', maxWidth: '500px', padding: 0, overflow: 'hidden' }}>
                            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0 }}>User Management</h3>
                                <button onClick={() => setShowUserModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                            </div>
                            <div style={{ padding: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
                                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--accent-peach)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-deep-brown)' }}>
                                        {selectedUser.full_name?.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '1.2rem' }}>{selectedUser.full_name}</h4>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{selectedUser.email}</div>
                                        <div style={{ marginTop: '4px' }}><span className={`badge badge-${selectedUser.kyc_status}`}>{selectedUser.kyc_status.toUpperCase()}</span></div>
                                    </div>
                                </div>

                                <div style={{ background: '#f9f9f9', padding: '16px', borderRadius: '12px', marginBottom: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>GHS Balance</label>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{parseFloat(selectedUser.balance_ghs).toLocaleString()} GHS</div>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>CAD Balance</label>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{parseFloat(selectedUser.balance_cad).toLocaleString()} CAD</div>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '24px' }}>
                                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, display: 'block', marginBottom: '8px' }}>KYC Actions</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => { updateKYC(selectedUser.id, 'verified'); setShowUserModal(false); }}
                                            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: 'var(--success)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                                        >
                                            Verify User
                                        </button>
                                        <button
                                            onClick={() => { updateKYC(selectedUser.id, 'rejected'); setShowUserModal(false); }}
                                            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: 'var(--danger)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                                        >
                                            Reject KYC
                                        </button>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '24px' }}>
                                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, display: 'block', marginBottom: '8px' }}>Account Access Control</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => toggleStatus(selectedUser.id)}
                                            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: selectedUser.is_active ? 'var(--danger)' : 'var(--success)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                                        >
                                            {selectedUser.is_active ? 'Disable Account' : 'Enable Account'}
                                        </button>
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                                        {selectedUser.is_active
                                            ? 'Disabling this account will prevent the user from logging in or performing any transactions.'
                                            : 'Enabling this account will restore full access to the platform.'}
                                    </p>
                                </div>

                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button
                                        onClick={() => setShowUserModal(false)}
                                        style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: '#fff', fontWeight: 700, cursor: 'pointer' }}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {/* Add Vendor Modal (Registration Form) */}
                {showAddVendorModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                        <div className="card scale-in" style={{ width: '100%', maxWidth: '500px', padding: 0, overflow: 'hidden' }}>
                            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0 }}>Register New Workforce (Vendor)</h3>
                                <button onClick={() => setShowAddVendorModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                            </div>
                            <form onSubmit={handleCreateVendor}>
                                <div style={{ padding: '24px' }}>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '24px' }}>Fill in the details below to create a dedicated Vendor account. Vendors are managed separately from platform customers.</p>

                                    <div style={{ display: 'grid', gap: '16px' }}>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Full Name</label>
                                            <input
                                                type="text"
                                                required
                                                value={newVendor.full_name}
                                                onChange={(e) => setNewVendor({ ...newVendor, full_name: e.target.value })}
                                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                                                placeholder="e.g. John Doe"
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Email Address</label>
                                            <input
                                                type="email"
                                                required
                                                value={newVendor.email}
                                                onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })}
                                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                                                placeholder="vendor@qwiktransfers.com"
                                            />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Phone Number</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={newVendor.phone}
                                                    onChange={(e) => setNewVendor({ ...newVendor, phone: e.target.value })}
                                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                                                    placeholder="+233..."
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Password</label>
                                                <input
                                                    type="password"
                                                    required
                                                    value={newVendor.password}
                                                    onChange={(e) => setNewVendor({ ...newVendor, password: e.target.value })}
                                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ padding: '24px', borderTop: '1px solid var(--border-color)', background: '#f9f9f9', display: 'flex', gap: '12px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddVendorModal(false)}
                                        style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: '#fff', fontWeight: 700, cursor: 'pointer' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: 'var(--text-deep-brown)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                                    >
                                        Create Vendor
                                    </button>
                                </div>
                            </form>
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
                                    alt="Preview"
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
            </main>
        </div>
    );
};

export default AdminDashboard;
