import ThemedCard from '@/components/ThemedCard'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { WebView } from 'react-native-webview'

type Props = { route: string } // e.g. '/(profiling)/residentaddress'

const ThemedMapAddress: React.FC<Props> = ({ route }) => {
  const router = useRouter()

  const [location, setLocation] = useState({
    lat: 10.2951,
    lng: 123.9028,
    fullAddress: '',
    street: '',
    barangay: '',
    city: '',
    inside: true,
    purok_code: '',
    purok_name: '',
  })
  const [loading, setLoading] = useState(true)

  const handleAddress = () => {
    router.replace({
      pathname: route, // ✅ replace, don’t push
      params: {
        street: location.street,
        brgy: location.barangay,
        city: location.city,
        purok_code: location.purok_code ?? '',
        purok_name: location.purok_name ?? '',
        lat: String(location.lat),
        lng: String(location.lng),
      },
    })
  }

  const leaflet = `
    <!DOCTYPE html><html><head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css"/>
      <style>
        html, body, #map { height: 100%; margin:0; padding:0; }
        #marker { position:absolute; top:50%; left:50%; transform:translate(-50%, -100%); z-index:999; pointer-events:none; }
      </style>
    </head><body>
      <div id="map"></div>
      <img id="marker" src="https://cdn-icons-png.flaticon.com/512/684/684908.png" width="30" height="30"/>
      <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/@turf/turf@6/turf.min.js"></script>
      <script>
        const map = L.map('map').setView([10.2951, 123.9028], 18);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(map);

        // Barangay polygon (Sto. Niño — from your earlier code)
        const barangayCoords = [
          [10.29731,123.90212],[10.29786,123.90201],[10.29764,123.90058],[10.29617,123.89806],[10.29501,123.89771],
          [10.29378,123.89805],[10.29427,123.89904],[10.29420,123.89994],[10.29213,123.89934],[10.29193,123.89938],
          [10.29210,123.90009],[10.28980,123.90065],[10.29069,123.90212],[10.29169,123.90181],[10.29180,123.90195],
          [10.29194,123.90196],[10.29488,123.90334],[10.29580,123.90359],[10.29723,123.90382],[10.29753,123.90379],
          [10.29724,123.90213],[10.29731,123.90212]
        ];
        const barangayPoly = L.polygon(barangayCoords,{color:'#3388ff',fillColor:'#3388ff',fillOpacity:0.1,weight:2}).addTo(map);

        // === Estimated PUROK polygons from your annotated map ===
        // Coordinates are [lat, lng] rings (closed).
        const PUROKS = [
          {
            code: "S01", name: "KANIPAAN", coords: [
              [10.29760,123.89850],
              [10.29785,123.90005],
              [10.29695,123.90150],
              [10.29610,123.90135],
              [10.29555,123.90005],
              [10.29605,123.89900],
              [10.29700,123.89870],
              [10.29760,123.89850]
            ]
          },
          {
            code: "S02", name: "PAMPANGO", coords: [
              [10.29460,123.90160],
              [10.29475,123.90360],
              [10.29330,123.90350],
              [10.29260,123.90250],
              [10.29285,123.90120],
              [10.29380,123.90100],
              [10.29460,123.90160]
            ]
          },
          {
            code: "S03", name: "LUTAW-LUTAW", coords: [
              [10.29485,123.89990],
              [10.29455,123.90140],
              [10.29355,123.90120],
              [10.29280,123.90000],
              [10.29355,123.89905],
              [10.29430,123.89900],
              [10.29485,123.89990]
            ]
          },
          {
            code: "S04", name: "MAUCO", coords: [
              [10.29650,123.90200],
              [10.29605,123.90345],
              [10.29495,123.90370],
              [10.29460,123.90225],
              [10.29525,123.90155],
              [10.29650,123.90200]
            ]
          }
        ];

        // Draw polygons lightly for visual reference
        // PUROKS.forEach(p => { L.polygon(p.coords, { color:'#4f46e5', weight:1, fillOpacity:0.05 }).addTo(map); });

        function toTurfPolygon(coordsLatLng){
          const ring = coordsLatLng.map(([lat,lng]) => [lng,lat]);
          if (ring[0][0] !== ring[ring.length-1][0] || ring[0][1] !== ring[ring.length-1][1]) ring.push(ring[0]);
          return turf.polygon([ring]);
        }

        function findPurok(lat,lng){
          const pt = turf.point([lng,lat]);
          // Only classify if INSIDE barangay
          const inside = barangayPoly.getBounds().contains(L.latLng(lat,lng));
          if (!inside) return { code:null, name:null };

          // Test each polygon
          const hits = [];
          for (const p of PUROKS){
            const gj = toTurfPolygon(p.coords);
            if (turf.booleanPointInPolygon(pt, gj)) hits.push(p);
          }
          if (hits.length === 1) return { code: hits[0].code, name: hits[0].name };
          if (hits.length > 1) {
            // pick smallest area (more specific) if overlaps
            let best = hits[0], bestA = turf.area(toTurfPolygon(hits[0].coords));
            for (let i=1;i<hits.length;i++){
              const a = turf.area(toTurfPolygon(hits[i].coords));
              if (a < bestA){ best = hits[i]; bestA = a; }
            }
            return { code: best.code, name: best.name };
          }
          // Fallback: nearest polygon edge
          let best=null, bestKm=Infinity;
          for (const p of PUROKS){
            const line = turf.polygonToLine(toTurfPolygon(p.coords));
            const d = turf.pointToLineDistance(pt, line, { units:'kilometers' });
            if (d < bestKm) { bestKm = d; best = p; }
          }
          return best ? { code:best.code, name:best.name } : { code:null, name:null };
        }

        function reverseGeocode(lat,lng){
          const inside = barangayPoly.getBounds().contains(L.latLng(lat,lng));
          window.ReactNativeWebView.postMessage(JSON.stringify({ loading: true }));
          fetch(\`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=\${lat}&lon=\${lng}\`)
            .then(r=>r.json())
            .then(data=>{
              const a = data.address || {};
              const purok = findPurok(lat,lng);
              const payload = {
                loading:false, inside,
                fullAddress: data.display_name || "",
                lat, lng,
                street: a.road || a.pedestrian || "Unknown Street",
                barangay: a.neighbourhood || a.suburb || "Señor Santo Niño",
                city: a.city || a.town || a.municipality || "Unknown City",
                purok_code: purok.code,
                purok_name: purok.name,
              };
              window.ReactNativeWebView.postMessage(JSON.stringify(payload));
            })
            .catch(_=>{
              window.ReactNativeWebView.postMessage(JSON.stringify({loading:false,inside:false,lat,lng,error:'Reverse geocoding failed'}));
            });
        }

        reverseGeocode(map.getCenter().lat, map.getCenter().lng);
        map.on('moveend',()=>{ const c = map.getCenter(); reverseGeocode(c.lat,c.lng); });
      </script>
    </body></html>
  `

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: leaflet }}
        javaScriptEnabled
        domStorageEnabled
        onMessage={(event) => {
          const data = JSON.parse(event.nativeEvent.data)
          if (data.loading !== undefined) setLoading(data.loading)
          if (data.error) { console.warn(data.error); return }
          setLocation({
            lat: data.lat, lng: data.lng, fullAddress: data.fullAddress,
            street: data.street, barangay: data.barangay, city: data.city, inside: data.inside,
            purok_code: data.purok_code || '',
            purok_name: data.purok_name || '',
          })
        }}
        style={styles.webview}
      />

      <View style={styles.cardContainer}>
        <Pressable disabled={!location.inside} onPress={handleAddress}>
          <ThemedCard>
            <Text style={styles.title}>Pinned Location</Text>
            {loading ? (
              <Text style={styles.loading}>Fetching address...</Text>
            ) : location.inside ? (
              <>
                <Text style={styles.address}>Street: {location.street}</Text>
                <Text style={styles.address}>Barangay: {location.barangay}</Text>
                <Text style={styles.address}>City: {location.city}</Text>
                <Text style={styles.address}>
                  Purok/Sitio: {location.purok_name || '—'}{location.lat ? ` (${location.purok_code})` : ''}
                </Text>
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

export default ThemedMapAddress

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1 },
  cardContainer: { position: 'absolute', bottom: 20, width: '100%' },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  address: { fontSize: 12, color: '#555', marginTop: 5 },
  loading: { fontSize: 12, color: '#888', marginTop: 5, fontStyle: 'italic' },
})