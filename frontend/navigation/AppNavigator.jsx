import React from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import StudentDashboardScreen from '../screens/StudentDashboardScreen';
import StudentFeedbackScreen from '../screens/StudentFeedbackScreen';
import StudentConcernScreen from "../screens/StudentConcernScreen";
import ConcernHistoryScreen from "../screens/ConcernHistoryScreen";
import ConcernDetailScreen from "../screens/ConcernDetailScreen";
import OwnerDashboardScreen from '../screens/OwnerDashboardScreen';
import OwnerAdminWorkspaceScreen from '../screens/OwnerAdminWorkspaceScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import AdminConcernDetailScreen from '../screens/AdminConcernDetailScreen';
import ConsulterDashboardScreen from '../screens/ConsulterDashboardScreen';
import StudentSettingsScreen from '../screens/StudentSettingsScreen';
import FeedbackInsightsScreen from '../screens/FeedbackInsightsScreen';

import { useAuth } from '../context/AuthContext';

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const StudentConcernStack = createNativeStackNavigator(); // Stack for concern-related screens
const StudentConcernHistoryStack = createNativeStackNavigator(); // Stack for concern history
const AdminDashboardStack = createNativeStackNavigator(); // Stack for admin dashboard + concern details

function SplashLoader() {
  return (
    <View style={styles.loaderWrap}>
      <ActivityIndicator size="large" color="#e53935" />
      <Text style={styles.loaderText}>Loading SCMS...</Text>
    </View>
  );
}

// Stack Navigator for Student Concern Flow
function StudentConcernStackNavigator() {
  return (
    <StudentConcernStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <StudentConcernStack.Screen
        name="SubmitConcern"
        component={StudentConcernScreen}
      />
      <StudentConcernStack.Screen
        name="ConcernHistory"
        component={ConcernHistoryScreen}
      />
      <StudentConcernStack.Screen
        name="ConcernDetail"
        component={ConcernDetailScreen}
      />
    </StudentConcernStack.Navigator>
  );
}

function StudentConcernHistoryStackNavigator() {
  return (
    <StudentConcernHistoryStack.Navigator
      initialRouteName="ConcernHistory"
      screenOptions={{
        headerShown: false,
      }}
    >
      <StudentConcernHistoryStack.Screen
        name="ConcernHistory"
        component={ConcernHistoryScreen}
      />
      <StudentConcernHistoryStack.Screen
        name="SubmitConcern"
        component={StudentConcernScreen}
      />
      <StudentConcernHistoryStack.Screen
        name="ConcernDetail"
        component={ConcernDetailScreen}
      />
    </StudentConcernHistoryStack.Navigator>
  );
}

function AdminDashboardStackNavigator() {
  return (
    <AdminDashboardStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#05070a',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerBackTitle: 'Back',
      }}
    >
      <AdminDashboardStack.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{
          headerShown: false,
        }}
      />
      <AdminDashboardStack.Screen
        name="AdminConcernDetail"
        component={AdminConcernDetailScreen}
        options={{
          title: 'Concern Details',
          headerShown: true,
        }}
      />
    </AdminDashboardStack.Navigator>
  );
}

function buildTabIcon(activeName, inactiveName) {
  return ({ color, size, focused }) => (
    <Ionicons name={focused ? activeName : inactiveName} size={size} color={color} />
  );
}

function getNormalizedRole(role) {
  const normalizedRole = String(role || 'student').toLowerCase();

  if (normalizedRole === 'owner' || normalizedRole === 'admin' || normalizedRole === 'consulter') {
    return normalizedRole;
  }

  return 'student';
}

function getDashboardConfig(role) {
  const normalizedRole = String(role || 'student').toLowerCase();

  if (normalizedRole === 'owner') {
    return {
      DashboardScreen: OwnerDashboardScreen,
      activeIcon: 'briefcase',
      inactiveIcon: 'briefcase-outline',
    };
  }

  if (normalizedRole === 'admin') {
    return {
      DashboardScreen: AdminDashboardStackNavigator,
      activeIcon: 'shield-checkmark',
      inactiveIcon: 'shield-checkmark-outline',
    };
  }

  if (normalizedRole === 'consulter') {
    return {
      DashboardScreen: ConsulterDashboardScreen,
      activeIcon: 'medkit',
      inactiveIcon: 'medkit-outline',
    };
  }

  return {
    DashboardScreen: StudentDashboardScreen,
    activeIcon: 'school',
    inactiveIcon: 'school-outline',
  };
}

