import { createRef } from 'react';
import * as Location from 'expo-location';

const pickerRef = createRef();

function open() {
    pickerRef.current.focus();
}

function close() {
    pickerRef.current.blur();
}

async function getCurrentLocation() {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permission to access location was denied');
      }

      const location = await Location.getCurrentPositionAsync({});
      return location;
}

// async function OnPressLeaveSpotButton(selectedCity, user, setSpots, saveSpotToDatabase, FirebaseFunctions) {
//   try {
//     const location = await getCurrentLocation();

//     const spot = {
//         latitude: location.coords.latitude,
//         longitude: location.coords.longitude,
//         timestamp: new Date().toISOString(),
//         city: selectedCity || '',
//         addedBy: user,
//         type: "left"
//     };

//     setSpots((prevSpots) => [...prevSpots, spot]);

//     await saveSpotToDatabase(spot);
//     FirebaseFunctions.addSpot(spot);

//     console.log('Left spot added:', spot);
//   } catch (error) {
//     console.error('Error adding left spot:', error);
//   }
// }

async function OnPressAddSpotButton(selectedCity, user, setSpots, saveSpotToDatabase, FirebaseFunctions, mapRef, selectedSpot, searchQuery) {
    try {
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
            addedBy: user
        }

        if (mapRef?.current) {
            mapRef.current.animateToRegion(
              {
                latitude: spot.latitude,
                longitude: spot.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              },
              1000 // animation duration in ms
            );
          }
    
        setSpots((prevSpots) => [...prevSpots, spot]);
    
        await saveSpotToDatabase(spot);
        FirebaseFunctions.addSpot(spot);
    
        console.log('Spot added:', spot);
    } catch (error) {
        console.error('Error adding spot:', error);
    }
}

export { pickerRef, open, close, OnPressAddSpotButton };