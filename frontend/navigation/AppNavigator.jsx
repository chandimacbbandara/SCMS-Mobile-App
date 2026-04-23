import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import StudentDashboardScreen from '../screens/StudentDashboardScreen';
import StudentFeedbackScreen from '../screens/StudentFeedbackScreen';
import OwnerDashboardScreen from '../screens/OwnerDashboardScreen';
import OwnerAdminWorkspaceScreen from '../screens/OwnerAdminWorkspaceScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import ConsulterDashboardScreen from '../screens/ConsulterDashboardScreen';
import FeedbackInsightsScreen from '../screens/FeedbackInsightsScreen';
import { useAuth } from '../context/AuthContext';

const Stack = createNativeStackNavigator();

function SplashLoader() {
  return (
    <View style={styles.loaderWrap}>
      <ActivityIndicator size="large" color="#e53935" />
      <Text style={styles.loaderText}>Loading SCMS...</Text>
    </View>
  );
}

export default function AppNavigator() {
  const { initializing, isAuthenticated, user } = useAuth();
  const isOwner = user?.role === 'owner';
  const isAdmin = user?.role === 'admin';
  const isConsulter = user?.role === 'consulter';

  const authStackKey = isOwner ? 'owner-stack' : isAdmin ? 'admin-stack' : isConsulter ? 'consulter-stack' : 'student-stack';
  const authInitialRoute = isOwner ? 'OwnerDashboard' : isAdmin ? 'AdminDashboard' : isConsulter ? 'ConsulterDashboard' : 'StudentDashboard';

  if (initializing) {
    return <SplashLoader />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        key={isAuthenticated ? authStackKey : 'guest-stack'}
        initialRouteName={isAuthenticated ? authInitialRoute : 'Home'}
        screenOptions={{
          headerTintColor: '#111827',
          headerTitleStyle: {
            fontWeight: '700',
          },
          contentStyle: {
            backgroundColor: '#f5f8fc',
          },
        }}
      >
        {!isAuthenticated ? (
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{
                title: 'Login',
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{
                title: 'Create Account',
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
              options={{
                title: 'Forgot Password',
                headerShown: false,
              }}
            />
          </>
        ) : (
          isOwner ? (
            <>
              <Stack.Screen
                name="OwnerDashboard"
                component={OwnerDashboardScreen}
                options={{
                  title: 'Owner Dashboard',
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="OwnerAdminWorkspace"
                component={OwnerAdminWorkspaceScreen}
                options={{
                  title: 'Admin Workspace',
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="FeedbackInsights"
                component={FeedbackInsightsScreen}
                options={{
                  title: 'Feedback Page',
                  headerShown: false,
                }}
              />
            </>
          ) : isAdmin ? (
            <>
              <Stack.Screen
                name="AdminDashboard"
                component={AdminDashboardScreen}
                options={{
                  title: 'Admin Dashboard',
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="FeedbackInsights"
                component={FeedbackInsightsScreen}
                options={{
                  title: 'Feedback Page',
                  headerShown: false,
                }}
              />
            </>
          ) : isConsulter ? (
            <>
              <Stack.Screen
                name="ConsulterDashboard"
                component={ConsulterDashboardScreen}
                options={{
                  title: 'Consulter Dashboard',
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="FeedbackInsights"
                component={FeedbackInsightsScreen}
                options={{
                  title: 'Feedback Page',
                  headerShown: false,
                }}
              />
            </>
          ) : (
            <>
              <Stack.Screen
                name="StudentDashboard"
                component={StudentDashboardScreen}
                options={{
                  title: 'Student Dashboard',
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="StudentFeedback"
                component={StudentFeedbackScreen}
                options={{
                  title: 'Student Feedback',
                  headerShown: false,
                }}
              />
            </>
          )
        )}
      </Stack.Navigator>
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
