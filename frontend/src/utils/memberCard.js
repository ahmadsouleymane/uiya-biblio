import logoUrl from "../assets/logo.svg"

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export function abbreviateName(fullName) {
  const parts = (fullName || "").trim().split(/\s+/)
  if (parts.length <= 2) return fullName.toUpperCase()
  const [first, second, ...rest] = parts
  return `${first} ${second} ${rest.map(p => p[0].toUpperCase() + ".").join(" ")}`.toUpperCase()
}

export async function generateMemberCard(user) {
  const W = 1012, H = 638
  const canvas = document.createElement("canvas")
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext("2d")

  // polyfill roundRect
  if (!ctx.roundRect) {
    ctx.roundRect = function (x, y, w, h, r) {
      const rad = Array.isArray(r) ? r[0] : r
      this.beginPath()
      this.moveTo(x + rad, y)
      this.arcTo(x + w, y, x + w, y + h, rad)
      this.arcTo(x + w, y + h, x, y + h, rad)
      this.arcTo(x, y + h, x, y, rad)
      this.arcTo(x, y, x + w, y, rad)
      this.closePath()
    }
  }

  // Fond
  const grad = ctx.createLinearGradient(0, 0, W, H)
  grad.addColorStop(0, "#040848")
  grad.addColorStop(1, "#0e1a7a")
  ctx.fillStyle = grad
  ctx.roundRect(0, 0, W, H, 32)
  ctx.fill()

  // Cercles décoratifs
  ctx.globalAlpha = 0.07
  ctx.fillStyle = "#ffffff"
  ctx.beginPath(); ctx.arc(W - 60, -60, 220, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(-40, H + 40, 180, 0, Math.PI * 2); ctx.fill()
  ctx.globalAlpha = 1

  // Bande rouge bas
  ctx.fillStyle = "#A71E3C"
  ctx.beginPath()
  ctx.roundRect(0, H - 90, W, 90, [0, 0, 32, 32])
  ctx.fill()
  ctx.fillStyle = "rgba(255,255,255,0.55)"
  ctx.font = "bold 22px system-ui, sans-serif"
  ctx.fillText("CARTE MEMBRE", 52, H - 53)
  ctx.fillStyle = "rgba(255,255,255,0.85)"
  ctx.fillText("·  BIBLIOTHÈQUE UIYA", 52 + ctx.measureText("CARTE MEMBRE").width + 8, H - 53)

  // Logo
  try {
    const logo = await loadImage(logoUrl)
    const logoW = 310, logoH = Math.round(310 * 1065 / 1621)
    ctx.drawImage(logo, 52, 52, logoW, logoH)
  } catch { /* absent */ }

  // Nom abrégé
  const displayName = abbreviateName(user.fullName)
  const maxW = W - 320 - 52 - 40
  let fontSize = 52
  ctx.font = `bold ${fontSize}px system-ui, sans-serif`
  while (ctx.measureText(displayName).width > maxW && fontSize > 28) {
    fontSize -= 2
    ctx.font = `bold ${fontSize}px system-ui, sans-serif`
  }
  ctx.fillStyle = "#ffffff"
  ctx.fillText(displayName, 52, 370)

  // Département
  if (user.department) {
    ctx.fillStyle = "rgba(255,255,255,0.45)"
    ctx.font = "500 24px system-ui, sans-serif"
    ctx.fillText(user.department, 52, 415)
  }

  // QR
  if (user.qrCode) {
    try {
      const qr = await loadImage(user.qrCode)
      const qrSize = 260
      const qrX = W - qrSize - 52
      const qrY = (H - 90 - qrSize) / 2
      ctx.fillStyle = "#ffffff"
      ctx.beginPath()
      ctx.roundRect(qrX - 14, qrY - 14, qrSize + 28, qrSize + 28, 18)
      ctx.fill()
      ctx.drawImage(qr, qrX, qrY, qrSize, qrSize)
    } catch { /* absent */ }
  }

  return canvas
}

export async function downloadCard(user) {
  const canvas = await generateMemberCard(user)
  const a = document.createElement("a")
  a.href = canvas.toDataURL("image/png")
  a.download = `carte-membre-${(user.fullName || "user").replace(/\s+/g, "-").toLowerCase()}.png`
  a.click()
}

export async function downloadAllCards(users) {
  for (const u of users) {
    if (!u.qrCode) continue
    await downloadCard(u)
    // petit délai pour éviter de bloquer le navigateur
    await new Promise(r => setTimeout(r, 300))
  }
}
