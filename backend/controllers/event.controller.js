import Event from "../models/event.model.js"

export const getEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .sort({ date: 1 })
      .populate("createdBy", "fullName")
      .select("-registrations")
    return res.status(200).json(events)
  } catch (err) {
    return res.status(500).json({ message: "Erreur serveur" })
  }
}

export const registerForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
    if (!event) return res.status(404).json({ message: "Activité introuvable" })

    const userId = req.user._id.toString()
    if (event.registrations.map(r => r.toString()).includes(userId)) {
      return res.status(400).json({ message: "Déjà inscrit" })
    }
    event.registrations.push(req.user._id)
    await event.save()
    return res.status(200).json({ message: "Inscription confirmée", count: event.registrations.length })
  } catch (err) {
    return res.status(500).json({ message: "Erreur serveur" })
  }
}

export const unregisterFromEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
    if (!event) return res.status(404).json({ message: "Activité introuvable" })

    event.registrations = event.registrations.filter(r => r.toString() !== req.user._id.toString())
    await event.save()
    return res.status(200).json({ message: "Désinscription effectuée", count: event.registrations.length })
  } catch (err) {
    return res.status(500).json({ message: "Erreur serveur" })
  }
}

export const getRegistrations = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("registrations", "fullName email phone department year role")
    if (!event) return res.status(404).json({ message: "Activité introuvable" })
    return res.status(200).json(event.registrations)
  } catch (err) {
    return res.status(500).json({ message: "Erreur serveur" })
  }
}

export const addEvent = async (req, res) => {
  try {
    const { title, date, location, description } = req.body
    const poster = req.file
      ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
      : null

    if (!title || !poster || !date || !location || !description) {
      return res.status(400).json({ message: "Veuillez remplir tous les champs" })
    }
    const event = await Event.create({
      title,
      poster,
      date,
      location,
      description,
      createdBy: req.user._id,
    })
    return res.status(201).json({ message: "Activité ajoutée", event })
  } catch (err) {
    return res.status(500).json({ message: "Erreur serveur" })
  }
}

export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id)
    if (!event) return res.status(404).json({ message: "Activité introuvable" })
    return res.status(200).json({ message: "Activité supprimée" })
  } catch (err) {
    return res.status(500).json({ message: "Erreur serveur" })
  }
}
