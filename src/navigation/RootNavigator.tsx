import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import DejarResenaScreen from '../screens/DejarResenaScreen';
import LoginScreen from '../screens/LoginScreen';
import PremiumScreen from '../screens/PremiumScreen';
import RegisterScreen from '../screens/RegisterScreen';
import WorkerProfileScreen from '../screens/WorkerProfileScreen';
import WorkersListScreen from '../screens/WorkersListScreen';
import { colors } from '../constants/theme';
import type { AppStackParamList, AuthStackParamList } from './types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function AppNavigator() {
  return (
    <AppStack.Navigator>
      <AppStack.Screen
        name="WorkersList"
        component={WorkersListScreen}
        options={{ headerShown: false }}
      />
      <AppStack.Screen
        name="WorkerProfile"
        component={WorkerProfileScreen}
        options={({ route }) => ({ title: route.params.nombre })}
      />
      <AppStack.Screen name="Premium" component={PremiumScreen} options={{ title: 'Premium' }} />
      <AppStack.Screen
        name="DejarResena"
        component={DejarResenaScreen}
        options={{ title: 'Dejar reseña' }}
      />
    </AppStack.Navigator>
  );
}

export default function RootNavigator() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return <NavigationContainer>{session ? <AppNavigator /> : <AuthNavigator />}</NavigationContainer>;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
