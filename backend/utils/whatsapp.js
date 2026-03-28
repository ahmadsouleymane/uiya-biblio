import makeWASocket, { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from "@whiskeysockets/baileys";
import QRCode from "qrcode";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_DIR = path.join(__dirname, "..", ".wwebjs_auth");

let socket = null;
let qrCodeData = null;
let status = "disconnected"; // disconnected | qr_pending | ready | error

/**
 * Formater un numéro pour WhatsApp (Côte d'Ivoire = 225)
 * 0701234567 → 2250701234567@s.whatsapp.net
 */
function formatPhone(phone) {
  let cleaned = phone.replace(/[^\d]/g, "");

  // +2250701234567 ou 002250701234567 → 2250701234567
  if (cleaned.startsWith("00225")) {
    cleaned = cleaned.slice(2);
  }
  // 0701234567 → 2250701234567 (garder le 0, c'est obligatoire en CI)
  else if (cleaned.startsWith("0")) {
    cleaned = "225" + cleaned;
  }
  // 701234567 (sans 0 ni indicatif) → 2250701234567
  else if (!cleaned.startsWith("225")) {
    cleaned = "2250" + cleaned;
  }

  return cleaned + "@s.whatsapp.net";
}

export function getWhatsAppStatus() {
  return { status, qrCode: qrCodeData };
}

export async function initWhatsApp() {
  if (socket) return;

  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    // Récupérer la dernière version du protocole WhatsApp
    const { version } = await fetchLatestBaileysVersion();
    console.log("[WhatsApp] Version WA:", version.join("."));

    socket = makeWASocket({
      auth: state,
      version,
      browser: ["Biblio UIYA", "Chrome", "1.0.0"],
    });

    socket.ev.on("creds.update", saveCreds);

    socket.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;
      console.log("[WhatsApp] connection.update:", JSON.stringify({ connection, hasQr: !!qr }));

      if (qr) {
        try {
          qrCodeData = await QRCode.toDataURL(qr);
          status = "qr_pending";
          console.log("[WhatsApp] QR code généré ✓");
        } catch (err) {
          console.error("[WhatsApp] Erreur génération QR image:", err);
        }
      }

      if (connection === "open") {
        qrCodeData = null;
        status = "ready";
        console.log("[WhatsApp] Bot connecté et prêt !");
      }

      if (connection === "close") {
        const code = lastDisconnect?.error?.output?.statusCode;
        console.log("[WhatsApp] Déconnecté, code:", code);

        socket = null;

        if (code !== DisconnectReason.loggedOut) {
          console.log("[WhatsApp] Reconnexion dans 3s...");
          setTimeout(() => initWhatsApp(), 3000);
        } else {
          status = "disconnected";
          qrCodeData = null;
        }
      }
    });

    console.log("[WhatsApp] Initialisation du bot lancée ✓");
  } catch (err) {
    console.error("[WhatsApp] Erreur init:", err);
    status = "error";
    socket = null;
  }
}

export function destroyWhatsApp() {
  if (socket) {
    socket.logout().catch(() => {});
    socket.end();
    socket = null;
  }
  status = "disconnected";
  qrCodeData = null;
}

async function sendMessage(phone, message) {
  if (status !== "ready" || !socket) {
    console.log("[WhatsApp] Bot non connecté, message non envoyé à", phone);
    return false;
  }

  const jid = formatPhone(phone);
  console.log(`[WhatsApp] Envoi à ${phone} → ${jid}`);

  try {
    await socket.sendMessage(jid, { text: message });
    console.log(`[WhatsApp] Message envoyé à ${jid} ✓`);
    return true;
  } catch (err) {
    console.error(`[WhatsApp] Erreur envoi à ${jid}:`, err.message);
    return false;
  }
}

// ─── Messages prédéfinis ───────────────────────────────────────────────

export async function sendWelcomeWhatsApp(phone, userName) {
  const message =
    `📚 *Bienvenue à la Bibliothèque UIYA, ${userName} !*\n\n` +
    `Votre compte a été créé avec succès.\n\n` +
    `✅ Vous pouvez maintenant :\n` +
    `• Parcourir et rechercher des livres\n` +
    `• Emprunter jusqu'à 3 livres simultanément\n` +
    `• Suivre vos emprunts et votre historique\n\n` +
    `Bonne lecture ! 🎉`;
  return sendMessage(phone, message);
}

export async function sendLoanReminderWhatsApp(phone, userName, bookTitle, dueDate) {
  const formatted = new Date(dueDate).toLocaleDateString("fr-FR");
  const message =
    `⏰ *Rappel de retour — Bibliothèque UIYA*\n\n` +
    `Bonjour ${userName},\n\n` +
    `Le livre *"${bookTitle}"* doit être retourné avant le *${formatted}* (dans 2 jours).\n\n` +
    `Merci de le rapporter à temps pour éviter une amende. 📖`;
  return sendMessage(phone, message);
}

export async function sendLoanOverdueWhatsApp(phone, userName, bookTitle, daysLate, fineAmount) {
  const message =
    `🚨 *Retard de retour — Bibliothèque UIYA*\n\n` +
    `Bonjour ${userName},\n\n` +
    `Le livre *"${bookTitle}"* est en retard de *${daysLate} jour(s)*.\n` +
    `Une amende de *${fineAmount} FCFA* a été générée.\n\n` +
    `Merci de régulariser votre situation au plus vite. 🙏`;
  return sendMessage(phone, message);
}

export async function sendCustomWhatsApp(phone, message) {
  return sendMessage(phone, message);
}
