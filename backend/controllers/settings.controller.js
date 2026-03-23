import LibrarySettings from "../models/librarySettings.model.js";

export const getSettings = async (req, res) => {
  try {
    const settings = await LibrarySettings.getSettings();
    await settings.populate("featuredBook", "title author cover _id");
    res.status(200).json(settings);
  } catch (e) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const { maxLoansPerUser, loanDurationDays, emailNotifications, featuredBook } = req.body;
    const settings = await LibrarySettings.getSettings();
    if (maxLoansPerUser !== undefined) settings.maxLoansPerUser = maxLoansPerUser;
    if (loanDurationDays !== undefined) settings.loanDurationDays = loanDurationDays;
    if (emailNotifications !== undefined) settings.emailNotifications = emailNotifications;
    if (featuredBook !== undefined) settings.featuredBook = featuredBook || null;

    await settings.save();
    res.status(200).json(settings);
  } catch (e) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};
