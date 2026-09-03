import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { AppButton, AppTextInput, Container, Text } from 'react-native-basic-elements';
import { moderateScale } from '../../Constants/PixelRatio';
import RoleSelector from '../../Components/RoleSelector';

const SignUp = ({ navigation }) => {
  const [role, setRole] = useState('Inspector');
  const [fullName, setFullName] = useState('');
  const [govId, setGovId] = useState('');
  const [department, setDepartment] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errors, setErrors] = useState({});

  const validate = () => {
    let valid = true;
    let newErrors = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
      valid = false;
    }
    if (!govId.trim()) {
      newErrors.govId = 'Government / Officer ID is required';
      valid = false;
    }
    if (!department.trim()) {
      newErrors.department = 'Department / Circle is required';
      valid = false;
    }
    if (!email.trim()) {
      newErrors.email = 'Official email is required';
      valid = false;
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Enter a valid email address';
      valid = false;
    }
    if (!mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
      valid = false;
    } else if (!phoneRegex.test(mobile.replace(/[^0-9]/g, ''))) {
      newErrors.mobile = 'Enter a valid 10-digit mobile number';
      valid = false;
    }
    if (!password) {
      newErrors.password = 'Password is required';
      valid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      valid = false;
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
      valid = false;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleRegister = () => {
    if (validate()) {
      navigation.navigate('SignIn');
    }
  };

  return (
    <Container style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header Titles */}
        <Text style={styles.categoryBadge}>DEPARTMENT ONBOARDING</Text>
        <Text.Heading title="Create account" style={styles.mainTitle} />
        <Text style={styles.subTitle}>For authorized inspectors & officers only</Text>

        <RoleSelector selectedRole={role} onSelectRole={setRole} />

        {/* Input Fields */}
        <Text style={styles.inputLabel}>Full name</Text>
        <AppTextInput
          value={fullName}
          onChangeText={(t) => {
            setFullName(t);
            if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: null }));
          }}
          placeholder="Enter Full Name"
          inputContainerStyle={[styles.textInputContainer, errors.fullName && styles.errorInputBorder]}
          style={styles.textInput}
        />
        {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}

        <Text style={styles.inputLabel}>Government / Officer ID</Text>
        <AppTextInput
          value={govId}
          onChangeText={(t) => {
            setGovId(t);
            if (errors.govId) setErrors((prev) => ({ ...prev, govId: null }));
          }}
          placeholder="Enter ID"
          inputContainerStyle={[styles.textInputContainer, errors.govId && styles.errorInputBorder]}
          style={styles.textInput}
        />
        {errors.govId && <Text style={styles.errorText}>{errors.govId}</Text>}

        <Text style={styles.inputLabel}>Department / Circle</Text>
        <AppTextInput
          value={department}
          onChangeText={(t) => {
            setDepartment(t);
            if (errors.department) setErrors((prev) => ({ ...prev, department: null }));
          }}
          placeholder="Select Department"
          inputContainerStyle={[styles.textInputContainer, errors.department && styles.errorInputBorder]}
          style={styles.textInput}
        />
        {errors.department && <Text style={styles.errorText}>{errors.department}</Text>}

        <Text style={styles.inputLabel}>Official email</Text>
        <AppTextInput
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
          }}
          placeholder="Enter Official Email"
          keyboardType="email-address"
          inputContainerStyle={[styles.textInputContainer, errors.email && styles.errorInputBorder]}
          style={styles.textInput}
        />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

        <Text style={styles.inputLabel}>Mobile number</Text>
        <AppTextInput
          value={mobile}
          onChangeText={(t) => {
            setMobile(t);
            if (errors.mobile) setErrors((prev) => ({ ...prev, mobile: null }));
          }}
          placeholder="Enter Mobile Number"
          keyboardType="phone-pad"
          inputContainerStyle={[styles.textInputContainer, errors.mobile && styles.errorInputBorder]}
          style={styles.textInput}
        />
        {errors.mobile && <Text style={styles.errorText}>{errors.mobile}</Text>}

        <Text style={styles.inputLabel}>Password</Text>
        <AppTextInput
          value={password}
          onChangeText={(t) => {
            setPassword(t);
            if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
          }}
          placeholder="Enter Password"
          secureTextEntry
          inputContainerStyle={[styles.textInputContainer, errors.password && styles.errorInputBorder]}
          style={styles.textInput}
        />
        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

        <Text style={styles.inputLabel}>Confirm password</Text>
        <AppTextInput
          value={confirmPassword}
          onChangeText={(t) => {
            setConfirmPassword(t);
            if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: null }));
          }}
          placeholder="Confirm Password"
          secureTextEntry
          inputContainerStyle={[styles.textInputContainer, errors.confirmPassword && styles.errorInputBorder]}
          style={styles.textInput}
        />
        {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

        {/* Submit Button */}
        <AppButton
          title="Submit for verification"
          textStyle={styles.buttonText}
          style={styles.primaryButton}
          onPress={handleRegister}
        />

        {/* Link back to Sign In */}
        <TouchableOpacity 
          style={styles.signInLink} 
          onPress={() => navigation.navigate('SignIn')}
        >
          <Text style={styles.signInLinkText}>
            Already registered? <Text style={styles.signInBoldText}>Sign In</Text>
          </Text>
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          Accounts are verified against departmental records before activation.
        </Text>
      </ScrollView>
    </Container>
  );
};

export default SignUp;

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