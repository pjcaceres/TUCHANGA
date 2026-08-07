import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import ChatScreen from '../screens/ChatScreen';
import ConfiguracionScreen from '../screens/ConfiguracionScreen';
import DejarResenaScreen from '../screens/DejarResenaScreen';
import EditarPerfilScreen from '../screens/EditarPerfilScreen';
import LoginScreen from '../screens/LoginScreen';
import MisChatsScreen from '../screens/MisChatsScreen';
import PremiumScreen from '../screens/PremiumScreen';
import PrivacidadScreen from '../screens/PrivacidadScreen';
import RegisterScreen from '../screens/RegisterScreen';
import TerminosScreen from '../screens/TerminosScreen';
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
      <AuthStack.Screen
        name="Terminos"
        component={TerminosScreen}
        options={{ headerShown: true, title: 'Términos y Condiciones' }}
      />
      <AuthStack.Screen
        name="Privacidad"
        component={PrivacidadScreen}
        options={{ headerShown: true, title: 'Política de Privacidad' }}
      />
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
      <AppStack.Screen
        name="Configuracion"
        component={ConfiguracionScreen}
        options={{ title: 'Configuración' }}
      />
      <AppStack.Screen
        name="Terminos"
        component={TerminosScreen}
        options={{ title: 'Términos y Condiciones' }}
      />
      <AppStack.Screen
        name="Privacidad"
        component={PrivacidadScreen}
        options={{ title: 'Política de Privacidad' }}
      />
      <AppStack.Screen name="MisChats" component={MisChatsScreen} options={{ title: 'Mis chats' }} />
      <AppStack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }) => ({ title: route.params.nombreOtroUsuario })}
      />
      <AppStack.Screen
        name="EditarPerfil"
        component={EditarPerfilScreen}
        options={{ title: 'Editar perfil' }}
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
