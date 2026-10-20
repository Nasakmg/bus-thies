function IconeBus({ className = '' }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 64 64"
      fill="none"
    >
      <rect x="11" y="8" width="42" height="46" rx="12" fill="currentColor" />
      <path d="M16 20a6 6 0 0 1 6-6h20a6 6 0 0 1 6 6v12H16V20Z" fill="#DDF6F1" />
      <path d="M16 36h32v8H16z" fill="#F8A13A" />
      <path d="M22 20h8v9h-8zM34 20h8v9h-8z" fill="#0D3440" />
      <path d="M18 47h28" stroke="#FFF8E9" strokeWidth="2" strokeLinecap="round" />
      <circle cx="21" cy="52" r="5" fill="#102F39" stroke="#FFF8E9" strokeWidth="2" />
      <circle cx="43" cy="52" r="5" fill="#102F39" stroke="#FFF8E9" strokeWidth="2" />
      <path d="M10 25H6m52 0h-4" stroke="#F8A13A" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function Icone({ nom, className = '' }) {
  const commun = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }

  if (nom === 'pin') {
    return <svg {...commun}><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>
  }
  if (nom === 'route') {
    return <svg {...commun}><circle cx="6" cy="18" r="2" /><circle cx="18" cy="6" r="2" /><path d="M8 18h3a3 3 0 0 0 3-3v-3a3 3 0 0 1 3-3h1" /></svg>
  }
  if (nom === 'map') {
    return <svg {...commun}><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" /><path d="M9 3v15m6-12v15" /></svg>
  }
  if (nom === 'arrow') {
    return <svg {...commun}><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
  }
  if (nom === 'download') {
    return <svg {...commun}><path d="M12 3v12m-5-5 5 5 5-5" /><path d="M5 16v4h14v-4" /></svg>
  }
  return <svg {...commun}><path d="m12 3 2.6 5.3 5.9.9-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.2 5.9-.9L12 3Z" /></svg>
}

