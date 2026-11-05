import React from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Switch,
} from 'react-native';

import { Container, Text } from 'react-native-basic-elements';
import { moderateScale } from '../../Constants/PixelRatio';

import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../Redux/reducer/User';
import Storage from '../../Utils/Storage';

const InspectorProfile = ({ navigation }) => {
  const dispatch = useDispatch();

  // Get the currently logged-in user from Redux
  const userData = useSelector(state => state.User?.userData);

  // Never use hard-coded profile information
  const name = userData?.name || 'Inspector';
  const officerId = userData?.officerId || '—';
  const email = userData?.email || '—';
  const jurisdiction = userData?.jurisdiction || 'West Bengal';

  // Simple initials for profile avatar
  const getInitials = () => {
    if (!name || name === 'Inspector') {
      return 'IN';
    }

    const parts = name.trim().split(' ');

    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }

    return (
      parts[0].charAt(0) +
      parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  const handleLogout = async () => {
    Alert.alert(
      'Sign out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => {
            try {
              // Remove saved authentication token
              if (Storage?.remove) {
                await Storage.remove('token');
              } else if (Storage?.set) {
                await Storage.set('token', null);
              }

              // Clear Redux user
              dispatch(logout());
            } catch (error) {
              console.error('Logout error:', error);

              // Still clear Redux even if storage fails
              dispatch(logout());
            }
          },
        },
      ]
    );
  };

  return (
    <Container style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        {/* ================= HEADER ================= */}

        <View style={styles.header}>

          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {getInitials()}
              </Text>
            </View>

            <View style={styles.onlineBadge} />
          </View>

          <Text style={styles.name}>
            {name}
          </Text>

          <Text style={styles.idText}>
            {officerId} · Legal Metrology, {jurisdiction}
          </Text>

          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              FIELD INSPECTOR
            </Text>
          </View>

        </View>

        {/* ================= STATISTICS ================= */}

        <View style={styles.statsContainer}>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>
              Total scans
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>—</Text>
            <Text style={styles.statLabel}>
              Avg. score
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>
              Pending review
            </Text>
          </View>

        </View>

        {/* ================= CONTACT DETAILS ================= */}

        <Text style={styles.sectionTitle}>
          CONTACT DETAILS
        </Text>

        <View style={styles.card}>

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>✉</Text>

            <Text style={styles.infoText}>
              {email}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>ID</Text>

            <Text style={styles.infoText}>
              {officerId}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>⌖</Text>

            <Text style={styles.infoText}>
              {jurisdiction}
            </Text>
          </View>

        </View>

        {/* ================= PREFERENCES ================= */}

        <Text style={styles.sectionTitle}>
          PREFERENCES
        </Text>

        <View style={styles.card}>

          <View style={styles.preferenceRow}>
            <Text style={styles.preferenceText}>
              Push notifications
            </Text>

            <Switch
              value={true}
              onValueChange={() => {}}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.preferenceRow}>
            <Text style={styles.preferenceText}>
              Face / fingerprint login
            </Text>

            <Switch
              value={true}
              onValueChange={() => {}}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.preferenceRow}>
            <Text style={styles.preferenceText}>
              Offline capture sync
            </Text>

            <Switch
              value={false}
              onValueChange={() => {}}
            />
          </View>

        </View>

        {/* ================= ACCOUNT & SUPPORT ================= */}

        <Text style={styles.sectionTitle}>
          ACCOUNT & SUPPORT
        </Text>

        <View style={styles.card}>

          <TouchableOpacity style={styles.menuRow}>
            <Text style={styles.menuText}>
              Account information
            </Text>

            <Text style={styles.arrow}>
              ›
            </Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuRow}>
            <Text style={styles.menuText}>
              Help & support
            </Text>

            <Text style={styles.arrow}>
              ›
            </Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuRow}>
            <Text style={styles.menuText}>
              Privacy policy
            </Text>

            <Text style={styles.arrow}>
              ›
            </Text>
          </TouchableOpacity>

        </View>

        {/* ================= LOGOUT ================= */}

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>
            Sign out
          </Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>
          ComplySpect · AI-Powered Compliance Inspection
        </Text>

      </ScrollView>
    </Container>
  );
};

