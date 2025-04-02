import { Image, StyleSheet,TouchableOpacity, Text, View, TextInput, Linking } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { db } from '../../scripts/firebase';
import { collection, onSnapshot, addDoc, doc, updateDoc } from 'firebase/firestore';
import {auth} from '../../scripts/auth';

import {pickerRef, open, close, OnPressAddSpotButton} from '../../scripts/index';
import { Picker } from '@react-native-picker/picker';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import MapView, { UrlTile, Marker, Callout } from 'react-native-maps';

type Spot = {
  latitude: number;
  longitude: number;
  city: string;
  timestamp: any;
  type?: string;
  claimedBy?: string;
  id: string;
  isFree?: boolean;
  notes?: string;
  openHours?: string;
}

export default function HomeScreen() {
  const [selectedCity, setSelectedCity] = useState();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [spots, setSpots] = useState<Spot[]>([]);
  const mapRef = useRef<MapView | null>(null);
  const [searchQuery, setSeachQuery] = useState<string>('');
  const user = auth.currentUser?.uid || 'testUser123';

  useEffect(() => {
    const unsubscibe = onSnapshot(collection(db, 'spots'), (snapshot) => {
      const now = Date.now();

      const updatedSpots = snapshot.docs
        .map((doc) => ({ ...(doc.data() as Spot), id: doc.id}))
        .filter((spot: any) => {
          if (spot.type == 'left') {
            const spotTime = new Date(spot.timestamp).getTime();
            return now - spotTime < 30 * 60 * 1000;
          };
          return true;
        });
        setSpots(updatedSpots);
      });
    return () => {
      unsubscibe();
    };
  }, []);

  const handleClaimSpot = async (spot: Spot) => {
    try {
      const spotRef = doc(db, 'spots', spot.id);
      await updateDoc(spotRef, { claimedBy: user });

      console.log('Spot claimed successfully!');
    } catch (error) {
      console.error('Error claiming spot:', error);
    }
  };

  const onChange = (text: string) => setSeachQuery(text);

  const onSearch = async () => {
    const results = await Location.geocodeAsync(searchQuery);
    if (results.length > 0) {
      mapRef.current?.animateToRegion({
        latitude: results[0].latitude,
        longitude: results[0].longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    } else {
      setErrorMsg('No results found');
    }
  }

  const handleLongPress = async (event: any) => {
    const coordinate = event.nativeEvent.coordinate;

    const spot = {
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      timestamp: new Date().toISOString(),
      city: selectedCity || '',
      addedBy: user
    };

    try {
      await FirebaseFunctions.addSpot(spot);
      console.log('Spot added from map!');
    } catch (error) {
      console.error('Error adding spot:', error);
    }
  };

  const handleJustLeft = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const spot = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: new Date().toISOString(),
        city: selectedCity || '',
        addedBy: user,
        type: 'left',
      };

      await FirebaseFunctions.addSpot(spot);
      console.log('Vacated spot added!');
      } catch (error) {
        console.error('Error adding vacated spot:', error);
      }
    };

  function saveSpotToData(spot: any) {
    // Save the spot to the database
    console.log('Saving spot:', spot);
    return Promise.resolve();
  }

  const FirebaseFunctions = {
    addSpot: async (spot: any) => {
      try {
        await addDoc(collection(db, 'spots'), spot);
        console.log('Spot added to Firestore!');
      } catch (error) {
        console.error('Error adding spot to Firestore:', error);
      }
    },
  };
     
let text = 'Waiting..';
if (errorMsg) {
    text = errorMsg;
}
else if (location) {
    text = JSON.stringify(location);
}

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
        <MapView ref={mapRef} style={styles.map} 
          initialRegion={{latitude: 37.78825, longitude: -122.4324, latitudeDelta: 0.0922, longitudeDelta: 0.0421}}
          onLongPress={handleLongPress}>
          <UrlTile urlTemplate='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            maximumZ={19}
            flipY={false}
            zIndex={1} />
            {spots.map((spot, index) => (
              <Marker
                key={index}
                coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
                pinColor={spot.type === 'left' ? 'orange' : 'blue'}
                title={`Spot in ${spot.city}`}
                description={
                  spot.claimedBy
                    ? `Claimed by ${spot.claimedBy}`
                    :`Added at ${new Date(spot.timestamp).toLocaleTimeString()}`}
                onPress={() => {
                  if (spot.type === 'left' && !spot.claimedBy) {
                    handleClaimSpot(spot);
                  }
                }}
              >
                <Callout onPress={() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${spot.latitude},${spot.longitude}`)}>
                  <View style={{ width: 200 }}>
                    <Text style={{ fontWeight: 'bold' }}>Spot in {spot.city}</Text>
                    <Text>{spot.notes || 'No notes'}</Text>
                    <Text>{spot.isFree ? 'Free' : 'Paid'}</Text>
                    <Text>{spot.openHours || 'No hours listed'}</Text>
                    <Text style={{ color: 'blue', marginTop: 8 }}>Get Directions</Text>
                  </View>
              </Callout>
              </Marker>
            ))}
        </MapView>
      </ThemedView>

      <ThemedText>Search a place:</ThemedText>
        <TextInput
          style={styles.inputText}
          value={searchQuery} 
          onChangeText={(text) => setSeachQuery(text)}
          placeholder="Search for a city"
          placeholderTextColor="#aaa"
        />

        <TouchableOpacity onPress={onSearch}>
          <Text style={styles.buttonText}>Search</Text>
        </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => OnPressAddSpotButton(selectedCity, user, setSpots, saveSpotToData, FirebaseFunctions, mapRef)}>
        <Text style={styles.buttonText}>Add a spot</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleJustLeft}>
        <Text style={styles.buttonText}>I just left</Text>
      </TouchableOpacity>

      <View style={styles.stepContainer}>
        <Text style={styles.paragraph}>{text}</Text>
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  buttonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    padding: 10,
  },
  inputText: {
    color: 'white',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    margin: 10,
    borderRadius: 6,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  paragraph: {
    fontSize: 18,
    textAlign: 'center',
  },
  map: {
    height: 300,
    width: '100%',
    marginVertical: 12,
    zIndex: 0,
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
