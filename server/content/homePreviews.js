/**
 * Inhalte für die Startseiten-Entwürfe /home1, /home2 und /home3.
 *
 * Die Entwürfe übernehmen die aktuellen Blöcke der Startseite aus der DB
 * und ergänzen sie um neue Sektionen (Über uns, Werte, Bewertungen, Referenzen).
 * Jede Variante nutzt dieselben Texte, aber ein eigenes Layout.
 *
 * Sobald ein Entwurf ausgewählt ist, können die Blöcke 1:1 als JSON in die
 * `content`-Spalte der Startseite übernommen werden (Typen sind registriert).
 */

const IMG = {
  unterhalt: 'https://res.cloudinary.com/drqz3fujd/image/upload/v1774115388/sauber-mehr/images/2026/03/unterhaltsreinigung.webp',
  buero: 'https://res.cloudinary.com/drqz3fujd/image/upload/v1774108854/sauber-mehr/images/2026/03/a6704169.webp',
  treppe: 'https://res.cloudinary.com/drqz3fujd/image/upload/v1774115387/sauber-mehr/images/2026/03/treppenreinigung.webp',
  fenster: 'https://res.cloudinary.com/drqz3fujd/image/upload/v1774115917/sauber-mehr/images/2026/03/fensterreinigung1.webp',
  praxis: 'https://res.cloudinary.com/drqz3fujd/image/upload/v1774115918/sauber-mehr/images/2026/03/praxisreinigung1.webp',
  event: 'https://res.cloudinary.com/drqz3fujd/image/upload/v1774108850/sauber-mehr/images/2026/03/a6704137.webp',
  grund: 'https://res.cloudinary.com/drqz3fujd/image/upload/v1774110799/sauber-mehr/images/2026/03/img1001.webp'
};

export const GOOGLE_REVIEWS_URL = 'https://www.google.com/maps?cid=8250758610613667508';

const ueberUns = {
  type: 'ueberUns',
  badge: 'Über uns',
  headline: 'Willkommen bei TM Sauber & Mehr',
  headlineAccent: 'Ihr Partner für gewerbliche Reinigung',
  lead: 'TM Sauber & Mehr ist Ihr verlässlicher Partner für gewerbliche Gebäudereinigung in Berlin. Seit 2022 führen wir unser eigenes Reinigungsunternehmen – und bringen unsere Branchenerfahrung aus der Hauptstadt seit 2017 direkt in Ihr Objekt.',
  text: 'Unser Kerngeschäft ist die regelmäßige <strong>Unterhaltsreinigung für Geschäftskunden</strong> – spezialisiert auf Flächen von <strong>150 bis 1.000 m²</strong>. Ob moderne Büroetage, Arzt- und Physiotherapiepraxis, Treppenhaus, Logistik- und Lagerhalle oder Club und Eventlocation nach einer langen Nacht: Wir sorgen dafür, dass Ihre Räume gepflegt sind und sich Kunden, Patienten und Mitarbeitende wohlfühlen.',
  objekteTitle: 'Diese Objekte reinigen wir regelmäßig',
  objekte: [
    { label: 'Büroetagen', icon: 'office' },
    { label: 'Arzt- & Physiotherapiepraxen', icon: 'praxis' },
    { label: 'Treppenhäuser', icon: 'stairs' },
    { label: 'Logistik- & Lagerhallen', icon: 'warehouse' },
    { label: 'Clubs & Eventlocations', icon: 'event' }
  ],
  sonderTitle: 'Neben der laufenden Pflege übernehmen wir Ihre Sonderreinigungen',
  sonder: [
    { title: 'Glas- & Fensterreinigung', text: 'Streifenfrei innen und außen – für den vollen Durchblick.', href: '/leistungen/fensterreinigung' },
    { title: 'Intensiv- & Grundreinigung', text: 'Wenn es gründlicher sein muss: nach Umbau, Auszug oder als Neustart.', href: '/leistungen/grundreinigung' },
    { title: 'Fußbodenreinigung & Pflege', text: 'Reinigung, Einpflege und Werterhalt für Ihre Bodenbeläge.', href: '/leistungen' }
  ],
  stats: [
    { value: '2017', label: 'Erfahrung in Berlin seit' },
    { value: '2022', label: 'Eigenes Unternehmen seit' },
    { value: '100 %', count: 100, suffix: ' %', label: 'Gewerblich – B2B only' },
    { value: '5,0', count: 5, decimals: 1, star: true, label: 'Sterne bei Google' }
  ],
  timeline: [
    {
      year: '2017',
      title: 'Start in der Berliner Gebäudereinigung',
      text: 'Seit 2017 arbeiten wir in der Reinigungsbranche der Hauptstadt und kennen die Anforderungen gewerblicher Objekte aus der Praxis.'
    },
    {
      year: '2022',
      title: 'Gründung von TM Sauber & Mehr',
      text: 'Mit eigenem Team, festen Ansprechpartnern und kurzen Wegen starten wir unser eigenes Reinigungsunternehmen.'
    },
    {
      year: 'Heute',
      title: 'Spezialisiert auf Unterhaltsreinigung für Unternehmen',
      text: 'Regelmäßige Reinigung für Flächen von 150 bis 1.000 m² – plus Sonderreinigungen aus einer Hand.'
    }
  ],
  image: { src: IMG.unterhalt, alt: 'Reinigungskraft von TM Sauber & Mehr bei der Unterhaltsreinigung in Berlin' },
  imageSecondary: { src: IMG.buero, alt: 'Büroreinigung durch TM Sauber & Mehr in einer Berliner Büroetage' },
  primaryButton: { label: 'Kostenlose Besichtigung anfragen', href: '#kontakt' },
  secondaryButton: { label: 'Team kennenlernen', href: '/about' }
};

