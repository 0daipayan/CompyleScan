import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Container, Text } from 'react-native-basic-elements';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSelector } from 'react-redux';
import { moderateScale } from '../../Constants/PixelRatio';
import FilterSheet from '../../Components/FilterSheet';

const mockHistoryData = [
  { id: '1', title: 'Coastal Salt 500g', time: 'Today, 9:12 AM', score: 96, status: 'PASS', company: 'Coastal Foods', fault: null },
  { id: '2', title: 'Sunrise Wheat Flakes', time: 'Today, 9:44 AM', score: 72, fault: 'Mfg. date', status: 'REVIEW', company: 'Sunrise Foods Pvt Ltd' },
  { id: '3', title: 'Nutri Bar Classic', time: 'Yesterday, 4:02 PM', score: 41, fault: 'MRP', status: 'FAIL', company: 'Nutri Corp' },
  { id: '4', title: 'Sunrise Multigrain Atta', time: 'Yesterday, 2:15 PM', score: 58, fault: 'MRP, Origin', status: 'FAIL', company: 'Sunrise Foods Pvt Ltd' },
  { id: '5', title: 'Sunrise Corn Flakes Mini', time: 'Mon, 11:30 AM', score: 69, fault: 'Font size', status: 'REVIEW', company: 'Sunrise Foods Pvt Ltd' },
];

const History = ({ navigation, route }) => {
  const userData = useSelector((state) => state.User?.userData);
  const isOfficer = userData?.role === 'Officer';
  const [filterVisible, setFilterVisible] = useState(false);
  
  // Applied filter state initialized to default screenshot values
  const [appliedFilters, setAppliedFilters] = useState({
    selectedScore: '50–75',
    selectedProductType: 'Packaged food',
    company: 'Sunrise Foods Pvt Ltd',
    selectedFault: 'Mfg. date',
    periodType: 'Monthly',
    selectedPeriod: 'August 2026',
  });

  // Open modal automatically if navigated from "All inspections & filters"
  useEffect(() => {
    if (route?.params?.openFilter) {
      setFilterVisible(true);
      navigation.setParams({ openFilter: undefined });
    }
  }, [route?.params?.openFilter]);

  // Dynamic filtering based on active selections
  const filteredData = mockHistoryData.filter((item) => {
    if (!isOfficer) return true;

    // Filter by score range
    if (appliedFilters.selectedScore === '< 50' && item.score >= 50) return false;
    if (appliedFilters.selectedScore === '50–75' && (item.score < 50 || item.score > 75)) return false;
    if (appliedFilters.selectedScore === '75–100' && item.score < 75) return false;

    // Filter by company
    if (appliedFilters.company && item.company !== appliedFilters.company) return false;

    return true;
  });

  const getDotColor = (score) => {
    if (score >= 75) return '#15803D';
    if (score >= 50) return '#B45309';
    return '#B91C1C';
  };

  const getStatusBadge = (status) => {
    if (status === 'REVIEW') {
      return <View style={[styles.badge, { backgroundColor: '#FEF3C7' }]}><Text style={[styles.badgeText, { color: '#B45309' }]}>REVIEW</Text></View>;
    }
    if (status === 'FAIL') {
      return <View style={[styles.badge, { backgroundColor: '#FEE2E2' }]}><Text style={[styles.badgeText, { color: '#B91C1C' }]}>FAIL</Text></View>;
    }
    return null;
  };

  return (
    <Container style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.subHeader}>OFFICER {userData?.officerId || 'LM-2026-0417'}</Text>
          <Text style={styles.title}>Inspection history</Text>
          <Text style={styles.caseCount}>
            {isOfficer ? `1,204 total · ${filteredData.length} matching filters` : '14 cases this week'}
          </Text>
        </View>
        <TouchableOpacity style={styles.moreBtn}>
          <Icon name="dots-horizontal" size={moderateScale(24)} color="#0F172A" />
        </TouchableOpacity>
      </View>

      {/* Officer Detailed Stats & Horizontally Scrollable Active Filters */}
      {isOfficer && (
        <>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Avg. score</Text>
              <Text style={styles.statValue}>78</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Pass rate</Text>
              <Text style={styles.statValue}>64%</Text>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
            <TouchableOpacity style={styles.filterChipDropdown} onPress={() => setFilterVisible(true)}>
              <Text style={styles.chipText}>Score {appliedFilters.selectedScore}</Text>
              <Icon name="chevron-down" size={16} color="#0F172A" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterChipDropdown} onPress={() => setFilterVisible(true)}>
              <Text style={styles.chipText}>{appliedFilters.company}</Text>
              <Icon name="chevron-down" size={16} color="#0F172A" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterChipDropdown} onPress={() => setFilterVisible(true)}>
              <Text style={styles.chipText}>Aug 2026</Text>
              <Icon name="chevron-down" size={16} color="#0F172A" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.addFilterBtn} onPress={() => setFilterVisible(true)}>
              <Text style={styles.addFilterText}>+ Filter</Text>
            </TouchableOpacity>
          </ScrollView>
        </>
      )}

      {/* History List */}
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.historyRow}
            onPress={() => navigation.navigate('ReportViewer', { item })}
          >
            <View style={styles.leftCol}>
              <View style={[styles.dot, { backgroundColor: getDotColor(item.score) }]} />
              <View style={styles.textDetails}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemSub}>
                  {isOfficer ? `Score ${item.score} · ${item.fault ? `${item.fault} missing` : 'All checks passed'}` : item.time}
                </Text>
              </View>
            </View>
            <View style={styles.rightCol}>
              {isOfficer ? getStatusBadge(item.status) : <Text style={styles.scoreText}>Score {item.score}</Text>}
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Filter Bottom Sheet */}
      <FilterSheet
        visible={filterVisible}
        initialFilters={appliedFilters}
        onClose={() => setFilterVisible(false)}
        onApply={(filters) => setAppliedFilters(filters)}
      />
    </Container>
  );
};

