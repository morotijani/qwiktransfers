import 'dotenv/config';

const productionUrl = 'https://api.qwiktransfers.com';

export default {
    name: "QwikTransfers",
    slug: "qwiktransfers",
    owner: "namibra",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: false,
    splash: {
        image: "./assets/name-logo.png",
        resizeMode: "contain",
        backgroundColor: "#ffffff"
    },
    ios: {
        supportsTablet: true
    },
    android: {
        adaptiveIcon: {
            foregroundImage: "./assets/icon.png",
            backgroundColor: "#ffffff"
        },
        edgeToEdgeEnabled: true,
        package: "com.namibra.qwiktransfers",
        versionCode: 3,
        usesCleartextTraffic: true,
        permissions: ["INTERNET"]
    },
    web: {
        favicon: "./assets/icon.png"
    },
    runtimeVersion: {
        policy: "appVersion"
    },
    updates: {
        url: "https://u.expo.dev/d8a066d8-caf6-4510-9aa1-986d97c618c2"
    },
    plugins: [
        "expo-font",
        "expo-sharing",
        "expo-splash-screen",
        "expo-status-bar",
        [
            "expo-build-properties",
            {
                "android": {
                    "usesCleartextTraffic": true
                }
            }
        ]
    ],
    extra: {
        apiUrl: (process.env.API_URL || productionUrl) + '/api',
        eas: {
            projectId: "d8a066d8-caf6-4510-9aa1-986d97c618c2"
        }
    }
};