function getRoleTabs(role) {
  const normalizedRole = getNormalizedRole(role);
  const dashboardConfig = getDashboardConfig(normalizedRole);

  const tabs = [
    {
      name: 'Home',
      component: HomeScreen,
      label: 'Home',
      title: 'Home',
      activeIcon: 'home',
      inactiveIcon: 'home-outline',
    },
    {
      name: 'Dashboard',
      component: dashboardConfig.DashboardScreen,
      label: 'Dashboard',
      title: 'Dashboard',
      activeIcon: dashboardConfig.activeIcon,
      inactiveIcon: dashboardConfig.inactiveIcon,
    },
  ];

  if (normalizedRole === 'student') {
    tabs.push({
      name: 'StudentFeedback',
      component: StudentFeedbackScreen,
      label: 'Feedback',
      title: 'Feedback',
      activeIcon: 'chatbox',
      inactiveIcon: 'chatbox-outline',
    });

    // ✅ Use Stack Navigator instead of direct screen
    tabs.push({
      name: 'StudentConcernStack',
      component: StudentConcernStackNavigator, // This is the stack navigator
      label: 'Concern',
      title: 'Concern',
      activeIcon: 'document-text',
      inactiveIcon: 'document-text-outline',
    });

    tabs.push({
      name: 'StudentConcernHistory',
      component: StudentConcernHistoryStackNavigator,
      label: 'History',
      title: 'History',
      activeIcon: 'time',
      inactiveIcon: 'time-outline',
    });
  }

  if (normalizedRole === 'owner') {
    tabs.push({
      name: 'OwnerAdminWorkspace',
      component: OwnerAdminWorkspaceScreen,
      label: 'Workspace',
      title: 'Workspace',
      activeIcon: 'settings',
      inactiveIcon: 'settings-outline',
    });
  }

  if (normalizedRole === 'owner' || normalizedRole === 'admin' || normalizedRole === 'consulter') {
    tabs.push({
      name: 'FeedbackInsights',
      component: FeedbackInsightsScreen,
      label: 'Feedback',
      title: 'Feedback',
      activeIcon: 'chatbox',
      inactiveIcon: 'chatbox-outline',
    });
  }

  return tabs;
}

const rootScreenOptions = {
  headerShown: false,
  contentStyle: {
    backgroundColor: '#f5f8fc',
  },
};

function getTabScreenOptions() {
  return {
    headerShown: false,
    tabBarHideOnKeyboard: true,
    tabBarActiveTintColor: '#ffffff',
    tabBarInactiveTintColor: '#64748b',
    tabBarLabelStyle: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.1,
    },
    tabBarStyle: {
      height: Platform.OS === 'ios' ? 66 : 58,
      paddingTop: 4,
      paddingBottom: Platform.OS === 'ios' ? 8 : 6,
      backgroundColor: '#05070a',
      borderTopWidth: 1,
      borderTopColor: '#111827',
    },
    tabBarItemStyle: {
      paddingVertical: 0,
    },
  };
}

function GuestTabsNavigator() {
  return (
    <Tab.Navigator initialRouteName="Home" screenOptions={getTabScreenOptions}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: buildTabIcon('home', 'home-outline'),
        }}
      />

      <Tab.Screen
        name="Login"
        component={LoginScreen}
        options={{
          title: 'Login',
          tabBarLabel: 'Login',
          tabBarIcon: buildTabIcon('log-in', 'log-in-outline'),
        }}
      />
    </Tab.Navigator>
  );
}

function AuthTabsNavigator() {
  const { user } = useAuth();
  const roleTabs = getRoleTabs(user?.role);
  const normalizedRole = getNormalizedRole(user?.role);

  return (
    <Tab.Navigator
      key={`auth-tabs-${normalizedRole}`}
      initialRouteName="Dashboard"
      screenOptions={getTabScreenOptions}
    >
      {roleTabs.map((tab) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{
            title: tab.title,
            tabBarLabel: tab.label,
            tabBarIcon: buildTabIcon(tab.activeIcon, tab.inactiveIcon),
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

function GuestRootNavigator() {
  return (
    <RootStack.Navigator initialRouteName="GuestTabs" screenOptions={rootScreenOptions}>
      <RootStack.Screen name="GuestTabs" component={GuestTabsNavigator} />
      <RootStack.Screen name="Register" component={RegisterScreen} />
      <RootStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </RootStack.Navigator>
  );
}

function AuthRootNavigator() {
  return (
    <RootStack.Navigator initialRouteName="AuthTabs" screenOptions={rootScreenOptions}>
      <RootStack.Screen name="AuthTabs" component={AuthTabsNavigator} />
      <RootStack.Screen 
        name="ConcernDetail" 
        component={ConcernDetailScreen} 
        options={{
          headerShown: false,
        }}
      />
      <RootStack.Screen 
        name="StudentSettings" 
        component={StudentSettingsScreen} 
        options={{
          headerShown: false,
        }}
      />
    </RootStack.Navigator>
  );
}

export default function AppNavigator() {
  const { initializing, isAuthenticated, user } = useAuth();

  if (initializing) {
    return <SplashLoader />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AuthRootNavigator key={`auth-${getNormalizedRole(user?.role)}`} /> : <GuestRootNavigator key="guest" />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f8fc',
  },
  loaderText: {
    marginTop: 10,
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '600',
  },
});