const werte = {
  type: 'werte',
  badge: 'Was uns ausmacht',
  headline: 'Ehrliche Arbeit.',
  headlineAccent: 'Kein Hokuspokus.',
  intro: 'Bei uns gibt es keinen Pfusch und keine leeren Versprechen – sondern ehrliche, gründliche Arbeit, auf die Sie sich verlassen können.',
  items: [
    { title: 'Feste Reinigungskräfte', text: 'In Ihrem Objekt arbeitet ein festes Team. Das schafft Vertrauen, eingespielte Abläufe und gleichbleibende Qualität.', icon: 'team' },
    { title: 'Gründlich statt hektisch', text: 'Wir reinigen nach abgestimmtem Plan und kontrollieren die Ergebnisse – sorgfältig und ohne Abkürzungen.', icon: 'check' },
    { title: 'Faire Bezahlung', text: 'Unser Team wird fair bezahlt. Denn nur motivierte Mitarbeitende liefern erstklassige Ergebnisse.', icon: 'heart' },
    { title: 'Schnell erreichbar', text: 'Direkter Draht statt Hotline: Wenn Sie uns brauchen, sind wir unkompliziert und schnell für Sie da.', icon: 'phone' }
  ],
  zielgruppeTitle: 'Für wen wir arbeiten – und für wen nicht',
  zielgruppeText: 'Um unseren Standard und unsere volle Flexibilität für Geschäftskunden zu halten, konzentrieren wir uns zu 100 % auf den gewerblichen Bereich. Privathaushalte reinigen wir daher nicht.',
  ja: ['Unternehmen & Büros', 'Arzt- & Therapiepraxen', 'Hausverwaltungen', 'Logistik & Lager', 'Clubs & Events'],
  nein: ['Privathaushalte'],
  closing: 'Sie suchen einen Reinigungsdienstleister in Berlin, der mitdenkt und hält, was er verspricht? Dann lassen Sie uns sprechen!',
  button: { label: 'Jetzt Kontakt aufnehmen', href: '#kontakt' },
  image: { src: IMG.treppe, alt: 'Gepflegtes Treppenhaus nach der Reinigung durch TM Sauber & Mehr' }
};

/**
 * Echte Google-Rezensionen (öffentlich sichtbar, Stand 16.11.2026).
 * Namen gekürzt. Weitere Rezensionen können im Admin ergänzt werden.
 */
