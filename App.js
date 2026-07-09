import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Switch, PermissionsAndroid, Platform } from 'react-native';

export default function App() {
  const [isPowerOn, setIsPowerOn] = useState(false);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [status, setStatus] = useState('OFFLINE');
  const [peers, setPeers] = useState(0);

  // Background Permission & Offline Network Setup
  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
          PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES,
        ]);
      } catch (err) {
        console.warn(err);
      }
    }
  };

  useEffect(() => {
    if (isPowerOn) {
      setStatus('SCANNING...');
      requestPermissions().then(() => {
        // Ekhane Google Nearby Connections API device search kora shuru korbe
        setTimeout(() => setStatus('SEARCHING FOR PEERS...'), 1500); 
      });
    } else {
      setStatus('OFFLINE');
      setPeers(0);
    }
  }, [isPowerOn]);

  const handlePTTDown = () => {
    if (!isPowerOn) return;
    setIsTransmitting(true);
    // Push to Talk chipte thakle mic theke audio haway pass hobe
  };

  const handlePTTUp = () => {
    if (!isPowerOn) return;
    setIsTransmitting(false);
    // Button chharle radio static sound hobe ar mic off hobe
  };

  return (
    <View style={styles.container}>
      {/* Top Section: Power Switch */}
      <View style={styles.topSection}>
        <Text style={styles.title}>WALKIE-TALKIE</Text>
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>POWER</Text>
          <Switch
            value={isPowerOn}
            onValueChange={setIsPowerOn}
            trackColor={{ false: '#767577', true: '#00ff66' }}
            thumbColor={isPowerOn ? '#fff' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Middle Section: Display Screen */}
      <View style={styles.displaySection}>
        <View style={[styles.screen, !isPowerOn && styles.screenOff]}>
          <Text style={[styles.screenText, !isPowerOn && styles.textOff]}>
            STATUS: {status}
          </Text>
          <Text style={[styles.screenText, !isPowerOn && styles.textOff]}>
            CONNECTED: {peers}
          </Text>
          {isTransmitting && (
            <Text style={styles.transmittingText}>>>> TRANSMITTING >>></Text>
          )}
        </View>
      </View>

      {/* Bottom Section: Massive PTT Button */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={[
            styles.pttButton,
            !isPowerOn && styles.pttButtonDisabled,
            isTransmitting && styles.pttButtonActive
          ]}
          onPressIn={handlePTTDown}
          onPressOut={handlePTTUp}
          activeOpacity={1}
        >
          <Text style={styles.pttText}>TALK</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 20, justifyContent: 'space-between' },
  topSection: { marginTop: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderColor: '#333', paddingBottom: 20 },
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold', letterSpacing: 2 },
  switchContainer: { alignItems: 'center' },
  switchLabel: { color: '#888', fontSize: 12, marginBottom: 5 },
  displaySection: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  screen: { backgroundColor: '#0f291e', width: '100%', height: 160, borderRadius: 10, padding: 20, borderWidth: 2, borderColor: '#1f523c', justifyContent: 'center' },
  screenOff: { backgroundColor: '#111', borderColor: '#333' },
  screenText: { color: '#00ff66', fontSize: 16, fontFamily: 'monospace', marginBottom: 10 },
  textOff: { color: '#444' },
  transmittingText: { color: '#ff3333', fontSize: 18, fontWeight: 'bold', fontFamily: 'monospace', marginTop: 10 },
  bottomSection: { marginBottom: 60, alignItems: 'center' },
  pttButton: { backgroundColor: '#222', width: 220, height: 220, borderRadius: 110, justifyContent: 'center', alignItems: 'center', borderWidth: 6, borderColor: '#444', elevation: 15 },
  pttButtonActive: { backgroundColor: '#ff3333', borderColor: '#ff6666', transform: [{ scale: 0.95 }] },
  pttButtonDisabled: { opacity: 0.4 },
  pttText: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: 2 },
});

