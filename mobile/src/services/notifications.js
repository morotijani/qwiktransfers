import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#ef4444', // QwikTransfers red
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            console.log('Push notification permission denied');
            return null;
        }
        try {
            const projectId =
                Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

            // We use a fallback projectId if EAS config is not present, to avoid crashing
            token = (
                await Notifications.getExpoPushTokenAsync({
                    projectId: projectId || "your-project-id",
                })
            ).data;
            console.log("QwikTransfers Push Token:", token);

            // Note: Ideally, you would send this token to the backend server 
            // e.g., await api.post('/users/push-token', { token });

        } catch (e) {
            console.log('Error getting push token', e);
        }
    } else {
        console.log('Push Notifications are only supported on physical devices');
    }

    return token;
}
