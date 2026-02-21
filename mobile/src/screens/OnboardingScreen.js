import React, { useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    FlatList,
    TouchableOpacity,
    Image,
    SafeAreaView,
    StatusBar,
    Platform
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const slides = [
    {
        id: '1',
        title: 'Send money\ninstantly to\nloved ones',
        subtitle: 'Fast, secure, and reliable transfers between Canada and Ghana.',
        image: require('../../assets/images/onboarding1.png'),
    },
    {
        id: '2',
        title: 'Best rates for\ninternational\ntransfers',
        subtitle: 'We offer the most competitive CAD to GHS exchange rates. No hidden fees.',
        image: require('../../assets/images/onboarding2.png'),
    },
    {
        id: '3',
        title: 'Safe & Secure\nTransactions',
        subtitle: 'Your money is safe with us. We use bank-grade security to protect your funds.',
        image: require('../../assets/images/onboarding3.png'),
    }
];

const Slide = ({ item, theme }) => {
    return (
        <View style={[styles.slide, { backgroundColor: theme.background }]}>
            <View style={styles.imageContainer}>
                <Image
                    source={item.image}
                    style={{ width: width * 0.9, height: width * 0.7 }}
                    resizeMode="contain"
                />
            </View>
            <View style={styles.textContainer}>
                <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
                {item.subtitle && (
                    <Text style={[styles.subtitle, { color: theme.textMuted }]}>{item.subtitle}</Text>
                )}
            </View>
        </View>
    );
};

const OnboardingScreen = ({ navigation }) => {
    const theme = useTheme();
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const ref = useRef();

    const updateCurrentSlideIndex = e => {
        const contentOffsetX = e.nativeEvent.contentOffset.x;
        const currentIndex = Math.round(contentOffsetX / width);
        setCurrentSlideIndex(currentIndex);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

            {/* Header / Logo (Optional) */}
            <View style={styles.header}>
                <Text style={[styles.logo, { color: theme.primary }]}>QwikTransfers</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={[styles.signInButton, { color: theme.primary }]}>Sign in</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                ref={ref}
                onMomentumScrollEnd={updateCurrentSlideIndex}
                contentContainerStyle={{ height: '75%', paddingTop: 20 }}
                showsHorizontalScrollIndicator={false}
                horizontal
                data={slides}
                pagingEnabled
                renderItem={({ item }) => <Slide item={item} theme={theme} />}
            />

            <View style={styles.footer}>
                {/* Pagination Dots */}
                <View style={styles.indicatorContainer}>
                    {slides.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.indicator,
                                currentSlideIndex === index && styles.indicatorActive,
                                { backgroundColor: currentSlideIndex === index ? theme.primary : theme.border }
                            ]}
                        />
                    ))}
                </View>

                {/* Main Action Button */}
                <TouchableOpacity
                    style={[styles.btn, { backgroundColor: theme.primary }]}
                    onPress={() => navigation.navigate('Register')}
                >
                    <Text style={styles.btnText}>Create free account</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: Platform.OS === 'android' ? 30 : 0
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        height: 60,
    },
    logo: {
        fontSize: 18,
        fontFamily: 'Outfit_700Bold',
    },
    signInButton: {
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
    },
    slide: {
        width,
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    imageContainer: {
        flex: 0.55,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20
    },
    textContainer: {
        flex: 0.45,
        alignItems: 'flex-start',
        width: '100%',
        paddingHorizontal: 10,
    },
    title: {
        fontSize: 32,
        fontFamily: 'Outfit_700Bold',
        marginBottom: 15,
        marginTop: 20,
        textAlign: 'left',
        lineHeight: 40,
    },
    subtitle: {
        fontSize: 16,
        fontFamily: 'Outfit_400Regular',
        textAlign: 'left',
        lineHeight: 24,
    },
    footer: {
        height: '25%',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    indicatorContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    indicator: {
        height: 6,
        width: 6,
        borderRadius: 3,
        marginHorizontal: 3,
    },
    indicatorActive: {
        width: 20, // Elongated active dot
    },
    btn: {
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnText: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#fff',
        fontFamily: 'Outfit_700Bold',
    },
});

export default OnboardingScreen;
