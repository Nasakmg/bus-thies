import { supabase, configManquante } from './supabase'

export const COULEURS = {
  1: '#e6194b', 2: '#2e9e44', 3: '#f58231', 4: '#4363d8', 5: '#911eb4',
  6: '#0f8b8d', 7: '#9a6324', 8: '#d4a800', 9: '#e0359e', 10: '#475569',
}
export const couleurLigne = (code) => COULEURS[code] ?? '#64748b'

export async function chargerReseau() {
  if (configManquante) {
    throw new Error('Configuration Supabase manquante (variables VITE_…)')
  }
  const { data, error } = await supabase.rpc('reseau_complet')
  if (error) throw new Error(error.message)
  return data
}

// Regroupe les variantes d'une même ligne (ex. ligne 7 = 2 tracés)
export function groupesLignes(reseau) {
  const groupes = new Map()
  for (const l of reseau.lignes) {
    const g = groupes.get(l.code) ?? { code: l.code, noms: [], a_arrets: false }
    if (!g.noms.includes(l.nom)) g.noms.push(l.nom)
    g.a_arrets = g.a_arrets || l.a_arrets
    groupes.set(l.code, g)
  }
  return [...groupes.values()].sort((a, b) => Number(a.code) - Number(b.code))
}

// Transforme les données de la base en GeoJSON pour la carte
export function construireDonnees(reseau) {
  const codeParLigne = new Map(reseau.lignes.map((l) => [l.id, l.code]))
  const codesParArret = new Map()
  for (const la of reseau.ligne_arrets) {
    const code = codeParLigne.get(la.ligne_id)
    if (!codesParArret.has(la.arret_id)) codesParArret.set(la.arret_id, new Set())
    codesParArret.get(la.arret_id).add(code)
  }

  const lignes = {
    type: 'FeatureCollection',
    features: reseau.lignes.map((l) => ({
      type: 'Feature',
      geometry: l.geojson,
      properties: { code: l.code, nom: l.nom, a_arrets: l.a_arrets, couleur: couleurLigne(l.code) },
    })),
  }

  const quartiers = {
    type: 'FeatureCollection',
    features: reseau.quartiers.map((q) => ({
      type: 'Feature',
      geometry: q.geojson,
      properties: { id: q.id, nom: q.nom, commune: q.commune },
    })),
  }

  const arrets = {
    type: 'FeatureCollection',
    features: reseau.arrets.map((a) => {
      const codes = [...(codesParArret.get(a.id) ?? [])].sort((x, y) => Number(x) - Number(y))
      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [a.lng, a.lat] },
        properties: {
          id: a.id,
          code: a.code,
          nom: a.nom,
          verifie: a.verifie,
          remarque: a.remarque,
          rattache: codes.length > 0,
          codes,
          lignes_txt: codes.join(', '),
        },
      }
    }),
  }

  // Cadrage initial : les arrêts réellement desservis par une ligne
  const pts = arrets.features.filter((f) => f.properties.rattache).map((f) => f.geometry.coordinates)
  const bounds = [
    [Math.min(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1]))],
    [Math.max(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1]))],
  ]

  return { lignes, quartiers, arrets, bounds }
}