import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { moderateScale } from '../Constants/PixelRatio';

const CustomBottomTab = ({ state, descriptors, navigation }) => {
  const getIconName = (routeName) => {
    switch (routeName) {
      case 'Home':
      case 'Overview':
        return 'home-outline';
      case 'New scan':
        return 'barcode-scan';
      case 'Review queue':
        return 'clipboard-check-outline';
      case 'History':
        return 'history';
      case 'Profile':
        return 'account-outline';
      default:
        return 'circle-outline';
    }
  };

  return (
    <View style={styles.tabContainer}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel !== undefined ? options.tabBarLabel : route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            activeOpacity={0.7}
            style={styles.tabButton}
          >
            <Icon
              name={getIconName(route.name)}
              size={moderateScale(20)}
              color={isFocused ? '#0F172A' : '#94A3B8'}
            />
            <Text style={[styles.tabLabel, isFocused ? styles.labelActive : styles.labelInactive]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default CustomBottomTab;

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    height: moderateScale(60),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabLabel: {
    fontSize: moderateScale(11),
    marginTop: moderateScale(2),
  },
  labelActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  labelInactive: {
    color: '#94A3B8',
    fontWeight: '500',
  },
});