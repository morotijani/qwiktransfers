import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    Image,
    ActivityIndicator
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

const KYCScreen = () => {
    const { user, refreshProfile } = useAuth();
    const theme = useTheme();
    const [docType, setDocType] = useState('ghana_card');
    const [docId, setDocId] = useState('');
    const [frontImage, setFrontImage] = useState(null);
    const [backImage, setBackImage] = useState(null);
    const [loading, setLoading] = useState(false);

    const pickImage = async (side) => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need access to your gallery to upload documents.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
        });

        if (!result.canceled) {
            if (side === 'front') setFrontImage(result.assets[0].uri);
            else setBackImage(result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        if (!docId || !frontImage || !backImage) {
            Alert.alert('Missing Information', 'Please provide your ID number and both front and back photos.');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('document_type', docType);
            formData.append('document_id', docId);

            const appendFile = (uri, field) => {
                const filename = uri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image`;
                formData.append(field, { uri, name: filename, type });
            };

            appendFile(frontImage, 'kyc_front');
            appendFile(backImage, 'kyc_back');

            await api.post('/auth/kyc/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            Alert.alert('Success', 'KYC documents submitted for verification!');
            refreshProfile?.();
        } catch (error) {
            Alert.alert('Upload Failed', error.response?.data?.error || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    if (user?.kyc_status === 'pending') {
        return (
            <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
                <Text style={styles.statusIcon}>⏳</Text>
                <Text style={[styles.statusTitle, { color: theme.text }]}>Verification Pending</Text>
                <Text style={[styles.statusDesc, { color: theme.textMuted }]}>Our team is currently reviewing your documents. You'll receive a notification once approved.</Text>
            </View>
        );
    }

    if (user?.kyc_status === 'verified') {
        return (
            <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
                <Text style={styles.statusIcon}>✅</Text>
                <Text style={[styles.statusTitle, { color: theme.text }]}>Account Verified</Text>
                <Text style={[styles.statusDesc, { color: theme.textMuted }]}>Your identity has been verified. You can now enjoy higher transaction limits.</Text>
            </View>
        );
    }

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>Identity Verification</Text>
                <Text style={[styles.subtitle, { color: theme.textMuted }]}>Upload a valid government ID to secure your account and increase limits.</Text>
            </View>

            <View style={[styles.card, { backgroundColor: theme.card }]}>
                <Text style={[styles.label, { color: theme.textMuted }]}>Document Type</Text>
                <View style={[styles.pickerContainer, { backgroundColor: theme.input, borderColor: theme.border }]}>
                    <Picker
                        selectedValue={docType}
                        onValueChange={(v) => setDocType(v)}
                        style={styles.picker}
                    >
                        <Picker.Item label="Ghana Card / Voter ID" value="ghana_card" />
                        <Picker.Item label="Passport" value="passport" />
                        <Picker.Item label="Driver's License" value="drivers_license" />
                    </Picker>
                </View>

                <Text style={[styles.label, { color: theme.textMuted }]}>ID Number</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text }]}
                    placeholder="Enter ID Number"
                    placeholderTextColor={theme.textMuted}
                    value={docId}
                    onChangeText={setDocId}
                />

                <View style={styles.uploadRow}>
                    <TouchableOpacity style={[styles.uploadBox, { backgroundColor: theme.input, borderColor: theme.border }]} onPress={() => pickImage('front')}>
                        {frontImage ? (
                            <Image source={{ uri: frontImage }} style={styles.preview} />
                        ) : (
                            <View style={styles.uploadPlaceholder}>
                                <Text style={styles.uploadIcon}>📷</Text>
                                <Text style={[styles.uploadText, { color: theme.textMuted }]}>Front Side</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.uploadBox, { backgroundColor: theme.input, borderColor: theme.border }]} onPress={() => pickImage('back')}>
                        {backImage ? (
                            <Image source={{ uri: backImage }} style={styles.preview} />
                        ) : (
                            <View style={styles.uploadPlaceholder}>
                                <Text style={styles.uploadIcon}>📷</Text>
                                <Text style={[styles.uploadText, { color: theme.textMuted }]}>Back Side</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[styles.submitButton, { backgroundColor: theme.primary }, loading ? styles.disabledButton : null]}
                    onPress={handleSubmit}
                    disabled={loading === true}
                >
                    {loading === true ? (
                        <ActivityIndicator color="#fff" animating={true} />
                    ) : (
                        <Text style={styles.submitText}>Submit for Verification</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

// Reuse or adapt styles
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    header: { padding: 25, paddingTop: 40 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    subtitle: { fontSize: 14, color: '#94a3b8', marginTop: 8, lineHeight: 20 },
    card: {
        backgroundColor: '#1e293b',
        margin: 20,
        padding: 20,
        borderRadius: 16,
    },
    label: { color: '#94a3b8', fontSize: 13, fontWeight: 'bold', marginBottom: 8, textTransform: 'uppercase' },
    pickerContainer: {
        backgroundColor: '#0f172a',
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#334155',
        overflow: 'hidden'
    },
    picker: {},
    input: {
        backgroundColor: '#0f172a',
        padding: 16,
        borderRadius: 12,
        color: '#fff',
        marginBottom: 25,
        borderWidth: 1,
        borderColor: '#334155',
    },
    uploadRow: { flexDirection: 'row', gap: 15, marginBottom: 30 },
    uploadBox: {
        flex: 1,
        aspectRatio: 1.5,
        backgroundColor: '#0f172a',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#334155',
        borderStyle: 'dashed',
        overflow: 'hidden'
    },
    uploadPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    uploadIcon: { fontSize: 24, marginBottom: 5 },
    uploadText: { color: '#64748b', fontSize: 12, fontWeight: '600' },
    preview: { width: '100%', height: '100%' },
    submitButton: {
        backgroundColor: '#6366f1',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
    },
    disabledButton: { opacity: 0.6 },
    submitText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    centerContainer: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', padding: 40 },
    statusIcon: { fontSize: 60, marginBottom: 20 },
    statusTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
    statusDesc: { fontSize: 15, color: '#94a3b8', textAlign: 'center', marginTop: 10, lineHeight: 22 },
});

export default KYCScreen;
