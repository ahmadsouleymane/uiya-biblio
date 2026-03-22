/**
 * Génère et télécharge une étiquette livre (PNG) via Canvas API.
 * Style: fond blanc avec ISBN, titre, auteur, emplacement.
 */
export async function generateBookLabel(book) {
  const W = 400, H = 220
  const canvas = document.createElement("canvas")
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext("2d")

  // Fond blanc avec bordure
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = "#040848"
  ctx.lineWidth = 2
  ctx.strokeRect(1, 1, W - 2, H - 2)

  // En-tête coloré
  ctx.fillStyle = "#040848"
  ctx.fillRect(0, 0, W, 42)

  ctx.fillStyle = "#ffffff"
  ctx.font = "bold 14px system-ui, sans-serif"
  ctx.fillText("BIBLIOTHÈQUE", 16, 26)

  // ISBN avec barre simulée (barcode visual simple)
  ctx.fillStyle = "#040848"
  ctx.font = "bold 11px monospace"
  ctx.fillText("ISBN: " + (book.isbn || "—"), 16, 68)

  // Barcode visual (lignes verticales)
  const isbnStr = (book.isbn || "0000000000000").replace(/-/g, "")
  const barX = 16
  const barY = 76
  const barH = 36
  let x = barX
  for (let i = 0; i < isbnStr.length; i++) {
    const digit = parseInt(isbnStr[i]) || 1
    const barW = (digit % 3) + 1
    ctx.fillStyle = i % 2 === 0 ? "#000" : "#fff"
    ctx.fillRect(x, barY, barW, barH)
    x += barW + 1
    if (x > W - 16) break
  }

  // Titre
  ctx.fillStyle = "#040848"
  ctx.font = "bold 15px system-ui, sans-serif"
  const title = book.title || "—"
  const maxTitleW = W - 32
  let fontSize = 15
  ctx.font = `bold ${fontSize}px system-ui, sans-serif`
  while (ctx.measureText(title).width > maxTitleW && fontSize > 10) {
    fontSize--
    ctx.font = `bold ${fontSize}px system-ui, sans-serif`
  }
  ctx.fillText(title.length > 45 ? title.slice(0, 42) + "…" : title, 16, 132)

  // Auteur
  ctx.fillStyle = "#64748b"
  ctx.font = "12px system-ui, sans-serif"
  const author = Array.isArray(book.author) ? book.author[0] : (book.author || "—")
  ctx.fillText(author.length > 50 ? author.slice(0, 47) + "…" : author, 16, 152)

  // Emplacement
  if (book.location) {
    ctx.fillStyle = "#A71E3C"
    ctx.font = "bold 12px system-ui, sans-serif"
    ctx.fillText("📍 " + book.location, 16, 174)
  }

  // Catégorie en bas
  ctx.fillStyle = "#94a3b8"
  ctx.font = "11px system-ui, sans-serif"
  ctx.fillText(book.category || "", 16, 204)

  // Télécharger
  const a = document.createElement("a")
  a.href = canvas.toDataURL("image/png")
  a.download = `etiquette-${(book.isbn || book._id || "livre").replace(/\s+/g, "-")}.png`
  a.click()
}
