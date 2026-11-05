import React, { useState } from 'react';

import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';

import {
  AppButton,
  AppTextInput,
  Container,
  Text,
} from 'react-native-basic-elements';

import { moderateScale } from '../../Constants/PixelRatio';
import RoleSelector from '../../Components/RoleSelector';

const BACKEND_URL = 'http://10.200.146.57:5000';

const SignUp = ({ navigation }) => {

  // ---------------------------------------------------------
  // ROLE
  // ---------------------------------------------------------
  const [role, setRole] = useState('Retailer');

  const [fullName, setFullName] = useState('');
  const [govId, setGovId] = useState('');
  const [department, setDepartment] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errors, setErrors] = useState({});

  // ---------------------------------------------------------
  // Validation
  // ---------------------------------------------------------
  const validate = () => {
    let valid = true;
    const newErrors = {};

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const phoneRegex =
      /^[0-9]{10}$/;

    // Full name
    if (!fullName.trim()) {
      newErrors.fullName =
        'Full name is required';

      valid = false;
    }

    // Retailer / Inspector ID
    if (!govId.trim()) {
      newErrors.govId =
        role === 'Retailer'
          ? 'Retailer ID is required'
          : 'Inspector ID is required';

      valid = false;
    }

    // Department
    if (!department.trim()) {
      newErrors.department =
        'Department / Circle is required';

      valid = false;
    }

    // Email
    if (!email.trim()) {
      newErrors.email =
        'Official email is required';

      valid = false;

    } else if (!emailRegex.test(email.trim())) {
      newErrors.email =
        'Enter a valid email address';

      valid = false;
    }

    // Mobile
    const cleanMobile =
      mobile.replace(/[^0-9]/g, '');

    if (!mobile.trim()) {
      newErrors.mobile =
        'Mobile number is required';

      valid = false;

    } else if (!phoneRegex.test(cleanMobile)) {
      newErrors.mobile =
        'Enter a valid 10-digit mobile number';

      valid = false;
    }

    // Password
    if (!password) {
      newErrors.password =
        'Password is required';

      valid = false;

    } else if (password.length < 6) {
      newErrors.password =
        'Password must be at least 6 characters';

      valid = false;
    }

    // Confirm password
    if (!confirmPassword) {
      newErrors.confirmPassword =
        'Please confirm your password';

      valid = false;

    } else if (password !== confirmPassword) {
      newErrors.confirmPassword =
        'Passwords do not match';

      valid = false;
    }

    setErrors(newErrors);

    return valid;
  };

  // ---------------------------------------------------------
  // Register
  // ---------------------------------------------------------
  const handleRegister = async () => {

    if (!validate()) {
      return;
    }

    try {

      const response = await fetch(
        `${BACKEND_URL}/api/auth/register`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            name: fullName.trim(),

            email: email
              .trim()
              .toLowerCase(),

            password,

            // Sends:
            // Retailer  -> retailer
            // Inspector -> inspector
            role: role.toLowerCase(),

            // Kept as officerId because
            // backend/database currently uses this field.
            officerId: govId.trim(),

            jurisdiction: department.trim(),
          }),
        }
      );

      const result = await response.json();

      console.log(
        'Registration response:',
        result
      );

      // Backend returned an error
      if (!response.ok) {
        throw new Error(
          result?.error ||
          result?.details ||
          'Registration failed.'
        );
      }

      // -----------------------------------------------------
      // Successful registration
      // -----------------------------------------------------
      Alert.alert(
        'Registration Successful',
        `Your account has been created.\n\nID: ${result.user.officerId}`,
        [
          {
            text: 'Go to Sign In',
            onPress: () => {
              navigation.navigate('SignIn');
            },
          },
        ]
      );

    } catch (error) {

      console.error(
        'Registration error:',
        error
      );

      Alert.alert(
        'Registration Failed',
        error?.message ||
          'Unable to create account.'
      );
    }
  };

  return (
    <Container style={styles.container}>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        {/* Header */}
        <Text style={styles.categoryBadge}>
          DEPARTMENT ONBOARDING
        </Text>

        <Text.Heading
          title="Create account"
          style={styles.mainTitle}
        />

        <Text style={styles.subTitle}>
          For authorized retailers & inspectors only
        </Text>

        {/* Role */}
        <RoleSelector
          selectedRole={role}
          onSelectRole={(newRole) => {
            setRole(newRole);
            setErrors({});
          }}
        />

        {/* Full Name */}
        <Text style={styles.inputLabel}>
          Full name
        </Text>

        <AppTextInput
          value={fullName}
          onChangeText={(text) => {
            setFullName(text);

            if (errors.fullName) {
              setErrors((prev) => ({
                ...prev,
                fullName: null,
              }));
            }
          }}
          placeholder="Enter Full Name"
          inputContainerStyle={[
            styles.textInputContainer,
            errors.fullName &&
              styles.errorInputBorder,
          ]}
          style={styles.textInput}
        />

        {errors.fullName && (
          <Text style={styles.errorText}>
            {errors.fullName}
          </Text>
        )}

        {/* Retailer / Inspector ID */}
        <Text style={styles.inputLabel}>
          {role === 'Retailer'
            ? 'Retailer ID'
            : 'Inspector ID'}
        </Text>

        <AppTextInput
          value={govId}
          onChangeText={(text) => {
            setGovId(text);

            if (errors.govId) {
              setErrors((prev) => ({
                ...prev,
                govId: null,
              }));
            }
          }}
          placeholder={`Enter ${
            role === 'Retailer'
              ? 'Retailer'
              : 'Inspector'
          } ID`}
          inputContainerStyle={[
            styles.textInputContainer,
            errors.govId &&
              styles.errorInputBorder,
          ]}
          style={styles.textInput}
        />

        {errors.govId && (
          <Text style={styles.errorText}>
            {errors.govId}
          </Text>
        )}

        {/* Department */}
        <Text style={styles.inputLabel}>
          Department / Circle
        </Text>

        <AppTextInput
          value={department}
          onChangeText={(text) => {
            setDepartment(text);

            if (errors.department) {
              setErrors((prev) => ({
                ...prev,
                department: null,
              }));
            }
          }}
          placeholder="Select Department"
          inputContainerStyle={[
            styles.textInputContainer,
            errors.department &&
              styles.errorInputBorder,
          ]}
          style={styles.textInput}
        />

        {errors.department && (
          <Text style={styles.errorText}>
            {errors.department}
          </Text>
        )}

        {/* Official Email */}
        <Text style={styles.inputLabel}>
          Official email
        </Text>

        <AppTextInput
          value={email}
          onChangeText={(text) => {
            setEmail(text);

            if (errors.email) {
              setErrors((prev) => ({
                ...prev,
                email: null,
              }));
            }
          }}
          placeholder="Enter Official Email"
          keyboardType="email-address"
          autoCapitalize="none"
          inputContainerStyle={[
            styles.textInputContainer,
            errors.email &&
              styles.errorInputBorder,
          ]}
          style={styles.textInput}
        />

        {errors.email && (
          <Text style={styles.errorText}>
            {errors.email}
          </Text>
        )}

        {/* Mobile */}
        <Text style={styles.inputLabel}>
          Mobile number
        </Text>

        <AppTextInput
          value={mobile}
          onChangeText={(text) => {
            setMobile(text);

            if (errors.mobile) {
              setErrors((prev) => ({
                ...prev,
                mobile: null,
              }));
            }
          }}
          placeholder="Enter Mobile Number"
          keyboardType="phone-pad"
          inputContainerStyle={[
            styles.textInputContainer,
            errors.mobile &&
              styles.errorInputBorder,
          ]}
          style={styles.textInput}
        />

        {errors.mobile && (
          <Text style={styles.errorText}>
            {errors.mobile}
          </Text>
        )}

        {/* Password */}
        <Text style={styles.inputLabel}>
          Password
        </Text>

        <AppTextInput
          value={password}
          onChangeText={(text) => {
            setPassword(text);

            if (errors.password) {
              setErrors((prev) => ({
                ...prev,
                password: null,
              }));
            }
          }}
          placeholder="Enter Password"
          secureTextEntry
          inputContainerStyle={[
            styles.textInputContainer,
            errors.password &&
              styles.errorInputBorder,
          ]}
          style={styles.textInput}
        />

        {errors.password && (
          <Text style={styles.errorText}>
            {errors.password}
          </Text>
        )}

        {/* Confirm Password */}
        <Text style={styles.inputLabel}>
          Confirm password
        </Text>

        <AppTextInput
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);

            if (errors.confirmPassword) {
              setErrors((prev) => ({
                ...prev,
                confirmPassword: null,
              }));
            }
          }}
          placeholder="Confirm Password"
          secureTextEntry
          inputContainerStyle={[
            styles.textInputContainer,
            errors.confirmPassword &&
              styles.errorInputBorder,
          ]}
          style={styles.textInput}
        />

        {errors.confirmPassword && (
          <Text style={styles.errorText}>
            {errors.confirmPassword}
          </Text>
        )}

        {/* Submit */}
        <AppButton
          title="Submit for verification"
          textStyle={styles.buttonText}
          style={styles.primaryButton}
          onPress={handleRegister}
        />

        {/* Sign In Link */}
        <TouchableOpacity
          style={styles.signInLink}
          onPress={() =>
            navigation.navigate('SignIn')
          }
        >
          <Text style={styles.signInLinkText}>
            Already registered?{' '}
            <Text style={styles.signInBoldText}>
              Sign In
            </Text>
          </Text>
        </TouchableOpacity>

        {/* Footer */}
        <Text style={styles.footerNote}>
          Accounts are verified against departmental
          records before activation.
        </Text>

      </ScrollView>
    </Container>
  );
};

export default SignUp;

// ---------------------------------------------------------
// Styles
// ---------------------------------------------------------

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  scrollContent: {
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(40),
    paddingBottom: moderateScale(30),
  },

  categoryBadge: {
    fontSize: moderateScale(11),
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: moderateScale(4),
  },

  mainTitle: {
    fontSize: moderateScale(24),
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: moderateScale(4),
  },

  subTitle: {
    fontSize: moderateScale(13),
    color: '#64748B',
    marginBottom: moderateScale(20),
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
    marginTop: moderateScale(12),
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(14),
    fontWeight: '600',
  },

  signInLink: {
    marginTop: moderateScale(18),
    alignItems: 'center',
  },

  signInLinkText: {
    fontSize: moderateScale(13),
    color: '#64748B',
  },

  signInBoldText: {
    fontWeight: '700',
    color: '#0F172A',
  },

  footerNote: {
    fontSize: moderateScale(12),
    color: '#64748B',
    textAlign: 'center',
    marginTop: moderateScale(20),
    lineHeight: moderateScale(18),
  },

});