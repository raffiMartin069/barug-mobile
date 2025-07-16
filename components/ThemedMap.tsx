import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import ThemedCard from './ThemedCard';

const ThemedMap = ({ route }) => {
    const router = useRouter()

    const handleAddress = () => {
      router.push(route)
    }

    const [location, setLocation] = useState({
      lat: 10.2951,
      lng: 123.9028,
      fullAddress: '',
      street: '',
      purokSitio: '',
      barangay: '',
      city: '',
      inside: true,
    });

    const [loading, setLoading] = useState(true)

    const leaflet = `
        <!DOCTYPE html>
        <html>
        <head>
        <title>Leaflet Map</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link
            rel="stylesheet"
            href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css"
        />
        <style>
            html, body, #map {
                height: 100%;
                margin: 0;
                padding: 0;
            }
            #marker {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -100%);
                z-index: 999;
                pointer-events: none;
            }
        </style>
        </head>
        <body>
        <div id="map"></div>
        <img id="marker" src="https://cdn-icons-png.flaticon.com/512/684/684908.png" width="30" height="30"/>
        <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
        <script>
            // Initialize map
            const map = L.map('map').setView([10.2951, 123.9028], 18);

            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            // Define the polygon coordinates
            const polygonCoords = [
            [10.29731, 123.90212],
            [10.29786, 123.90201],
            [10.29764, 123.90058],
            [10.29617, 123.89806],
            [10.29501, 123.89771],
            [10.29378, 123.89805],
            [10.29427, 123.89904],
            [10.29420, 123.89994],
            [10.29213, 123.89934],
            [10.29193, 123.89938],
            [10.29210, 123.90009],
            [10.28980, 123.90065],
            [10.29069, 123.90212],
            [10.29169, 123.90181],
            [10.29180, 123.90195],
            [10.29194, 123.90196],
            [10.29488, 123.90334],
            [10.29580, 123.90359],
            [10.29723, 123.90382],
            [10.29753, 123.90379],
            [10.29724, 123.90213],
            [10.29731, 123.90212] // close polygon
            ];

            // Add the polygon to the map
            const polygon = L.polygon(polygonCoords, {
            color: '#3388ff',
            fillColor: '#3388ff',
            fillOpacity: 0.1,
            weight: 2
            }).addTo(map);

            // Fit map bounds to polygon
            // map.fitBounds(polygon.getBounds());

            // Reverse geocoding function
            function reverseGeocode(lat, lng) {
                const point = L.latLng(lat, lng);
                const isInside = polygon.getBounds().contains(point)

                window.ReactNativeWebView.postMessage(JSON.stringify({ loading: true }));
                
                fetch(\`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=\${lat}&lon=\${lng}\`)
                    .then(response => response.json())
                    .then(data => {
                        const addr = data.address;
                        const fullAddress = data.display_name || "No address found";

                        const street = addr.road || addr.pedestrian || "Unknown Street";
                        const purokSitio = addr.suburb || addr.hamlet || addr.village || "N/A";
                        const barangay = addr.neighbourhood || addr.suburb || "Señor Santo Niño";
                        const city = addr.city || addr.town || addr.municipality || "Unknown City";
                        // Send back to React Native
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            loading: false,
                            inside: isInside,
                            fullAddress: fullAddress,
                            lat: lat,
                            lng: lng,
                            street: street,
                            purokSitio: purokSitio,
                            barangay: barangay,
                            city: city,
                        }));
                    })
                    .catch(error => {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            loading: false,
                            inside: false,
                            lat: lat,
                            lng: lng,
                            error: "Reverse geocoding failed"
                        }));
                    });
            }

            // Get initial address
            const center = map.getCenter();
            reverseGeocode(center.lat, center.lng);

            // When map is moved
            map.on('moveend', function() {
                const center = map.getCenter();
                reverseGeocode(center.lat, center.lng);
            });
        </script>
        </body>
        </html>
    `;

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: leaflet }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onMessage={(event) => {
        const data = JSON.parse(event.nativeEvent.data);

        if (data.loading !== undefined) {
          setLoading(data.loading); // 🟢 Set loading state
        }

        // Check for errors
        if (data.error) {
          // Optional: handle error
          console.warn(data.error);
          //setLoading(false);
          return;
        }

        // Update state with broken-down address
        setLocation({
            lat: data.lat,
            lng: data.lng,
            fullAddress: data.fullAddress,
            street: data.street,
            purokSitio: data.purokSitio,
            barangay: data.barangay,
            city: data.city,
            inside: data.inside,
        });
        //setLoading(false);
      }}
        style={styles.webview}
      />
      <View style={styles.cardContainer}>
        <Pressable
          disabled={!location.inside}
          onPress={() => {
            if (location.inside) {
              console.log("Pinned location selected:", location)
              handleAddress()
            }
          }}
        >
          <ThemedCard>
            <Text style={styles.title}>Pinned Location</Text>
            {loading ? (
              <Text style={styles.loading}>Fetching address...</Text>
            ) : location.inside ? (
              <>
                <Text style={styles.address}>Street: {location.street}</Text>
                <Text style={styles.address}>Purok or Sitio: {location.purokSitio}</Text>
                <Text style={styles.address}>Barangay: {location.barangay}</Text>
                <Text style={styles.address}>City: {location.city}</Text>
              </>
            ) : (
              <>
                <Text style={styles.address}>{location.fullAddress}</Text>
                <Text style={styles.loading}>This address is outside the barangay.</Text>
              </>
            )}
          </ThemedCard>
        </Pressable>
        
      </View>
    </View>
  )
}

export default ThemedMap

const styles = StyleSheet.create({
    container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  cardContainer: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 2,
  },
  address: {
    fontSize: 12,
    color: '#555',
    marginTop: 5,
  },
  loading: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
    fontStyle: 'italic',
  },
})