const bewertungen = {
  type: 'bewertungen',
  badge: 'Bewertungen',
  headline: 'Das sagen',
  headlineAccent: 'unsere Kunden',
  intro: 'Echte Stimmen aus Google – ungefiltert und ungekürzt.',
  rating: '5,0',
  ratingCount: 15,
  source: 'Google',
  allReviewsUrl: GOOGLE_REVIEWS_URL,
  allReviewsLabel: 'Alle Bewertungen auf Google',
  items: [
    {
      name: 'Benny B.',
      stars: 5,
      date: '2024',
      service: 'Büro, Fenster & Grundreinigung',
      text: 'Wir sind absolut begeistert von TM Sauber & Mehr Gebäudereinigung! Das Team arbeitet unglaublich professionell, zuverlässig und effizient. Unsere Räumlichkeiten- Büro, Fenster waren nach der Grundreinigung makellos sauber, bis ins kleinste Detail. Besonders hervorzuheben ist der freundliche Kundenservice und die flexible Terminvereinbarung. Man merkt, dass hier mit Herz und Verstand gearbeitet wird. Absolut empfehlenswert – wir werden definitiv wieder auf ihre Dienstleistungen zurückgreifen.'
    },
    {
      name: 'Eva S.',
      stars: 5,
      date: '2024',
      service: 'Event- & Büroreinigung',
      text: 'Wir haben die Firma TM Sauber & Mehr schon für verschiedene Projekte von Event- bis Büroreinigung eingesetzt. Wir waren sehr zufrieden mit ihrer Arbeit. Das Preis-Leistungs-Verhältnis ist sehr gut! Gerne wieder..'
    },
    {
      name: 'Cem C.',
      stars: 5,
      date: '2025',
      service: 'Fensterreinigung',
      text: 'Vielen Dank für die schnelle Hilfe. Zum Ablauf: TM Sauber & Mehr hat uns unkompliziert und schnell einen Termin für die Fensterreinigung gegeben und diesen pünktlich eingehalten. Zur Arbeit: Wir sind super zufrieden alle Fenster inklusive Rahmen und Fensterbänke sind wieder strahlend sauber, fast wie neu. 100% zufrieden und 5 Sterne verdient.'
    },
    {
      name: 'Gerd L.',
      stars: 5,
      date: '2025',
      service: 'Reinigung',
      text: 'Tatjana und Moritz, ein wirklich sehr gut eingespieltes Team, das mit grosser Sorgalt und Hingabe hervorragende Arbeit abgeliefert hat. Zudem sehr sympathisch und mit sehr fairen Preisen. Wir freuen uns heute schon aufs nächste Mal.'
    },
    {
      name: 'Claudia B.',
      stars: 5,
      date: '2026',
      service: 'Grundreinigung',
      text: 'Topp Kommunikation, hoch zuverlässig, die Wohnung (eine Grundreinigung nach Auszug von Kurzzeitmieter) war sehr gut. Schlüsselübergabe und Schlüsselabgabe haben sehr gut geklappt. Die beiden Gründer:innen sind nett, denken mit und vor, es war alles sehr unkompliziert. Findet man nicht häufig!'
    }
  ]
};

/**
 * PLATZHALTER: Referenzen müssen vom Kunden geliefert und von den
 * jeweiligen Firmen freigegeben werden (Name, Logo, Foto).
 */
