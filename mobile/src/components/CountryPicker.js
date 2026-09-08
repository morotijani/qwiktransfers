import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, SafeAreaView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Ionicons from '@expo/vector-icons/Ionicons';

const countries = [
    // { name: 'Ghana', code: '+233', flag: '🇬🇭' },
    { name: 'Canada', code: '+1', flag: '🇨🇦' }
];

const CountryPicker = ({ visible, onClose, onSelect, selectedCountry }) => {
    const theme = useTheme();

    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.text }]}>Select Country</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={countries}
                        keyExtractor={(item) => item.name}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    styles.countryItem,
                                    { borderBottomColor: theme.border },
                                    selectedCountry === item.name && { backgroundColor: theme.isDark ? '#374151' : '#f3f4f6' }
                                ]}
                                onPress={() => {
                                    onSelect(item);
                                    onClose();
                                }}
                            >
                                <Text style={styles.flag}>{item.flag}</Text>
                                <Text style={[styles.countryName, { color: theme.text }]}>{item.name}</Text>
                                <Text style={[styles.phoneCode, { color: theme.textMuted }]}>{item.code}</Text>
                                {selectedCountry === item.name && (
                                    <Ionicons name="checkmark-sharp" size={20} color={theme.primary} />
                                )}
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end'
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 20,
        paddingHorizontal: 20,
        maxHeight: '50%'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    title: {
        fontSize: 20,
        fontFamily: 'Outfit_700Bold'
    },
    countryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 10
    },
    flag: {
        fontSize: 24,
        marginRight: 15
    },
    countryName: {
        flex: 1,
        fontSize: 16,
        fontFamily: 'Outfit_500Medium'
    },
    phoneCode: {
        fontSize: 14,
        fontFamily: 'Outfit_400Regular',
        marginRight: 10
    }
});

export default CountryPicker;
