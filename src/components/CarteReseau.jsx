import { useEffect, useMemo, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import { construireDonnees } from '../lib/reseau'

const STYLE = 'https://tiles.openfreemap.org/styles/liberty'

maplibregl.setWorkerUrl(workerUrl)

function contenuPopup(titre, lignes) {
  const div = document.createElement('div')
  div.style.fontFamily = 'system-ui, sans-serif'
  div.style.fontSize = '13px'
  const t = document.createElement('strong')
  t.textContent = titre
  div.appendChild(t)
  for (const l of lignes.filter(Boolean)) {
    const p = document.createElement('div')
    p.style.marginTop = '4px'
    p.textContent = l
    div.appendChild(p)
  }
  return div
}

export default function CarteReseau({ reseau, visibles }) {
  const conteneur = useRef(null)
  const carte = useRef(null)
  const [pret, setPret] = useState(false)
  const donnees = useMemo(() => construireDonnees(reseau), [reseau])

  // Création de la carte (une seule fois)
  useEffect(() => {
    const map = new maplibregl.Map({
      container: conteneur.current,
      style: STYLE,
      bounds: donnees.bounds,
      fitBoundsOptions: { padding: 40 },
      attributionControl: { compact: true },
    })
    carte.current = map
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')

    map.on('style.load', () => {
      map.addSource('quartiers', { type: 'geojson', data: donnees.quartiers })
      map.addSource('lignes', { type: 'geojson', data: donnees.lignes })
      map.addSource('arrets', { type: 'geojson', data: donnees.arrets })

      map.addLayer({
        id: 'quartiers-fill', type: 'fill', source: 'quartiers',
        paint: { 'fill-color': '#0ea5e9', 'fill-opacity': 0.06 },
      })
      map.addLayer({
        id: 'quartiers-bord', type: 'line', source: 'quartiers',
        paint: { 'line-color': '#64748b', 'line-width': 1, 'line-opacity': 0.6 },
      })
      map.addLayer({
        id: 'lignes-pleines', type: 'line', source: 'lignes',
        filter: ['==', ['get', 'a_arrets'], true],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': ['get', 'couleur'], 'line-width': 3.5, 'line-opacity': 0.9 },
      })
      map.addLayer({
        id: 'lignes-pointilles', type: 'line', source: 'lignes',
        filter: ['==', ['get', 'a_arrets'], false],
        paint: {
          'line-color': ['get', 'couleur'], 'line-width': 3,
          'line-dasharray': [2, 2], 'line-opacity': 0.8,
        },
      })
      map.addLayer({
        id: 'arrets', type: 'circle', source: 'arrets',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, 3, 15, 7, 18, 10],
          'circle-color': ['case', ['get', 'rattache'], '#ffffff', '#cbd5e1'],
          'circle-stroke-width': 2,
          'circle-stroke-color': ['case', ['get', 'verifie'], '#1e293b', '#f97316'],
        },
      })

      map.on('mouseenter', 'arrets', () => (map.getCanvas().style.cursor = 'pointer'))
      map.on('mouseleave', 'arrets', () => (map.getCanvas().style.cursor = ''))

      map.on('click', (e) => {
        const a = map.queryRenderedFeatures(e.point, { layers: ['arrets'] })[0]
        if (a) {
          const p = a.properties
          new maplibregl.Popup({ offset: 10 })
            .setLngLat(a.geometry.coordinates)
            .setDOMContent(contenuPopup(
              p.nom ? p.nom : 'Arrêt ' + p.code,
              [
                p.rattache ? 'Lignes : ' + p.lignes_txt : 'Non rattaché à une ligne',
                p.verifie === false || p.verifie === 'false' ? 'Position à vérifier' : null,
                p.remarque && p.remarque !== 'null' ? p.remarque : null,
              ]
            ))
            .addTo(map)
          return
        }
        const q = map.queryRenderedFeatures(e.point, { layers: ['quartiers-fill'] })[0]
        if (q) {
          new maplibregl.Popup()
            .setLngLat(e.lngLat)
            .setDOMContent(contenuPopup(q.properties.nom, [q.properties.commune]))
            .addTo(map)
        }
      })

      setPret(true)
    })

    return () => map.remove()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Filtre des lignes visibles
  useEffect(() => {
    if (!pret) return
    const map = carte.current
    map.getSource('lignes').setData({
      type: 'FeatureCollection',
      features: donnees.lignes.features.filter((f) => visibles.has(f.properties.code)),
    })
    map.getSource('arrets').setData({
      type: 'FeatureCollection',
      features: donnees.arrets.features.filter(
        (f) => !f.properties.rattache || f.properties.codes.some((c) => visibles.has(c))
      ),
    })
  }, [pret, visibles, donnees])

  return <div ref={conteneur} className="h-full w-full" />
}