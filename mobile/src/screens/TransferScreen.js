import React, { useState, useEffect } from 'react';
import Big from 'big.js';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    StatusBar,
    ActivityIndicator,
    Modal,
    Platform,
    KeyboardAvoidingView,
    Keyboard,
    TouchableWithoutFeedback
} from 'react-native';
import { errorToast, successToast } from '../utils/toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authenticateAsync } from '../services/biometrics';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import api from '../services/api';
import SelectionPicker from '../components/SelectionPicker';
import NetInfo from '@react-native-community/netinfo';

const TransferScreen = ({ navigation }) => {
    const theme = useTheme();
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [newTransaction, setNewTransaction] = useState(null);

    // Form State
    const [amount, setAmount] = useState('');
    const fromCurrency = 'CAD';
    const toCurrency = 'GHS';

    const [rate, setRate] = useState(8.90);
    const [note, setNote] = useState('');

    // Recipient State
    const [recipientType, setRecipientType] = useState('momo');
    const [recipientName, setRecipientName] = useState('');
    const [accountNumber, setAccountNumber] = useState(''); // Generic for momo/bank account
    const [momoProvider, setMomoProvider] = useState('');
    const [bankName, setBankName] = useState('');
    const [transitNumber, setTransitNumber] = useState('');
    const [institutionNumber, setInstitutionNumber] = useState('');
    const [interacEmail, setInteracEmail] = useState('');

    // System Data
    const [ghsPaymentMethod, setGhsPaymentMethod] = useState(null);
    const [cadPaymentMethod, setCadPaymentMethod] = useState(null);
    const [adminReference, setAdminReference] = useState('');
    const [rateLockedUntil, setRateLockedUntil] = useState(null);

    // PIN State
    const [showPinModal, setShowPinModal] = useState(false);
    const [pin, setPin] = useState('');
    const [pinLoading, setPinLoading] = useState(false);
    const [canUseBiometrics, setCanUseBiometrics] = useState(false);

    // UI State for custom pickers
    const [providerPickerVisible, setProviderPickerVisible] = useState(false);
    const [bankPickerVisible, setBankPickerVisible] = useState(false);

    // Constants
    const momoProviders = [
        { id: 'mtn', name: 'MTN Momo', color: '#ffcc00' },
        { id: 'telecel', name: 'Telecel Cash', color: '#e60000' },
        { id: 'airteltigo', name: 'AirtelTigo Money', color: '#003399' }
    ];

    const ghanaBanks = [
        'GCB Bank', 'Ecobank Ghana', 'Absa Bank', 'Zenith Bank', 'Standard Chartered', 'Fidelity Bank', 'Stanbic Bank', 'ADB Bank'
    ];

    useEffect(() => {
        loadInitialData();
        checkBiometrics();
    }, []);

    const checkBiometrics = async () => {
        const bioEnabled = await AsyncStorage.getItem('biometricEnabled');
        if (bioEnabled === 'true') {
            setCanUseBiometrics(true);
        }
    };

    useEffect(() => {
        // Default recipient type based on destination
        if (toCurrency === 'CAD') {
            setRecipientType('interac');
        } else {
            setRecipientType('momo');
        }
    }, [toCurrency]);

    const loadInitialData = async () => {
        setPageLoading(true);
        try {
            const [rateRes, methodsRes] = await Promise.all([
                api.get('/rates'),
                api.get('/system/payment-methods')
            ]);

            const rawRate = rateRes.data.rate || 0.1124;
            setRate(rawRate < 1 ? (1 / rawRate) : rawRate);

            const methods = methodsRes.data;
            const ghs = methods.find(m => m.type === 'momo-ghs');
            const cad = methods.find(m => m.type === 'interac-cad');

            if (ghs) setGhsPaymentMethod(typeof ghs.details === 'string' ? JSON.parse(ghs.details) : ghs.details);
            if (cad) setCadPaymentMethod(typeof cad.details === 'string' ? JSON.parse(cad.details) : cad.details);

        } catch (error) {
            console.error('Initial data load failed:', error);
            // Fallback rate if offline/error
        } finally {
            setPageLoading(false);
        }
    };



    const generateReference = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let result = 'QW-';
        for (let i = 0; i < 5; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    const validateStep1 = () => {
        if (!amount || parseFloat(amount) <= 0) {
            errorToast('Invalid Amount', 'Please enter a valid amount to send.');
            return false;
        }
        return true;
    };

    const validateStep2 = () => {
        if (!recipientName) {
            errorToast('Missing Info', "Please enter the recipient's full name.");
            return false;
        }

        if (toCurrency === 'CAD') {
            if (recipientType === 'bank') {
                if (!accountNumber || !transitNumber || !institutionNumber) {
                    errorToast('Missing Info', 'Please fill in all bank details (Account, Transit, Inst #).');
                    return false;
                }
            } else if (recipientType === 'interac') {
                if (!interacEmail || !interacEmail.includes('@')) {
                    errorToast('Invalid Email', 'Please enter a valid Interac email address.');
                    return false;
                }
            }
        } else { // GHS
            if (recipientType === 'momo') {
                if (!accountNumber || !momoProvider) {
                    errorToast('Missing Info', 'Please select a provider and enter the mobile money number.');
                    return false;
                }
            } else if (recipientType === 'bank') {
                if (!accountNumber || !bankName) {
                    errorToast('Missing Info', 'Please select a bank and enter the account number.');
                    return false;
                }
            }
        }
        return true;
    };

    const handleContinue = () => {
        if (step === 1 && validateStep1()) {
            setStep(2);
        } else if (step === 2 && validateStep2()) {
            setAdminReference(generateReference());
            setStep(3);
        }
    };

    const executeTransaction = async () => {
        if (loading) return; // Robust guard

        // Connectivity check
        const netInfo = await NetInfo.fetch();
        if (!netInfo.isConnected) {
            errorToast('No Internet', 'Please check your connection and try again.');
            return;
        }

        setLoading(true);

        try {
            const details = {
                type: recipientType,
                name: recipientName,
                note: note,
                admin_reference: adminReference
            };

            if (toCurrency === 'GHS') {
                if (recipientType === 'momo') {
                    details.momo_provider = momoProvider;
                    details.account = accountNumber;
                } else {
                    details.bank_name = bankName;
                    details.account = accountNumber;
                }
            } else { // CAD
                if (recipientType === 'interac') {
                    details.interac_email = interacEmail;
                } else {
                    details.bank_name = bankName || 'Bank Transfer'; // Default if standard bank flow
                    details.account = accountNumber;
                    details.transit_number = transitNumber;
                    details.institution_number = institutionNumber;
                }
            }

            const res = await api.post('/transactions', {
                amount_sent: amount,
                type: `${fromCurrency}-${toCurrency}`,
                recipient_details: details
            });

            setRateLockedUntil(res.data.rate_locked_until);

            // Store full transaction for details navigation
            const txData = res.data.transaction || res.data;
            if (txData) {
                setNewTransaction(txData);
            }

            setShowPinModal(false);
            setPin('');
            setStep(4); // Success Step
        } catch (error) {
            console.error('Transaction execution failed:', error);

            // If the request was made but no response was received (Network Error)
            if (!error.response && error.request) {
                setShowPinModal(false);
                setPin('');
                errorToast('Connection Lost', 'Your transaction may have been processed. Please check your history before trying again.');
            } else {
                // Better guidance for user on standard API errors
                const errorMsg = error.response?.data?.error || 'Transfer failed. Check your connection.';
                errorToast('Transfer Error', errorMsg);
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePinSubmit = async () => {
        if (pin.length < 4) return;
        setPinLoading(true);
        try {
            await api.post('/auth/verify-pin', { pin: pin.toString() });
            await executeTransaction();
        } catch (error) {
            errorToast('Error', error.response?.data?.error || 'PIN Validation Failed');
        } finally {
            setPinLoading(false);
        }
    };

    const handleVerifyPress = async () => {
        if (loading) return;

        if (canUseBiometrics) {
            const result = await authenticateAsync('Authorize Transfer');
            if (result.success) {
                try {
                    await executeTransaction();
                } catch (error) {
                    errorToast('Error', error.response?.data?.error || 'Transaction failed. Please check your history before trying again.');
                }
            } else {
                // Fallback to PIN if biometric auth fails or cancels
                setShowPinModal(true);
            }
        } else {
            setShowPinModal(true);
        }
    };

    const renderStep1 = () => (
        <View style={styles.centerContainer}>
            <View style={styles.amountContainer}>
                <TextInput
                    style={[styles.bigInput, { color: theme.text }]}
                    placeholder="0"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="decimal-pad"
                    value={amount}
                    onChangeText={setAmount}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}
                />
                <View style={[styles.currencyPill, { backgroundColor: theme.input }]}>
                    <Text style={[styles.currencyText, { color: theme.text, marginRight: 0 }]}>{fromCurrency}</Text>
                </View>
            </View>

            <View style={styles.conversionContainer}>
                <View style={[styles.conversionPill, { backgroundColor: theme.input }]}>
                    <Text style={[styles.conversionText, { color: theme.textMuted }]}>
                        ≈ {amount ? new Big(amount).times(rate).toFixed(2) : '0.00'} {toCurrency}
                    </Text>
                </View>
                <Text style={[styles.rateText, { color: theme.textMuted }]}>
                    1 {fromCurrency} = {new Big(rate).toFixed(4)} {toCurrency}
                </Text>
            </View>
        </View>
    );

    const renderStep2 = () => (
        <ScrollView contentContainerStyle={styles.scrollForm}>
            <Text style={[styles.stepHeader, { color: theme.text }]}>Who are you sending to?</Text>

            {/* Recipient Type Selector */}
            <View style={styles.typeSelector}>
                {toCurrency === 'GHS' ? (
                    <>
                        <TouchableOpacity
                            style={[styles.typeBtn, recipientType === 'momo' && { backgroundColor: theme.primary, borderColor: theme.primary }, { borderColor: theme.border }]}
                            onPress={() => setRecipientType('momo')}
                        >
                            <Ionicons name="phone-portrait-outline" size={20} color={recipientType === 'momo' ? '#fff' : theme.text} />
                            <Text style={[styles.typeBtnText, { color: recipientType === 'momo' ? '#fff' : theme.text }]}>Mobile Money</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.typeBtn, recipientType === 'bank' && { backgroundColor: theme.primary, borderColor: theme.primary }, { borderColor: theme.border }]}
                            onPress={() => setRecipientType('bank')}
                        >
                            <Ionicons name="business-outline" size={20} color={recipientType === 'bank' ? '#fff' : theme.text} />
                            <Text style={[styles.typeBtnText, { color: recipientType === 'bank' ? '#fff' : theme.text }]}>Bank Transfer</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <TouchableOpacity
                            style={[styles.typeBtn, recipientType === 'interac' && { backgroundColor: theme.primary, borderColor: theme.primary }, { borderColor: theme.border }]}
                            onPress={() => setRecipientType('interac')}
                        >
                            <Ionicons name="mail-outline" size={20} color={recipientType === 'interac' ? '#fff' : theme.text} />
                            <Text style={[styles.typeBtnText, { color: recipientType === 'interac' ? '#fff' : theme.text }]}>Interac e-Transfer</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.typeBtn, recipientType === 'bank' && { backgroundColor: theme.primary, borderColor: theme.primary }, { borderColor: theme.border }]}
                            onPress={() => setRecipientType('bank')}
                        >
                            <Ionicons name="business-outline" size={20} color={recipientType === 'bank' ? '#fff' : theme.text} />
                            <Text style={[styles.typeBtnText, { color: recipientType === 'bank' ? '#fff' : theme.text }]}>Bank Transfer</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>

            <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.textMuted }]}>Full Legal Name</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text }]}
                    value={recipientName}
                    onChangeText={setRecipientName}
                    placeholder="E.g. Kofi Mensah"
                    placeholderTextColor={theme.textMuted}
                />
            </View>

            {/* Dynamic Fields */}
            {toCurrency === 'GHS' && recipientType === 'momo' && (
                <>
                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: theme.textMuted }]}>Provider</Text>
                        <TouchableOpacity
                            style={[styles.pickerTrigger, { backgroundColor: theme.input, borderColor: theme.border }]}
                            onPress={() => setProviderPickerVisible(true)}
                        >
                            <Text style={[styles.pickerText, { color: momoProvider ? theme.text : theme.textMuted }]}>
                                {momoProvider || 'Select Provider'}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color={theme.textMuted} />
                        </TouchableOpacity>

                        <SelectionPicker
                            visible={providerPickerVisible}
                            onClose={() => setProviderPickerVisible(false)}
                            title="Select Provider"
                            data={momoProviders}
                            selectedValue={momoProvider}
                            onSelect={(item) => setMomoProvider(item.name)}
                        />
                    </View>
                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: theme.textMuted }]}>Mobile Number</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text }]}
                            value={accountNumber}
                            onChangeText={setAccountNumber}
                            placeholder="024XXXXXXX"
                            placeholderTextColor={theme.textMuted}
                            keyboardType="phone-pad"
                        />
                    </View>
                </>
            )}

            {toCurrency === 'GHS' && recipientType === 'bank' && (
                <>
                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: theme.textMuted }]}>Bank Name</Text>
                        <TouchableOpacity
                            style={[styles.pickerTrigger, { backgroundColor: theme.input, borderColor: theme.border }]}
                            onPress={() => setBankPickerVisible(true)}
                        >
                            <Text style={[styles.pickerText, { color: bankName ? theme.text : theme.textMuted }]}>
                                {bankName || 'Select Bank'}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color={theme.textMuted} />
                        </TouchableOpacity>

                        <SelectionPicker
                            visible={bankPickerVisible}
                            onClose={() => setBankPickerVisible(false)}
                            title="Select Bank"
                            data={ghanaBanks}
                            selectedValue={bankName}
                            onSelect={(item) => setBankName(item)}
                            placeholder="Search banks..."
                        />
                    </View>
                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: theme.textMuted }]}>Account Number</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text }]}
                            value={accountNumber}
                            onChangeText={setAccountNumber}
                            placeholder="Account Number"
                            placeholderTextColor={theme.textMuted}
                            keyboardType="numeric"
                        />
                    </View>
                </>
            )}

            {toCurrency === 'CAD' && recipientType === 'interac' && (
                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: theme.textMuted }]}>Interac Email</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text }]}
                        value={interacEmail}
                        onChangeText={setInteracEmail}
                        placeholder="recipient@email.com"
                        placeholderTextColor={theme.textMuted}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>
            )}

            {toCurrency === 'CAD' && recipientType === 'bank' && (
                <>
                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: theme.textMuted }]}>Account Number</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text }]}
                            value={accountNumber}
                            onChangeText={setAccountNumber}
                            placeholder="Account Number"
                            placeholderTextColor={theme.textMuted}
                            keyboardType="numeric"
                        />
                    </View>
                    <View style={styles.row}>
                        <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                            <Text style={[styles.label, { color: theme.textMuted }]}>Transit #</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text }]}
                                value={transitNumber}
                                onChangeText={setTransitNumber}
                                placeholder="5 digits"
                                maxLength={5}
                                keyboardType="numeric"
                                placeholderTextColor={theme.textMuted}
                            />
                        </View>
                        <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                            <Text style={[styles.label, { color: theme.textMuted }]}>Inst #</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text }]}
                                value={institutionNumber}
                                onChangeText={setInstitutionNumber}
                                placeholder="3 digits"
                                maxLength={3}
                                keyboardType="numeric"
                                placeholderTextColor={theme.textMuted}
                            />
                        </View>
                    </View>
                </>
            )}

            <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.textMuted }]}>Note (Optional)</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text }]}
                    value={note}
                    onChangeText={setNote}
                    placeholder="What is this for?"
                    placeholderTextColor={theme.textMuted}
                />
            </View>
        </ScrollView>
    );

    const renderStep3 = () => (
        <ScrollView contentContainerStyle={styles.scrollForm}>
            <Text style={[styles.stepHeader, { color: theme.text }]}>Review & Send</Text>

            <View style={[styles.receiptCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                {/* Amount Row */}
                <View style={styles.receiptRow}>
                    <Text style={[styles.receiptLabel, { color: theme.textMuted }]}>You send</Text>
                    <Text style={[styles.receiptValue, { color: theme.text }]}>{amount} {fromCurrency}</Text>
                </View>
                <View style={styles.receiptRow}>
                    <Text style={[styles.receiptLabel, { color: theme.textMuted }]}>They get</Text>
                    <Text style={[styles.receiptValue, { color: theme.primary }]}>{amount ? new Big(amount).times(rate).toFixed(2) : '0.00'} {toCurrency}</Text>
                </View>

                <View style={[styles.divider, { backgroundColor: theme.border }]} />

                {/* Recipient Row */}
                <View style={styles.receiptRow}>
                    <Text style={[styles.receiptLabel, { color: theme.textMuted }]}>To</Text>
                    <Text style={[styles.receiptValue, { color: theme.text }]}>{recipientName}</Text>
                </View>

                {/* Method Row */}
                <View style={styles.receiptRow}>
                    <Text style={[styles.receiptLabel, { color: theme.textMuted }]}>Via</Text>
                    <Text style={[styles.receiptValue, { color: theme.text, textTransform: 'capitalize' }]}>
                        {recipientType === 'momo' ? `${momoProvider}` : (recipientType === 'interac' ? 'Interac e-Transfer' : bankName || 'Bank Transfer')}
                    </Text>
                </View>

                {/* Account Row */}
                <View style={styles.receiptRow}>
                    <Text style={[styles.receiptLabel, { color: theme.textMuted }]}>Details</Text>
                    <Text style={[styles.receiptValue, { color: theme.text }]}>
                        {recipientType === 'momo' ? accountNumber : (recipientType === 'interac' ? interacEmail : `${accountNumber} (${bankName})`)}
                    </Text>
                </View>

                <View style={[styles.divider, { backgroundColor: theme.border }]} />

                <View style={styles.receiptRow}>
                    <Text style={[styles.receiptLabel, { color: theme.textMuted }]}>Reference</Text>
                    <Text style={[styles.receiptValue, { color: theme.text, fontFamily: 'Outfit_700Bold', letterSpacing: 1 }]}>{adminReference}</Text>
                </View>

                {note ? (
                    <View style={styles.receiptRow}>
                        <Text style={[styles.receiptLabel, { color: theme.textMuted }]}>Note</Text>
                        <Text style={[styles.receiptValue, { color: theme.text, fontStyle: 'italic' }]}>{note}</Text>
                    </View>
                ) : null}

            </View>
        </ScrollView>
    );

    const renderStep4 = () => (
        <ScrollView contentContainerStyle={styles.centerContainer}>
            <View style={styles.successIconWrapper}>
                <Ionicons name="checkmark" size={60} color="#fff" />
            </View>
            <Text style={[styles.successTitle, { color: theme.text }]}>Transfer Initiated!</Text>
            <Text style={[styles.successSub, { color: theme.textMuted }]}>
                Your rate is locked. Please complete the payment below.
            </Text>

            <View style={[styles.instructionCard, { backgroundColor: theme.isDark ? '#2a2a2a' : '#2D3748' }]}>
                <View style={styles.instructionHeader}>
                    <Text style={styles.instructionTitle}>PAYMENT INSTRUCTIONS</Text>
                </View>

                <Text style={styles.instructionText}>
                    Send <Text style={styles.boldWhite}>{amount} {fromCurrency}</Text> to:
                </Text>

                <View style={styles.detailsBox}>
                    {fromCurrency === 'GHS' ? (
                        <>
                            <Text style={styles.detailRow}>
                                <Text style={styles.labelWhite}>MTN Momo:</Text> {ghsPaymentMethod?.number || '055 123 4567'}
                            </Text>
                            <Text style={styles.detailRow}>
                                <Text style={styles.labelWhite}>Name:</Text> {ghsPaymentMethod?.name || 'Qwiktransfers Limited'}
                            </Text>
                        </>
                    ) : (
                        <>
                            <Text style={styles.detailRow}>
                                <Text style={styles.labelWhite}>Interac:</Text> {cadPaymentMethod?.email || 'pay@qwiktransfers.ca'}
                            </Text>
                            <Text style={styles.detailRow}>
                                <Text style={styles.labelWhite}>Name:</Text> {cadPaymentMethod?.name || 'Qwiktransfers Canada'}
                            </Text>
                        </>
                    )}
                </View>

                <View style={styles.refBox}>
                    <Text style={styles.refLabel}>TRANSACTION REFERENCE</Text>
                    <Text style={[styles.refValue, { fontSize: 20 }]}>{newTransaction?.transaction_id || adminReference}</Text>
                    <Text style={styles.refNote}>Share this code for transaction inquiries</Text>
                </View>
            </View>
        </ScrollView>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />

            {/* Standardized Header - Hidden on Step 4 (Success) */}
            {step < 4 && (
                <View style={[styles.header, { borderBottomColor: theme.border + '15', borderBottomWidth: step > 1 ? 1 : 0 }]}>
                    <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name={step === 1 ? "close" : "arrow-back"} size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>
                        {step === 1 ? 'Send Money' : step === 2 ? 'Recipient Info' : 'Review Transfer'}
                    </Text>
                    <View style={{ width: 44 }} />
                </View>
            )}

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={{ flex: 1 }}>
                        {step === 1 && renderStep1()}
                        {step === 2 && renderStep2()}
                        {step === 3 && renderStep3()}
                        {step === 4 && renderStep4()}
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>

            {/* Footer Action Button */}
            <View style={styles.footer}>
                {step < 3 && (
                    <Button
                        style={{ backgroundColor: theme.primary }}
                        onPress={handleContinue}
                        label="Continue"
                    />
                )}

                {step === 3 && (
                    <Button
                        style={{ backgroundColor: theme.primary }}
                        onPress={handleVerifyPress}
                        disabled={loading}
                        loading={loading}
                        label="Verify & Send"
                    />
                )}

                {step === 4 && (
                    <View style={{ width: '100%', gap: 12 }}>
                        <Button
                            style={{ backgroundColor: theme.primary }}
                            onPress={() => {
                                if (newTransaction) {
                                    navigation.replace('TransactionDetails', {
                                        transactionId: newTransaction.transaction_id || newTransaction.id,
                                        initialData: newTransaction
                                    });
                                } else {
                                    navigation.navigate('Home');
                                }
                            }}
                            label="I Have Sent It"
                        />
                        <Button
                            style={styles.secondaryBtn}
                            textStyle={{ color: theme.text }}
                            onPress={() => {
                                setStep(1);
                                setAmount('');
                                setRecipientName('');
                                setAccountNumber('');
                            }}
                            label="Send Another"
                        />
                    </View>
                )}
            </View>

            {/* PIN Modal */}
            <Modal
                visible={showPinModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowPinModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>Enter Your PIN</Text>
                        <Text style={[styles.modalSub, { color: theme.textMuted }]}>Please confirm your transaction</Text>

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
                            <Button
                                style={[styles.modalBtn, { backgroundColor: theme.input }]}
                                textStyle={{ color: theme.text }}
                                onPress={() => setShowPinModal(false)}
                                label="Cancel"
                            />
                            <Button
                                style={[styles.modalBtn, { backgroundColor: theme.primary }]}
                                onPress={handlePinSubmit}
                                disabled={pinLoading}
                                loading={pinLoading}
                                label="Confirm"
                            />
                        </View>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        height: 60,
    },
    backBtn: { padding: 8 },
    headerTitle: {
        fontSize: 18,
        fontFamily: 'Outfit_700Bold',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    amountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    bigInput: {
        fontSize: 56,
        fontFamily: 'Outfit_700Bold',
        textAlign: 'right',
        minWidth: 80,
    },
    currencyPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginLeft: 12,
    },
    currencyText: {
        fontSize: 20,
        fontWeight: '700',
        fontFamily: 'Outfit_700Bold',
        marginRight: 4,
    },
    conversionContainer: {
        alignItems: 'center',
    },
    conversionPill: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 12,
        marginBottom: 12,
    },
    conversionText: {
        fontSize: 16,
        fontWeight: '500',
        fontFamily: 'Outfit_500Medium',
    },
    rateText: {
        fontSize: 14,
        fontFamily: 'Outfit_400Regular',
    },
    scrollForm: {
        padding: 24,
    },
    stepHeader: {
        fontSize: 24,
        fontWeight: '700',
        fontFamily: 'Outfit_700Bold',
        marginBottom: 32,
    },
    typeSelector: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    typeBtn: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderWidth: 1.5,
        borderRadius: 12,
        gap: 8,
    },
    typeBtnText: {
        fontSize: 12,
        fontWeight: '600',
        fontFamily: 'Outfit_600SemiBold',
        textAlign: 'center',
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        fontFamily: 'Outfit_600SemiBold',
        marginBottom: 8,
    },
    input: {
        height: 56,
        borderWidth: 1.5,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        fontFamily: 'Outfit_400Regular',
    },
    pickerTrigger: {
        height: 56,
        borderRadius: 16,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginBottom: 20,
    },
    pickerText: {
        fontSize: 16,
        fontFamily: 'Outfit_400Regular',
    },
    pickerWrapper: {
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        overflow: 'hidden'
    },
    row: {
        flexDirection: 'row',
    },
    footer: {
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 10 : 24,
    },
    secondaryBtn: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: 'rgba(0,0,0,0.1)', // Will be overridden or theme.border
    },
    receiptCard: {
        padding: 24,
        borderRadius: 20,
        borderWidth: 1,
    },
    receiptRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    receiptLabel: {
        fontSize: 15,
        fontFamily: 'Outfit_500Medium',
    },
    receiptValue: {
        fontSize: 15,
        fontFamily: 'Outfit_700Bold',
        textAlign: 'right',
        maxWidth: '60%',
    },
    divider: {
        height: 1,
        marginVertical: 16,
    },
    // Success Screen Styles
    successIconWrapper: {
        width: 100,
        height: 100,
        backgroundColor: '#22c55e', // Success Green
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        marginTop: 40,
        shadowColor: "#22c55e",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    successTitle: {
        fontSize: 28,
        fontWeight: '700',
        fontFamily: 'Outfit_700Bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    successSub: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 40,
        fontFamily: 'Outfit_400Regular',
    },
    instructionCard: {
        width: '100%',
        borderRadius: 16,
        padding: 24,
        marginBottom: 40,
    },
    instructionHeader: {
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
        paddingBottom: 12,
    },
    instructionTitle: {
        color: '#fbbf24', // Amber/Gold
        fontSize: 14,
        fontWeight: '700',
        fontFamily: 'Outfit_700Bold',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    instructionText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 16,
        marginBottom: 16,
        fontFamily: 'Outfit_400Regular',
    },
    boldWhite: {
        color: '#fff',
        fontWeight: '700',
        fontFamily: 'Outfit_700Bold',
    },
    detailsBox: {
        marginBottom: 24,
    },
    detailRow: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 16,
        marginBottom: 8,
        fontFamily: 'Outfit_400Regular',
    },
    labelWhite: {
        color: '#fff',
        fontWeight: '700',
    },
    refBox: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        borderStyle: 'dashed',
    },
    refLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 6,
        letterSpacing: 1,
    },
    refValue: {
        color: '#fbbf24',
        fontSize: 22,
        fontWeight: '800',
        fontFamily: 'Outfit_700Bold',
        marginBottom: 4,
        letterSpacing: 2,
    },
    refNote: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 24,
    },
    modalContent: {
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
        fontFamily: 'Outfit_700Bold',
        marginBottom: 8,
    },
    modalSub: {
        fontSize: 15,
        marginBottom: 24,
        fontFamily: 'Outfit_400Regular',
    },
    pinInput: {
        fontSize: 32,
        fontWeight: '700',
        fontFamily: 'Outfit_700Bold',
        width: '100%',
        textAlign: 'center',
        borderWidth: 1.5,
        borderRadius: 12,
        padding: 16,
        letterSpacing: 10,
        marginBottom: 32,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    modalBtn: {
        flex: 1,
    },
});

export default TransferScreen;
