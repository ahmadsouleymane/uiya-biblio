import { Resend } from "resend";

const getResend = () => new Resend(process.env.RESEND_API_KEY);
const FROM = "Bibliothèque UIYA <onboarding@resend.dev>";

export const sendWelcomeEmail = async (to, userName) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  await getResend().emails.send({
    from: FROM,
    to,
    subject: "Bienvenue à la Bibliothèque UIYA !",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
        <!-- Header -->
        <div style="background:#040848;padding:36px 32px;text-align:center">
          <h1 style="color:#ffffff;margin:0;font-size:26px;letter-spacing:1px">📚 Bibliothèque UIYA</h1>
          <p style="color:#a0aacc;margin:8px 0 0;font-size:14px">Votre portail de lecture universitaire</p>
        </div>

        <!-- Body -->
        <div style="padding:32px">
          <h2 style="color:#040848;margin-top:0">Bienvenue, ${userName} ! 🎉</h2>
          <p style="color:#444;line-height:1.7">
            Votre compte a été créé avec succès. Vous avez maintenant accès à toute la collection de la bibliothèque UIYA : emprunts, réservations, historique et bien plus encore.
          </p>

          <div style="background:#f4f6fb;border-left:4px solid #040848;border-radius:8px;padding:16px 20px;margin:24px 0">
            <p style="margin:0;color:#040848;font-weight:bold">Ce que vous pouvez faire :</p>
            <ul style="color:#555;margin:10px 0 0;padding-left:20px;line-height:1.9">
              <li>Parcourir et rechercher des livres</li>
              <li>Emprunter jusqu'à 3 livres simultanément</li>
              <li>Réserver un livre indisponible</li>
              <li>Suivre vos emprunts et votre historique</li>
            </ul>
          </div>

          <div style="text-align:center;margin:32px 0 16px">
            <a href="${frontendUrl}" style="display:inline-block;padding:14px 36px;background:#A71E3C;color:#fff;text-decoration:none;border-radius:10px;font-weight:bold;font-size:15px;letter-spacing:0.5px">
              Accéder à la bibliothèque
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background:#f9f9f9;padding:20px 32px;text-align:center;border-top:1px solid #eee">
          <p style="color:#999;font-size:12px;margin:0">
            Cet email a été envoyé automatiquement — merci de ne pas y répondre.<br>
            © ${new Date().getFullYear()} Bibliothèque UIYA
          </p>
        </div>
      </div>
    `,
  });
};

export const sendResetPasswordEmail = async (to, resetUrl) => {
  await getResend().emails.send({
    from: FROM,
    to,
    subject: "Réinitialisation de votre mot de passe — Bibliothèque UIYA",
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#f9f9f9;border-radius:12px">
        <h2 style="color:#040848">Réinitialisation du mot de passe</h2>
        <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous :</p>
        <a href="${resetUrl}" style="display:inline-block;margin:16px 0;padding:12px 28px;background:#A71E3C;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold">
          Réinitialiser mon mot de passe
        </a>
        <p style="color:#888;font-size:13px">Ce lien expire dans <strong>1 heure</strong>. Si vous n'avez pas fait cette demande, ignorez cet email.</p>
      </div>
    `,
  });
};

export const sendLoanReminderEmail = async (to, userName, bookTitle, dueDate) => {
  const formatted = new Date(dueDate).toLocaleDateString("fr-FR");
  await getResend().emails.send({
    from: FROM,
    to,
    subject: `Rappel : retour de "${bookTitle}" dans 2 jours`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#f9f9f9;border-radius:12px">
        <h2 style="color:#040848">Rappel de retour</h2>
        <p>Bonjour <strong>${userName}</strong>,</p>
        <p>Le livre <strong>"${bookTitle}"</strong> doit être retourné avant le <strong>${formatted}</strong>.</p>
        <p>Merci de le rapporter à la bibliothèque avant cette date pour éviter une amende.</p>
      </div>
    `,
  });
};

export const sendLoanOverdueEmail = async (to, userName, bookTitle, daysLate, fineAmount) => {
  await getResend().emails.send({
    from: FROM,
    to,
    subject: `Retard de retour : "${bookTitle}"`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#fff3f3;border-radius:12px;border:1px solid #ffcccc">
        <h2 style="color:#A71E3C">Retard de retour</h2>
        <p>Bonjour <strong>${userName}</strong>,</p>
        <p>Le livre <strong>"${bookTitle}"</strong> est en retard de <strong>${daysLate} jour(s)</strong>.</p>
        <p>Une amende de <strong>${fineAmount} DA</strong> a été générée. Merci de régulariser votre situation à la bibliothèque.</p>
      </div>
    `,
  });
};

