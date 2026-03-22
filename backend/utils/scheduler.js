import cron from "node-cron";
import Loan from "../models/loan.model.js";
import Reservation from "../models/reservation.model.js";
import LibrarySettings from "../models/librarySettings.model.js";
import Fine from "../models/fine.model.js";
import Notification from "../models/notification.model.js";
import { sendLoanReminderEmail, sendLoanOverdueEmail } from "./email.js";

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
        } else if (daysDiff <= 0 && loan.status !== "late") {
          // Nouveau retard — créer amende si elle n'existe pas encore
          const daysLate = Math.abs(daysDiff);
          const existingFine = await Fine.findOne({ loan: loan._id });
          if (!existingFine) {
            const amount = daysLate * settings.fineRatePerDay;
            await Fine.create({
              loan: loan._id,
              user: loan.user._id,
              amount,
              daysLate,
              reason: `Retard de ${daysLate} jour(s) (détecté automatiquement)`,
            });
            try {
              await sendLoanOverdueEmail(loan.user.email, loan.user.fullName, loan.book.title, daysLate, amount);
            } catch (e) {
              console.error("Erreur email retard:", e.message);
            }
            await Notification.create({
              user: loan.user._id,
              type: "loan_late",
              message: `"${loan.book.title}" est en retard de ${daysLate} jour(s). Une amende de ${amount} FCFA a été générée.`,
              link: "/profile",
            });
          }

          await Loan.findByIdAndUpdate(loan._id, { status: "late" });
        }
      }

      // Expirer les réservations "available" depuis plus de 48h
      const expireThreshold = new Date(now - 48 * 60 * 60 * 1000);
      await Reservation.updateMany(
        { status: "available", notifiedAt: { $lt: expireThreshold } },
        { status: "expired" }
      );

      console.log("[Scheduler] Vérification terminée.");
    } catch (err) {
      console.error("[Scheduler] Erreur:", err);
    }
  });

  console.log("[Scheduler] Démarré — vérification quotidienne à 9h00");
};