export default InspectorProfile;


/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  scrollContent: {
    paddingBottom: moderateScale(100),
  },

  /* ---------- HEADER ---------- */

  header: {
    backgroundColor: '#1E293B',
    alignItems: 'center',
    paddingTop: moderateScale(40),
    paddingBottom: moderateScale(34),
    borderBottomLeftRadius: moderateScale(28),
    borderBottomRightRadius: moderateScale(28),
  },

  avatarContainer: {
    position: 'relative',
    marginBottom: moderateScale(14),
  },

  avatar: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
    backgroundColor: '#0F172A',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    color: '#FFFFFF',
    fontSize: moderateScale(32),
    fontWeight: '700',
  },

  onlineBadge: {
    position: 'absolute',
    right: moderateScale(0),
    bottom: moderateScale(4),
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: moderateScale(11),
    backgroundColor: '#10B981',
    borderWidth: 3,
    borderColor: '#1E293B',
  },

  name: {
    color: '#FFFFFF',
    fontSize: moderateScale(24),
    fontWeight: '700',
    marginBottom: moderateScale(5),
  },

  idText: {
    color: '#CBD5E1',
    fontSize: moderateScale(13),
    textAlign: 'center',
    paddingHorizontal: moderateScale(20),
  },

  roleBadge: {
    marginTop: moderateScale(12),
    backgroundColor: '#D1FAE5',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(7),
    borderRadius: moderateScale(20),
  },

  roleText: {
    color: '#047857',
    fontSize: moderateScale(12),
    fontWeight: '700',
  },

  /* ---------- STATS ---------- */

  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: moderateScale(20),
    marginTop: moderateScale(20),
    gap: moderateScale(10),
  },

  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(18),
    alignItems: 'center',
  },

  statNumber: {
    color: '#0F172A',
    fontSize: moderateScale(24),
    fontWeight: '700',
    marginBottom: moderateScale(4),
  },

  statLabel: {
    color: '#64748B',
    fontSize: moderateScale(11),
    textAlign: 'center',
  },

  /* ---------- SECTIONS ---------- */

  sectionTitle: {
    color: '#94A3B8',
    fontSize: moderateScale(13),
    fontWeight: '700',
    marginTop: moderateScale(28),
    marginBottom: moderateScale(10),
    paddingHorizontal: moderateScale(20),
  },

  /* ---------- CARD ---------- */

  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: moderateScale(20),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: moderateScale(16),
    paddingHorizontal: moderateScale(16),
  },

  /* ---------- CONTACT ---------- */

  infoRow: {
    minHeight: moderateScale(62),
    flexDirection: 'row',
    alignItems: 'center',
  },

  infoIcon: {
    width: moderateScale(34),
    color: '#64748B',
    fontSize: moderateScale(15),
    textAlign: 'center',
    marginRight: moderateScale(8),
  },

  infoText: {
    flex: 1,
    color: '#334155',
    fontSize: moderateScale(14),
  },

  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },

  /* ---------- PREFERENCES ---------- */

  preferenceRow: {
    minHeight: moderateScale(62),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  preferenceText: {
    color: '#334155',
    fontSize: moderateScale(14),
    fontWeight: '600',
    flex: 1,
  },

  /* ---------- MENU ---------- */

  menuRow: {
    minHeight: moderateScale(58),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  menuText: {
    color: '#334155',
    fontSize: moderateScale(14),
    fontWeight: '600',
  },

  arrow: {
    color: '#94A3B8',
    fontSize: moderateScale(24),
  },

  /* ---------- LOGOUT ---------- */

  logoutButton: {
    marginHorizontal: moderateScale(20),
    marginTop: moderateScale(28),
    height: moderateScale(48),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: '#FCA5A5',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
  },

  logoutText: {
    color: '#DC2626',
    fontSize: moderateScale(14),
    fontWeight: '700',
  },

  versionText: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: moderateScale(11),
    marginTop: moderateScale(20),
  },

});