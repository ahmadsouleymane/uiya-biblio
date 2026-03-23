import cron from "node-cron";
import Loan from "../models/loan.model.js";
import LibrarySettings from "../models/librarySettings.model.js";
import Notification from "../models/notification.model.js";
import { sendLoanReminderEmail, sendLoanOverdueEmail } from "./email.js";

const FINE_RATE = 500; // FCFA par jour

export const startScheduler = () => {
  // Chaque jour à 9h00
  cron.schedule("0 9 * * *", async () => {
    console.log("[Scheduler] Vérification des emprunts...");
    try {
      const settings = await LibrarySettings.getSettings();
      if (!settings.emailNotifications) return;

      const now = new Date();
      const loans = await Loan.find({ status: { $in: ["borrowed", "late"] } })
        .populate("user", "email fullName")
        .populate("book", "title");

      for (const loan of loans) {
        if (!loan.user?.email) continue;

        const dueDate = new Date(loan.borrowDate);
        dueDate.setDate(dueDate.getDate() + settings.loanDurationDays);

        const msUntilDue = dueDate - now;
        const daysDiff = Math.ceil(msUntilDue / (1000 * 60 * 60 * 24));

        if (daysDiff === 2) {
          // Rappel J-2
          try {
            await sendLoanReminderEmail(loan.user.email, loan.user.fullName, loan.book.title, dueDate);
          } catch (e) {
            console.error("Erreur email rappel:", e.message);
          }
          await Notification.create({
            user: loan.user._id,
            type: "loan_due",
            message: `Rappel : "${loan.book.title}" doit être rendu dans 2 jours.`,
            link: "/profile",
          });
        } else if (daysDiff <= 0) {
          // Retard — marquer late + email si pas encore notifié
          if (loan.status !== "late") {
            await Loan.findByIdAndUpdate(loan._id, { status: "late" });
            const daysLate = Math.abs(daysDiff);
            const amount = daysLate * FINE_RATE;
            try {
              await sendLoanOverdueEmail(loan.user.email, loan.user.fullName, loan.book.title, daysLate, amount);
            } catch (e) {
              console.error("Erreur email retard:", e.message);
            }
            await Notification.create({
              user: loan.user._id,
              type: "loan_late",
              message: `"${loan.book.title}" est en retard de ${daysLate} jour(s). Une amende de ${amount} FCFA sera appliquée au retour.`,
              link: "/profile",
            });
          }
        }
      }

      console.log("[Scheduler] Vérification terminée.");
    } catch (err) {
      console.error("[Scheduler] Erreur:", err);
    }
  });

  console.log("[Scheduler] Démarré — vérification quotidienne à 9h00");
};
