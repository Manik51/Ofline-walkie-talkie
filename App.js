import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Switch, PermissionsAndroid, Platform, ToastAndroid, FlatList } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import BLEAdvertiser from 'react-native-ble-advertiser';
import { theme } from './theme/theme';
import { registerForPushWakeAsync } from './services/wakeService';

const bleManager = new BleManager();
const MESH_UUID = '0000fee0-0000-1000-8000-00805f9b34fb'; // shared ID so app instances recognize each other

export default function App() {
  const [isPowerOn, setIsPowerOn] = useState(false);
  const [status, setStatus] = useState('OFFLINE');
  const [wakeStatus, setWakeStatus] = useState('INITIALIZING');
  const [peers, setPeers] = useState([]);

  useEffect(() => {
    registerForPushWakeAsync().then(token => {
      setWakeStatus(token ? 'WAKE-LINK ACTIVE' : 'WAKE-LINK DISABLED');
    });
    BLEAdvertiser.setCompanyId(0x00);
    return () => bleManager.destroy();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
      ]);
      return Object.values(granted).every(v => v === 'granted');
    }
    return true;
  };

  const startMesh = () => {
    setPeers([]);

    // Broadcast our presence so other MeshTalk phones can find us
    BLEAdvertiser.broadcast(MESH_UUID, [], {
      advertiseMode: BLEAdvertiser.ADVERTISE_MODE_LOW_LATENCY,
      txPowerLevel: BLEAdvertiser.ADVERTISE_TX_POWER_HIGH,
      connectable: true,
      includeDeviceName: true,
    }).catch(err => console.log('Advertise error:', err));

    // Scan for other MeshTalk phones broadcasting the same UUID
    bleManager.startDeviceScan([MESH_UUID], { allowDuplicates: false }, (error, device) => {
      if (error) {
        console.log('Scan error:', error);
        return;
      }
      if (device) {
        setPeers(prev => (prev.some(p => p.id === device.id) ? prev : [...prev, device]));
      }
    });
  };

  const stopMesh = () => {
    bleManager.stopDeviceScan();
    BLEAdvertiser.stopBroadcast().catch(() => {});
    setPeers([]);
  };

  useEffect(() => {
    if (isPowerOn) {
      setStatus('BROADCASTING...');
      requestPermissions().then(granted => {
        if (granted) {
          startMesh();
          setStatus('READY TO TALK');
          if (Platform.OS === 'android') ToastAndroid.show('Radio ON', ToastAndroid.SHORT);
        } else {
          setStatus('PERMISSION DENIED');
          setIsPowerOn(false);
        }
      });
    } else {
      stopMesh();
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
            <Text style={styles.peerText}>{item.name || item.id}</Text>
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
