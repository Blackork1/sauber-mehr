1. site Config für sauber-mehr einrichten:
export const SITE = {
  name: "Kurdisches Filmfestival",
  baseUrl: "https://kurdisches-filmfestival.de",
  defaultLocale: "de-DE",          // deine “primäre” Sprache pro URL
  locales: ["de-DE", "en-US", "ku"],

  themeColor: "#ffffff",

  // Standard OG Bild (wichtig: absoluter Pfad)
  defaultOgImage: {
    url: "https://kurdisches-filmfestival.de/images/og-default.jpg",
    width: 1200,
    height: 630,
    alt: "Kurdisches Filmfestival"
  },

  // Organization (Schema + teilweise auch im Meta-Kontext nützlich)
  organization: {
    id: "https://kurdisches-filmfestival.de/#organization",
    name: "Kurdisches Filmfestival",
    url: "https://kurdisches-filmfestival.de/",
    logo: {
      url: "https://kurdisches-filmfestival.de/images/logo.png",
      width: 545,
      height: 545
    },
    sameAs: [
      "https://www.facebook.com/KurdischesFilmfestival",
      "https://www.instagram.com/kurdisches.filmfestival/",
      "https://x.com/Filmfestkurdi"
    ],
    contact: {
      email: "info@mitosfilm.com",
      telephone: "+49 (0)30 54 71 94 62"
    },
    address: {
      streetAddress: "Oranienstr. 191",
      postalCode: "10999",
      addressLocality: "Berlin",
      addressCountry: "DE"
    }
  },

  // Festival-Event (Sep 2026) – Daten kannst du später exakt setzen
  festivalEvent: {
    id: "https://kurdisches-filmfestival.de/#kff-2026",
    name: "Kurdisches Filmfestival Berlin 2026",
    startDate: "2026-09-01",
    endDate: "2026-09-30",
    attendanceMode: "https://schema.org/MixedEventAttendanceMode",
    status: "https://schema.org/EventScheduled",
    locations: [
      {
        name: "Kino Babylon",
        url: "https://babylonberlin.eu/programm/festivals",
        address: {
          streetAddress: "Rosa-Luxemburg-Str. 30",
          postalCode: "10178",
          addressLocality: "Berlin",
          addressCountry: "DE"
        }
      },
      {
        virtualUrl: "https://kurdisches-filmfestival.de/online-pass/"
      }
    ]
  }
};

2. adminController einrichten:
3. Auth Controller umwandeln
4. Consent Controller erstellen
5. Datenbank einträge erstellen
6. Component Registry für alles neues einrichten und ComponentConfig nutzbar machen
7. CSS helper check
8. navHelper auf deutsch ausschließlich umbauen aber funktion beibehalten, pageMeta auf sauber-mehr umbauen, seo.js umbauen
9. Server richtig auf postgresql, session umbauen
10. middleware/accessLog.js anpassen und datenbank anlegen, auth.js anlegen, authMiddleware.js anlegen, consent middleware richtig anlegen
11. Nodemon json behalten und uploads in data/uploads, data/downloads, data/postgres verschieben