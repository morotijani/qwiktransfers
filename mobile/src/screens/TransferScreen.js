import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    SafeAreaView,
    StatusBar,
    Alert,
    ActivityIndicator,
    Platform
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

const TransferScreen = ({ navigation }) => {
    const theme = useTheme();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form State
    const [amount, setAmount] = useState('');
    const [fromCurrency, setFromCurrency] = useState('GHS');
    const [toCurrency, setToCurrency] = useState('CAD');
    const [payoutMethod, setPayoutMethod] = useState('');
    const [rate, setRate] = useState(0.0904);

    // Recipient State
    const [recipientName, setRecipientName] = useState('');
    const [momoProvider, setMomoProvider] = useState('mtn');
    const [accountNumber, setAccountNumber] = useState('');
    const [bankName, setBankName] = useState('');
    const [transitNumber, setTransitNumber] = useState('');
    const [institutionNumber, setInstitutionNumber] = useState('');
    const [interacEmail, setInteracEmail] = useState('');

    useEffect(() => {
        fetchRate();
    }, [fromCurrency, toCurrency]);

    useEffect(() => {
        // Default payout methods based on destination
        if (toCurrency === 'CAD') {
            setPayoutMethod('interac');
        } else {
            setPayoutMethod('momo');
        }
    }, [toCurrency]);

    const fetchRate = async () => {
        try {
            const res = await api.get('/rates');
            setRate(res.data.rate || 0.0904);
        } catch (error) {
            console.error('Rate fetch failed');
        }
    };

    const nextStep = () => {
        if (step === 1) {
            if (!amount || parseFloat(amount) <= 0) {
                Alert.alert('Error', 'Please enter a valid amount');
                return;
            }
        }
        if (step === 2) {
            if (!recipientName) {
                Alert.alert('Error', 'Recipient name is required');
                return;
            }
            if (payoutMethod === 'momo' && !accountNumber) {
                Alert.alert('Error', 'Phone number is required');
                return;
            }
        }
        setStep(step + 1);
    };

    const prevStep = () => setStep(step - 1);

    const handleSubmit = async () => {
        setLoading(true);
        const details = {
            name: recipientName,
            type: payoutMethod,
        };

        if (payoutMethod === 'momo') {
            details.account = accountNumber;
            details.momo_provider = momoProvider;
        } else if (payoutMethod === 'bank') {
            details.account = accountNumber;
            details.bank_name = bankName;
            if (toCurrency === 'CAD') {
                details.transit_number = transitNumber;
                details.institution_number = institutionNumber;
            }
        } else if (payoutMethod === 'interac') {
            details.email = interacEmail;
        }

        try {
            await api.post('/transactions', {
                amount_sent: amount,
                type: `${fromCurrency}-${toCurrency}`,
                recipient_details: details
            });
            Alert.alert('Success', 'Transfer request submitted successfully!', [
                { text: 'View History', onPress: () => navigation.navigate('Home') }
            ]);
        } catch (error) {
            Alert.alert('Error', error.response?.data?.error || 'Submission failed');
        } finally {
            setLoading(false);
        }
    };

    const renderStep1 = () => (
        <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: theme.text }]}>How much are you sending?</Text>

            <View style={styles.inputWrapper}>
                <Text style={[styles.label, { color: theme.textMuted }]}>You send ({fromCurrency})</Text>
                <TextInput
                    style={[styles.bigInput, { color: theme.text }]}
                    placeholder="0.00"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="decimal-pad"
                    value={amount}
                    onChangeText={setAmount}
                    autoFocus
                />
            </View>

            <View style={styles.conversionInfo}>
                <Text style={[styles.conversionText, { color: theme.textMuted }]}>
                    1 {fromCurrency} = {rate} {toCurrency}
                </Text>
                <Text style={[styles.receivedText, { color: theme.primary }]}>
                    Recipient receives: {(parseFloat(amount || 0) * rate).toFixed(2)} {toCurrency}
                </Text>
            </View>

            <View style={styles.payoutToggle}>
                <Text style={[styles.label, { color: theme.textMuted }]}>Destination</Text>
                <View style={[styles.segmentContainer, { backgroundColor: theme.input }]}>
                    <TouchableOpacity
                        style={[styles.segment, toCurrency === 'CAD' && { backgroundColor: theme.primary }]}
                        onPress={() => { setToCurrency('CAD'); setFromCurrency('GHS'); }}
                    >
                        <Text style={[styles.segmentText, { color: toCurrency === 'CAD' ? '#fff' : theme.textMuted }]}>Canada</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.segment, toCurrency === 'GHS' && { backgroundColor: theme.primary }]}
                        onPress={() => { setToCurrency('GHS'); setFromCurrency('CAD'); }}
                    >
                        <Text style={[styles.segmentText, { color: toCurrency === 'GHS' ? '#fff' : theme.textMuted }]}>Ghana</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.payoutMethods}>
                <Text style={[styles.label, { color: theme.textMuted }]}>Payout Method</Text>
                <View style={[styles.pickerContainer, { backgroundColor: theme.input, borderColor: theme.border }]}>
                    <Picker
                        selectedValue={payoutMethod}
                        onValueChange={(v) => setPayoutMethod(v)}
                        style={{ color: theme.text }}
                        dropdownIconColor={theme.text}
                    >
                        {toCurrency === 'GHS' && <Picker.Item label="Mobile Money" value="momo" />}
                        {toCurrency === 'GHS' && <Picker.Item label="Bank Transfer" value="bank" />}
                        {toCurrency === 'CAD' && <Picker.Item label="Interac e-Transfer" value="interac" />}
                        {toCurrency === 'CAD' && <Picker.Item label="Bank Transfer" value="bank" />}
                    </Picker>
                </View>
            </View>
        </View>
    );

    const renderStep2 = () => (
        <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: theme.text }]}>Recipient Details</Text>

            <View style={styles.formItem}>
                <Text style={[styles.label, { color: theme.textMuted }]}>Full Legal Name</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text }]}
                    placeholder="E.g. Kofi Kingston"
                    placeholderTextColor={theme.textMuted}
                    value={recipientName}
                    onChangeText={setRecipientName}
                />
            </View>

            {payoutMethod === 'momo' && (
                <>
                    <View style={styles.formItem}>
                        <Text style={[styles.label, { color: theme.textMuted }]}>Provider</Text>
                        <View style={[styles.pickerContainer, { backgroundColor: theme.input, borderColor: theme.border }]}>
                            <Picker
                                selectedValue={momoProvider}
                                onValueChange={(v) => setMomoProvider(v)}
                                style={{ color: theme.text }}
                            >
                                <Picker.Item label="MTN Momo" value="mtn" />
                                <Picker.Item label="Telecel Cash" value="telecel" />
                                <Picker.Item label="AirtelTigo Money" value="airteltigo" />
                            </Picker>
                        </View>
                    </View>
                    <View style={styles.formItem}>
                        <Text style={[styles.label, { color: theme.textMuted }]}>Phone Number</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text }]}
                            placeholder="024XXXXXXX"
                            placeholderTextColor={theme.textMuted}
                            keyboardType="phone-pad"
                            value={accountNumber}
                            onChangeText={setAccountNumber}
                        />
                    </View>
                </>
            )}

            {payoutMethod === 'interac' && (
                <View style={styles.formItem}>
                    <Text style={[styles.label, { color: theme.textMuted }]}>Interac Email</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text }]}
                        placeholder="recipient@email.com"
                        placeholderTextColor={theme.textMuted}
                        keyboardType="email-address"
                        value={interacEmail}
                        onChangeText={setInteracEmail}
                    />
                </View>
            )}

            {payoutMethod === 'bank' && (
                <>
                    <View style={styles.formItem}>
                        <Text style={[styles.label, { color: theme.textMuted }]}>Bank Name</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text }]}
                            placeholder="Enter bank name"
                            placeholderTextColor={theme.textMuted}
                            value={bankName}
                            onChangeText={setBankName}
                        />
                    </View>
                    <View style={styles.formItem}>
                        <Text style={[styles.label, { color: theme.textMuted }]}>Account Number</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text }]}
                            placeholder="Account Number"
                            placeholderTextColor={theme.textMuted}
                            keyboardType="numeric"
                            value={accountNumber}
                            onChangeText={setAccountNumber}
                        />
                    </View>
                </>
            )}
        </View>
    );

    const renderStep3 = () => (
        <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: theme.text }]}>Review Transfer</Text>

            <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.summaryItem}>
                    <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Amount to Send</Text>
                    <Text style={[styles.summaryValue, { color: theme.text }]}>{amount} {fromCurrency}</Text>
                </View>
                <View style={styles.summaryItem}>
                    <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Recipient Receives</Text>
                    <Text style={[styles.summaryValue, { color: theme.primary }]}>{(parseFloat(amount) * rate).toFixed(2)} {toCurrency}</Text>
                </View>
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
                <View style={styles.summaryItem}>
                    <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Recipient</Text>
                    <Text style={[styles.summaryValue, { color: theme.text }]}>{recipientName}</Text>
                </View>
                <View style={styles.summaryItem}>
                    <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Method</Text>
                    <Text style={[styles.summaryValue, { color: theme.text, textTransform: 'capitalize' }]}>{payoutMethod}</Text>
                </View>
                <View style={styles.summaryItem}>
                    <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Reference</Text>
                    <Text style={[styles.summaryValue, { color: theme.primary, fontWeight: '900' }]}>QT-{Math.floor(1000 + Math.random() * 9000)}</Text>
                </View>
            </View>

            <View style={styles.noticeBox}>
                <Text style={[styles.noticeText, { color: theme.textMuted }]}>
                    After clicking Send, you will need to upload proof of payment in the Activity tab to complete the transfer.
                </Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => step > 1 ? prevStep() : navigation.goBack()}>
                    <Text style={[styles.backText, { color: theme.primary }]}>Back</Text>
                </TouchableOpacity>
                <View style={styles.stepIndicator}>
                    {[1, 2, 3].map(i => (
                        <View
                            key={i}
                            style={[
                                styles.dot,
                                { backgroundColor: i <= step ? theme.primary : theme.border },
                                i === step && { width: 20 }
                            ]}
                        />
                    ))}
                </View>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.primary }]}
                    onPress={step === 3 ? handleSubmit : nextStep}
                    disabled={loading === true}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>{step === 3 ? 'Confirm & Send' : 'Continue'}</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    backText: { fontSize: 16, fontWeight: '600' },
    stepIndicator: { flexDirection: 'row', alignItems: 'center' },
    dot: { width: 8, height: 8, borderRadius: 4, marginHorizontal: 4 },
    scroll: { padding: 24 },
    stepContainer: { flex: 1 },
    stepTitle: { fontSize: 24, fontWeight: '900', marginBottom: 32, letterSpacing: -0.5 },
    inputWrapper: { marginBottom: 24 },
    label: { fontSize: 13, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    bigInput: { fontSize: 48, fontWeight: '800', borderBottomWidth: 0 },
    conversionInfo: { marginBottom: 32 },
    conversionText: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
    receivedText: { fontSize: 16, fontWeight: '800' },
    payoutToggle: { marginBottom: 32 },
    segmentContainer: { flexDirection: 'row', borderRadius: 12, padding: 4 },
    segment: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
    segmentText: { fontWeight: '700', fontSize: 14 },
    payoutMethods: { marginBottom: 24 },
    pickerContainer: { borderWidth: 1.5, borderRadius: 12, overflow: 'hidden' },
    formItem: { marginBottom: 20 },
    input: { height: 56, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 16, fontSize: 16 },
    summaryCard: { padding: 20, borderRadius: 16, borderWidth: 1, marginBottom: 24 },
    summaryItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    summaryLabel: { fontSize: 14, fontWeight: '600' },
    summaryValue: { fontSize: 14, fontWeight: '700' },
    divider: { height: 1, marginVertical: 12 },
    noticeBox: { paddingHorizontal: 10 },
    noticeText: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
    footer: { padding: 24 },
    button: { height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});

export default TransferScreen;
