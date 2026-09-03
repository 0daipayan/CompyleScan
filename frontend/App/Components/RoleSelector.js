import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { moderateScale } from '../Constants/PixelRatio';

const RoleSelector = ({ selectedRole, onSelectRole }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.tab, selectedRole === 'Inspector' && styles.activeTab]}
        onPress={() => onSelectRole('Inspector')}
        activeOpacity={0.8}
      >
        <Text style={[styles.tabText, selectedRole === 'Inspector' && styles.activeTabText]}>
          Inspector
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, selectedRole === 'Officer' && styles.activeTab]}
        onPress={() => onSelectRole('Officer')}
        activeOpacity={0.8}
      >
        <Text style={[styles.tabText, selectedRole === 'Officer' && styles.activeTabText]}>
          Officer
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default RoleSelector;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(10),
    padding: moderateScale(4),
    marginBottom: moderateScale(20),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tab: {
    flex: 1,
    paddingVertical: moderateScale(10),
    alignItems: 'center',
    borderRadius: moderateScale(8),
  },
  activeTab: {
    backgroundColor: '#0F172A',
  },
  tabText: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
});