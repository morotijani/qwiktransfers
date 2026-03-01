import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

/**
 * Check if the device has biometric hardware and if any biometrics are enrolled.
 * @returns {Promise<boolean>} True if biometrics can be used.
 */
export const isBiometricSupported = async () => {
    try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        return hasHardware && isEnrolled;
    } catch (error) {
        console.error('Biometric support check failed:', error);
        return false;
    }
};

/**
 * Prompt the user for biometric authentication.
 * @param {string} promptMessage The message to display on the native biometric prompt.
 * @param {string} cancelLabel The label for the cancel button.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const authenticateAsync = async (promptMessage = 'Authenticate', cancelLabel = 'Cancel') => {
    try {
        const supported = await isBiometricSupported();
        if (!supported) {
            return { success: false, error: 'Biometrics not supported or not enrolled on this device.' };
        }

        const result = await LocalAuthentication.authenticateAsync({
            promptMessage,
            cancelLabel,
            disableDeviceFallback: true, // We want strict biometrics, not device PIN for app auth logic (unless specified).
            fallbackLabel: 'Use Password/PIN',
        });

        if (result.success) {
            return { success: true };
        } else {
            return { success: false, error: result.error || 'Authentication failed or was canceled.' };
        }
    } catch (error) {
        console.error('Biometric authentication error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get the types of biometrics supported by the device.
 * @returns {Promise<number[]>} Array of LocalAuthentication.AuthenticationType (1: FINGERPRINT, 2: FACIAL_RECOGNITION, 3: IRIS)
 */
export const getSupportedBiometrics = async () => {
    try {
        return await LocalAuthentication.supportedAuthenticationTypesAsync();
    } catch (error) {
        console.error('Failed to get supported biometrics:', error);
        return [];
    }
};
