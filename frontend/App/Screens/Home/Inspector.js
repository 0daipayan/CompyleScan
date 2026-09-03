import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { AppButton, Container, Text } from 'react-native-basic-elements';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { moderateScale } from '../../Constants/PixelRatio';
import { useSelector } from 'react-redux';

const Inspector = () => {
  const userData = useSelector(state => state.User?.userData);

  return (
    <Container style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.greetingText}>GOOD MORNING</Text>
          <Text.Heading title={userData?.name || 'Rahul Verma'} style={styles.userName} />
          <Text style={styles.userRole}>
            {userData?.officerId || 'LM-2026-0533'} · Field Inspector
          </Text>
        </View>

        {/* Start Inspection CTA */}
        <AppButton
          title="Start new inspection"
          textStyle={styles.ctaButtonText}
          style={styles.ctaButton}
          icon={
            <Icon
              name="camera-outline"
              size={moderateScale(20)}
              color="#FFFFFF"
              style={{ marginRight: moderateScale(8) }}
            />
          }
          onPress={() => {}}
        />

        {/* Metric Cards Row */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Today</Text>
            <Text style={styles.metricValue}>6</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Pending review</Text>
            <Text style={styles.metricValue}>2</Text>
          </View>
        </View>

        {/* Recent Inspections List */}
        <Text style={styles.sectionHeader}>RECENT INSPECTIONS</Text>

        <View style={styles.inspectionItem}>
          <View>
            <Text style={styles.itemTitle}>Sunrise Wheat Flakes</Text>
            <Text style={styles.itemSub}>2 min ago</Text>
          </View>
          <View style={[styles.badge, styles.badgeReview]}>
            <Text style={styles.badgeTextReview}>REVIEW</Text>
          </View>
        </View>

        <View style={styles.inspectionItem}>
          <View>
            <Text style={styles.itemTitle}>Coastal Salt 500g</Text>
            <Text style={styles.itemSub}>1 hr ago</Text>
          </View>
          <View style={[styles.badge, styles.badgePass]}>
            <Text style={styles.badgeTextPass}>PASS</Text>
          </View>
        </View>

        <View style={styles.inspectionItem}>
          <View>
            <Text style={styles.itemTitle}>Nutri Bar Classic</Text>
            <Text style={styles.itemSub}>Yesterday</Text>
          </View>
          <View style={[styles.badge, styles.badgeFail]}>
            <Text style={styles.badgeTextFail}>FAIL</Text>
          </View>
        </View>
      </ScrollView>
    </Container>
  );
};

export default Inspector;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(40),
    paddingBottom: moderateScale(20),
  },
  header: {
    marginBottom: moderateScale(20),
  },
  greetingText: {
    fontSize: moderateScale(11),
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  userName: {
    fontSize: moderateScale(24),
    fontWeight: '700',
    color: '#0F172A',
    marginVertical: moderateScale(2),
  },
  userRole: {
    fontSize: moderateScale(13),
    color: '#64748B',
  },
  ctaButton: {
    backgroundColor: '#0F172A',
    borderRadius: moderateScale(12),
    height: moderateScale(52),
    justifyContent: 'center',
    marginBottom: moderateScale(20),
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(15),
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: moderateScale(24),
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: moderateScale(12),
  },
  metricLabel: {
    fontSize: moderateScale(12),
    color: '#64748B',
    marginBottom: moderateScale(8),
  },
  metricValue: {
    fontSize: moderateScale(24),
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionHeader: {
    fontSize: moderateScale(11),
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: moderateScale(12),
  },
  inspectionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  itemTitle: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#0F172A',
  },
  itemSub: {
    fontSize: moderateScale(12),
    color: '#94A3B8',
    marginTop: moderateScale(2),
  },
  badge: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(12),
  },
  badgeReview: {
    backgroundColor: '#FEF3C7',
  },
  badgeTextReview: {
    color: '#D97706',
    fontSize: moderateScale(10),
    fontWeight: '700',
  },
  badgePass: {
    backgroundColor: '#DCFCE7',
  },
  badgeTextPass: {
    color: '#16A34A',
    fontSize: moderateScale(10),
    fontWeight: '700',
  },
  badgeFail: {
    backgroundColor: '#FEE2E2',
  },
  badgeTextFail: {
    color: '#DC2626',
    fontSize: moderateScale(10),
    fontWeight: '700',
  },
});