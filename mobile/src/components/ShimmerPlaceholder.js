import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const ShimmerPlaceholder = ({ style }) => {
    const theme = useTheme();
    const shimmerValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const startShimmer = () => {
            shimmerValue.setValue(0);
            Animated.timing(shimmerValue, {
                toValue: 1,
                duration: 1000,
                // Do not use native driver for color interpolation if not supported, but we'll use it for translateX if we used a mask.
                // For a simpler version, we'll just pulse the opacity.
                useNativeDriver: true,
            }).start(() => startShimmer());
        };
        startShimmer();
    }, [shimmerValue]);

    const opacity = shimmerValue.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.3, 0.7, 0.3]
    });

    return (
        <Animated.View
            style={[
                styles.shimmer,
                style,
                { backgroundColor: theme.isDark ? '#334155' : '#e2e8f0', opacity }
            ]}
        />
    );
};

const styles = StyleSheet.create({
    shimmer: {
        borderRadius: 4,
        overflow: 'hidden',
    }
});

export default ShimmerPlaceholder;