const referenzen = {
  type: 'referenzen',
  badge: 'Referenzen',
  headline: 'Objekte, die wir',
  headlineAccent: 'regelmäßig betreuen',
  intro: 'Ein Einblick in unseren Alltag: Welche Objekte wir reinigen, wie oft wir vor Ort sind und was dabei zu tun ist.',
  placeholderNote: 'Platzhalter – echte Referenz folgt',
  items: [
    {
      placeholder: true,
      name: 'Kreativagentur',
      category: 'Büroetage',
      district: 'Berlin-Mitte',
      since: 'seit 2023',
      interval: '3× pro Woche',
      area: 'ca. 600 m²',
      text: 'Feste Reinigungskraft am Abend, damit das Team morgens in ein aufgeräumtes Büro startet.',
      tasks: ['Arbeitsplätze & Kontaktflächen', 'Teeküche & Spülmaschine', 'Sanitärräume', 'Böden & Müll'],
      image: { src: IMG.buero, alt: 'Büroreinigung in einer Berliner Büroetage' }
    },
    {
      placeholder: true,
      name: 'Zahnarztpraxis',
      category: 'Praxis',
      district: 'Reinickendorf',
      since: 'seit 2022',
      interval: '5× pro Woche',
      area: 'ca. 250 m²',
      text: 'Hygienische Reinigung nach Praxisschluss mit Fokus auf Behandlungsstühle und Kontaktflächen.',
      tasks: ['Behandlungszimmer', 'Empfang & Wartebereich', 'Desinfektion Kontaktflächen', 'Sanitär'],
      image: { src: IMG.praxis, alt: 'Praxisreinigung in einer Zahnarztpraxis in Berlin' }
    },
    {
      placeholder: true,
      name: 'Wohn- & Geschäftshaus',
      category: 'Treppenhaus',
      district: 'Pankow',
      since: 'seit 2024',
      interval: '1× pro Woche',
      area: '6 Etagen',
      text: 'Gepflegter erster Eindruck für Mieter und Besucher – im festen Turnus, mit Protokoll für die Hausverwaltung.',
      tasks: ['Treppen & Podeste', 'Geländer & Handläufe', 'Eingangsbereich', 'Glastüren'],
      image: { src: IMG.treppe, alt: 'Treppenhausreinigung in einem Berliner Wohn- und Geschäftshaus' }
    },
    {
      placeholder: true,
      name: 'Logistikstandort',
      category: 'Lager & Logistik',
      district: 'Spandau',
      since: 'seit 2023',
      interval: '2× pro Woche',
      area: 'ca. 1.000 m²',
      text: 'Reinigung von Büro- und Sozialräumen sowie der Verkehrswege – abgestimmt auf die Schichtzeiten.',
      tasks: ['Sozial- & Pausenräume', 'Büros', 'Sanitär', 'Verkehrswege'],
      image: { src: IMG.event, alt: 'Reinigung einer Lager- und Logistikhalle in Berlin' }
    },
    {
      placeholder: true,
      name: 'Club & Eventlocation',
      category: 'Club / Event',
      district: 'Friedrichshain',
      since: 'seit 2023',
      interval: 'nach jedem Wochenende',
      area: 'ca. 800 m²',
      text: 'Nach der langen Nacht kommen wir: Am Montag ist die Location wieder bereit für Gäste.',
      tasks: ['Tanzfläche & Bars', 'Sanitär', 'Müllentsorgung', 'Außenbereich'],
      image: { src: IMG.grund, alt: 'Eventreinigung in einer Berliner Eventlocation' }
    },
    {
      placeholder: true,
      name: 'Bürogebäude',
      category: 'Glas & Fenster',
      district: 'Charlottenburg',
      since: 'seit 2024',
      interval: 'quartalsweise',
      area: 'ca. 400 m² Glas',
      text: 'Streifenfreie Glasflächen innen und außen – mit Teleskopstange auch bei großen Fensterfronten.',
      tasks: ['Fenster innen & außen', 'Rahmen & Fensterbänke', 'Glastrennwände', 'Eingangsportal'],
      image: { src: IMG.fenster, alt: 'Fensterreinigung an einem Bürogebäude in Berlin' }
    }
  ]
};

const withLayout = (block, layout) => ({ ...block, layout });

export const HOME_PREVIEW_VARIANTS = {
  home1: {
    number: 1,
    name: 'Klar & Strukturiert',
    afterHero: [withLayout(ueberUns, 'split'), withLayout(werte, 'cards')],
    afterKontakt: [withLayout(bewertungen, 'spotlight'), withLayout(referenzen, 'cards')]
  },
  home2: {
    number: 2,
    name: 'Bento & Modern',
    afterHero: [withLayout(ueberUns, 'bento'), withLayout(werte, 'list')],
    afterKontakt: [withLayout(bewertungen, 'track'), withLayout(referenzen, 'tabs')]
  },
  home3: {
    number: 3,
    name: 'Story & Kontrast',
    afterHero: [withLayout(ueberUns, 'story'), withLayout(werte, 'band')],
    afterKontakt: [withLayout(bewertungen, 'wall'), withLayout(referenzen, 'zigzag')]
  }
};
