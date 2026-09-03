import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { Container, Text } from 'react-native-basic-elements';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { moderateScale } from '../../Constants/PixelRatio';
import { useSelector } from 'react-redux';
import FilterSheet from '../../Components/FilterSheet';

const Officer = ({ navigation }) => {
  const userData = useSelector(state => state.User?.userData);
  const [filterVisible, setFilterVisible] = useState(false);

  const handleApplyFilters = (filters) => {
    // Navigate to history with the chosen filters applied
    navigation?.navigate('History', { filters });
  };

  return (
    <Container style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.greetingText}>LEGAL METROLOGY, WEST BENGAL</Text>
          <Text.Heading title="Officer overview" style={styles.userName} />
          <Text style={styles.userRole}>
            {userData?.officerId || 'LM-2026-0417'} · Enforcement Officer
          </Text>
        </View>

        {/* Overview Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total inspections</Text>
            <Text style={styles.statValue}>1,204</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Avg. score</Text>
            <Text style={styles.statValue}>78</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Pending review</Text>
            <Text style={styles.statValue}>112</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>This month</Text>
            <Text style={styles.statValue}>340</Text>
          </View>
        </View>

        {/* Needs Your Review Section */}
        <Text style={styles.sectionHeader}>NEEDS YOUR REVIEW</Text>

        <View style={styles.reviewItem}>
          <View>
            <Text style={styles.itemTitle}>Sunrise Wheat Flakes</Text>
            <Text style={styles.itemSub}>Inspector: R. Verma</Text>
          </View>
          <View style={styles.badgeReview}>
            <Text style={styles.badgeTextReview}>REVIEW</Text>
          </View>
        </View>

        <View style={styles.reviewItem}>
          <View>
            <Text style={styles.itemTitle}>Sunrise Corn Flakes Mini</Text>
            <Text style={styles.itemSub}>Inspector: P. Ghosh</Text>
          </View>
          <View style={styles.badgeReview}>
            <Text style={styles.badgeTextReview}>REVIEW</Text>
          </View>
        </View>

        {/* Quick Links Section */}
        <Text style={[styles.sectionHeader, { marginTop: moderateScale(20) }]}>QUICK LINKS</Text>

        <TouchableOpacity 
          style={styles.quickLinkCard}
          onPress={() => setFilterVisible(true)}
        >
          <Text style={styles.quickLinkText}>All inspections & filters</Text>
          <Icon name="chevron-right" size={moderateScale(18)} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickLinkCard}>
          <Text style={styles.quickLinkText}>Rule set management</Text>
          <Icon name="chevron-right" size={moderateScale(18)} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickLinkCard}>
          <Text style={styles.quickLinkText}>Audit log</Text>
          <Icon name="chevron-right" size={moderateScale(18)} color="#94A3B8" />
        </TouchableOpacity>
      </ScrollView>

      {/* Filter Bottom Sheet Component */}
      <FilterSheet 
        visible={filterVisible} 
        onClose={() => setFilterVisible(false)} 
        onApply={handleApplyFilters}
      />
    </Container>
  );
};

export default Officer;

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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: moderateScale(16),
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: moderateScale(12),
  },
  statLabel: {
    fontSize: moderateScale(12),
    color: '#64748B',
    marginBottom: moderateScale(8),
  },
  statValue: {
    fontSize: moderateScale(22),
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
  reviewItem: {
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
  badgeReview: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(12),
  },
  badgeTextReview: {
    color: '#D97706',
    fontSize: moderateScale(10),
    fontWeight: '700',
  },
  quickLinkCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(10),
  },
  quickLinkText: {
    fontSize: moderateScale(14),
    fontWeight: '500',
    color: '#0F172A',
  },
});