export default History;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: moderateScale(20), paddingTop: moderateScale(40), marginBottom: moderateScale(16) },
  subHeader: { fontSize: moderateScale(11), fontWeight: '700', color: '#64748B', letterSpacing: 0.8 },
  title: { fontSize: moderateScale(22), fontWeight: '700', color: '#0F172A', marginTop: moderateScale(2) },
  caseCount: { fontSize: moderateScale(13), color: '#64748B', marginTop: moderateScale(2) },
  moreBtn: { paddingTop: moderateScale(4) },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: moderateScale(20), marginBottom: moderateScale(16) },
  statCard: { width: '48%', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: moderateScale(12), padding: moderateScale(14) },
  statLabel: { fontSize: moderateScale(11), color: '#64748B', fontWeight: '500' },
  statValue: { fontSize: moderateScale(22), fontWeight: '700', color: '#0F172A', marginTop: moderateScale(4) },
  filterBar: { paddingLeft: moderateScale(20), marginBottom: moderateScale(12), maxHeight: moderateScale(40) },
  filterChipDropdown: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: moderateScale(8), paddingHorizontal: moderateScale(10), paddingVertical: moderateScale(6), marginRight: moderateScale(8) },
  chipText: { fontSize: moderateScale(12), color: '#0F172A', marginRight: moderateScale(4), fontWeight: '500' },
  addFilterBtn: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: moderateScale(8), paddingHorizontal: moderateScale(12), paddingVertical: moderateScale(6), marginRight: moderateScale(20) },
  addFilterText: { fontSize: moderateScale(12), color: '#64748B', fontWeight: '600' },
  listContent: { paddingHorizontal: moderateScale(20), paddingBottom: moderateScale(20) },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: moderateScale(14), borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  leftCol: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  dot: { width: moderateScale(8), height: moderateScale(8), borderRadius: moderateScale(4), marginRight: moderateScale(10) },
  textDetails: { flex: 1 },
  itemTitle: { fontSize: moderateScale(14), fontWeight: '600', color: '#0F172A' },
  itemSub: { fontSize: moderateScale(12), color: '#64748B', marginTop: moderateScale(2) },
  rightCol: { alignItems: 'flex-end', marginLeft: moderateScale(8) },
  scoreText: { fontSize: moderateScale(13), color: '#64748B', fontWeight: '500' },
  badge: { paddingHorizontal: moderateScale(8), paddingVertical: moderateScale(4), borderRadius: moderateScale(6) },
  badgeText: { fontSize: moderateScale(10), fontWeight: '700' },
});