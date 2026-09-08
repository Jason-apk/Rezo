// Fonction qui calcule le zoom à partir du longitudeDelta
const getZoomLevel = (lngDelta: number) => {
  return Math.round(Math.log2((360 * (width / 256)) / lngDelta));
};

// Fonction appelée à chaque changement de région stabilisé
const handleRegionChangeComplete = async (region: Region) => {
  console.log("--- DONNÉES DE LA CARTE ---");
  console.log("Région actuelle :", region);

  // Étape 1 : Calcul du niveau de zoom
  const zoom = getZoomLevel(region.longitudeDelta);
  console.log(`Niveau de Zoom (estimé) : ${zoom}`);

  // Étape 2 : Récupération de l'orientation (Heading / Bearing) via la Caméra
  if (mapRef.current) {
    try {
      const camera: Camera = await mapRef.current.getCamera();
      console.log(`Orientation (Heading) : ${camera.heading}°`);
      console.log(`Inclinaison (Pitch) : ${camera.pitch}°`);
    } catch (error) {
      console.warn("Impossible de récupérer les données de la caméra", error);
    }
  }
  console.log("---------------------------");
};
