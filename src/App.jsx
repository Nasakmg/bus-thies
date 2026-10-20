import { useEffect, useMemo, useRef, useState } from 'react'
import CarteReseau from './components/CarteReseau'
import { supabase } from './lib/supabase'
import { chargerReseau, construireDonnees, groupesLignes, couleurLigne } from './lib/reseau'
import { arretsProches, distanceM, boundsGeometrie, normaliser } from './lib/geo'

function Pastille({ code }) {
  return (
    <span
      className="inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-bold text-white"
      style={{ background: couleurLigne(code) }}
    >
      {code}
    </span>
  )
}

function ArretLigne({ a, detail, quartierParId, onClick }) {
  return (
    <li>
      <button className="flex w-full items-center gap-3 py-3 text-left" onClick={onClick}>
        <span className="w-16 shrink-0 text-sm font-semibold text-slate-800">{detail}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm text-slate-800">{a.nom || 'Arrêt ' + a.code}</span>
          <span className="block text-xs text-slate-500">
            {quartierParId.get(a.quartier_id) ?? ''}
            {a.verifie === false && <em className="text-orange-600"> · position à vérifier</em>}
          </span>
        </span>
        <span className="flex flex-wrap justify-end gap-1">
          {a.codes.map((c) => <Pastille key={c} code={c} />)}
        </span>
      </button>
    </li>
  )
}

