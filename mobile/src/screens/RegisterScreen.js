import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    ScrollView,
} from 'react-native';
import { errorToast, successToast } from '../utils/toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import Button from '../components/Button';
import Input from '../components/Input';
import CountryPicker from '../components/CountryPicker';

const countryCodes = {
    // 'Ghana': '+233',
    'Canada': '+1',
};

const RegisterScreen = ({ navigation }) => {
    const theme = useTheme();
    const { register } = useAuth();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);

    // Form State
    const [firstName, setFirstName] = useState('');
    const [middleName, setMiddleName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [country, setCountry] = useState('Canada');
    const [phone, setPhone] = useState('+1');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [pin, setPin] = useState('');
    const [referralCode, setReferralCode] = useState('');

    // UI State
    const [showPassword, setShowPassword] = useState(false);
    const [showPin, setShowPin] = useState(false);
    const [pickerVisible, setPickerVisible] = useState(false);

    const handleNext = () => {
        if (step === 1) {
            if (!firstName.trim()) {
                errorToast('Required', 'Please enter your first name.');
                return;
            }
            if (!lastName.trim()) {
                errorToast('Required', 'Please enter your last name.');
                return;
            }
            if (!email.trim().includes('@')) {
                errorToast('Invalid Email', 'Please enter a valid email address.');
                return;
            }
        }
        if (step === 2) {
            const code = countryCodes[country];
            if (!phone.startsWith(code)) {
                errorToast('Invalid Phone', `Phone number must start with ${code} for ${country}`);
                return;
            }
            if (phone.length < 10) {
                errorToast('Too Short', 'Please enter a valid phone number.');
                return;
            }
        }
        setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        } else {
            navigation.goBack();
        }
    };

    const handleRegister = async () => {
        if (password.length < 6) {
            errorToast('Weak Password', 'Password must be at least 6 characters.');
            return;
        }
        if (password !== confirmPassword) {
            errorToast('Mismatch', 'Passwords do not match.');
            return;
        }
        if (pin.length !== 4) {
            errorToast('Invalid PIN', 'Transaction PIN must be 4 digits.');
            return;
        }

        setLoading(true);
        try {
            await register({
                email: email.toLowerCase().trim(),
                password,
                confirmPassword,
                first_name: firstName.trim(),
                middle_name: middleName.trim(),
                last_name: lastName.trim(),
                phone: phone.trim(),
                country: country,
                pin: pin,
                referral_code: referralCode,
                role: 'user'
            }, { autoLogin: false });

            navigation.navigate('RegisterSuccess', { email: email.toLowerCase().trim() });
        } catch (error) {
            if (error.code === 'ECONNABORTED') {
                errorToast('Timeout', 'Registration request timed out. Please check your internet connection.');
            } else if (!error.response) {
                errorToast('Network Error', 'Please check your internet connection and try again.');
            } else {
                errorToast('Registration Failed', error.response?.data?.error || 'Registration failed. Please check your details.');
            }
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <View style={styles.stepContainer}>
                        <Input
                            label="First Name"
                            placeholder="Hamza"
                            value={firstName}
                            onChangeText={setFirstName}
                        />
                        <Input
                            label="Middle Name (Optional)"
                            placeholder="Moro"
                            value={middleName}
                            onChangeText={setMiddleName}
                        />
                        <Input
                            label="Last Name"
                            placeholder="Ibrahim"
                            value={lastName}
                            onChangeText={setLastName}
                        />
                        <Input
                            label="Email Address"
                            placeholder="email@example.com"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>
                );
            case 2:
                return (
                    <View style={styles.stepContainer}>
                        <Text style={[styles.label, { color: theme.textMuted }]}>Your Country</Text>
                        <TouchableOpacity
                            style={[
                                styles.pickerTrigger,
                                {
                                    backgroundColor: theme.isDark ? '#1f2937' : '#f3f4f6',
                                    borderColor: theme.border || (theme.isDark ? '#374151' : '#e5e7eb')
                                }
                            ]}
                            onPress={() => setPickerVisible(true)}
                        >
                            <Text style={[styles.pickerText, { color: theme.text }]}>{country}</Text>
                            <Ionicons name="chevron-down" size={20} color={theme.textMuted} />
                        </TouchableOpacity>

                        <Input
                            label="Phone Number"
                            placeholder={countryCodes[country]}
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                        />

                        <CountryPicker
                            visible={pickerVisible}
                            onClose={() => setPickerVisible(false)}
                            selectedCountry={country}
                            onSelect={(item) => {
                                setCountry(item.name);
                                setPhone(item.code);
                            }}
                        />
                    </View>
                );
            case 3:
                return (
                    <View style={styles.stepContainer}>
                        <Input
                            label="Password"
                            placeholder="Minimum 6 characters"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            rightIcon={showPassword ? "eye-off" : "eye"}
                            onRightIconPress={() => setShowPassword(!showPassword)}
                        />
                        <Input
                            label="Confirm Password"
                            placeholder="Repeat your password"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showPassword}
                        />
                        <View style={{ marginBottom: 10 }}>
                            <Input
                                label="4-Digit Transaction PIN"
                                placeholder="••••"
                                value={pin}
                                onChangeText={(text) => setPin(text.replace(/\D/g, ''))}
                                secureTextEntry={!showPin}
                                rightIcon={showPin ? "eye-off" : "eye"}
                                onRightIconPress={() => setShowPin(!showPin)}
                                keyboardType="number-pad"
                                maxLength={4}
                            />
                            <Text style={[styles.helperText, { color: theme.textMuted }]}>
                                Used to authorize transfers and uploads.
                            </Text>
                        </View>
                        <Input
                            label="Referral Code (Optional)"
                            placeholder="QT-XXXXXX"
                            value={referralCode}
                            onChangeText={(text) => setReferralCode(text.toUpperCase())}
                            autoCapitalize="characters"
                        />
                    </View>
                );
            default:
                return null;
        }
    };

    const getHeaderTitle = () => {
        if (step === 1) return "Personal Information";
        if (step === 2) return "Location Information";
        if (step === 3) return "Account Security";
        return "Create Account";
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <View style={[styles.progressBarInfo]}>
                    <View style={[styles.progressValues, { width: `${(step / 3) * 100}%`, backgroundColor: theme.primary }]} />
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <Text style={[styles.title, { color: theme.text }]}>
                        {getHeaderTitle()}
                    </Text>

                    {renderStep()}

                    <View style={{ gap: 12 }}>
                        <Button
                            label={step === 3 ? 'Complete Registration' : 'Next Step'}
                            onPress={step === 3 ? handleRegister : handleNext}
                            loading={loading}
                        />

                        {step > 1 && (
                            <Button
                                label="Back"
                                variant="outline"
                                onPress={handleBack}
                                disabled={loading}
                            />
                        )}
                    </View>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('Login')}
                        style={{ marginTop: 30, alignItems: 'center' }}
                    >
                        <Text style={{ color: theme.textMuted, fontFamily: 'Outfit_400Regular' }}>
                            Already have an account? <Text style={{ color: theme.primary, fontFamily: 'Outfit_700Bold' }}>Sign in</Text>
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    flex: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 10,
        height: 50,
    },
    backBtn: {
        padding: 5,
        marginRight: 20
    },
    progressBarInfo: {
        flex: 1,
        height: 4,
        backgroundColor: '#e2e8f0',
        borderRadius: 2,
        overflow: 'hidden',
        marginRight: 20
    },
    progressValues: {
        height: '100%',
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 30,
        paddingBottom: 40
    },
    title: {
        fontSize: 28,
        fontFamily: 'Outfit_700Bold',
        marginBottom: 30,
    },
    stepContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontFamily: 'Outfit_600SemiBold',
        marginBottom: 8,
        marginLeft: 4,
    },
    pickerTrigger: {
        height: 56,
        borderRadius: 16,
        borderWidth: 1.5,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    pickerText: {
        fontSize: 16,
        fontFamily: 'Outfit_400Regular',
    },
    helperText: {
        fontSize: 12,
        fontFamily: 'Outfit_400Regular',
        marginTop: -10,
        marginLeft: 4,
    }
});

export default RegisterScreen;
