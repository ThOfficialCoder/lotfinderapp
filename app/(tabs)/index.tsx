import { Image, StyleSheet,TouchableOpacity, Text, View, TextInput, Linking } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { db } from '../../scripts/firebase';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
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
  placeName?: string;
  type?: 'left';
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
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'spots'), async (snapshot) => {
      const now = Date.now();
  
      // First, clean up old "left" spots
      for (const docSnap of snapshot.docs) {
        const spot = docSnap.data();
        if (spot.type === 'left') {
          const spotTime = new Date(spot.timestamp).getTime();
          if (now - spotTime > 10 * 60 * 1000) {
            await deleteDoc(doc(db, 'spots', docSnap.id));
            console.log(`Auto-removed expired spot: ${docSnap.id}`);
          }
        }
      }
  
      // Now update spots state with valid ones
      const updatedSpots = snapshot.docs
        .map((doc) => ({ ...(doc.data() as Spot), id: doc.id }))
        .filter((spot: any) => {
          if (spot.type === 'left') {
            const spotTime = new Date(spot.timestamp).getTime();
            return now - spotTime <= 10 * 60 * 1000; // ⏱ show if under 10 min
          }
          return true; // keep all non-left spots
        });
  
      setSpots(updatedSpots);
    });
  
    return () => {
      unsubscribe();
    };
  }, []);

  const handleClaimSpot = async (spot: Spot) => {
    if (!spot.id) {
      console.error('Spot ID is missing');
      return;
    }


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

    const placemarks = await Location.reverseGeocodeAsync({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
    });

    const autoCity = placemarks[0]?.name || 'Unknown';

    const spot = {
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      timestamp: new Date().toISOString(),
      city: autoCity,
      placeName: searchQuery || autoCity,
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
      if (!selectedSpot || !selectedSpot.id) {
        alert('Please tap on a spot you`re leaving');
        return;
      }

      const source = selectedSpot
      ? { coords : { latitude: selectedSpot.latitude, longitude: selectedSpot.longitude } }
      : await Location.getCurrentPositionAsync({});

      const placemarks = await Location.reverseGeocodeAsync({
        latitude: source.coords.latitude,
        longitude: source.coords.longitude,
      });
      const autoCity = placemarks[0]?.city || 'Unknown';
      
      const spot = {
        latitude: source.coords.latitude,
        longitude: source.coords.longitude,
        timestamp: new Date().toISOString(),
        city: autoCity,
        placeName: searchQuery || autoCity,
        addedBy: user,
        type: 'left',
        id: `temp-${Date.now()}`,
      };

      await FirebaseFunctions.addSpot(spot);
      setSpots((prev: any) => [...prev, spot]);
      console.log((prev: any) => [...prev, spot]);
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

  return (
    <ParallaxScrollView>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Lotfinder App</ThemedText>
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
                pinColor={spot.type === 'left' ? 'green' : 'red'}
                title={spot.type === 'left' ? 'Recently Left Spot' : `Spot #${index + 1}`}
                description={
                  spot.claimedBy
                    ? `Claimed by ${spot.claimedBy}`
                    :`Added at ${new Date(spot.timestamp).toLocaleTimeString()}`}
                onPress={() => {
                  setSelectedSpot(spot);
                  if (spot.type === 'left' && !spot.claimedBy) {
                    handleClaimSpot(spot);
                  }
                }}
              >
                <Callout onPress={() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${spot.latitude},${spot.longitude}`)}>
                  <View style={{ width: 200 }}>
                    <Text style={{ fontWeight: 'bold' }}>
                      {spot.placeName 
                      ? `Near ${spot.placeName}` 
                      : spot.city
                      ? `Spot in ${spot.city}`
                      : `Unnamed spot at (${spot.latitude.toFixed(4)}, ${spot.longitude.toFixed(4)})`}
                    </Text>
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

      <TouchableOpacity style={styles.button} onPress={() => OnPressAddSpotButton(selectedCity, user, setSpots, saveSpotToData, FirebaseFunctions, mapRef, selectedSpot, searchQuery)}>
        <Text style={styles.buttonText}>Add a spot</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleJustLeft}
      disabled={!selectedSpot}>
        <Text style={styles.buttonText}>I just left</Text>
      </TouchableOpacity>
    </ParallaxScrollView>
  )};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: '#f9f9f9', // light background for contrast
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  map: {
    height: 300,
    width: '100%',
    marginVertical: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  inputText: {
    backgroundColor: '#fff',
    color: '#333',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#007BFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 12,
    alignSelf: 'center',
    width: '60%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    color: 'black',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  paragraph: {
    fontSize: 16,
    textAlign: 'center',
    color: '#444',
    marginBottom: 12,
  },
  stepContainer: {
    marginBottom: 16,
  },
  reactLogo: {
    height: 140,
    width: 250,
    resizeMode: 'contain',
    marginBottom: 12,
  },
});
