import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

export default function App() {
  const [etat, setEtat] = useState('Chargement…')

  useEffect(() => {
    supabase.rpc('reseau_complet').then(({ data, error }) => {
      if (error) return setEtat('Erreur : ' + error.message)
      setEtat(
        `${data.arrets.length} arrêts, ${data.lignes.length} lignes, ${data.quartiers.length} quartiers chargés`
      )
    })
  }, [])

  return (
    <main className="min-h-screen grid place-items-center p-6 bg-slate-50">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-800">Bus Tata Thiès</h1>
        <p className="mt-3 text-slate-600">{etat}</p>
      </div>
    </main>
  )
}