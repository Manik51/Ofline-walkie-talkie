import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Switch, PermissionsAndroid, Platform, ToastAndroid } from 'react-native';
import NearbyConnections, { Strategy } from 'react-native-nearby-connections';
import { theme } from './theme/theme';
import { registerForPushWakeAsync } from './services/wakeService';

export default function App() {
  const [isPowerOn, setIsPowerOn] = useState(false);
  const [status, setStatus] = useState('OFFLINE');
  const [wakeStatus, setWakeStatus] = useState('INITIALIZING');

  // Register for push-based wake (FCM) once, on app start.
  useEffect(() => {
    registerForPushWakeAsync().then(token => {
      setWakeStatus(token ? 'WAKE-LINK ACTIVE' : 'WAKE-LINK DISABLED');
    });
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES,
      ]);
      return granted['android.permission.ACCESS_FINE_LOCATION'] === 'granted';
    }
    return true;
  };

  useEffect(() => {
    if (isPowerOn) {
      setStatus('CONNECTING...');
      requestPermissions().then(granted => {
        if (granted) {
          NearbyConnections.startAdvertising('MyPhone', 'SERVICE_ID', Strategy.P2P_STAR);
          NearbyConnections.startDiscovery('SERVICE_ID', Strategy.P2P_STAR);
          setStatus('READY TO TALK');
          ToastAndroid.show('Radio ON', ToastAndroid.SHORT);
        }
      });
    } else {
      NearbyConnections.stopAdvertising();
      NearbyConnections.stopDiscovery();
      setStatus('OFFLINE');
    }
  }, [isPowerOn]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MESHTALK</Text>
      <Text style={styles.subtitle}>OFFLINE WALKIE-TALKIE</Text>

      <View style={styles.wakePill}>
        <View style={[styles.dot, { backgroundColor: wakeStatus === 'WAKE-LINK ACTIVE' ? theme.colors.primary : theme.colors.danger }]} />
        <Text style={styles.wakeText}>{wakeStatus}</Text>
      </View>

      <Switch
        value={isPowerOn}
        onValueChange={setIsPowerOn}
        trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
        thumbColor={theme.colors.textPrimary}
      />
      <Text style={styles.status}>{status}</Text>

      <TouchableOpacity style={styles.pttButton} onPressIn={() => {}} onPressOut={() => {}}>
        <Text style={styles.pttText}>TALK</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: theme.colors.primary,
    fontSize: theme.font.sizeXl,
    fontFamily: theme.font.mono,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: theme.font.sizeMd,
    fontFamily: theme.font.mono,
    marginBottom: 16,
    letterSpacing: 2,
  },
  wakePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  wakeText: {
    color: theme.colors.textPrimary,
    fontFamily: theme.font.mono,
    fontSize: 12,
  },
  status: {
    color: theme.colors.primary,
    marginTop: 20,
    marginBottom: 20,
    fontSize: 18,
    fontFamily: theme.font.mono,
  },
  pttButton: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.primary,
    borderWidth: 2,
    padding: 50,
    borderRadius: 100,
  },
  pttText: {
    color: theme.colors.primary,
    fontSize: 20,
    fontFamily: theme.font.mono,
    fontWeight: 'bold',
  },
});
