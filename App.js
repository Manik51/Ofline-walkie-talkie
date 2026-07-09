import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Switch, PermissionsAndroid, Platform, ToastAndroid, FlatList } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import { theme } from './theme/theme';
import { registerForPushWakeAsync } from './services/wakeService';

const bleManager = new BleManager();

export default function App() {
  const [isPowerOn, setIsPowerOn] = useState(false);
  const [status, setStatus] = useState('OFFLINE');
  const [wakeStatus, setWakeStatus] = useState('INITIALIZING');
  const [peers, setPeers] = useState([]);
  const scanSubscription = useRef(null);

  useEffect(() => {
    registerForPushWakeAsync().then(token => {
      setWakeStatus(token ? 'WAKE-LINK ACTIVE' : 'WAKE-LINK DISABLED');
    });
    return () => bleManager.destroy();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]);
      return Object.values(granted).every(v => v === 'granted');
    }
    return true;
  };

  const startScan = () => {
    setPeers([]);
    bleManager.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
      if (error) {
        console.log('Scan error:', error);
        setStatus('SCAN ERROR');
        return;
      }
      if (device?.name) {
        setPeers(prev => (prev.some(p => p.id === device.id) ? prev : [...prev, device]));
      }
    });
  };

  const stopScan = () => {
    bleManager.stopDeviceScan();
    setPeers([]);
  };

  useEffect(() => {
    if (isPowerOn) {
      setStatus('SCANNING...');
      requestPermissions().then(granted => {
        if (granted) {
          startScan();
          setStatus('READY TO TALK');
          if (Platform.OS === 'android') ToastAndroid.show('Radio ON', ToastAndroid.SHORT);
        } else {
          setStatus('PERMISSION DENIED');
          setIsPowerOn(false);
        }
      });
    } else {
      stopScan();
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

      <FlatList
        style={styles.peerList}
        data={peers}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.peerRow}>
            <View style={styles.peerDot} />
            <Text style={styles.peerText}>{item.name}</Text>
          </View>
        )}
        ListEmptyComponent={
          isPowerOn ? <Text style={styles.emptyText}>Searching for nearby radios…</Text> : null
        }
      />

      <TouchableOpacity style={styles.pttButton} onPressIn={() => {}} onPressOut={() => {}}>
        <Text style={styles.pttText}>TALK</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' },
  title: { color: theme.colors.primary, fontSize: theme.font.sizeXl, fontFamily: theme.font.mono, fontWeight: 'bold', letterSpacing: 4 },
  subtitle: { color: theme.colors.textMuted, fontSize: theme.font.sizeMd, fontFamily: theme.font.mono, marginBottom: 16, letterSpacing: 2 },
  wakePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, borderRadius: theme.radius, paddingVertical: 6, paddingHorizontal: 14, marginBottom: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  wakeText: { color: theme.colors.textPrimary, fontFamily: theme.font.mono, fontSize: 12 },
  status: { color: theme.colors.primary, marginTop: 20, marginBottom: 10, fontSize: 18, fontFamily: theme.font.mono },
  peerList: { maxHeight: 140, width: '80%', marginBottom: 20 },
  peerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  peerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.secondary, marginRight: 8 },
  peerText: { color: theme.colors.textPrimary, fontFamily: theme.font.mono, fontSize: 13 },
  emptyText: { color: theme.colors.textMuted, fontFamily: theme.font.mono, fontSize: 12, textAlign: 'center' },
  pttButton: { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary, borderWidth: 2, padding: 50, borderRadius: 100 },
  pttText: { color: theme.colors.primary, fontSize: 20, fontFamily: theme.font.mono, fontWeight: 'bold' },
});
