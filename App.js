import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Switch, PermissionsAndroid, Platform, ToastAndroid } from 'react-native';
import NearbyConnections, { Strategy } from 'react-native-nearby-connections';

export default function App() {
  const [isPowerOn, setIsPowerOn] = useState(false);
  const [status, setStatus] = useState('OFFLINE');

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
          // Asol connection logic
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
      <Text style={styles.title}>WALKIE-TALKIE</Text>
      <Switch value={isPowerOn} onValueChange={setIsPowerOn} />
      <Text style={styles.status}>{status}</Text>
      <TouchableOpacity style={styles.pttButton} onPressIn={() => {}} onPressOut={() => {}}>
        <Text style={styles.pttText}>TALK</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  status: { color: '#0f0', margin: 20, fontSize: 18 },
  pttButton: { backgroundColor: '#333', padding: 50, borderRadius: 100 },
  pttText: { color: '#fff', fontSize: 20 }
});
