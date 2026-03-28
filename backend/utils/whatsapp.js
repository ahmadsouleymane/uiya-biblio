import path from "path";
import { fileURLToPath } from "url";
import QRCode from "qrcode";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_DIR = path.join(__dirname, "..", ".wwebjs_auth");

let socket = null;
let qrCodeData = null; // Déjà en base64 image (data:image/png;base64,...)
let status = "disconnected"; // disconnected | qr_pending | ready | error

/**
 * Formater un numéro pour WhatsApp (Côte d'Ivoire = 225)
 * Baileys utilise le format : indicatif + numéro + @s.whatsapp.net
 */
function formatPhone(phone) {
  let cleaned = phone.replace(/[^\d]/g, "");

  if (cleaned.startsWith("00225")) {
    cleaned = cleaned.slice(2);
  } else if (cleaned.startsWith("0")) {
    cleaned = "225" + cleaned.slice(1);
  } else if (!cleaned.startsWith("225")) {
    cleaned = "225" + cleaned;
  }

  return cleaned + "@s.whatsapp.net";
}

export function getWhatsAppStatus() {
  return { status, qrCode: qrCodeData };
}

export async function initWhatsApp() {
  if (socket) return;

  try {
    const baileys = await import("@whiskeysockets/baileys");
    const makeWASocket = baileys.default?.default || baileys.default || baileys.makeWASocket;
    const { useMultiFileAuthState, DisconnectReason } = baileys;

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    socket = makeWASocket({
      auth: state,
      printQRInTerminal: true,
      browser: ["Biblio UIYA", "Chrome", "1.0.0"],
    });

    socket.ev.on("creds.update", saveCreds);

    socket.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
      if (qr) {
        // Convertir le QR string en image base64 directement
        try {
          qrCodeData = await QRCode.toDataURL(qr);
        } catch {
          qrCodeData = null;
        }
        status = "qr_pending";
        console.log("[WhatsApp] QR code généré — scannez-le depuis l'admin");
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

        // Reconnexion auto sauf si déconnecté manuellement (loggedOut)
        if (code !== DisconnectReason.loggedOut) {
          console.log("[WhatsApp] Reconnexion...");
          setTimeout(() => initWhatsApp(), 3000);
        } else {
          status = "disconnected";
          qrCodeData = null;
          console.log("[WhatsApp] Déconnecté (logged out)");
        }
      }
    });

    console.log("[WhatsApp] Initialisation du bot...");
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
  console.log(`[WhatsApp] Envoi à ${phone} → formaté: ${jid}`);

  try {
    await socket.sendMessage(jid, { text: message });
    console.log(`[WhatsApp] Message envoyé à ${jid}`);
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
