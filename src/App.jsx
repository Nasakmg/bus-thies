import { useEffect, useMemo, useState } from 'react'
import CarteReseau from './components/CarteReseau'
import { chargerReseau, construireDonnees, groupesLignes, couleurLigne } from './lib/reseau'
import { arretsProches, distanceM } from './lib/geo'

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

export default function App() {
  const [reseau, setReseau] = useState(null)
  const [erreur, setErreur] = useState(null)
  const [visibles, setVisibles] = useState(new Set())
  const [panneau, setPanneau] = useState(null) // null | 'lignes' | 'depart'
  const [depart, setDepart] = useState(null)
  const [choisir, setChoisir] = useState(false)
  const [cible, setCible] = useState(null)
  const [message, setMessage] = useState(null)
  const [recherche, setRecherche] = useState(false)

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

  const resultat = useMemo(
    () => (depart && donnees ? arretsProches(donnees.arrets, depart.lat, depart.lng) : null),
    [depart, donnees]
  )

  const horsThies = useMemo(() => {
    if (!depart || !donnees) return false
    const [[x1, y1], [x2, y2]] = donnees.bounds
    return distanceM(depart.lat, depart.lng, (y1 + y2) / 2, (x1 + x2) / 2) > 12000
  }, [depart, donnees])

  const placerDepart = (lat, lng, source, precision) => {
    setDepart({ lat, lng, source, precision })
    setChoisir(false)
    setMessage(null)
    setPanneau('depart')
    setCible({ lat, lng, zoom: 15 })
  }

  const utiliserGps = () => {
    if (!navigator.geolocation) {
      setMessage('La géolocalisation n’est pas disponible sur cet appareil. Touchez « Placer le départ » pour choisir sur la carte.')
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

  const bouton = 'rounded-full px-4 py-3 text-sm font-semibold shadow-lg active:scale-95 '

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
          className={bouton + 'flex-1 bg-sky-600 text-white md:flex-none disabled:opacity-60'}
        >
          {recherche ? 'Recherche…' : '📍 Ma position'}
        </button>
        <button
          onClick={() => { setChoisir((c) => !c); setPanneau(null); setMessage(null) }}
          className={bouton + 'flex-1 bg-white text-slate-800 md:flex-none'}
        >
          👆 Placer le départ
        </button>
        <button
          onClick={() => setPanneau((p) => (p === 'lignes' ? null : 'lignes'))}
          className={bouton + 'bg-slate-900 text-white'}
        >
          Lignes
        </button>
      </div>

      {panneau === 'depart' && depart && resultat && (
        <aside className="absolute bottom-24 left-3 right-3 z-10 max-h-[55dvh] overflow-auto rounded-2xl bg-white p-4 shadow-2xl md:bottom-auto md:right-auto md:top-16 md:w-96 md:max-h-[calc(100dvh-9rem)]">
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
              <li key={a.id}>
                <button
                  className="flex w-full items-center gap-3 py-3 text-left"
                  onClick={() => setCible({ lat: a.lat, lng: a.lng, zoom: 17 })}
                >
                  <span className="w-16 shrink-0 text-sm font-semibold text-slate-800">
                    {a.distance < 1000 ? `${a.distance} m` : `${(a.distance / 1000).toFixed(1)} km`}
                  </span>
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

      {panneau === 'lignes' && (
        <aside className="absolute bottom-24 left-3 right-3 z-10 max-h-[60dvh] overflow-auto rounded-2xl bg-white p-4 shadow-2xl md:bottom-auto md:right-auto md:top-16 md:w-80 md:max-h-[calc(100dvh-9rem)]">
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