const formatM = (m) => (m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`)

export default function App() {
  const [reseau, setReseau] = useState(null)
  const [erreur, setErreur] = useState(null)
  const [visibles, setVisibles] = useState(new Set())
  const [panneau, setPanneau] = useState(null) // null | 'lignes' | 'depart' | 'destination'
  const [depart, setDepart] = useState(null)
  const [choisir, setChoisir] = useState(false)
  const [cible, setCible] = useState(null)
  const [message, setMessage] = useState(null)
  const [recherche, setRecherche] = useState(false)

  const [destination, setDestination] = useState(null) // quartier choisi
  const [requete, setRequete] = useState('')
  const [destArrets, setDestArrets] = useState(null) // résultat de arrets_du_quartier
  const [destChargement, setDestChargement] = useState(false)
  const [destErreur, setDestErreur] = useState(null)
  const numeroRequete = useRef(0)

  useEffect(() => {
    chargerReseau()
      .then((r) => {
        setReseau(r)
        setVisibles(new Set(r.lignes.map((l) => l.code)))
      })
      .catch((e) => setErreur(e.message))
  }, [])

  const donnees = useMemo(() => (reseau ? construireDonnees(reseau) : null), [reseau])
  const groupes = useMemo(() => (reseau ? groupesLignes(reseau) : []), [reseau])
  const quartierParId = useMemo(
    () => new Map((reseau?.quartiers ?? []).map((q) => [q.id, q.nom])),
    [reseau]
  )
  const proprietesArret = useMemo(
    () => new Map((donnees?.arrets.features ?? []).map((f) => [f.properties.id, f.properties])),
    [donnees]
  )

  const resultat = useMemo(
    () => (depart && donnees ? arretsProches(donnees.arrets, depart.lat, depart.lng) : null),
    [depart, donnees]
  )

  const horsThies = useMemo(() => {
    if (!depart || !donnees) return false
    const [[x1, y1], [x2, y2]] = donnees.bounds
    return distanceM(depart.lat, depart.lng, (y1 + y2) / 2, (x1 + x2) / 2) > 12000
  }, [depart, donnees])

  // Quartiers filtrés par la recherche (sans accents, mots dans n'importe quel ordre)
  const quartiersFiltres = useMemo(() => {
    const mots = normaliser(requete).split(/\s+/).filter(Boolean)
    return [...(reseau?.quartiers ?? [])]
      .filter((q) => {
        const t = normaliser(q.nom + ' ' + (q.commune ?? ''))
        return mots.every((m) => t.includes(m))
      })
      .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
  }, [reseau, requete])

  // Lignes qui traversent le quartier de destination
  const lignesDuQuartier = useMemo(() => {
    if (!destination || !reseau) return []
    const idsLignes = new Set(
      reseau.quartier_lignes.filter((x) => x.quartier_id === destination.id).map((x) => x.ligne_id)
    )
    const codes = new Set(reseau.lignes.filter((l) => idsLignes.has(l.id)).map((l) => l.code))
    return groupes.filter((g) => codes.has(g.code))
  }, [destination, reseau, groupes])

  const destQuartierFeature = useMemo(
    () => (destination && donnees ? donnees.quartiers.features.find((f) => f.properties.id === destination.id) : null),
    [destination, donnees]
  )

  // Arrêts de la destination, enrichis avec leurs lignes
  const destListe = useMemo(() => {
    if (!destArrets) return null
    const enrichis = destArrets
      .map((r) => ({ ...(proprietesArret.get(r.id) ?? {}), ...r }))
      .filter((a) => a.codes)
    return {
      dans: enrichis
        .filter((a) => a.dans_quartier)
        .sort((a, b) => a.distance_centre_m - b.distance_centre_m),
      pres: enrichis
        .filter((a) => !a.dans_quartier)
        .sort((a, b) => a.distance_bord_m - b.distance_bord_m),
    }
  }, [destArrets, proprietesArret])

  const placerDepart = (lat, lng, source, precision) => {
    setDepart({ lat, lng, source, precision })
    setChoisir(false)
    setMessage(null)
    setPanneau('depart')
    setCible({ lat, lng, zoom: 15 })
  }

  const utiliserGps = () => {
    if (!navigator.geolocation) {
      setMessage('La géolocalisation n’est pas disponible sur cet appareil. Utilisez « Départ » pour choisir sur la carte.')
      return
    }
    setRecherche(true)
    setMessage(null)
    setChoisir(false)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setRecherche(false)
        placerDepart(pos.coords.latitude, pos.coords.longitude, 'gps', Math.round(pos.coords.accuracy))
      },
      (err) => {
        setRecherche(false)
        setMessage(
          err.code === 1
            ? 'Accès à la position refusé. Vous pouvez choisir votre départ en touchant la carte.'
            : 'Position introuvable. Vous pouvez choisir votre départ en touchant la carte.'
        )
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    )
  }

  const choisirDestination = async (q) => {
    const numero = ++numeroRequete.current
    setDestination(q)
    setDestArrets(null)
    setDestErreur(null)
    setDestChargement(true)
    setCible({ bounds: boundsGeometrie(q.geojson) })
    const { data, error } = await supabase.rpc('arrets_du_quartier', { p_quartier: q.id, p_marge: 400 })
    if (numero !== numeroRequete.current) return // une autre sélection a eu lieu entre-temps
    setDestChargement(false)
    if (error) setDestErreur(error.message)
    else setDestArrets(data)
  }

  const effacerDestination = () => {
    numeroRequete.current++
    setDestination(null)
    setDestArrets(null)
    setDestErreur(null)
    setDestChargement(false)
    setRequete('')
  }

  const basculer = (code) =>
    setVisibles((prev) => {
      const suivant = new Set(prev)
      if (suivant.has(code)) suivant.delete(code)
      else suivant.add(code)
      return suivant
    })

  if (erreur) {
    return (
      <main className="grid place-items-center p-6 text-center" style={{ height: '100dvh' }}>
        <p className="text-red-600">Erreur : {erreur}</p>
      </main>
    )
  }
  if (!reseau || !donnees) {
    return (
      <main className="grid place-items-center text-slate-500" style={{ height: '100dvh' }}>
        Chargement du réseau…
      </main>
    )
  }

  const bouton = 'min-w-0 flex-1 whitespace-nowrap rounded-full px-2 py-3 text-xs font-semibold shadow-lg active:scale-95 sm:flex-none sm:px-4 sm:text-sm '
  const panneauClasse =
    'absolute bottom-24 left-3 right-3 z-10 overflow-auto rounded-2xl bg-white p-4 shadow-2xl md:bottom-auto md:right-auto md:top-16 md:w-96 md:max-h-[calc(100dvh-9rem)] '

  return (
    <div className="relative w-full overflow-hidden bg-slate-100" style={{ height: '100dvh' }}>
      <CarteReseau
        donnees={donnees}
        visibles={visibles}
        depart={depart}
        proches={resultat?.arrets}
        choisirDepart={choisir}
        onChoisirPoint={(lat, lng) => placerDepart(lat, lng, 'carte')}
        cible={cible}
        destQuartier={destQuartierFeature}
        destArrets={destListe ? [...destListe.dans, ...destListe.pres] : null}
      />

      <header className="absolute top-3 left-3 z-10 rounded-full bg-white/95 px-4 py-2 shadow-lg backdrop-blur">
        <h1 className="text-sm font-bold text-slate-800">🚌 Bus Tata Thiès</h1>
      </header>

      {choisir && (
        <div className="absolute top-16 left-3 right-3 z-10 flex items-center justify-between gap-3 rounded-2xl bg-sky-600 px-4 py-3 text-sm text-white shadow-xl md:left-1/2 md:right-auto md:w-96 md:-translate-x-1/2">
          <span>Touchez la carte pour placer votre départ</span>
          <button className="rounded-full bg-white/20 px-3 py-1 font-semibold" onClick={() => setChoisir(false)}>
            Annuler
          </button>
        </div>
      )}

      {message && !choisir && (
        <div className="absolute top-16 left-3 right-3 z-10 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-xl md:right-auto md:w-96">
          {message}
          <button className="ml-2 font-semibold underline" onClick={() => setMessage(null)}>OK</button>
        </div>
      )}

      <div className="absolute bottom-6 left-3 right-3 z-10 flex gap-2 md:right-auto">
        <button
          onClick={utiliserGps}
          disabled={recherche}
          className={bouton + 'bg-sky-600 text-white disabled:opacity-60'}
        >
          {recherche ? 'Recherche…' : '📍 Position'}
        </button>
        <button
          onClick={() => { setChoisir((c) => !c); setPanneau(null); setMessage(null) }}
          className={bouton + 'bg-white text-slate-800'}
        >
          👆 Départ
        </button>
        <button
          onClick={() => { setChoisir(false); setPanneau((p) => (p === 'destination' ? null : 'destination')) }}
          className={bouton + 'bg-orange-500 text-white'}
        >
          🎯 Destination
        </button>
        <button
          onClick={() => { setChoisir(false); setPanneau((p) => (p === 'lignes' ? null : 'lignes')) }}
          className={bouton + 'bg-slate-900 text-white'}
        >
          Lignes
        </button>
      </div>

      {/* ---------- Panneau DESTINATION ---------- */}
      {panneau === 'destination' && (
        <aside className={panneauClasse + 'max-h-[60dvh]'}>
          <div className="mb-2 flex items-start justify-between gap-3">
            <h2 className="font-semibold text-slate-800">
              {destination ? 'Destination' : 'Où allez-vous ?'}
            </h2>
            <button className="text-slate-400" aria-label="Fermer" onClick={() => setPanneau(null)}>✕</button>
          </div>

          {!destination && (
            <>
              <input
                type="search"
                value={requete}
                onChange={(e) => setRequete(e.target.value)}
                placeholder="Rechercher un quartier…"
                className="mb-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-500"
              />
              <ul className="divide-y divide-slate-100">
                {quartiersFiltres.map((q) => (
                  <li key={q.id}>
                    <button
                      className="flex w-full items-center justify-between gap-2 py-2.5 text-left"
                      onClick={() => choisirDestination(q)}
                    >
                      <span className="text-sm text-slate-800">{q.nom}</span>
                      <span className="shrink-0 text-xs text-slate-400">{q.commune}</span>
                    </button>
                  </li>
                ))}
                {quartiersFiltres.length === 0 && (
                  <li className="py-3 text-sm text-slate-500">Aucun quartier ne correspond à « {requete} ».</li>
                )}
              </ul>
            </>
          )}

          {destination && (
            <>
              <div className="mb-3 rounded-xl bg-orange-50 p-3">
                <p className="font-semibold text-slate-900">{destination.nom}</p>
                <p className="text-xs text-slate-600">
                  {destination.commune}
                  {destination.arrondissement ? ` · ${destination.arrondissement}` : ''}
                </p>
                <button className="mt-1 text-xs font-semibold text-orange-700 underline" onClick={effacerDestination}>
                  Changer de destination
                </button>
              </div>

              {destChargement && <p className="text-sm text-slate-500">Recherche des arrêts…</p>}
              {destErreur && <p className="text-sm text-red-600">Erreur : {destErreur}</p>}

              {destListe && (
                <>
                  {destListe.dans.length > 0 && (
                    <>
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Arrêts dans le quartier
                      </h3>
                      <ul className="divide-y divide-slate-100">
                        {destListe.dans.map((a) => (
                          <ArretLigne
                            key={a.id}
                            a={a}
                            quartierParId={quartierParId}
                            detail={'à ' + formatM(a.distance_centre_m)}
                            onClick={() => setCible({ lat: a.lat, lng: a.lng, zoom: 17 })}
                          />
                        ))}
                      </ul>
                    </>
                  )}
                  {destListe.pres.length > 0 && (
                    <>
                      <h3 className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        À proximité (moins de 400 m du quartier)
                      </h3>
                      <ul className="divide-y divide-slate-100">
                        {destListe.pres.map((a) => (
                          <ArretLigne
                            key={a.id}
                            a={a}
                            quartierParId={quartierParId}
                            detail={formatM(a.distance_bord_m)}
                            onClick={() => setCible({ lat: a.lat, lng: a.lng, zoom: 17 })}
                          />
                        ))}
                      </ul>
                    </>
                  )}
                  {destListe.dans.length === 0 && destListe.pres.length === 0 && (
                    <p className="rounded-lg bg-amber-50 p-2 text-sm text-amber-900">
                      Aucun arrêt connu dans ce quartier ni à moins de 400 m.
                    </p>
                  )}
                </>
              )}

              <h3 className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Lignes qui traversent le quartier
              </h3>
              {lignesDuQuartier.length === 0 ? (
                <p className="text-sm text-slate-500">Aucune ligne du réseau ne traverse ce quartier.</p>
              ) : (
                <ul className="mt-1 space-y-1">
                  {lignesDuQuartier.map((g) => (
                    <li key={g.code} className="flex items-center gap-2 text-sm text-slate-800">
                      <Pastille code={g.code} />
                      <span>{g.noms.join(' / ')}</span>
                      {!g.a_arrets && <em className="text-xs text-amber-700">tracé seulement, arrêts non relevés</em>}
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-xs text-slate-400">
                Distance des arrêts : en ligne droite, à vol d’oiseau.
              </p>
            </>
          )}
        </aside>
      )}

      {/* ---------- Panneau DÉPART ---------- */}
      {panneau === 'depart' && depart && resultat && (
        <aside className={panneauClasse + 'max-h-[55dvh]'}>
          <div className="mb-1 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold text-slate-800">Arrêts proches de votre départ</h2>
              <p className="text-xs text-slate-500">
                {depart.source === 'gps'
                  ? `Position GPS (précision ± ${depart.precision} m)`
                  : 'Point choisi sur la carte'}
              </p>
            </div>
            <button className="text-slate-400" aria-label="Fermer" onClick={() => setPanneau(null)}>✕</button>
          </div>

          {horsThies && (
            <p className="mb-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-900">
              Ce point semble éloigné du réseau de Thiès.
            </p>
          )}
          {resultat.horsRayon && (
            <p className="mb-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-900">
              Aucun arrêt à moins de 1 km. Voici les plus proches.
            </p>
          )}

          <ul className="divide-y divide-slate-100">
            {resultat.arrets.map((a) => (
              <ArretLigne
                key={a.id}
                a={a}
                quartierParId={quartierParId}
                detail={formatM(a.distance)}
                onClick={() => setCible({ lat: a.lat, lng: a.lng, zoom: 17 })}
              />
            ))}
          </ul>
          <p className="mt-2 text-xs text-slate-400">Distances en ligne droite, pas le chemin à pied réel.</p>
          <button
            className="mt-3 text-xs text-slate-500 underline"
            onClick={() => { setDepart(null); setPanneau(null) }}
          >
            Effacer le départ
          </button>
        </aside>
      )}

      {/* ---------- Panneau LIGNES ---------- */}
      {panneau === 'lignes' && (
        <aside className={panneauClasse + 'max-h-[60dvh] md:w-80'}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Lignes du réseau</h2>
            <div className="flex gap-3 text-xs">
              <button className="text-sky-700 underline" onClick={() => setVisibles(new Set(groupes.map((g) => g.code)))}>
                Toutes
              </button>
              <button className="text-sky-700 underline" onClick={() => setVisibles(new Set())}>
                Aucune
              </button>
            </div>
          </div>
          <ul className="space-y-1">
            {groupes.map((g) => (
              <li key={g.code}>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={visibles.has(g.code)}
                    onChange={() => basculer(g.code)}
                  />
                  <span
                    className="inline-block h-1.5 w-8 rounded"
                    style={{
                      background: g.a_arrets
                        ? couleurLigne(g.code)
                        : `repeating-linear-gradient(90deg, ${couleurLigne(g.code)} 0 6px, transparent 6px 10px)`,
                    }}
                  />
                  <span className="text-sm text-slate-800">
                    <strong>Ligne {g.code}</strong>
                    <span className="text-slate-500"> · {g.noms.join(' / ')}</span>
                    {!g.a_arrets && (
                      <em className="block text-xs text-amber-700">Tracé seulement, arrêts non relevés</em>
                    )}
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <p className="mt-3 border-t pt-3 text-xs text-slate-500">
            Contour noir : arrêt vérifié · contour orange : position à vérifier · gris : arrêt non rattaché
          </p>
        </aside>
      )}
    </div>
  )
}