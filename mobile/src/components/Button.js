import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';

const Button = ({ onPress, style, textStyle, label, loading, disabled, ...props }) => {
    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (onPress) onPress();
    };

    return (
        <TouchableOpacity
            style={[styles.button, style, (disabled || loading) && styles.disabled]}
            onPress={handlePress}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={textStyle?.color || "#fff"} />
            ) : (
                <Text style={[styles.text, textStyle]}>{label}</Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    disabled: {
        opacity: 0.7,
    },
    text: {
        fontSize: 18,
        fontWeight: '700',
        fontFamily: 'Outfit_700Bold',
        color: '#fff',
    }
});

export default Button;
