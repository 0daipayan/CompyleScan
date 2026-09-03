import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { moderateScale } from '../../Constants/PixelRatio';

const FILTER_INSPECTORS = ['All inspectors', 'Inspector R. Verma', 'Inspector P. Ghosh'];
const FILTER_SORT = ['Oldest first', 'Newest first', 'Highest score'];

const MOCK_CASES = [
  {
    id: '1',
    title: 'Sunrise Wheat Flakes',
    inspector: 'Inspector R. Verma',
    score: 72,
    time: '2 min ago',
    tags: ['Mfg date missing'],
  },
  {
    id: '2',
    title: 'Sunrise Corn Flakes Mini',
    inspector: 'Inspector P. Ghosh',
    score: 69,
    time: '40 min ago',
    tags: ['Font size low'],
  },
  {
    id: '3',
    title: 'Meadow Milk Powder',
    inspector: 'Inspector R. Verma',
    score: 68,
    time: '3 hrs ago',
    tags: ['Origin unreadable', 'Blurry image'],
  },
];

const ReviewQueue = () => {
  const [selectedInspector, setSelectedInspector] = useState(FILTER_INSPECTORS[0]);
  const [selectedSort, setSelectedSort] = useState(FILTER_SORT[0]);

  const renderCaseCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemMeta}>
            {item.inspector} · Score {item.score}
          </Text>
          <Text style={styles.itemTime}>{item.time}</Text>
        </View>
        <View style={styles.reviewBadge}>
          <Text style={styles.reviewBadgeText}>REVIEW</Text>
        </View>
      </View>

      <View style={styles.tagRow}>
        {item.tags.map((tag, idx) => (
          <View key={idx} style={styles.issueTag}>
            <Text style={styles.issueTagText}>{tag}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.btnSecondary} activeOpacity={0.7}>
          <Text style={styles.btnSecondaryText}>View details</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnSuccess} activeOpacity={0.7}>
          <Text style={styles.btnSuccessText}>Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnDanger} activeOpacity={0.7}>
          <Text style={styles.btnDangerText}>Flag</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.subHeaderTitle}>LEGAL METROLOGY, WEST BENGAL</Text>
        <Text style={styles.headerTitle}>Review queue</Text>
        <Text style={styles.headerSubtitle}>12 cases awaiting your decision</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <TouchableOpacity style={styles.filterDropdown}>
            <Text style={styles.filterText}>{selectedInspector} ▾</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterDropdown}>
            <Text style={styles.filterText}>{selectedSort} ▾</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterChip}>
            <Text style={styles.filterText}>High severity</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <FlatList
        data={MOCK_CASES}
        keyExtractor={(item) => item.id}
        renderItem={renderCaseCard}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default ReviewQueue;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(20),
    paddingBottom: moderateScale(10),
  },
  subHeaderTitle: {
    fontSize: moderateScale(10),
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: moderateScale(4),
  },
  headerTitle: {
    fontSize: moderateScale(24),
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: moderateScale(13),
    color: '#64748B',
    marginTop: moderateScale(2),
    marginBottom: moderateScale(16),
  },
  filterScroll: { gap: moderateScale(8) },
  filterDropdown: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  filterChip: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(8),
    backgroundColor: '#F1F5F9',
  },
  filterText: {
    fontSize: moderateScale(12),
    color: '#334155',
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: moderateScale(20),
    paddingBottom: moderateScale(20),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    marginBottom: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: { flex: 1 },
  itemTitle: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#0F172A',
  },
  itemMeta: {
    fontSize: moderateScale(12),
    color: '#64748B',
    marginTop: moderateScale(2),
  },
  itemTime: {
    fontSize: moderateScale(11),
    color: '#94A3B8',
    marginTop: moderateScale(2),
  },
  reviewBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(6),
  },
  reviewBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: '700',
    color: '#B45309',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(6),
    marginVertical: moderateScale(12),
  },
  issueTag: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(6),
  },
  issueTagText: {
    fontSize: moderateScale(11),
    color: '#991B1B',
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    gap: moderateScale(8),
  },
  btnSecondary: {
    flex: 1,
    paddingVertical: moderateScale(8),
    backgroundColor: '#F1F5F9',
    borderRadius: moderateScale(8),
    alignItems: 'center',
  },
  btnSecondaryText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: '#0F172A',
  },
  btnSuccess: {
    flex: 1,
    paddingVertical: moderateScale(8),
    backgroundColor: '#DCFCE7',
    borderRadius: moderateScale(8),
    alignItems: 'center',
  },
  btnSuccessText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: '#15803D',
  },
  btnDanger: {
    flex: 1,
    paddingVertical: moderateScale(8),
    backgroundColor: '#FEE2E2',
    borderRadius: moderateScale(8),
    alignItems: 'center',
  },
  btnDangerText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: '#B91C1C',
  },
});