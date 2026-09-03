import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';

// Dashboards
import InspectorHome from '../Screens/Home/Inspector';
import OfficerHome from '../Screens/Home/Officer';

// Tab Pages
import ReviewQueue from '../Screens/Tabs/ReviewQueue';
import History from '../Screens/Tabs/History';
import InspectorProfile from '../Screens/Tabs/InspectorProfile';
import OfficerProfile from '../Screens/Tabs/OfficerProfile';

// Inspection Flow Screens
import ProductSelection from '../Screens/Inspection/ProductSelection';
import ImageCapture from '../Screens/Inspection/ImageCapture';
import Processing from '../Screens/Inspection/Processing';
import ResultReview from '../Screens/Inspection/ResultReview';
import ReportViewer from '../Screens/Inspection/ReportViewer';

// Custom Tab Bar Component
import CustomBottomTab from '../Components/CustomBottomTab';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigator Component
const MainTabs = () => {
  const userData = useSelector(state => state.User?.userData);
  const isOfficer = userData?.role === 'Officer';

  return (
    <Tab.Navigator
      tabBar={props => <CustomBottomTab {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {isOfficer ? (
        <>
          <Tab.Screen name="Overview" component={OfficerHome} />
          <Tab.Screen name="Review queue" component={ReviewQueue} />
          <Tab.Screen name="History" component={History} />
          <Tab.Screen name="Profile" component={OfficerProfile} />
        </>
      ) : (
        <>
          <Tab.Screen name="Home" component={InspectorHome} />
          {/* Mount ProductSelection directly inside the bottom tabs */}
          <Tab.Screen name="New scan" component={ProductSelection} />
          <Tab.Screen name="History" component={History} />
          <Tab.Screen name="Profile" component={InspectorProfile} />
        </>
      )}
    </Tab.Navigator>
  );
};

// Main App Stack Container
const AppStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Root Tab Navigator */}
      <Stack.Screen name="MainTabs" component={MainTabs} />

      {/* Subsequent Full-Screen Inspection Steps */}
      <Stack.Screen name="ImageCapture" component={ImageCapture} />
      <Stack.Screen name="Processing" component={Processing} />
      <Stack.Screen name="ResultReview" component={ResultReview} />
      <Stack.Screen name="ReportViewer" component={ReportViewer} />
    </Stack.Navigator>
  );
};

export default AppStack;