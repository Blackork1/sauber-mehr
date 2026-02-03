export const SITE = {
  name: "TM Sauber & Mehr UG",
  baseUrl: "https://sauber-mehr.de",
  defaultLocale: "de-DE",          // deine “primäre” Sprache pro URL
  locales: ["de-DE", "en-US"],

  themeColor: "#ffffff",

  // Standard OG Bild (wichtig: absoluter Pfad)
  defaultOgImage: {
    url: "https://sauber-mehr.de/images/og-default.jpg",
    width: 1200,
    height: 630,
    alt: "TM Sauber & Mehr UG"
  },

  // Organization (Schema + teilweise auch im Meta-Kontext nützlich)
  organization: {
    id: "https://sauber-mehr.de/#organization",
    name: "TM Sauber & Mehr UG",
    url: "https://sauber-mehr.de/",
    logo: {
      url: "https://sauber-mehr.de/images/logo.png",
      width: 545,
      height: 545
    },
    sameAs: [
      "https://www.facebook.com/saubermehr",
      "https://www.instagram.com/saubermehr/",
      "https://x.com/saubermehr"
    ],
    contact: {
      email: "info@sauber-mehr.de",
      telephone: "+49 (0)30 54 71 94 62"
    },
    address: {
      streetAddress: "Oranienstr. 191",
      postalCode: "10999",
      addressLocality: "Berlin",
      addressCountry: "DE"
    }
  }
};
