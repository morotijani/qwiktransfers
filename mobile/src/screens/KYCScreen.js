import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    Image,
    ActivityIndicator,
    TextInput,
    StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import Ionicons from '@expo/vector-icons/Ionicons';

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
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [16, 9],
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
            formData.append('documentType', docType);
            formData.append('documentId', docId);

            const appendFile = (uri, field) => {
                const filename = uri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image`;
                formData.append(field, {
                    uri,
                    name: filename,
                    type
                });
            };

            appendFile(frontImage, 'front');
            appendFile(backImage, 'back');

            await api.post('/auth/kyc', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            Alert.alert('Success', 'KYC documents submitted for verification!');
            if (refreshProfile) await refreshProfile();
        } catch (error) {
            console.error(error);
            Alert.alert('Upload Failed', error.response?.data?.error || 'Something went wrong. Please check your network connection.');
        } finally {
            setLoading(false);
        }
    };

    if (user?.kyc_status === 'pending') {
        return (
            <SafeAreaView style={[styles.centerContainer, { backgroundColor: theme.background }]}>
                <Ionicons name="time-outline" size={80} color={theme.primary} />
                <Text style={[styles.statusTitle, { color: theme.text }]}>Verification Pending</Text>
                <Text style={[styles.statusDesc, { color: theme.textMuted }]}>
                    Our team is currently reviewing your documents. You'll receive a notification once approved.
                </Text>
            </SafeAreaView>
        );
    }

    if (user?.kyc_status === 'verified') {
        return (
            <SafeAreaView style={[styles.centerContainer, { backgroundColor: theme.background }]}>
                <Ionicons name="checkmark-circle" size={80} color="#10b981" />
                <Text style={[styles.statusTitle, { color: theme.text }]}>Account Verified</Text>
                <Text style={[styles.statusDesc, { color: theme.textMuted }]}>
                    Your identity has been verified. You can now enjoy higher transaction limits.
                </Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.text }]}>Verify Identity</Text>
                    <Text style={[styles.subtitle, { color: theme.textMuted }]}>
                        Increase your sending limits and secure your account by verifying your identity.
                    </Text>
                </View>

                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.label, { color: theme.textMuted }]}>Document Type</Text>
                    <View style={[styles.pickerContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
                        <Picker
                            selectedValue={docType}
                            onValueChange={(v) => setDocType(v)}
                            style={styles.picker}
                            dropdownIconColor={theme.text}
                        >
                            <Picker.Item label="Ghana Card / Voter ID" value="ghana_card" color={theme.text} />
                            <Picker.Item label="Passport" value="passport" color={theme.text} />
                            <Picker.Item label="Driver's License" value="drivers_license" color={theme.text} />
                        </Picker>
                    </View>

                    <Text style={[styles.label, { color: theme.textMuted }]}>ID Number</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                        placeholder="Enter ID Number"
                        placeholderTextColor={theme.textMuted}
                        value={docId}
                        onChangeText={setDocId}
                    />

                    <Text style={[styles.label, { color: theme.textMuted, marginBottom: 16 }]}>Document Photos</Text>
                    <View style={styles.uploadRow}>
                        <TouchableOpacity
                            style={[styles.uploadBox, { backgroundColor: theme.background, borderColor: theme.border }]}
                            onPress={() => pickImage('front')}
                            activeOpacity={0.7}
                        >
                            {frontImage ? (
                                <Image source={{ uri: frontImage }} style={styles.preview} />
                            ) : (
                                <View style={styles.uploadPlaceholder}>
                                    <Ionicons name="camera-outline" size={24} color={theme.textMuted} />
                                    <Text style={[styles.uploadText, { color: theme.textMuted }]}>Front Side</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.uploadBox, { backgroundColor: theme.background, borderColor: theme.border }]}
                            onPress={() => pickImage('back')}
                            activeOpacity={0.7}
                        >
                            {backImage ? (
                                <Image source={{ uri: backImage }} style={styles.preview} />
                            ) : (
                                <View style={styles.uploadPlaceholder}>
                                    <Ionicons name="camera-outline" size={24} color={theme.textMuted} />
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
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitText}>Submit for Verification</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.infoBox}>
                    <Ionicons name="information-circle-outline" size={20} color={theme.textMuted} style={{ marginRight: 10 }} />
                    <Text style={[styles.infoText, { color: theme.textMuted }]}>
                        Make sure the photos are clear, well-lit, and all details are readable.
                    </Text>
                </View>
                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: 20, paddingTop: 20, marginBottom: 20 },
    title: {
        fontSize: 32,
        fontFamily: 'Outfit_700Bold',
    },
    subtitle: {
        fontSize: 15,
        fontFamily: 'Outfit_400Regular',
        marginTop: 8,
        lineHeight: 22
    },
    card: {
        marginHorizontal: 20,
        padding: 24,
        borderRadius: 20,
        borderWidth: 1,
    },
    label: {
        fontSize: 13,
        fontFamily: 'Outfit_600SemiBold',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    pickerContainer: {
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        overflow: 'hidden'
    },
    picker: {
        height: 55,
    },
    input: {
        height: 55,
        paddingHorizontal: 16,
        borderRadius: 12,
        fontSize: 16,
        marginBottom: 20,
        borderWidth: 1,
        fontFamily: 'Outfit_400Regular',
    },
    uploadRow: { flexDirection: 'row', gap: 15, marginBottom: 30 },
    uploadBox: {
        flex: 1,
        height: 100,
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
        overflow: 'hidden'
    },
    uploadPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    uploadText: { fontSize: 12, fontFamily: 'Outfit_600SemiBold', marginTop: 4 },
    preview: { width: '100%', height: '100%' },
    submitButton: {
        height: 58,
        borderRadius: 29,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    disabledButton: { opacity: 0.6 },
    submitText: { color: '#fff', fontSize: 16, fontFamily: 'Outfit_700Bold' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    statusTitle: {
        fontSize: 24,
        fontFamily: 'Outfit_700Bold',
        textAlign: 'center',
        marginTop: 20
    },
    statusDesc: {
        fontSize: 16,
        fontFamily: 'Outfit_400Regular',
        textAlign: 'center',
        marginTop: 12,
        lineHeight: 24
    },
    infoBox: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        marginTop: 20,
        alignItems: 'center'
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        fontFamily: 'Outfit_400Regular',
    }
});

export default KYCScreen;
