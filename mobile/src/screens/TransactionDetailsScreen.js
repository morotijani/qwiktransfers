import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    TextInput,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import * as ImagePicker from 'expo-image-picker';

const TransactionDetailsScreen = ({ route, navigation }) => {
    const { transactionId, initialData } = route.params || {};
    const theme = useTheme();
    const [transaction, setTransaction] = useState(initialData || null);
    const [loading, setLoading] = useState(!initialData);
    const [refreshing, setRefreshing] = useState(false);

    // PIN & Upload State
    const [showPinModal, setShowPinModal] = useState(false);
    const [pin, setPin] = useState('');
    const [pinLoading, setPinLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    // Preview State
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);

    useEffect(() => {
        fetchTransactionDetails();
    }, [transactionId]);

    const fetchTransactionDetails = async () => {
        try {
            // If we don't have an ID (rare), go back
            if (!transactionId && !initialData?.id) return;

            const id = transactionId || initialData.id;
            const res = await api.get(`/transactions/${id}`);

            // Handle potentially different response structures
            // Some APIs return { transaction: {...} } or just {...}
            const data = res.data.transaction || res.data;
            setTransaction(data);
        } catch (error) {
            console.error('Failed to fetch details:', error);
            // If we have initialData, don't show error for 404, just rely on what we have
            if (initialData && error.response && error.response.status === 404) {
                // Do nothing, keep using initialData
            } else {
                Alert.alert('Error', 'Could not load transaction details.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePickImage = async () => {
        // Request permissions
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'We need access to your photos to upload proof.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images, // Images only for now, PDF support requires more work on native
            quality: 0.8,
            allowsEditing: false,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setSelectedImage(result.assets[0]);
            setShowPinModal(true); // Prompt PIN immediately after selection
        }
    };

    const handlePinSubmit = async () => {
        if (pin.length < 4) return;
        setPinLoading(true);
        try {
            // 1. Verify PIN
            await api.post('/auth/verify-pin', { pin: pin.toString() });

            // 2. If valid, proceed to upload
            await uploadProof();

        } catch (error) {
            Alert.alert('Error', error.response?.data?.error || 'PIN Verification Failed');
            setPinLoading(false);
            setPin('');
        }
    };

    const uploadProof = async () => {
        if (!selectedImage) return;

        const formData = new FormData();
        // Append file securely
        const localUri = selectedImage.uri;
        const filename = localUri.split('/').pop();

        // Infer the type of the image
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;

        formData.append('proof', { uri: localUri, name: filename, type });

        try {
            await api.post(`/transactions/${transaction.id}/upload-proof`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            Alert.alert('Success', 'Payment proof uploaded successfully!');
            setShowPinModal(false);
            setPin('');
            setSelectedImage(null);
            setPinLoading(false);

            // Manually update local state since GET /transactions/:id might handle 404s
            setTransaction(prev => ({
                ...prev,
                proof_url: 'uploaded_successfully',
                localProofUri: localUri, // Store local URI for immediate preview
                proof_uploaded_at: new Date().toISOString(),
                status: prev.status === 'initiated' ? 'pending' : prev.status
            }));

            fetchTransactionDetails();
        } catch (error) {
            console.error('Upload error:', error);
            Alert.alert('Upload Failed', 'There was an issue uploading your proof. Please try again.');
            setPinLoading(false);
        }
    };

    const handleViewProof = () => {
        if (transaction.localProofUri) {
            setPreviewImage(transaction.localProofUri);
        } else if (transaction.proof_url) {
            // Handle relative paths from DB - using fixed IP for now as per api.js
            const baseUrl = 'http://192.168.79.98:5000';
            const url = transaction.proof_url.startsWith('http')
                ? transaction.proof_url
                : `${baseUrl}${transaction.proof_url}`;
            setPreviewImage(url);
        }
        setShowPreviewModal(true);
    };

    // Helper to determine active step index
    const getStatusIndex = (status, proofUrl) => {
        // Status map: initiated -> proof_uploaded (implied) -> pending -> processing -> sent
        if (status === 'sent') return 4;
        if (status === 'processing') return 3;
        if (status === 'pending') return 2; // Usually "Pending Review"
        if (proofUrl) return 1; // Proof uploaded but not yet pending review (or system logic variants)
        return 0; // Initiated
    };

    const renderTimeline = () => {
        if (!transaction) return null;

        const steps = [
            { label: 'Initiated', icon: 'create-outline', date: transaction.created_at },
            { label: 'Proof Uploaded', icon: 'cloud-upload-outline', date: transaction.proof_uploaded_at },
            { label: 'Pending Review', icon: 'time-outline', date: null },
            { label: 'Processing', icon: 'sync-outline', date: null },
            { label: 'Sent', icon: 'checkmark-circle', date: transaction.sent_at }
        ];

        // determine current active step based on status
        let activeIndex = 0;
        const status = transaction.status;
        if (status === 'sent') activeIndex = 4;
        else if (status === 'processing') activeIndex = 3;
        else if (status === 'pending') activeIndex = 2;
        else if (transaction.proof_url) activeIndex = 1;
        else activeIndex = 0;

        // Handle cancelled state specially
        if (status === 'cancelled') {
            return (
                <View style={[styles.card, { backgroundColor: '#fee2e2', borderColor: '#fca5a5' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
                        <Ionicons name="close-circle" size={24} color="#ef4444" />
                        <Text style={{ color: '#ef4444', fontFamily: 'Outfit_700Bold', fontSize: 16 }}>Transaction Cancelled</Text>
                    </View>
                </View>
            )
        }

        return (
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>Status Timeline</Text>
                <View style={styles.timelineContainer}>
                    {steps.map((step, index) => {
                        const isActive = index <= activeIndex;
                        const isLast = index === steps.length - 1;

                        return (
                            <View key={index} style={styles.timelineItem}>
                                <View style={styles.timelineLeft}>
                                    <View style={[
                                        styles.timelineDot,
                                        {
                                            backgroundColor: isActive ? theme.primary : theme.border,
                                            borderColor: isActive ? theme.primary : theme.border
                                        }
                                    ]}>
                                        <Ionicons name={step.icon} size={14} color="#fff" />
                                    </View>
                                    {!isLast && (
                                        <View style={[
                                            styles.timelineLine,
                                            { backgroundColor: index < activeIndex ? theme.primary : theme.border }
                                        ]} />
                                    )}
                                </View>
                                <View style={styles.timelineContent}>
                                    <Text style={[
                                        styles.stepLabel,
                                        {
                                            color: isActive ? theme.text : theme.textMuted,
                                            fontFamily: isActive ? 'Outfit_600SemiBold' : 'Outfit_400Regular'
                                        }
                                    ]}>
                                        {step.label}
                                    </Text>
                                    {step.date && (
                                        <Text style={[styles.stepDate, { color: theme.textMuted }]}>
                                            {new Date(step.date).toLocaleDateString()}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        );
                    })}
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    if (!transaction) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
                <Text style={{ color: theme.text }}>Transaction not found.</Text>
            </View>
        );
    }

    const { amount_sent, amount_received, type, recipient_details, admin_reference, proof_url } = transaction;
    const [fromCur, toCur] = (type || 'GHS-CAD').split('-');

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Transaction Details</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Timeline */}
                {renderTimeline()}

                {/* Main Details */}
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Transfer Details</Text>

                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Date</Text>
                        <Text style={[styles.detailValue, { color: theme.text }]}>
                            {new Date(transaction.created_at).toLocaleString()}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Amount Sent</Text>
                        <Text style={[styles.detailValue, { color: theme.text }]}>{amount_sent} {fromCur}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Exchange Rate</Text>
                        <Text style={[styles.detailValue, { color: theme.text }]}>
                            1 {fromCur} = {(amount_received / amount_sent).toFixed(4)} {toCur}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Recipient Gets</Text>
                        <Text style={[styles.detailValue, { color: theme.primary, fontFamily: 'Outfit_700Bold' }]}>
                            {parseFloat(amount_received || 0).toFixed(2)} {toCur}
                        </Text>
                    </View>

                    <View style={[styles.divider, { backgroundColor: theme.border }]} />

                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Recipient Name</Text>
                        <Text style={[styles.detailValue, { color: theme.text }]}>{recipient_details?.name || 'N/A'}</Text>
                    </View>

                    {recipient_details?.type === 'momo' && (
                        <>
                            <View style={styles.detailRow}>
                                <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Provider</Text>
                                <Text style={[styles.detailValue, { color: theme.text }]}>{recipient_details.momo_provider}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Mobile Number</Text>
                                <Text style={[styles.detailValue, { color: theme.text }]}>{recipient_details.account}</Text>
                            </View>
                        </>
                    )}

                    {recipient_details?.type === 'bank' && (
                        <>
                            <View style={styles.detailRow}>
                                <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Bank Name</Text>
                                <Text style={[styles.detailValue, { color: theme.text }]}>{recipient_details.bank_name}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Account Number</Text>
                                <Text style={[styles.detailValue, { color: theme.text }]}>{recipient_details.account}</Text>
                            </View>
                        </>
                    )}

                    {recipient_details?.type === 'interac' && (
                        <View style={styles.detailRow}>
                            <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Interac Email</Text>
                            <Text style={[styles.detailValue, { color: theme.text }]}>{recipient_details.interac_email}</Text>
                        </View>
                    )}

                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Reference</Text>
                        <Text style={[styles.detailValue, { color: theme.text, fontFamily: 'Outfit_700Bold', letterSpacing: 1 }]}>
                            {recipient_details?.admin_reference || admin_reference || 'N/A'}
                        </Text>
                    </View>
                </View>

                {/* Proof Upload Action */}
                {!proof_url && transaction.status !== 'cancelled' && transaction.status !== 'sent' && (
                    <View style={styles.actionContainer}>
                        <Text style={[styles.actionHint, { color: theme.textMuted }]}>
                            Please upload proof of payment to proceed.
                        </Text>
                        <TouchableOpacity
                            style={[styles.uploadBtn, { backgroundColor: theme.primary }]}
                            onPress={handlePickImage}
                        >
                            <Ionicons name="cloud-upload" size={20} color="#fff" style={{ marginRight: 8 }} />
                            <Text style={styles.uploadBtnText}>Upload Proof</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Proof Preview if Exists */}
                {proof_url && (
                    <TouchableOpacity
                        style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, alignItems: 'center' }]}
                        onPress={handleViewProof}
                    >
                        <Ionicons name="document-text-outline" size={40} color={theme.primary} />
                        <Text style={[styles.detailValue, { color: theme.text, marginTop: 8 }]}>Proof Uploaded</Text>
                        <Text style={[styles.detailLabel, { color: theme.textMuted, fontSize: 12 }]}>Tap to view proof</Text>
                    </TouchableOpacity>
                )}

                {/* Preview Modal */}
                <Modal
                    visible={showPreviewModal}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowPreviewModal(false)}
                >
                    <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.9)' }]}>
                        <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                            <TouchableOpacity
                                style={{ position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10 }}
                                onPress={() => setShowPreviewModal(false)}
                            >
                                <Ionicons name="close-circle" size={36} color="#fff" />
                            </TouchableOpacity>
                            {previewImage && (
                                <Image
                                    source={{ uri: previewImage }}
                                    style={{ width: '90%', height: '80%', resizeMode: 'contain' }}
                                />
                            )}
                        </View>
                    </View>
                </Modal>

            </ScrollView>

            {/* PIN Modal */}
            <Modal
                visible={showPinModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowPinModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>Enter PIN to Upload</Text>
                        <Text style={[styles.modalSub, { color: theme.textMuted }]}>Verify it's you to complete the upload</Text>

                        <TextInput
                            style={[styles.pinInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.input }]}
                            keyboardType="numeric"
                            maxLength={4}
                            secureTextEntry
                            value={pin}
                            onChangeText={setPin}
                            placeholder="****"
                            placeholderTextColor={theme.textMuted}
                            autoFocus
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalBtn, { backgroundColor: theme.input }]}
                                onPress={() => { setShowPinModal(false); setPin(''); setSelectedImage(null); }}
                            >
                                <Text style={[styles.modalBtnText, { color: theme.text }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, { backgroundColor: theme.primary }]}
                                onPress={handlePinSubmit}
                                disabled={pinLoading}
                            >
                                {pinLoading ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Text style={[styles.modalBtnText, { color: '#fff' }]}>Confirm</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        height: 60,
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: 'Outfit_600SemiBold',
    },
    scrollContent: {
        padding: 20,
        gap: 20,
    },
    card: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 20,
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 16,
        fontFamily: 'Outfit_700Bold',
        marginBottom: 16,
    },
    timelineContainer: {
        paddingLeft: 8,
    },
    timelineItem: {
        flexDirection: 'row',
        minHeight: 60,
    },
    timelineLeft: {
        alignItems: 'center',
        width: 30,
    },
    timelineDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    timelineLine: {
        width: 2,
        flex: 1,
        marginVertical: 4,
    },
    timelineContent: {
        marginLeft: 12,
        paddingBottom: 24,
    },
    stepLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    stepDate: {
        fontSize: 12,
        marginTop: 2,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    detailLabel: {
        fontSize: 14,
        fontFamily: 'Outfit_400Regular',
    },
    detailValue: {
        fontSize: 14,
        fontFamily: 'Outfit_600SemiBold',
        textAlign: 'right',
        maxWidth: '60%',
    },
    divider: {
        height: 1,
        marginVertical: 12,
    },
    actionContainer: {
        alignItems: 'center',
        gap: 12,
        marginTop: 10,
    },
    actionHint: {
        fontSize: 14,
        textAlign: 'center',
    },
    uploadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 30,
    },
    uploadBtnText: {
        color: '#fff',
        fontFamily: 'Outfit_700Bold',
        fontSize: 16,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxWidth: 340,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: 'Outfit_700Bold',
        marginBottom: 8,
    },
    modalSub: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
    },
    pinInput: {
        width: '100%',
        height: 60,
        borderWidth: 1.5,
        borderRadius: 12,
        textAlign: 'center',
        fontSize: 24,
        fontFamily: 'Outfit_700Bold',
        marginBottom: 24,
        letterSpacing: 8,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    modalBtn: {
        flex: 1,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBtnText: {
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
    },
});

export default TransactionDetailsScreen;
