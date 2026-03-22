import { Resend } from "resend";

const getResend = () => new Resend(process.env.RESEND_API_KEY);
const FROM = "Bibliothèque UIYA <onboarding@resend.dev>";

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

export const sendReservationAvailableEmail = async (to, userName, bookTitle, bookId, frontendUrl) => {
  const bookUrl = `${frontendUrl || process.env.FRONTEND_URL || "http://localhost:5173"}/book/${bookId}`;
  await getResend().emails.send({
    from: FROM,
    to,
    subject: `"${bookTitle}" est maintenant disponible !`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#f9f9f9;border-radius:12px">
        <h2 style="color:#040848">Votre réservation est disponible</h2>
        <p>Bonjour <strong>${userName}</strong>,</p>
        <p>Le livre <strong>"${bookTitle}"</strong> que vous avez réservé est maintenant disponible.</p>
        <p>Vous avez <strong>48 heures</strong> pour venir l'emprunter avant que votre réservation expire.</p>
        <a href="${bookUrl}" style="display:inline-block;margin:16px 0;padding:12px 28px;background:#040848;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold">
          Voir le livre
        </a>
      </div>
    `,
  });
};
