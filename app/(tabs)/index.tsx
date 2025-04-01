import { Image, StyleSheet,TouchableOpacity, Text } from 'react-native';
import React, { useState } from 'react';

import {pickerRef, open, close} from '../../scripts/index.js';
import { Picker } from '@react-native-picker/picker';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import MapView, { UrlTile } from 'react-native-maps';

export default function HomeScreen() {
  const [selectedCity, setSelectedCity] = useState();

  return (
    <ParallaxScrollView 
    headerImage={<Image
      source={require('@/assets/images/react-logo.png')}
      style={styles.reactLogo}
      resizeMode="contain"
    />} 
    headerBackgroundColor={{
      dark: '',
      light: ''
    }}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome to Parking App</ThemedText>
      </ThemedView>

      <ThemedView>
        <MapView style={styles.map} 
          initialRegion={{latitude: 37.78825, longitude: -122.4324, latitudeDelta: 0.0922, longitudeDelta: 0.0421}}>
          <UrlTile urlTemplate='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            maximumZ={19}
            flipY={false}
            zIndex={1} />
        </MapView>
      </ThemedView>

      <ThemedText>Select a city:</ThemedText>
      <Picker ref={pickerRef} selectedValue={selectedCity} onValueChange={(itemValue, itemIndex) => setSelectedCity(itemValue)}>
        <Picker.Item label="New York" value="NY" />
        <Picker.Item label="San Francisco" value="SF" />
        <Picker.Item label="Los Angeles" value="LA" />
      </Picker>

      <TouchableOpacity style={styles.button} onPress={() => console.log('button clicked')}>
        <Text style={styles.buttonText}>Add a spot</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => console.log('button clicked')}>
        <Text style={styles.buttonText}>I just left</Text>
      </TouchableOpacity>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  map: {
    height: 300,
    width: '100%',
    marginVertical: 12,
    zIndex: 0
  },
  buttonText: {
    color: 'white',
    fontSize: 16
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  button: {
    backgroundColor: '#007BFF',
    borderRadius: 4,
    padding: 8,
    marginTop: 8,
    width: 100,
  }
});
