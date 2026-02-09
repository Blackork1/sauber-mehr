UPDATE pages
SET
  title = 'Datenschutz',
  meta_title = 'Datenschutzerklärung – Sauber Mehr',
  meta_description = 'Datenschutzerklärung der TM Sauber & Mehr UG (haftungsbeschränkt) mit Informationen zu Cookies, Clarity, Google Tag Manager/Google Analytics, Google Search Console, YouTube, Cloudinary und Mailchimp.',
  content = jsonb_build_array(
    jsonb_build_object(
      'type', 'richText',
      'title', 'Datenschutzerklärung',
      'html', $$
<p><strong>Stand:</strong> 9. Februar 2026</p>
<p>Diese Datenschutzerklärung informiert Sie über Art, Umfang und Zwecke der Verarbeitung personenbezogener Daten auf dieser Website und den dazugehörigen Unterseiten.</p>

<h3>1. Verantwortlicher</h3>
<p>TM Sauber &amp; Mehr UG (haftungsbeschränkt)<br>Senftenberger Ring 38B<br>13435 Berlin<br>Telefon: +49 30 28641-263<br>E-Mail: <a href="mailto:info@sauber-mehr.de">info@sauber-mehr.de</a></p>

<h3>2. Überblick über die Verarbeitung</h3>
<p>Wir verarbeiten personenbezogene Daten insbesondere zur Bereitstellung und Sicherheit der Website, zur Bearbeitung von Anfragen, zur Verwaltung von Nutzerkonten, zum Newsletterversand sowie – nur nach Einwilligung – für Analysezwecke und externe Medieninhalte.</p>

<h3>3. Rechtsgrundlagen</h3>
<p>Die Verarbeitung erfolgt insbesondere auf Grundlage von Art. 6 Abs. 1 lit. a, b, c und f DSGVO. Soweit Informationen auf Ihrem Endgerät gespeichert oder ausgelesen werden (z. B. Cookies, ähnliche Technologien), erfolgt dies nach § 25 TDDDG – entweder mit Ihrer Einwilligung oder, soweit technisch zwingend erforderlich, nach § 25 Abs. 2 TDDDG.</p>

<h3>4. Hosting und Server-Logfiles</h3>
<p>Unsere Website wird bei der IONOS SE, Elgendorfer Str. 57, 56410 Montabaur, Deutschland gehostet. Dabei werden Server-Logdaten verarbeitet (z. B. IP-Adresse, Datum/Uhrzeit, aufgerufene URL, Referrer, User-Agent, Statuscodes). Zweck ist die technische Bereitstellung, Stabilität und Sicherheit der Website (Art. 6 Abs. 1 lit. f DSGVO). Logdaten werden grundsätzlich nur so lange gespeichert, wie dies für den sicheren Betrieb erforderlich ist.</p>

<h3>5. Kontaktaufnahme</h3>
<p>Bei Kontakt per E-Mail, Telefon oder Formular verarbeiten wir die von Ihnen mitgeteilten Daten zur Bearbeitung Ihres Anliegens. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche/vertragliche Kommunikation) oder Art. 6 Abs. 1 lit. f DSGVO (allgemeine Anfragen). Daten werden nach Abschluss der Bearbeitung gelöscht, sofern keine gesetzlichen Aufbewahrungspflichten entgegenstehen.</p>

<h3>6. Nutzerkonto / Registrierung</h3>
<p>Für den Login-Bereich verarbeiten wir insbesondere Name, E-Mail-Adresse, gehashte Passwörter sowie technische Kontodaten (z. B. Registrierungszeitpunkt). Zweck ist die Bereitstellung und Absicherung des Benutzerkontos. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO sowie Art. 6 Abs. 1 lit. f DSGVO (Missbrauchs- und Sicherheitsprävention).</p>

<h3>7. Newsletter (Mailchimp)</h3>
<p>Für den Newsletterversand verwenden wir Mailchimp (The Rocket Science Group LLC d/b/a Mailchimp, USA). Verarbeitet werden insbesondere E-Mail-Adresse, ggf. Name, Anmeldezeitpunkt und Double-Opt-In-Nachweis. Rechtsgrundlage ist Ihre Einwilligung nach Art. 6 Abs. 1 lit. a DSGVO. Die Abmeldung ist jederzeit über den Abmeldelink im Newsletter möglich. Eine Übermittlung in Drittländer (insbesondere USA) kann erfolgen; hierfür werden geeignete Garantien (z. B. Standardvertragsklauseln) genutzt.</p>

<h3>8. Consent-Management (eigener Cookie-Banner)</h3>
<p>Wir nutzen ein eigenes Einwilligungsmanagement, um Ihre Auswahl zu speichern und technisch umzusetzen. Dabei verarbeiten wir Einwilligungsstatus, Zeitstempel und technische Sitzungsdaten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO; für technisch notwendige Speicherungen auf dem Endgerät § 25 Abs. 2 TDDDG. Sie können Ihre Auswahl jederzeit über den Link „Cookie-Einstellungen“ ändern oder widerrufen.</p>

<h3>9. Analyse mit Microsoft Clarity und Google Tag Manager / Google Analytics (nur nach Einwilligung)</h3>
<p>Sofern Sie zustimmen, nutzen wir Microsoft Clarity sowie Google Tag Manager / Google Analytics zur Analyse von Nutzungsinteraktionen und Reichweiten (z. B. Klicks, Scrollverhalten, technische Gerätedaten und Seitenaufrufe), um die Website zu verbessern. Rechtsgrundlage ist Art. 6 Abs. 1 lit. a DSGVO sowie § 25 Abs. 1 TDDDG. Ohne Einwilligung werden diese Analyse-Dienste nicht geladen.</p>

<h3>10. Externe Medien: YouTube (nur nach Einwilligung)</h3>
<p>YouTube-Inhalte werden erst nach Ihrer Einwilligung geladen. Beim Laden/Abspielen können personenbezogene Daten (z. B. IP-Adresse, Geräte-/Browserdaten, Referrer, Cookies/IDs) an Google/YouTube übertragen werden. Rechtsgrundlage ist Art. 6 Abs. 1 lit. a DSGVO sowie § 25 Abs. 1 TDDDG. Ein Widerruf ist jederzeit über die Cookie-Einstellungen möglich.</p>

<h3>11. Medienauslieferung über Cloudinary</h3>
<p>Für die performante Auslieferung und Optimierung von Bildern/Videos verwenden wir Cloudinary. Dabei werden technisch erforderliche Zugriffsdaten verarbeitet (z. B. IP-Adresse, Browser-/Geräteinformationen). Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (effiziente, sichere Bereitstellung der Website). Je nach Konfiguration kann eine Drittlandübermittlung stattfinden.</p>

<h3>12. Schriftarten (lokales Hosting)</h3>
<p>Die auf dieser Website verwendeten Schriftarten werden lokal von unserem Server ausgeliefert. Eine automatische Verbindung zu Google-Fonts-Servern erfolgt dadurch nicht.</p>

<h3>13. Google Search Console</h3>
<p>Wir nutzen die Google Search Console zur technischen Überwachung und Optimierung unserer Auffindbarkeit in Suchmaschinen. Auf der Website selbst ist hierfür kein eigenständiges Tracking-Skript erforderlich. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO.</p>

<h3>14. Empfänger, Auftragsverarbeiter, Drittlandtransfer</h3>
<p>Wir setzen vertraglich gebundene Dienstleister (Auftragsverarbeiter nach Art. 28 DSGVO) ein. Sofern Daten in Drittländer übermittelt werden, erfolgt dies nur unter Beachtung der DSGVO-Vorgaben (z. B. Angemessenheitsbeschluss, Standardvertragsklauseln).</p>

<h3>15. Speicherdauer</h3>
<p>Wir speichern personenbezogene Daten nur so lange, wie es für die jeweiligen Zwecke erforderlich ist oder gesetzliche Pflichten dies verlangen. Danach werden die Daten gelöscht oder anonymisiert.</p>

<h3>16. Ihre Rechte</h3>
<p>Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16 DSGVO), Löschung (Art. 17 DSGVO), Einschränkung (Art. 18 DSGVO), Datenübertragbarkeit (Art. 20 DSGVO), Widerspruch (Art. 21 DSGVO) sowie Widerruf erteilter Einwilligungen (Art. 7 DSGVO) mit Wirkung für die Zukunft.</p>

<h3>17. Beschwerderecht</h3>
<p>Sie haben das Recht, sich bei einer Datenschutzaufsichtsbehörde zu beschweren, insbesondere bei der für Berlin zuständigen Aufsichtsbehörde.</p>

<h3>18. Änderung dieser Datenschutzerklärung</h3>
<p>Wir passen diese Datenschutzerklärung an, wenn dies aufgrund rechtlicher, technischer oder organisatorischer Änderungen erforderlich ist.</p>
$$
    )
  ),
  updated_at = now()
WHERE slug = 'datenschutz';