export default function Accueil({
  nombreArrets,
  nombreLignes,
  nombreQuartiers,
  donneesDisponibles,
  installee,
  installer,
  aideInstallation,
  ouvrirCarte,
}) {
  return (
    <main className="accueil-shell">
      <div className="accueil-grain" aria-hidden="true" />
      <header className="accueil-header">
        <a className="accueil-marque" href="/" aria-label="Bus Tata Thiès, accueil">
          <span className="accueil-marque-icone"><IconeBus /></span>
          <span>
            <strong>Bus Tata</strong>
            <small>THIÈS</small>
          </span>
        </a>
        <button
          className={`accueil-install${installee ? ' accueil-install-done' : ''}`}
          onClick={installee ? undefined : installer}
          disabled={installee}
          aria-label={installee ? 'Application installée' : 'Installer l’application'}
        >
          {installee ? <span aria-hidden="true">✓</span> : <Icone nom="download" />}
          <span>{installee ? 'Application installée' : 'Installer l’app'}</span>
        </button>
      </header>

      <section className="accueil-hero">
        <div className="accueil-copy">
          <div className="accueil-eyebrow">
            <span className="accueil-eyebrow-point" />
            VOTRE VILLE, VOS TRAJETS
          </div>
          <h1>
            Thiès bouge.
            <span>Votre trajet aussi.</span>
          </h1>
          <p className="accueil-intro">
            Retrouvez les lignes Tata, les arrêts près de vous et le bon chemin
            pour traverser la ville. Tout Thiès dans votre poche.
          </p>
          <div className="accueil-actions">
            <button className="accueil-primary" onClick={ouvrirCarte}>
              Explorer le réseau
              <Icone nom="arrow" />
            </button>
            {!installee && (
              <button className="accueil-secondary" onClick={installer}>
                <Icone nom="download" />
                Installer l’application
              </button>
            )}
          </div>
          <div className="accueil-social-proof">
            <span className="accueil-avatars" aria-hidden="true">
              <i>🚌</i><i>📍</i><i>🧭</i>
            </span>
            <span>Le réseau de Thiès, simple et à portée de main</span>
          </div>
        </div>

        <div className="accueil-art" aria-label="Illustration d’un bus Tata dans les rues de Thiès">
          <div className="accueil-sun" />
          <div className="accueil-art-tag"><span /> EN ROUTE À THIÈS</div>
          <svg className="accueil-scene" viewBox="0 0 600 440" fill="none" role="img" aria-label="Bus Tata roulant à Thiès">
            <path d="M67 328c48-71 109-86 184-47 67 35 119 35 186-14 46-34 82-38 105-11v113H67v-41Z" fill="#DDEBE0" />
            <path d="M54 356c67-28 142-27 227 3 98 35 176 26 265-9v52H54v-46Z" fill="#CEDFD1" />
            <path d="M47 377c110-9 183 7 253 15 94 11 165 0 253-20" stroke="#F7F3E8" strokeWidth="5" strokeLinecap="round" strokeDasharray="1 16" />
            <path d="M114 341c24-33 50-52 78-58" stroke="#A9C1AE" strokeWidth="4" strokeLinecap="round" />
            <path d="M425 321c25-39 53-63 86-71" stroke="#A9C1AE" strokeWidth="4" strokeLinecap="round" />
            <circle cx="183" cy="275" r="28" fill="#BDD2C1" />
            <circle cx="511" cy="244" r="31" fill="#BDD2C1" />
            <path d="M172 297v42m-12-31h25m311-39v58m-15-42h31" stroke="#789A83" strokeWidth="5" strokeLinecap="round" />
            <path d="M110 326c0-10 8-18 18-18h320c16 0 29 12 31 27l8 45H103l7-54Z" fill="#F7A33B" />
            <path d="M125 328c0-5 4-9 9-9h287c10 0 18 7 20 17l3 17H121l4-25Z" fill="#F7E9C8" />
            <path d="M143 325h83v28h-83zm96 0h81v28h-81zm94 0h77v28h-77z" fill="#18424B" />
            <path d="M120 364h350v16H120z" fill="#E8872D" />
            <path d="M131 358h26v8h-26zm289 0h28v8h-28z" fill="#FFF1D1" />
            <path d="M120 380h345" stroke="#F8D79E" strokeWidth="3" />
            <circle cx="171" cy="379" r="29" fill="#183941" />
            <circle cx="171" cy="379" r="13" fill="#E8E9DE" />
            <circle cx="390" cy="379" r="29" fill="#183941" />
            <circle cx="390" cy="379" r="13" fill="#E8E9DE" />
            <path d="M272 362h51" stroke="#FCEFD9" strokeWidth="4" strokeLinecap="round" />
            <path d="m99 344 13-4m371 3 13 4" stroke="#F7A33B" strokeWidth="5" strokeLinecap="round" />
            <path d="M293 287c0-17 13-30 30-30s30 13 30 30" stroke="#F7A33B" strokeWidth="5" strokeLinecap="round" />
            <path d="M312 285v-12m21 12v-12" stroke="#F7A33B" strokeWidth="5" strokeLinecap="round" />
            <circle cx="322" cy="225" r="4" fill="#F7A33B" />
            <circle cx="346" cy="238" r="3" fill="#F7A33B" />
            <circle cx="297" cy="241" r="3" fill="#F7A33B" />
          </svg>
          <div className="accueil-route-chip">
            <span className="accueil-route-chip-icon"><Icone nom="pin" /></span>
            <span><strong>Thiès, Sénégal</strong><small>Le réseau Tata vous attend</small></span>
            <span className="accueil-route-dot">↗</span>
          </div>
          <span className="accueil-art-caption">DËKK BI ÑU BËGG · LA VILLE QU’ON AIME</span>
        </div>
      </section>

      <section className="accueil-stats" aria-label="Le réseau de transport">
        <div className="accueil-stats-intro">
          <span>UN RÉSEAU QUI NOUS RAPPROCHE</span>
          <strong>La ville, mieux connectée.</strong>
        </div>
        <div className="accueil-stat">
          <strong>{donneesDisponibles ? nombreLignes : '—'}</strong>
          <span>lignes Tata</span>
        </div>
        <div className="accueil-stat">
          <strong>{donneesDisponibles ? nombreArrets : '—'}</strong>
          <span>arrêts référencés</span>
        </div>
        <div className="accueil-stat">
          <strong>{donneesDisponibles ? nombreQuartiers : '—'}</strong>
          <span>quartiers couverts</span>
        </div>
      </section>

      <section className="accueil-features">
        <article className="accueil-feature">
          <span className="accueil-feature-icon feature-orange"><Icone nom="pin" /></span>
          <div><strong>Trouvez votre arrêt</strong><p>Les arrêts les plus proches de votre position, en un geste.</p></div>
        </article>
        <article className="accueil-feature">
          <span className="accueil-feature-icon feature-green"><Icone nom="route" /></span>
          <div><strong>Choisissez votre ligne</strong><p>Explorez les tracés et repérez votre itinéraire dans Thiès.</p></div>
        </article>
        <article className="accueil-feature">
          <span className="accueil-feature-icon feature-blue"><Icone nom="map" /></span>
          <div><strong>Repérez le quartier</strong><p>Visualisez les quartiers desservis avant de prendre la route.</p></div>
        </article>
      </section>

      <footer className="accueil-footer">
        <span><IconeBus className="accueil-footer-bus" /> Fait avec <b>♥</b> pour Thiès</span>
        {!installee && (
          <button onClick={aideInstallation}>Ajouter à l’écran d’accueil <Icone nom="arrow" /></button>
        )}
      </footer>
    </main>
  )
}
