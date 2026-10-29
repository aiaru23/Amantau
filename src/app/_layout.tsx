import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { ThemeColors } from '../constants/theme';

export default function RootLayout() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: ThemeColors.navDark,
          },
          headerTintColor: ThemeColors.accentLime,
          headerTitleStyle: {
            fontWeight: '800',
            fontSize: 18,
          },
          contentStyle: {
            backgroundColor: ThemeColors.background,
          },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="routes"
          options={{
            title: 'МОИ МАРШРУТЫ',
            headerBackTitle: 'Назад',
          }}
        />
        <Stack.Screen
          name="prepare"
          options={{
            title: 'ПОДГОТОВКА К ПОХОДУ',
            headerBackTitle: 'Назад',
          }}
        />
        <Stack.Screen
          name="hike"
          options={{
            title: 'МАРШРУТ В ПОХОДЕ',
            headerLeft: () => null,
          }}
        />
        <Stack.Screen
          name="sos"
          options={{
            title: 'ЭКСТРЕННАЯ СИТУАЦИЯ',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="sos-history"
          options={{
            title: 'ИСТОРИЯ SOS СИГНАЛОВ',
            headerBackTitle: 'Назад',
          }}
        />
        <Stack.Screen
          name="community"
          options={{
            title: 'Е Д И Н О М Ы Ш Л Е Н Н И К И',
            headerBackTitle: 'Назад',
          }}
        />
        <Stack.Screen
          name="chat"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="auth"
          options={{
            title: 'АККАУНТ AmanTau',
            headerBackTitle: 'Назад',
          }}
        />
        <Stack.Screen
          name="admin-db"
          options={{
            title: 'БАЗА ДАННЫХ ПОЛЬЗОВАТЕЛЕЙ',
            headerBackTitle: 'Назад',
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            title: 'НАСТРОЙКИ',
            headerBackTitle: 'Назад',
          }}
        />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ThemeColors.background,
  },
});
