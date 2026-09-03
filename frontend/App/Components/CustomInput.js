import React from 'react';
import { StyleSheet, View, Text, TextInput } from 'react-native';
import { moderateScale } from '../Constants/PixelRatio';

const CustomInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  containerStyle,
  inputStyle,
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, error && styles.inputWrapperError]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          style={[styles.input, inputStyle]}
          autoCapitalize="none"
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

export default CustomInput;

const styles = StyleSheet.create({
  container: {
    marginBottom: moderateScale(16),
    width: '100%',
  },
  label: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: '#334155',
    marginBottom: moderateScale(6),
  },
  inputWrapper: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    height: moderateScale(48),
    justifyContent: 'center',
  },
  inputWrapperError: {
    borderColor: '#EF4444',
  },
  input: {
    fontSize: moderateScale(14),
    color: '#0F172A',
    padding: 0,
  },
  errorText: {
    fontSize: moderateScale(11),
    color: '#EF4444',
    marginTop: moderateScale(4),
  },
});