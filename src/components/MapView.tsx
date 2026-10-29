import React, { useRef, useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Modal, SafeAreaView } from 'react-native';
import { WebView } from 'react-native-webview';
import Svg, { Path, Circle, Line, Rect, Text as SvgText, G } from 'react-native-svg';
import { Layers, Navigation, Maximize2, X, Globe } from 'lucide-react-native';
import { LatLng, RoutePoint } from '../types/route';
import { ThemeColors } from '../constants/theme';

interface MapViewProps {
  routePoints: RoutePoint[];
  userLocation: LatLng;
  lastPointOnRoute?: LatLng | null;
  deviationMeters: number;
}

type TileStyle = 'dark' | 'topo' | 'osm';

const TILE_URLS: Record<TileStyle, { url: string; label: string }> = {
  dark: {
    url: 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    label: '2GIS Dark',
  },
  topo: {
    url: 'https://a.tile.opentopomap.org/{z}/{x}/{y}.png',
    label: 'Топо Карта',
  },
  osm: {
    url: 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
    label: 'Схема',
  },
};

function generateLeafletHtml(
  routePoints: RoutePoint[],
  userLocation: LatLng,
  lastPointOnRoute: LatLng | null | undefined,
  deviationMeters: number,
  tileStyle: TileStyle
): string {
  const pointsJson = JSON.stringify(
    routePoints.map((p) => [p.latitude, p.longitude])
  );
  const userLocJson = JSON.stringify([userLocation.latitude, userLocation.longitude]);
  const lastPointJson = lastPointOnRoute
    ? JSON.stringify([lastPointOnRoute.latitude, lastPointOnRoute.longitude])
    : 'null';

  const startPt = routePoints[0] || userLocation;
  const endPt = routePoints[routePoints.length - 1] || userLocation;

  const startJson = JSON.stringify([startPt.latitude, startPt.longitude]);
  const endJson = JSON.stringify([endPt.latitude, endPt.longitude]);

  const tileConfig = TILE_URLS[tileStyle];

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { box-sizing: border-box; }
    html, body, #map {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      background: #0E1411;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .leaflet-control-container .leaflet-bottom { display: none; }
    .user-pulse-marker {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .user-pulse-dot {
      width: 14px;
      height: 14px;
      background-color: #10B981;
      border: 2px solid #FFFFFF;
      border-radius: 50%;
    }
    .start-marker, .end-marker {
      font-size: 18px;
      text-align: center;
      line-height: 18px;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    try {
      var points = ${pointsJson};
      var userLoc = ${userLocJson};
      var lastPt = ${lastPointJson};
      var startPt = ${startJson};
      var endPt = ${endJson};
      var devMeters = ${deviationMeters};

      var map = L.map('map', {
        zoomControl: false,
        attributionControl: false
      });

      L.tileLayer('${tileConfig.url}', {
        maxZoom: 19,
        crossOrigin: true
      }).addTo(map);

      if (points && points.length > 1) {
        L.polyline(points, {
          color: '#0B120E',
          weight: 8,
          opacity: 0.6,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(map);

        L.polyline(points, {
          color: '#10B981',
          weight: 5,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(map);

        var bounds = L.latLngBounds(points);
        bounds.extend(userLoc);
        map.fitBounds(bounds, { padding: [25, 25] });
      } else {
        map.setView(userLoc, 15);
      }

      var userIcon = L.divIcon({
        className: 'user-pulse-marker',
        html: '<div class="user-pulse-dot"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
      var userMarker = L.marker(userLoc, { icon: userIcon }).addTo(map);

      L.marker(startPt, {
        icon: L.divIcon({ className: 'start-marker', html: '🟢', iconSize: [18, 18], iconAnchor: [9, 9] })
      }).addTo(map);

      L.marker(endPt, {
        icon: L.divIcon({ className: 'end-marker', html: '🏁', iconSize: [18, 18], iconAnchor: [9, 9] })
      }).addTo(map);

      var devConnector = null;
      if (devMeters > 50 && lastPt) {
        devConnector = L.polyline([userLoc, lastPt], {
          color: '#EF4444',
          weight: 3,
          dashArray: '6, 6',
          opacity: 0.9
        }).addTo(map);
      }

      window.updateUserLocation = function(lat, lng, dev) {
        var newLoc = [lat, lng];
        userMarker.setLatLng(newLoc);
        if (dev > 50 && lastPt) {
          if (devConnector) {
            devConnector.setLatLngs([newLoc, lastPt]);
          } else {
            devConnector = L.polyline([newLoc, lastPt], { color: '#EF4444', weight: 3, dashArray: '6, 6' }).addTo(map);
          }
        } else if (devConnector) {
          map.removeLayer(devConnector);
          devConnector = null;
        }
      };

      window.centerOnUser = function(lat, lng) {
        map.panTo([lat, lng], { animate: true, duration: 0.8 });
      };

      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage('MAP_LOADED');
      }
    } catch (e) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage('MAP_ERROR:' + e.message);
      }
    }
  </script>
</body>
</html>
  `;
}

export const MapViewComponent: React.FC<MapViewProps> = ({
  routePoints,
  userLocation,
  lastPointOnRoute,
  deviationMeters,
}) => {
  const webViewRef = useRef<WebView>(null);
  const fullscreenWebViewRef = useRef<WebView>(null);
  const [tileStyle, setTileStyle] = useState<TileStyle>('dark');
  const [webFallback] = useState(Platform.OS === 'web');
  const [useSvgMode, setUseSvgMode] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!mapLoaded) {
        setUseSvgMode(true);
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [mapLoaded]);

  useEffect(() => {
    const activeRef = isFullscreen ? fullscreenWebViewRef.current : webViewRef.current;
    if (activeRef && !webFallback && !useSvgMode && mapLoaded) {
      const script = `
        if (window.updateUserLocation) {
          window.updateUserLocation(${userLocation.latitude}, ${userLocation.longitude}, ${deviationMeters});
        }
        true;
      `;
      activeRef.injectJavaScript(script);
    }
  }, [userLocation.latitude, userLocation.longitude, deviationMeters, webFallback, useSvgMode, mapLoaded, isFullscreen]);

  const handleCenterUser = () => {
    const activeRef = isFullscreen ? fullscreenWebViewRef.current : webViewRef.current;
    if (activeRef && !webFallback && !useSvgMode && mapLoaded) {
      const script = `
        if (window.centerOnUser) {
          window.centerOnUser(${userLocation.latitude}, ${userLocation.longitude});
        }
        true;
      `;
      activeRef.injectJavaScript(script);
    }
  };

  const handleCycleStyle = () => {
    if (useSvgMode) {
      setUseSvgMode(false);
      setMapLoaded(false);
      return;
    }
    const styles: TileStyle[] = ['dark', 'topo', 'osm'];
    const nextIdx = (styles.indexOf(tileStyle) + 1) % styles.length;
    setTileStyle(styles[nextIdx]);
  };

  const htmlSource = useMemo(
    () => ({
      html: generateLeafletHtml(
        routePoints,
        userLocation,
        lastPointOnRoute,
        deviationMeters,
        tileStyle
      ),
    }),
    [routePoints, userLocation, lastPointOnRoute, deviationMeters, tileStyle]
  );

  return (
    <View style={styles.container}>
      {webFallback || useSvgMode ? (
        <FallbackSvgMap
          routePoints={routePoints}
          userLocation={userLocation}
          lastPointOnRoute={lastPointOnRoute}
          deviationMeters={deviationMeters}
        />
      ) : (
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={htmlSource}
          style={styles.webView}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          userAgent="Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
          mixedContentMode="always"
          allowFileAccess={true}
          allowUniversalAccessFromFileURLs={true}
          onMessage={(event) => {
            const data = event.nativeEvent.data;
            if (data === 'MAP_LOADED') {
              setMapLoaded(true);
            } else if (data.startsWith('MAP_ERROR')) {
              setUseSvgMode(true);
            }
          }}
          onError={() => setUseSvgMode(true)}
        />
      )}

      {/* Control overlay on map */}
      <View style={styles.topControlRow}>
        <TouchableOpacity style={styles.controlBtn} onPress={handleCycleStyle}>
          {useSvgMode ? <Globe size={13} color="#F8FAFC" /> : <Layers size={13} color="#F8FAFC" />}
          <Text style={styles.controlBtnText}>{useSvgMode ? 'Онлайн' : TILE_URLS[tileStyle].label}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlBtn} onPress={handleCenterUser}>
          <Navigation size={13} color="#F8FAFC" />
          <Text style={styles.controlBtnText}>Вы</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlBtn} onPress={() => setIsFullscreen(true)}>
          <Maximize2 size={13} color="#F8FAFC" />
          <Text style={styles.controlBtnText}>Экран</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.legendOverlay}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: ThemeColors.accentGreen }]} />
          <Text style={styles.legendText}>Маршрут</Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.legendText}>Старт</Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
          <Text style={styles.legendText}>Финиш</Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#3B82F6', borderRadius: 6 }]} />
          <Text style={styles.legendText}>Вы</Text>
        </View>
      </View>

      {/* FULLSCREEN MAP MODAL */}
      <Modal
        visible={isFullscreen}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setIsFullscreen(false)}
      >
        <SafeAreaView style={styles.fullscreenContainer}>
          {webFallback || useSvgMode ? (
            <FallbackSvgMap
              routePoints={routePoints}
              userLocation={userLocation}
              lastPointOnRoute={lastPointOnRoute}
              deviationMeters={deviationMeters}
            />
          ) : (
            <WebView
              ref={fullscreenWebViewRef}
              originWhitelist={['*']}
              source={htmlSource}
              style={styles.fullscreenWebView}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              userAgent="Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
              mixedContentMode="always"
            />
          )}

          {/* Fullscreen Overlay Controls */}
          <View style={styles.fullscreenTopBar}>
            <TouchableOpacity style={styles.fullscreenCloseBtn} onPress={() => setIsFullscreen(false)}>
              <X size={14} color="#FFFFFF" />
              <Text style={styles.fullscreenCloseBtnText}>Свернуть</Text>
            </TouchableOpacity>

            <View style={styles.fullscreenRightGroup}>
              <TouchableOpacity style={styles.controlBtn} onPress={handleCycleStyle}>
                <Layers size={13} color="#F8FAFC" />
                <Text style={styles.controlBtnText}>{useSvgMode ? 'Онлайн' : TILE_URLS[tileStyle].label}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.controlBtn} onPress={handleCenterUser}>
                <Navigation size={13} color="#F8FAFC" />
                <Text style={styles.controlBtnText}>Вы</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Fullscreen Info Badge */}
          <View style={styles.fullscreenBottomBadge}>
            <Text style={styles.fullscreenBadgeText}>
              {userLocation.latitude.toFixed(5)}, {userLocation.longitude.toFixed(5)}
              {deviationMeters > 30 ? `  •  Отклонение: ${deviationMeters} м` : ''}
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const FallbackSvgMap: React.FC<MapViewProps> = ({ routePoints, userLocation, lastPointOnRoute, deviationMeters }) => {
  const startPoint = routePoints[0] || userLocation;
  const endPoint = routePoints[routePoints.length - 1] || userLocation;

  let minLat = Math.min(...routePoints.map((p) => p.latitude), userLocation.latitude);
  let maxLat = Math.max(...routePoints.map((p) => p.latitude), userLocation.latitude);
  let minLon = Math.min(...routePoints.map((p) => p.longitude), userLocation.longitude);
  let maxLon = Math.max(...routePoints.map((p) => p.longitude), userLocation.longitude);

  const latPad = Math.max(0.005, (maxLat - minLat) * 0.25);
  const lonPad = Math.max(0.005, (maxLon - minLon) * 0.25);
  minLat -= latPad;
  maxLat += latPad;
  minLon -= lonPad;
  maxLon += lonPad;

  const mapWidth = 340;
  const mapHeight = 220;

  const toSvgX = (lon: number) => Math.round(((lon - minLon) / (maxLon - minLon || 1)) * (mapWidth - 50) + 25);
  const toSvgY = (lat: number) => Math.round((1 - (lat - minLat) / (maxLat - minLat || 1)) * (mapHeight - 50) + 25);

  const routePathSvg = routePoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${toSvgX(p.longitude)} ${toSvgY(p.latitude)}`).join(' ');
  const userX = toSvgX(userLocation.longitude);
  const userY = toSvgY(userLocation.latitude);
  const lastRouteX = lastPointOnRoute ? toSvgX(lastPointOnRoute.longitude) : userX;
  const lastRouteY = lastPointOnRoute ? toSvgY(lastPointOnRoute.latitude) : userY;

  return (
    <View style={{ flex: 1, width: '100%', height: '100%' }}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${mapWidth} ${mapHeight}`} style={{ backgroundColor: '#0B120E' }}>
        <Rect width="100%" height="100%" fill="#0B120E" />

        <Circle cx={mapWidth / 2} cy={mapHeight / 2} r="80" fill="none" stroke="#16241E" strokeWidth="1" strokeDasharray="3,3" />
        <Circle cx={mapWidth / 2} cy={mapHeight / 2} r="140" fill="none" stroke="#16241E" strokeWidth="1" strokeDasharray="3,3" />

        <Line x1="0" y1="50" x2={mapWidth} y2="50" stroke="#16241E" strokeWidth="1" />
        <Line x1="0" y1="110" x2={mapWidth} y2="110" stroke="#16241E" strokeWidth="1" />
        <Line x1="0" y1="170" x2={mapWidth} y2="170" stroke="#16241E" strokeWidth="1" />
        <Line x1="110" y1="0" x2="110" y2={mapHeight} stroke="#16241E" strokeWidth="1" />
        <Line x1="230" y1="0" x2="230" y2={mapHeight} stroke="#16241E" strokeWidth="1" />

        <Path d={routePathSvg} fill="none" stroke="#0B120E" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        <Path d={routePathSvg} fill="none" stroke="#10B981" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />

        {deviationMeters > 50 && (
          <G>
            <Line x1={userX} y1={userY} x2={lastRouteX} y2={lastRouteY} stroke="#EF4444" strokeWidth="2.5" strokeDasharray="5,5" />
            <Circle cx={lastRouteX} cy={lastRouteY} r="5" fill="#3B82F6" />
          </G>
        )}

        <G>
          <Circle cx={toSvgX(startPoint.longitude)} cy={toSvgY(startPoint.latitude)} r="8" fill="#10B981" />
          <SvgText x={toSvgX(startPoint.longitude)} y={toSvgY(startPoint.latitude) + 4} fill="#FFFFFF" fontSize="10" fontWeight="bold" textAnchor="middle">
            A
          </SvgText>
        </G>

        <G>
          <Circle cx={toSvgX(endPoint.longitude)} cy={toSvgY(endPoint.latitude)} r="8" fill="#F59E0B" />
          <SvgText x={toSvgX(endPoint.longitude)} y={toSvgY(endPoint.latitude) + 4} fill="#0B120E" fontSize="10" fontWeight="bold" textAnchor="middle">
            B
          </SvgText>
        </G>

        <Circle cx={userX} cy={userY} r="14" fill="rgba(16, 185, 129, 0.25)" />
        <Circle cx={userX} cy={userY} r="7" fill="#10B981" stroke="#0B120E" strokeWidth="2" />
      </Svg>

      <View style={styles.legendOverlay}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.legendText}>Маршрут</Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.legendText}>Старт</Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
          <Text style={styles.legendText}>Финиш</Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10B981', borderRadius: 6 }]} />
          <Text style={styles.legendText}>Вы</Text>
        </View>
      </View>
    </View>
  );
};

export const MapView = MapViewComponent;
export default MapViewComponent;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 260,
    backgroundColor: '#0B120E',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ThemeColors.cardBorder,
    marginBottom: 16,
  },
  webView: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#0B120E',
  },
  topControlRow: {
    position: 'absolute',
    top: 10,
    right: 10,
    left: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 6,
    zIndex: 10,
  },
  controlBtn: {
    backgroundColor: 'rgba(11, 18, 14, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(35, 56, 47, 0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  controlBtnText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '700',
  },
  legendOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(11, 18, 14, 0.9)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(35, 56, 47, 0.8)',
    zIndex: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  legendText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },

  // Fullscreen Modal Styles
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#0B120E',
  },
  fullscreenWebView: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#0B120E',
  },
  fullscreenTopBar: {
    position: 'absolute',
    top: 45,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    zIndex: 20,
  },
  fullscreenRightGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  fullscreenCloseBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  fullscreenCloseBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  fullscreenBottomBadge: {
    position: 'absolute',
    bottom: 30,
    left: 14,
    right: 14,
    backgroundColor: 'rgba(11, 18, 14, 0.94)',
    borderColor: 'rgba(35, 56, 47, 0.8)',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    zIndex: 20,
  },
  fullscreenBadgeText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
  },
});
