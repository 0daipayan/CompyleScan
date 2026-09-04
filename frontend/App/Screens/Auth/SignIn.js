import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Image } from 'react-native';
import { AppButton, AppTextInput, Container, Text } from 'react-native-basic-elements';
import { moderateScale } from '../../Constants/PixelRatio';
import { useDispatch } from 'react-redux';
import { setUser } from '../../Redux/reducer/User';
import RoleSelector from '../../Components/RoleSelector';

const SignIn = ({ navigation }) => {
  const dispatch = useDispatch();
  const [role, setRole] = useState('Inspector');
  const [officerId, setOfficerId] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  const validate = () => {
    let valid = true;
    let newErrors = {};

    if (!officerId.trim()) {
      newErrors.officerId = `${role === 'Inspector' ? 'Inspector ID' : 'Officer ID'} is required`;
      valid = false;
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSignIn = () => {
    if (validate()) {
      dispatch(setUser({ officerId, role }));
    }
  };

  return (
    <Container style={styles.container}>
      <View style={styles.contentContainer}>
        {/* Header Icon */}
        <View style={styles.iconBadge}>
          <Image
            source={require('../../Assets/sign-in.png')}
            style={styles.headerIcon}
            resizeMode="contain"
          />
        </View>

        {/* Header Titles */}
        <Text.Heading title="ComplySpect" style={styles.mainTitle} />
        <Text style={styles.subTitle}>AI-Powered Compliance Inspection</Text>

        {/* Form Container */}
        <View style={styles.formContainer}>
          <RoleSelector
            selectedRole={role}
            onSelectRole={(newRole) => {
              setRole(newRole);
              setErrors({});
            }}
          />

          <Text style={styles.inputLabel}>
            {role === 'Inspector' ? 'Inspector ID' : 'Officer ID'}
          </Text>
          <AppTextInput
            value={officerId}
            onChangeText={(text) => {
              setOfficerId(text);
              if (errors.officerId) setErrors((prev) => ({ ...prev, officerId: null }));
            }}
            placeholder={`Enter ${role} ID`}
            inputContainerStyle={[
              styles.textInputContainer,
              errors.officerId && styles.errorInputBorder,
            ]}
            style={styles.textInput}
          />
          {errors.officerId && <Text style={styles.errorText}>{errors.officerId}</Text>}

          <Text style={styles.inputLabel}>Password</Text>
          <AppTextInput
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
            }}
            placeholder="Enter Password"
            secureTextEntry
            inputContainerStyle={[
              styles.textInputContainer,
              errors.password && styles.errorInputBorder,
            ]}
            style={styles.textInput}
          />
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

          {/* Submit Button */}
          <AppButton
            title="Sign in"
            textStyle={styles.buttonText}
            style={styles.primaryButton}
            onPress={handleSignIn}
          />
        </View>

        {/* Link to Registration */}
        <TouchableOpacity
          style={styles.registerLink}
          onPress={() => navigation.navigate('SignUp')}
        >
          <Text style={styles.registerLinkText}>
            New to the department? <Text style={styles.registerBoldText}>Register</Text>
          </Text>
        </TouchableOpacity>

        {/* Footer Note */}
        <View style={styles.footerContainer}>
          <Image
            source={require('../../Assets/padlock.png')}
            style={styles.lockIcon}
            resizeMode="contain"
          />
          <Text style={styles.footerText}> Secured · role-based access</Text>
        </View>
      </View>
    </Container>
  );
};

export default SignIn;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    paddingHorizontal: moderateScale(20),
  },
  contentContainer: {
    alignItems: 'center',
    width: '100%',
  },
  iconBadge: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(14),
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(16),
  },
  headerIcon: {
    width: moderateScale(28),
    height: moderateScale(28),
    tintColor: '#0F172A',
  },
  mainTitle: {
    fontSize: moderateScale(22),
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: moderateScale(4),
  },
  subTitle: {
    fontSize: moderateScale(13),
    color: '#64748B',
    marginBottom: moderateScale(24),
  },
  formContainer: {
    width: '100%',
  },
  inputLabel: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: '#334155',
    marginBottom: moderateScale(6),
  },
  textInputContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    marginBottom: moderateScale(12),
    height: moderateScale(48),
  },
  textInput: {
    fontSize: moderateScale(14),
    color: '#0F172A',
  },
  errorInputBorder: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: moderateScale(11),
    color: '#EF4444',
    marginTop: moderateScale(-8),
    marginBottom: moderateScale(12),
  },
  primaryButton: {
    backgroundColor: '#0F172A',
    borderRadius: moderateScale(10),
    height: moderateScale(48),
    justifyContent: 'center',
    marginTop: moderateScale(8),
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  registerLink: {
    marginTop: moderateScale(20),
  },
  registerLinkText: {
    fontSize: moderateScale(13),
    color: '#64748B',
  },
  registerBoldText: {
    fontWeight: '700',
    color: '#0F172A',
  },
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: moderateScale(24),
  },
  lockIcon: {
    width: moderateScale(14),
    height: moderateScale(14),
    tintColor: '#64748B',
  },
  footerText: {
    fontSize: moderateScale(12),
    color: '#64748B',
  },
});