// Distance en mètres entre deux points GPS (formule de haversine)
export function distanceM(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const rad = Math.PI / 180
  const dLat = (lat2 - lat1) * rad
  const dLng = (lng2 - lng1) * rad
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

// Arrêts desservis par au moins une ligne, du plus proche au plus éloigné.
// Distance en ligne droite (à vol d'oiseau), pas le chemin piéton réel.
export function arretsProches(arretsFC, lat, lng, { rayon = 1000, max = 6 } = {}) {
  const liste = arretsFC.features
    .filter((f) => f.properties.rattache)
    .map((f) => {
      const [aLng, aLat] = f.geometry.coordinates
      return {
        ...f.properties,
        lat: aLat,
        lng: aLng,
        distance: Math.round(distanceM(lat, lng, aLat, aLng)),
      }
    })
    .sort((a, b) => a.distance - b.distance)

  const dansRayon = liste.filter((a) => a.distance <= rayon).slice(0, max)
  return dansRayon.length
    ? { arrets: dansRayon, horsRayon: false }
    : { arrets: liste.slice(0, 3), horsRayon: true }
}