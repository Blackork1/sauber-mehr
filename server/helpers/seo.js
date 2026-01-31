import { SITE } from "../config/siteConfig.js";

function stripTags(html = "") {
  return String(html).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function absolutizeUrl(url, baseUrl = SITE.baseUrl) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("//")) return "https:" + url;
  return baseUrl.replace(/\/$/, "") + (url.startsWith("/") ? url : "/" + url);
}

export function buildMeta({ req, page }) {
  const canonical = absolutizeUrl(page?.canonical || req.originalUrl, SITE.baseUrl);

  const title =
    page?.meta_title ||
    page?.title ||
    SITE.name;

  const description =
    page?.meta_description ||
    stripTags(page?.excerpt || "") ||
    "Short films, documentaries and feature films from the four parts of Kurdistan – and the diaspora.";

  // robots: default index/follow, aber DB kann überschreiben
  const robots = page?.noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

  const ogImage = page?.og_image
    ? { url: absolutizeUrl(page.og_image), width: 1200, height: 630, alt: title }
    : { ...SITE.defaultOgImage };

  const locale = page?.locale || SITE.defaultLocale;

  return {
    title,
    description,
    robots,
    canonical,
    locale,
    og: {
      type: page?.og_type || "website", // "article" z.B. für News
      site_name: SITE.name,
      url: canonical,
      title,
      description,
      image: ogImage
    },
    // Optional: Alternates (nur sinnvoll, wenn du echte Sprach-URLs hast)
    alternates: page?.alternates || [] // [{ hreflang:"de-DE", href:"..." }, ...]
  };
}

/**
 * JSON-LD sicher in <script> ausgeben (verhindert </script>-Breakout)
 */
export function safeJsonLd(obj) {
  return JSON.stringify(obj)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

/**
 * Baut einen @graph:
 * - WebSite
 * - Organization
 * - WebPage
 * + optional Event (z.B. home)
 * + optional FAQPage (wenn content Blocks FAQ enthalten)
 */
export function buildSchemaGraph({ req, page }) {
  const url = absolutizeUrl(page?.canonical || req.originalUrl);
  const websiteId = SITE.baseUrl + "/#website";
  const orgId = SITE.organization.id;

  const graph = [];

  // Organization
  graph.push({
    "@type": "Organization",
    "@id": orgId,
    "name": SITE.organization.name,
    "url": SITE.organization.url,
    "logo": {
      "@type": "ImageObject",
      "url": SITE.organization.logo.url,
      "width": SITE.organization.logo.width,
      "height": SITE.organization.logo.height
    },
    "sameAs": SITE.organization.sameAs
  });

  // WebSite
  graph.push({
    "@type": "WebSite",
    "@id": websiteId,
    "url": SITE.baseUrl + "/",
    "name": SITE.name,
    "publisher": { "@id": orgId },
    "inLanguage": page?.locale || SITE.defaultLocale
  });

  // WebPage
  graph.push({
    "@type": "WebPage",
    "@id": url + "#webpage",
    "url": url,
    "name": page?.meta_title || page?.title || SITE.name,
    "description": page?.meta_description || "",
    "isPartOf": { "@id": websiteId },
    "about": { "@id": orgId },
    "inLanguage": page?.locale || SITE.defaultLocale,
    ...(page?.primary_image ? {
      "primaryImageOfPage": {
        "@type": "ImageObject",
        "url": absolutizeUrl(page.primary_image)
      }
    } : {})
  });

  // FAQPage: wenn ein FAQ-Block vorhanden ist
  const faqBlock = Array.isArray(page?.content)
    ? page.content.find(b => b?.type === "faq" && Array.isArray(b?.items) && b.items.length)
    : null;

  if (faqBlock) {
    graph.push({
      "@type": "FAQPage",
      "@id": url + "#faq",
      "mainEntity": faqBlock.items
        .filter(i => i?.q && i?.a)
        .map(i => ({
          "@type": "Question",
          "name": stripTags(i.q),
          "acceptedAnswer": {
            "@type": "Answer",
            "text": stripTags(i.a)
          }
        }))
    });
  }

  // Event: z.B. Startseite (oder jede Seite mit page.include_event = true)
  const includeEvent = page?.include_event || page?.slug === "home";
  if (includeEvent) {
    const ev = SITE.festivalEvent;

    graph.push({
      "@type": "Event",
      "@id": ev.id,
      "name": ev.name,
      "startDate": ev.startDate,
      "endDate": ev.endDate,
      "eventStatus": ev.status,
      "eventAttendanceMode": ev.attendanceMode,
      "organizer": { "@id": orgId },
      "location": ev.locations.map(loc => {
        if (loc.virtualUrl) {
          return { "@type": "VirtualLocation", "url": loc.virtualUrl };
        }
        return {
          "@type": "Place",
          "name": loc.name,
          "url": loc.url,
          "address": {
            "@type": "PostalAddress",
            ...loc.address
          }
        };
      })
    });
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph
  };
}
