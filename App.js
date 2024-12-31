import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, Alert, TouchableOpacity, SafeAreaView, Button, ActivityIndicator } from "react-native";
import { BleManager } from "react-native-ble-plx";
import { Buffer } from 'buffer'
import Icon from 'react-native-vector-icons/AntDesign';
import { WebView } from 'react-native-webview';

const bleManager = new BleManager();

const TARGET_DEVICE_ID = "D4:8A:FC:67:A7:F6";
// const TARGET_DEVICE_ID = "d4:8a:fc:67:a7:f6";

const App = () => {
  const backgroundStyle = {
    backgroundColor: "#3C3C3C",
  };

  const [isConnected, setIsConnected] = useState(false);
  const [device, setDevice] = useState(null);

  const SERVICE_UUID = "12345678-1234-5678-1234-56789abcdef0";
  const CHARACTERISTIC_UUID = "abcdef01-1234-5678-1234-56789abcdef0";

  const connectToDevice = async () => {
    try {
      console.log("Scanning for devices...");
      const scannedDevice = await bleManager.connectToDevice(TARGET_DEVICE_ID);
      // console.log("Device found:", scannedDevice.name);
      console.log(scannedDevice);
      await scannedDevice.discoverAllServicesAndCharacteristics();
      console.log("Services discovered");

      // Save device and update state
      setDevice(scannedDevice);
      setIsConnected(true);
      Alert.alert("Success", `Connected to device: ${scannedDevice.id}`);

      // Mulai memonitor karakteristik untuk data masuk
      scannedDevice.monitorCharacteristicForService(
        SERVICE_UUID,
        CHARACTERISTIC_UUID,
        (error, characteristic) => {
          if (error) {
            console.error("Error monitoring characteristic:", error);
            return;
          }

          const value = characteristic.value; // Data dalam Base64
          const decodedValue = atob(value); // Decode Base64 ke string
          // setData(decodedValue);
          console.log("Received data:", decodedValue);
        }
      );

    } catch (error) {
      console.error("Error connecting to device:", error);
      Alert.alert("Error", `Failed to connect: ${error.message}`);
    }
  };

  const disconnectDevice = async () => {
    try {
      if (device) {
        console.log("Disconnecting from device...");
        // await bleManager.cancelDeviceConnection(TARGET_DEVICE_ID)
        await device.cancelConnection();
        setDevice(null);
        setIsConnected(false);
        Alert.alert("Disconnected", "Device has been disconnected");
      }
    } catch (error) {
      console.error("Error disconnecting from device:", error);
      Alert.alert("Error", `Failed to disconnect: ${error.message}`);
    }
  };

  const checkConnectionStatus = async () => {
    const connectionStatus = await bleManager.isDeviceConnected(TARGET_DEVICE_ID);
    if (!connectionStatus) {
      setIsConnected(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      checkConnectionStatus()
    }, 3000);

    return () => {
      clearInterval(interval);
    }
  }, [])

  // useEffect(() => {
  //   return () => {
  //     bleManager.destroy();
  //   };
  // }, []);

  const [intervalId, setIntervalId] = useState(null);

  const handlePressIn = (val) => {
    const id = setInterval(async () => {

      let value = `${val}`
      try {
        if (device) {
          const serviceUUID = "12345678-1234-5678-1234-56789abcdef0"; // Ganti dengan Service UUID perangkat
          const characteristicUUID = "abcdef01-1234-5678-1234-56789abcdef0"; // Ganti dengan Characteristic UUID perangkat

          const data = Buffer.from(val, "utf-8").toString("base64"); // Encode ke Base64
          await device.writeCharacteristicWithResponseForService(
            serviceUUID,
            characteristicUUID,
            data
          );

          Alert.alert("Success", "Sent: FORWARD", `Sent: ${value}`);
        } else {
          console.error("Device is not connected");
        }
      } catch (error) {
        console.error("Error sending data:", error);
      }

    }, 250); // Interval waktu aksi dalam milidetik (100 ms)
    setIntervalId(id);
  };

  const handlePressOut = () => {
    clearInterval(intervalId); // Hentikan interval
    setIntervalId(null);
  };

  const webViewRef = useRef(null); // Referensi ke WebView
  const [refreshing, setRefreshing] = useState(false);
  const onReloadPress = () => {
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  return (
    <SafeAreaView style={[backgroundStyle, { height: '100%' }]}>

      <View style={{ flex: 0.7, backgroundColor: 'grey' }} >
        <WebView
          ref={webViewRef}
          style={{ marginTop: (Platform.OS == 'ios') ? 20 : 0, }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          source={{ uri: "http://192.168.43.11" }}
        />
        <Button title="Refresh"  onPress={onReloadPress} />
      </View>

      <View style={{ flex: 1, justifyContent: 'center', alignSelf: 'center', alignItems: 'center' }}>
        <TouchableOpacity onPressIn={() => handlePressIn("F")} onPressOut={handlePressOut}>
          <Icon name="caretup" size={130} color="#D9D9D9" />
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', gap: 0 }} >
          <TouchableOpacity onPressIn={() => handlePressIn("L")} onPressOut={handlePressOut}>
            <Icon name="caretleft" size={130} color="#D9D9D9" />
          </TouchableOpacity>

          <View style={{ justifyContent: 'center' }} >
            {
              !isConnected ? (
                <TouchableOpacity onPress={connectToDevice} style={{ backgroundColor: '#282828', width: 100, height: 100, borderRadius: 5, justifyContent: 'center' }}>
                  <Text style={{ textAlign: 'center', color: 'white', fontWeight: 'bold', fontSize: 18 }}>CONNECT</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={disconnectDevice} style={{ backgroundColor: 'red', width: 100, height: 100, borderRadius: 30, justifyContent: 'center' }}>
                  <Text style={{ textAlign: 'center', color: 'white', fontWeight: 'bold', fontSize: 16 }}>DISCONNECT</Text>
                </TouchableOpacity>
              )
            }

          </View>

          <TouchableOpacity onPressIn={() => handlePressIn("R")} onPressOut={handlePressOut}>
            <Icon name="caretright" size={130} color="#D9D9D9" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPressIn={() => handlePressIn("B")} onPressOut={handlePressOut}>
          <Icon name="caretdown" size={130} color="#D9D9D9" />
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  )
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
});

export default App;