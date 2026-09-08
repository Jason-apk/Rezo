// src/config/mapCustomStyle.ts

// Réglages natifs Apple Maps (react-native-maps, provider par défaut sur iOS)
// customMapStyle en JSON n'existe que sur Google Maps — non applicable ici.
export const mapCustomStyle = {
  mapType: "standard" as const,
  showsPointsOfInterest: false, // retire restaurants, commerces, etc.
  showsBuildings: false,
  showsTraffic: true,
  showsCompass: false,
  showsScale: false,
  userInterfaceStyle: "light" as const,
};

// Caméra 3D — niveau x1 : vue d'ensemble de la ligne
export const CAMERA_LINE_VIEW = {
  pitch: 55,
  heading: 0,
  altitude: 1500,
};

// Caméra 3D — niveau x2 : focus sur le bus suivi
export const CAMERA_BUS_VIEW = {
  pitch: 60,
  heading: 0,
  altitude: 600,
};
