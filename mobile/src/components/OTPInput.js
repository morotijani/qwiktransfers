import React, { useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const OTPInput = ({ value, onChange, length = 4 }) => {
    const theme = useTheme();
    const inputRef = useRef(null);
    const [isFocused, setIsFocused] = useState(false);

    const handlePress = () => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    const renderBoxes = () => {
        const boxes = [];
        for (let i = 0; i < length; i++) {
            const char = value[i];
            const isCurrentBox = value.length === i;
            const isBoxFocused = isCurrentBox && isFocused;

            boxes.push(
                <View
                    key={i}
                    style={[
                        styles.box,
                        {
                            backgroundColor: theme.background,
                            borderColor: isBoxFocused ? theme.primary : theme.border,
                            borderWidth: isBoxFocused ? 2 : 1,
                        }
                    ]}
                >
                    <Text style={[styles.boxText, { color: theme.text }]}>
                        {char ? '•' : ''}
                    </Text>
                </View>
            );
        }
        return boxes;
    };

    return (
        <View style={styles.container}>
            <Pressable onPress={handlePress} style={styles.boxesContainer}>
                {renderBoxes()}
            </Pressable>
            <TextInput
                ref={inputRef}
                value={value}
                onChangeText={onChange}
                maxLength={length}
                keyboardType="numeric"
                style={styles.hiddenInput}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                caretHidden={true}
                contextMenuHidden={true}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        marginVertical: 10,
    },
    boxesContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        gap: 12,
    },
    box: {
        width: 50,
        height: 60,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    boxText: {
        fontSize: 24,
        fontFamily: 'Outfit_700Bold',
    },
    hiddenInput: {
        position: 'absolute',
        width: 1,
        height: 1,
        opacity: 0,
    }
});

export default OTPInput;
