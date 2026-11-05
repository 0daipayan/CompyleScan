import React from 'react';

import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

import {
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';

import { useSelector } from 'react-redux';

// ---------------------------------------------------------
// Dashboards
// ---------------------------------------------------------
import InspectorHome from '../Screens/Home/Inspector';
import OfficerHome from '../Screens/Home/Officer';

// ---------------------------------------------------------
// Tab Pages
// ---------------------------------------------------------
import ReviewQueue from '../Screens/Tabs/ReviewQueue';
import History from '../Screens/Tabs/History';
import InspectorProfile from '../Screens/Tabs/InspectorProfile';
import OfficerProfile from '../Screens/Tabs/OfficerProfile';

// ---------------------------------------------------------
// Inspection Flow
// ---------------------------------------------------------
import ProductSelection from '../Screens/Inspection/ProductSelection';
import ImageCapture from '../Screens/Inspection/ImageCapture';
import Processing from '../Screens/Inspection/Processing';
import ResultReview from '../Screens/Inspection/ResultReview';
import ReportViewer from '../Screens/Inspection/ReportViewer';

// ---------------------------------------------------------
// Custom Bottom Tab
// ---------------------------------------------------------
import CustomBottomTab from '../Components/CustomBottomTab';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ---------------------------------------------------------
// Main Bottom Tabs
// ---------------------------------------------------------
const MainTabs = () => {

  const userData = useSelector(
    (state) => state.User?.userData
  );

  /*
   * Backend stores roles as:
   *
   * inspector
   * officer
   * admin
   *
   * Therefore comparison MUST be lowercase.
   */
  const isOfficer =
    userData?.role === 'officer';

  return (
    <Tab.Navigator
      tabBar={(props) => (
        <CustomBottomTab {...props} />
      )}
      screenOptions={{
        headerShown: false,
      }}
    >

      {isOfficer ? (
        <>
          {/* Officer Dashboard */}
          <Tab.Screen
            name="Overview"
            component={OfficerHome}
          />

          {/* Officer Review Queue */}
          <Tab.Screen
            name="Review queue"
            component={ReviewQueue}
          />

          {/* Shared History */}
          <Tab.Screen
            name="History"
            component={History}
          />

          {/* Officer Profile */}
          <Tab.Screen
            name="Profile"
            component={OfficerProfile}
          />
        </>
      ) : (
        <>
          {/* Inspector Dashboard */}
          <Tab.Screen
            name="Home"
            component={InspectorHome}
          />

          {/* Start New Inspection */}
          <Tab.Screen
            name="New scan"
            component={ProductSelection}
          />

          {/* Inspector History */}
          <Tab.Screen
            name="History"
            component={History}
          />

          {/* Inspector Profile */}
          <Tab.Screen
            name="Profile"
            component={InspectorProfile}
          />
        </>
      )}

    </Tab.Navigator>
  );
};

// ---------------------------------------------------------
// Main Application Stack
// ---------------------------------------------------------
const AppStack = () => {

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >

      {/* Main application tabs */}
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
      />

      {/* Inspection flow */}
      <Stack.Screen
        name="ImageCapture"
        component={ImageCapture}
      />

      <Stack.Screen
        name="Processing"
        component={Processing}
      />

      <Stack.Screen
        name="ResultReview"
        component={ResultReview}
      />

      <Stack.Screen
        name="ReportViewer"
        component={ReportViewer}
      />

    </Stack.Navigator>
  );
};

export default AppStack;