import React from 'react';
import { getImageUrl } from '../../services/api';

const TransactionTable = ({ transactions, updateStatus, setSelectedTx, setShowTxModal, setPreviewImage, setPreviewDate, setShowPreviewModal }) => {
    return (
        <table style={{ marginTop: '0' }}>
            <thead>
                <tr>
                    <th>Transaction ID</th>
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
                            <div style={{ fontWeight: 600 }}>{tx.transaction_id}</div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{new Date(tx.createdAt).toLocaleString()}</div>
                        </td>
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
                                            setPreviewImage(getImageUrl(tx.proof_url));
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
                {transactions.length === 0 && (
                    <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No transactions found.</td>
                    </tr>
                )}
            </tbody>
        </table>
    );
};

export default TransactionTable;
