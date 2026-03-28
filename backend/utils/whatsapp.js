import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let client = null;
let qrCodeData = null;
let status = "disconnected"; // disconnected | qr_pending | ready | error

/**
 * Formater un numéro de téléphone pour WhatsApp (Côte d'Ivoire = 225)
 * 0701234567 → 2250701234567@c.us
 * +2250701234567 → 2250701234567@c.us
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

  return cleaned + "@c.us";
}

export function getWhatsAppStatus() {
  return { status, qrCode: qrCodeData };
}

export async function initWhatsApp() {
  if (client) return;

  try {
    // Import dynamique — ne charge Puppeteer que quand on connecte le bot
    const pkg = await import("whatsapp-web.js");
    const { Client, LocalAuth } = pkg.default || pkg;

    const puppeteerArgs = [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--single-process",
    ];

    const puppeteerOptions = {
      headless: true,
      args: puppeteerArgs,
    };

    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      puppeteerOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    }

    client = new Client({
      authStrategy: new LocalAuth({
        dataPath: path.join(__dirname, "..", ".wwebjs_auth"),
      }),
      puppeteer: puppeteerOptions,
    });

    client.on("qr", (qr) => {
      qrCodeData = qr;
      status = "qr_pending";
      console.log("[WhatsApp] QR code généré — scannez-le depuis l'admin");
    });

    client.on("ready", () => {
      qrCodeData = null;
      status = "ready";
      console.log("[WhatsApp] Bot connecté et prêt !");
    });

    client.on("authenticated", () => {
      console.log("[WhatsApp] Authentifié");
    });

    client.on("auth_failure", (msg) => {
      status = "error";
      console.error("[WhatsApp] Échec auth:", msg);
    });

    client.on("disconnected", (reason) => {
      status = "disconnected";
      qrCodeData = null;
      client = null;
      console.log("[WhatsApp] Déconnecté:", reason);
    });

    client.initialize();
    console.log("[WhatsApp] Initialisation du bot...");
  } catch (err) {
    console.error("[WhatsApp] Erreur init:", err);
    status = "error";
    client = null;
  }
}

export function destroyWhatsApp() {
  if (client) {
    client.destroy();
    client = null;
    status = "disconnected";
    qrCodeData = null;
  }
}

async function sendMessage(phone, message) {
  if (status !== "ready" || !client) {
    console.log("[WhatsApp] Bot non connecté, message non envoyé à", phone);
    return false;
  }

  const chatId = formatPhone(phone);
  console.log(`[WhatsApp] Envoi à ${phone} → formaté: ${chatId}`);

  try {
    const isRegistered = await client.isRegisteredUser(chatId);
    if (!isRegistered) {
      console.log(`[WhatsApp] ${chatId} n'est pas enregistré sur WhatsApp`);
      return false;
    }

    await client.sendMessage(chatId, message);
    console.log(`[WhatsApp] Message envoyé à ${chatId}`);
    return true;
  } catch (err) {
    console.error(`[WhatsApp] Erreur envoi à ${chatId}:`, err.message);
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
