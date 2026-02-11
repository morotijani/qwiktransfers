import React from 'react';

const AdminSidebar = ({ activeTab, setActiveTab, logout }) => {
    const menuItems = [
        { id: 'transactions', label: 'Transactions', icon: '📊' },
        { id: 'kyc', label: 'KYC Review', icon: '🆔' },
        { id: 'users', label: 'Users', icon: '👥' },
        { id: 'vendors', label: 'Vendors', icon: '🏢' },
        { id: 'payment-settings', label: 'Payment Settings', icon: '💳' },
        { id: 'profile', label: 'Profile', icon: '👤' },
    ];

    return (
        <aside style={{ width: '260px', background: '#fff', borderRight: '1px solid var(--border-color)', height: '100vh', position: 'fixed', left: 0, top: 0, display: 'flex', flexDirection: 'column', zIndex: 1000 }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.5px' }}>QWIK Admin</h1>
            </div>

            <nav style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {menuItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 16px',
                            background: activeTab === item.id ? 'var(--text-deep-brown)' : 'transparent',
                            color: activeTab === item.id ? '#fff' : 'var(--text-muted)',
                            borderRadius: '8px',
                            border: 'none',
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textAlign: 'left',
                            width: '100%',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                        {item.label}
                    </button>
                ))}
            </nav>

            <div style={{ padding: '24px', borderTop: '1px solid var(--border-color)' }}>
                <button
                    onClick={logout}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 16px',
                        background: 'var(--danger)', // slightly lighter red background for sign out? No, keep standard danger color or outlined.
                        color: '#fff',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        width: '100%'
                    }}
                >
                    <span style={{ fontSize: '1.1rem' }}>🚪</span>
                    Sign Out
                </button>
            </div>
        </aside>
    );
};

export default AdminSidebar;
