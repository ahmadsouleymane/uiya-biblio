import LibrarySettings from "../models/librarySettings.model.js";

export const getSettings = async (req, res) => {
  try {
    const settings = await LibrarySettings.getSettings();
    res.status(200).json(settings);
  } catch (e) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const { fineRatePerDay, maxLoansPerUser, loanDurationDays, emailNotifications } = req.body;
    const settings = await LibrarySettings.getSettings();

    if (fineRatePerDay !== undefined) settings.fineRatePerDay = fineRatePerDay;
    if (maxLoansPerUser !== undefined) settings.maxLoansPerUser = maxLoansPerUser;
    if (loanDurationDays !== undefined) settings.loanDurationDays = loanDurationDays;
    if (emailNotifications !== undefined) settings.emailNotifications = emailNotifications;

    await settings.save();
    res.status(200).json(settings);
  } catch (e) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};
