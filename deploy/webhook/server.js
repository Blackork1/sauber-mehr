import express from "express";
import crypto from "crypto";
import { spawn } from "child_process";

const app = express();
const PORT = Number(process.env.WEBHOOK_PORT || 4000);
const SECRET = process.env.WEBHOOK_SECRET;
const DEPLOY_SCRIPT = process.env.DEPLOY_SCRIPT || "/apps/kurdischesfestival/deploy/deploy.sh";

if (!SECRET) {
  console.error("WEBHOOK_SECRET fehlt.");
  process.exit(1);
}

app.get(["/", "/kurdischesfestival"], (_req, res) => res.status(200).send("OK"));
app.post(["/", "/kurdischesfestival"], express.raw({ type: "*/*" }), (req, res) => {
  
  const sig = String(req.headers["x-hub-signature-256"] || "");
  const event = String(req.headers["x-github-event"] || "");

  const digest =
    "sha256=" + crypto.createHmac("sha256", SECRET).update(req.body).digest("hex");

  try {
    if (sig.length !== digest.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(digest))) {
      console.log("❌ Ungültige Signatur");
      return res.status(401).send("Unauthorized");
    }
  } catch {
    console.log("❌ Signatur-Compare fehlgeschlagen");
    return res.status(401).send("Unauthorized");
  }

  if (event !== "push") return res.status(200).send("Ignored");

  console.log("✅ Webhook validiert, starte Deploy…");
  const p = spawn("bash", [DEPLOY_SCRIPT], { shell: "/bin/bash" });

  p.stdout.on("data", (d) => process.stdout.write(`[deploy] ${d}`));
  p.stderr.on("data", (d) => process.stderr.write(`[deploy][stderr] ${d}`));
  p.on("close", (code) => console.log(`📦 Deploy beendet (Code ${code})`));

  return res.status(200).send("Deployment gestartet");
});

app.listen(PORT, () => console.log(`🚀 Webhook läuft auf Port ${PORT}`));
