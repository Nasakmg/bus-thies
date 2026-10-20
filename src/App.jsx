import { useEffect, useMemo, useState } from 'react'
import CarteReseau from './components/CarteReseau'
import { chargerReseau, groupesLignes, couleurLigne } from './lib/reseau'

export default function App() {
  const [reseau, setReseau] = useState(null)
  const [erreur, setErreur] = useState(null)
  const [visibles, setVisibles] = useState(new Set())
  const [panneau, setPanneau] = useState(false)

  useEffect(() => {
    chargerReseau()
      .then((r) => {
        setReseau(r)
        setVisibles(new Set(r.lignes.map((l) => l.code)))
      })
      .catch((e) => setErreur(e.message))
  }, [])

  const groupes = useMemo(() => (reseau ? groupesLignes(reseau) : []), [reseau])

  const basculer = (code) =>
    setVisibles((prev) => {
      const suivant = new Set(prev)
      suivant.has(code) ? suivant.delete(code) : suivant.add(code)
      return suivant
    })

  if (erreur) {
    return (
      <main className="h-dvh grid place-items-center p-6 text-center">
        <p className="text-red-600">Erreur : {erreur}</p>
      </main>
    )
  }
  if (!reseau) {
    return (
      <main className="h-dvh grid place-items-center text-slate-500">
        Chargement du réseau…
      </main>
    )
  }

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-slate-100">
      <CarteReseau reseau={reseau} visibles={visibles} />

      <header className="absolute top-3 left-3 z-10 rounded-full bg-white/95 px-4 py-2 shadow-lg backdrop-blur">
        <h1 className="text-sm font-bold text-slate-800">🚌 Bus Tata Thiès</h1>
      </header>

      <button
        onClick={() => setPanneau((o) => !o)}
        className="absolute bottom-6 left-3 z-10 rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg active:scale-95"
      >
        {panneau ? 'Fermer' : 'Lignes'}
      </button>

      {panneau && (
        <aside className="absolute bottom-20 left-3 right-3 z-10 max-h-[60dvh] overflow-auto rounded-2xl bg-white p-4 shadow-2xl md:bottom-auto md:right-auto md:top-16 md:w-80 md:max-h-[calc(100dvh-5rem)]">
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
                    {!g.a_arrets && <em className="block text-xs text-amber-700">Tracé seulement, arrêts non relevés</em>}
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <div className="mt-3 border-t pt-3 text-xs text-slate-500">
            <p>Contour noir : arrêt vérifié · contour orange : position à vérifier · gris : arrêt non rattaché</p>
          </div>
        </aside>
      )}
    </div>
  )
}