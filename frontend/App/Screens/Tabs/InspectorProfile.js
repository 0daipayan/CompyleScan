import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { moderateScale } from '../../Constants/PixelRatio';
import { useDispatch } from 'react-redux';
import { logout } from '../../Redux/reducer/User';

const InspectorProfile = () => {
  const dispatch = useDispatch();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [biometricLogin, setBiometricLogin] = useState(true);
  const [offlineSync, setOfflineSync] = useState(false);

  return (
    <View style={styles.mainContainer}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Dark Header Banner */}
        <View style={styles.topHeaderBanner} />

        {/* Profile Details Container */}
        <View style={styles.profileContent}>
          {/* Avatar Section Overlapping Banner */}
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>RV</Text>
            <TouchableOpacity style={styles.editBadge}>
              <Icon name="pencil" size={moderateScale(11)} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.nameRow}>
            <Text style={styles.userName}>Rahul Verma</Text>
            <Icon name="check-circle" size={moderateScale(18)} color="#059669" />
          </View>

          <Text style={styles.userRoleText}>
            LM-2026-0533 · Legal Metrology, West Bengal
          </Text>

          <View style={styles.badgePill}>
            <Text style={styles.badgePillText}>FIELD INSPECTOR</Text>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>184</Text>
              <Text style={styles.statLabel}>Total scans</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>81</Text>
              <Text style={styles.statLabel}>Avg. score</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>6</Text>
              <Text style={styles.statLabel}>Pending review</Text>
            </View>
          </View>

          {/* Contact Details */}
          <Text style={styles.sectionHeader}>CONTACT DETAILS</Text>
          <View style={styles.cardBlock}>
            <View style={styles.infoRow}>
              <Icon name="email-outline" size={moderateScale(18)} color="#64748B" />
              <Text style={styles.infoText}>rahul.verma@gov.in</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Icon name="phone-outline" size={moderateScale(18)} color="#64748B" />
              <Text style={styles.infoText}>+91 98XXXXXX21</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Icon name="map-marker-outline" size={moderateScale(18)} color="#64748B" />
              <Text style={styles.infoText}>Salt Lake Circle, Kolkata</Text>
            </View>
          </View>

          {/* Preferences */}
          <Text style={styles.sectionHeader}>PREFERENCES</Text>
          <View style={styles.cardBlock}>
            <View style={styles.switchRow}>
              <View style={styles.optionLeft}>
                <Icon name="bell-outline" size={moderateScale(18)} color="#64748B" />
                <Text style={styles.optionText}>Push notifications</Text>
              </View>
              <Switch
                value={pushNotifications}
                onValueChange={setPushNotifications}
                trackColor={{ false: '#E2E8F0', true: '#059669' }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.switchRow}>
              <View style={styles.optionLeft}>
                <Icon name="checkbox-marked-outline" size={moderateScale(18)} color="#64748B" />
                <Text style={styles.optionText}>Face / fingerprint login</Text>
              </View>
              <Switch
                value={biometricLogin}
                onValueChange={setBiometricLogin}
                trackColor={{ false: '#E2E8F0', true: '#059669' }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.switchRow}>
              <View style={styles.optionLeft}>
                <Icon name="star-outline" size={moderateScale(18)} color="#64748B" />
                <Text style={styles.optionText}>Offline capture sync</Text>
              </View>
              <Switch
                value={offlineSync}
                onValueChange={setOfflineSync}
                trackColor={{ false: '#E2E8F0', true: '#059669' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Account & Support */}
          <Text style={styles.sectionHeader}>ACCOUNT & SUPPORT</Text>
          <View style={styles.cardBlock}>
            <TouchableOpacity style={styles.optionRow}>
              <View style={styles.optionLeft}>
                <Icon name="lock-outline" size={moderateScale(18)} color="#64748B" />
                <Text style={styles.optionText}>Change password</Text>
              </View>
              <Icon name="chevron-right" size={moderateScale(16)} color="#94A3B8" />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.optionRow}>
              <View style={styles.optionLeft}>
                <Icon name="help-circle-outline" size={moderateScale(18)} color="#64748B" />
                <Text style={styles.optionText}>Help & guidelines</Text>
              </View>
              <Icon name="chevron-right" size={moderateScale(16)} color="#94A3B8" />
            </TouchableOpacity>
            <View style={styles.divider} />
            <View style={styles.optionRow}>
              <View style={styles.optionLeft}>
                <Icon name="file-document-outline" size={moderateScale(18)} color="#64748B" />
                <Text style={styles.optionText}>Rule set version</Text>
              </View>
              <Text style={styles.versionText}>v2026.07-r3</Text>
            </View>
          </View>

          {/* Logout Action */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => dispatch(logout())}
          >
            <Icon name="logout" size={moderateScale(18)} color="#991B1B" />
            <Text style={styles.logoutText}>Log out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default InspectorProfile;

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { flex: 1 },
  topHeaderBanner: {
    height: moderateScale(110),
    backgroundColor: '#1E293B',
    width: '100%',
  },
  profileContent: {
    paddingHorizontal: moderateScale(20),
    alignItems: 'center',
  },
  avatarContainer: {
    width: moderateScale(88),
    height: moderateScale(88),
    borderRadius: moderateScale(44),
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: moderateScale(-44),
    borderWidth: 3,
    borderColor: '#FFFFFF',
    position: 'relative',
  },
  avatarText: { fontSize: moderateScale(26), fontWeight: '700', color: '#FFFFFF' },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#059669',
    borderRadius: moderateScale(12),
    padding: moderateScale(4),
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
    marginTop: moderateScale(12),
  },
  userName: { fontSize: moderateScale(20), fontWeight: '700', color: '#0F172A' },
  userRoleText: {
    fontSize: moderateScale(11),
    color: '#64748B',
    marginTop: moderateScale(4),
    textAlign: 'center',
  },
  badgePill: {
    marginTop: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(12),
    backgroundColor: '#ECFDF5',
  },
  badgePillText: { fontSize: moderateScale(10), fontWeight: '700', color: '#047857' },
  statsRow: {
    flexDirection: 'row',
    gap: moderateScale(10),
    marginVertical: moderateScale(20),
    width: '100%',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(14),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statValue: { fontSize: moderateScale(18), fontWeight: '700', color: '#0F172A' },
  statLabel: { fontSize: moderateScale(10), color: '#64748B', marginTop: moderateScale(2) },
  sectionHeader: {
    alignSelf: 'flex-start',
    fontSize: moderateScale(11),
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: moderateScale(8),
    letterSpacing: 0.5,
  },
  cardBlock: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    marginBottom: moderateScale(20),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(12),
    gap: moderateScale(12),
  },
  infoText: { fontSize: moderateScale(13), color: '#334155' },
  divider: { height: 1, backgroundColor: '#F1F5F9' },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: moderateScale(12),
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: moderateScale(6),
  },
  optionLeft: { flexDirection: 'row', alignItems: 'center', gap: moderateScale(12) },
  optionText: { fontSize: moderateScale(13), color: '#334155', fontWeight: '500' },
  versionText: { fontSize: moderateScale(12), color: '#94A3B8' },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: moderateScale(8),
    paddingVertical: moderateScale(12),
    marginBottom: moderateScale(20),
  },
  logoutText: { fontSize: moderateScale(14), fontWeight: '700', color: '#991B1B' },
});