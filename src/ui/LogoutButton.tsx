import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

type Props = {
  onLogout: () => void;
};

export const LogoutButton = ({ onLogout }: Props) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onLogout} activeOpacity={0.8}>
      <Feather name="log-out" size={18} color="#E53935" />
      <Text style={styles.text}>Logout</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
		width: '100%',
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F5C6C6',
  },
  text: {
    color: '#E53935',
    fontSize: 15,
    fontWeight: '600',
  },
});
