import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api, { getImageUrl } from '../services/api';
import { toast } from 'react-hot-toast';
import AdminSidebar from '../components/AdminSidebar';
import PaymentSettings from '../components/PaymentSettings';
import AdminProfile from '../components/AdminProfile';
import ThemeSwitcher from '../components/ThemeSwitcher';
import NotificationPanel from '../components/NotificationPanel';
import TransactionTable from '../components/admin/TransactionTable';
import KYCTable from '../components/admin/KYCTable';
import UserTable from '../components/admin/UserTable';
import VendorTable from '../components/admin/VendorTable';

const AdminDashboard = () => {
    const { logout, user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [users, setUsers] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [auditTotalPages, setAuditTotalPages] = useState(1);
    const [auditPage, setAuditPage] = useState(1);
    const [auditSearch, setAuditSearch] = useState('');
    const [auditAction, setAuditAction] = useState('');
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


    // Selected items for Modals
    const [selectedTx, setSelectedTx] = useState(null);
    const [showTxModal, setShowTxModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [showAddVendorModal, setShowAddVendorModal] = useState(false);
    const [newVendor, setNewVendor] = useState({ email: '', full_name: '', phone: '', password: '', country: 'All' });

    // Preview Modal States
    const [previewImage, setPreviewImage] = useState('');
    const [previewDate, setPreviewDate] = useState(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);

    // Individual User/Vendor Transaction History & Stats
    const [userTransactions, setUserTransactions] = useState([]);
    const [userTransactionsLoading, setUserTransactionsLoading] = useState(false);
    const [vendorStats, setVendorStats] = useState({ totalCount: 0, totalVolumeCAD: 0, totalVolumeGHS: 0, successRate: 0 });

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
        } else if (tab === 'audit') {
            fetchAuditLogs();
        }
    }, [page, search, statusFilter, userPage, userSearch, auditPage, auditSearch, auditAction, tab]);

    useEffect(() => {
        if (selectedUser && showUserModal) {
            fetchUserTransactions(selectedUser.id, selectedUser.role);
        } else {
            setUserTransactions([]);
            setVendorStats({ totalCount: 0, totalVolumeCAD: 0, totalVolumeGHS: 0, successRate: 0 });
        }
    }, [selectedUser, showUserModal]);

    const fetchStats = async () => {
        try {
            const res = await api.get('/transactions/stats');
            setAdminStats(res.data);
        } catch (error) {
            console.error('Stats error:', error);
        }
    };

    const fetchTransactions = async () => {
        try {
            const res = await api.get(`/transactions?page=${page}&limit=10&search=${search}&status=${statusFilter}`);
            setTransactions(res.data.transactions);
            setTotalPages(res.data.pages);
            setTotalTransactions(res.data.total);
        } catch (error) {
            console.error(error);
        } finally {
        }
    };

    const fetchUsersServerSide = async (kycStatus = '') => {
        try {
            // Strictly fetch 'user' role for the Users tab
            const roleParam = tab === 'users' ? 'user' : '';
            const res = await api.get(`/auth/users?page=${userPage}&limit=10&search=${userSearch}&kycStatus=${kycStatus}&role=${roleParam}`);
            setUsers(res.data.users);
            setUserTotalPages(res.data.pages);
        } catch (error) {
            console.error(error);
        } finally {
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

    const fetchAuditLogs = async () => {
        try {
            const res = await api.get(`/system/admin/audit-logs?page=${auditPage}&limit=20&search=${auditSearch}&action=${auditAction}`);
            setAuditLogs(res.data.logs);
            setAuditTotalPages(res.data.pages);
        } catch (error) {
            console.error('Audit error:', error);
        } finally {
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
            setNewVendor({ email: '', full_name: '', phone: '', password: '', country: 'All' });
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



    const updateRegion = async (userId, country) => {
        try {
            await api.patch('/auth/update-region', { userId, country });
            toast.success(`Vendor region updated to ${country}`);
            if (tab === 'vendors') fetchVendors();
            if (selectedUser && selectedUser.id === userId) {
                setSelectedUser({ ...selectedUser, country });
            }
        } catch (error) {
            toast.error('Failed to update region');
        }
    };

    const fetchUserTransactions = async (userId, role) => {
        setUserTransactionsLoading(true);
        try {
            const params = role === 'vendor' ? { vendorId: userId, limit: 100 } : { userId: userId, limit: 100 };
            const res = await api.get('/transactions', { params });
            const txs = res.data.transactions;
            setUserTransactions(txs);
            if (role === 'vendor') {
                calculateVendorStats(txs);
            }
        } catch (error) {
            console.error('Fetch user transactions error:', error);
        } finally {
            setUserTransactionsLoading(false);
        }
    };

    const calculateVendorStats = (txs) => {
        const totalCount = txs.length;
        if (totalCount === 0) {
            setVendorStats({ totalCount: 0, totalVolumeCAD: 0, totalVolumeGHS: 0, successRate: 0 });
            return;
        }

        const successful = txs.filter(t => t.status === 'sent');
        const totalVolumeCAD = successful.reduce((sum, t) => t.type.startsWith('CAD') ? sum + parseFloat(t.amount_sent) : sum, 0);
        const totalVolumeGHS = successful.reduce((sum, t) => t.type.startsWith('GHS') ? sum + parseFloat(t.amount_sent) : sum, 0);
        const successRate = ((successful.length / totalCount) * 100).toFixed(1);

        setVendorStats({ totalCount, totalVolumeCAD, totalVolumeGHS, successRate });
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-peach)', transition: 'background-color 0.3s ease' }}>
            {/* Mobile Header */}
            <div className="mobile-header">
                <button className="mobile-nav-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                    {sidebarOpen ? '✕' : '☰'}
                </button>
                <h1 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--primary)' }}>QWIK Admin</h1>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <NotificationPanel />
                    <ThemeSwitcher />
                </div>
            </div>

            <AdminSidebar
                activeTab={tab}
                setActiveTab={(t) => { setTab(t); setSidebarOpen(false); }}
                logout={logout}
                isOpen={sidebarOpen}
                toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            />

            <div className="admin-main-container">
                <header className="admin-header desktop-only">
                    <div className="admin-header-content">
                        <div className="admin-top-nav-actions">
                            <div className="admin-utility-icons">
                                <NotificationPanel />
                                <ThemeSwitcher />
                            </div>
                            <div className="admin-profile-chip" onClick={() => setTab('profile')}>
                                <img
                                    src={user?.profile_picture ? getImageUrl(user.profile_picture) : 'https://via.placeholder.com/40'}
                                    alt="Admin Avatar"
                                    className="admin-profile-avatar"
                                />
                                <div className="admin-profile-info">
                                    <span className="admin-profile-name">{user?.full_name || 'Administrator'}</span>
                                    <span className="admin-profile-role">Master Admin</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="admin-main" style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
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
                        {['transactions', 'kyc', 'users', 'vendors', 'audit'].includes(tab) && (
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
                                        <TransactionTable
                                            transactions={transactions}
                                            updateStatus={updateStatus}
                                            setSelectedTx={setSelectedTx}
                                            setShowTxModal={setShowTxModal}
                                            setPreviewImage={setPreviewImage}
                                            setPreviewDate={setPreviewDate}
                                            setShowPreviewModal={setShowPreviewModal}
                                        />
                                    )}

                                    {tab === 'kyc' && (
                                        <KYCTable
                                            users={users}
                                            updateKYC={updateKYC}
                                            setPreviewImage={setPreviewImage}
                                            setPreviewDate={setPreviewDate}
                                            setShowPreviewModal={setShowPreviewModal}
                                        />
                                    )}

                                    {tab === 'users' && (
                                        <UserTable
                                            users={users}
                                            setSelectedUser={setSelectedUser}
                                            setShowUserModal={setShowUserModal}
                                        />
                                    )}

                                    {tab === 'vendors' && (
                                        <VendorTable
                                            vendors={vendors}
                                            toggleStatus={toggleStatus}
                                            setSelectedUser={setSelectedUser}
                                            setShowUserModal={setShowUserModal}
                                        />
                                    )}

                                    {tab === 'audit' && (
                                        <div className="fade-in">
                                            <div style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', background: '#fcfcfc', borderBottom: '1px solid #eee' }}>
                                                <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
                                                    <div style={{ position: 'relative', flex: 0.7 }}>
                                                        <input
                                                            type="text"
                                                            placeholder="Search logs..."
                                                            value={auditSearch}
                                                            onChange={(e) => { setAuditSearch(e.target.value); setAuditPage(1); }}
                                                            style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '8px', border: '1px solid #eee', fontSize: '0.85rem' }}
                                                        />
                                                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>🔍</span>
                                                    </div>
                                                    <select
                                                        value={auditAction}
                                                        onChange={(e) => { setAuditAction(e.target.value); setAuditPage(1); }}
                                                        style={{ flex: 0.3, padding: '10px', borderRadius: '8px', border: '1px solid #eee', fontSize: '0.85rem' }}
                                                    >
                                                        <option value="">All Actions</option>
                                                        <option value="LOGIN">Login</option>
                                                        <option value="REGISTER">Register</option>
                                                        <option value="TRANSACTION_CREATE">TX Create</option>
                                                        <option value="TRANSACTION_STATUS_CHANGE">TX Status Change</option>
                                                        <option value="VENDOR_ACCEPT_TRANSACTION">Vendor Accept</option>
                                                        <option value="VENDOR_COMPLETE_TRANSACTION">Vendor Complete</option>
                                                        <option value="CREATE_VENDOR">Create Vendor</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <table style={{ marginTop: '0' }}>
                                                <thead>
                                                    <tr>
                                                        <th>Timestamp</th>
                                                        <th>User & Action</th>
                                                        <th>Details</th>
                                                        <th>IP Address</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {auditLogs.map(log => (
                                                        <tr key={log.id}>
                                                            <td style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                                                                {new Date(log.createdAt).toLocaleString()}
                                                            </td>
                                                            <td>
                                                                <div style={{ fontWeight: 700 }}>{log.user?.full_name || 'System'}</div>
                                                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{log.user?.email}</div>
                                                                <div className={`badge badge-${log.action.toLowerCase().replace(/_/g, '-')}`} style={{ marginTop: '4px', fontSize: '0.6rem' }}>{log.action}</div>
                                                            </td>
                                                            <td style={{ fontSize: '0.8rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {log.details}
                                                            </td>
                                                            <td style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
                                                                {log.ipAddress}
                                                                <button
                                                                    onClick={() => { navigator.clipboard.writeText(log.ipAddress); toast.success('IP Copied!'); }}
                                                                    style={{ marginLeft: '8px', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.3 }}
                                                                    title="Copy IP"
                                                                >
                                                                    📋
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {auditLogs.length === 0 && (
                                                        <tr>
                                                            <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No audit logs found matching your criteria.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
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
                                    ) : tab === 'audit' ? (
                                        Array.from({ length: auditTotalPages }, (_, i) => (
                                            <button
                                                key={i + 1}
                                                onClick={() => setAuditPage(i + 1)}
                                                style={{
                                                    padding: '6px 12px',
                                                    borderRadius: '4px',
                                                    border: '1px solid var(--border-color)',
                                                    background: auditPage === i + 1 ? 'var(--primary)' : '#fff',
                                                    color: auditPage === i + 1 ? '#fff' : 'var(--text-deep-brown)',
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
                </main>
            </div>
            {/* Admin Transaction Details Modal */}
            {showTxModal && selectedTx && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div className="card scale-in" style={{ width: '100%', maxWidth: '500px', padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>Transaction Details (ID: {selectedTx.transaction_id})</h3>
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
                    <div className="card scale-in" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>User Management</h3>
                            <button onClick={() => setShowUserModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        </div>
                        <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
                                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--accent-peach)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-deep-brown)' }}>
                                    {selectedUser.full_name?.charAt(0)}
                                </div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '1.2rem' }}>{selectedUser.full_name}</h4>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 800, margin: '4px 0' }}>{selectedUser.account_number || 'N/A'}</div>
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

                            {selectedUser.role === 'vendor' && (
                                <div style={{ marginBottom: '24px' }}>
                                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, display: 'block', marginBottom: '8px' }}>Assigned Region</label>
                                    <select
                                        value={selectedUser.country || 'All'}
                                        onChange={(e) => updateRegion(selectedUser.id, e.target.value)}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: '#fff' }}
                                    >
                                        <option value="Canada">Canada</option>
                                        <option value="Ghana">Ghana</option>
                                        <option value="All">All Countries</option>
                                    </select>
                                </div>
                            )}

                            {selectedUser.role === 'vendor' && (
                                <div style={{ marginBottom: '32px' }}>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, display: 'block', marginBottom: '16px' }}>Performance Overview</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                                        <div style={{ padding: '12px', background: 'var(--bg-peach)', borderRadius: '8px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Total Handled</div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{vendorStats.totalCount}</div>
                                        </div>
                                        <div style={{ padding: '12px', background: 'var(--bg-peach)', borderRadius: '8px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>CAD Volume</div>
                                            <div style={{ fontSize: '1rem', fontWeight: 800 }}>${vendorStats.totalVolumeCAD.toLocaleString()}</div>
                                        </div>
                                        <div style={{ padding: '12px', background: 'var(--bg-peach)', borderRadius: '8px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>GHS Volume</div>
                                            <div style={{ fontSize: '1rem', fontWeight: 800 }}>{vendorStats.totalVolumeGHS.toLocaleString()}₵</div>
                                        </div>
                                        <div style={{ padding: '12px', background: 'var(--success)', color: '#fff', borderRadius: '8px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.65rem', opacity: 0.8, fontWeight: 700, textTransform: 'uppercase' }}>Success Rate</div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{vendorStats.successRate}%</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, display: 'block', marginBottom: '12px' }}>
                                    {selectedUser.role === 'vendor' ? 'Service History' : 'Transaction History'}
                                </label>
                                <div style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
                                    <table style={{ margin: 0, fontSize: '0.8rem' }}>
                                        <thead style={{ background: '#f9f9f9' }}>
                                            <tr>
                                                <th style={{ padding: '10px' }}>ID/Type</th>
                                                <th style={{ padding: '10px' }}>Amount</th>
                                                <th style={{ padding: '10px' }}>Status</th>
                                                <th style={{ padding: '10px' }}>Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {userTransactionsLoading ? (
                                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>Loading history...</td></tr>
                                            ) : userTransactions.length === 0 ? (
                                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No transactions found.</td></tr>
                                            ) : userTransactions.map(tx => (
                                                <tr key={tx.id}>
                                                    <td style={{ padding: '10px' }}>
                                                        <div style={{ fontWeight: 700 }}>#{tx.id}</div>
                                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{tx.type}</div>
                                                    </td>
                                                    <td style={{ padding: '10px', fontWeight: 700 }}>
                                                        {parseFloat(tx.amount_sent).toLocaleString()} {tx.type?.split('-')[0]}
                                                    </td>
                                                    <td style={{ padding: '10px' }}>
                                                        <span className={`badge badge-${tx.status}`} style={{ fontSize: '0.65rem' }}>{tx.status}</span>
                                                    </td>
                                                    <td style={{ padding: '10px', color: 'var(--text-muted)' }}>
                                                        {new Date(tx.createdAt).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: 'auto', paddingTop: '24px' }}>
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
                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Assigned Region (Country)</label>
                                        <select
                                            required
                                            value={newVendor.country}
                                            onChange={(e) => setNewVendor({ ...newVendor, country: e.target.value })}
                                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', background: '#fff' }}
                                        >
                                            <option value="Canada">Canada (CAD Transactions)</option>
                                            <option value="Ghana">Ghana (GHS Transactions)</option>
                                            <option value="All">All Countries (Global)</option>
                                        </select>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                            Vendors assigned to a country can only claim transactions originating from that country.
                                        </p>
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
        </div>
    );
};

export default AdminDashboard;
