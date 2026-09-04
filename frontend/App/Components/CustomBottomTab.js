import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { moderateScale } from '../Constants/PixelRatio';

const CustomBottomTab = ({ state, descriptors, navigation }) => {
  const getIconSource = (routeName) => {
    switch (routeName) {
      case 'Home':
      case 'Overview':
        return require('../Assets/home.png');
      case 'New scan':
        return require('../Assets/scanner.png');
      case 'Review queue':
        return require('../Assets/report.png');
      case 'History':
        return require('../Assets/review.png');
      case 'Profile':
        return require('../Assets/profile.png');
      default:
        return require('../Assets/home.png');
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
            <Image
              source={getIconSource(route.name)}
              style={[
                styles.icon,
                { tintColor: isFocused ? '#0F172A' : '#94A3B8' },
              ]}
              resizeMode="contain"
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
  icon: {
    width: moderateScale(22),
    height: moderateScale(22),
  },
  tabLabel: {
    fontSize: moderateScale(11),
    marginTop: moderateScale(4),
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