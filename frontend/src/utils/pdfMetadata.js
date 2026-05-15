import * as pdfjsLib from "pdfjs-dist"

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString()

const cleanString = (s) => {
  if (!s || typeof s !== "string") return ""
  const v = s.trim()
  if (!v || /^untitled$/i.test(v)) return ""
  return v
}

// Detect a likely ISBN-13 inside a chunk of text
const findIsbn = (text) => {
  if (!text) return ""
  const match = text.match(/97[89][\s-]?(?:\d[\s-]?){9}\d/)
  return match ? match[0].replace(/[\s-]/g, "") : ""
}

// Render the first page of the PDF as a JPEG data URL (book cover)
const renderFirstPageCover = async (pdf, maxWidth = 600) => {
  const page = await pdf.getPage(1)
  const baseViewport = page.getViewport({ scale: 1 })
  const scale = Math.min(maxWidth / baseViewport.width, 2.5)
  const viewport = page.getViewport({ scale })

  const canvas = document.createElement("canvas")
  canvas.width = Math.ceil(viewport.width)
  canvas.height = Math.ceil(viewport.height)
  const ctx = canvas.getContext("2d")
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  await page.render({ canvasContext: ctx, viewport, canvas }).promise
  return canvas.toDataURL("image/jpeg", 0.85)
}

export async function extractPdfMetadata(file) {
  const buf = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise

  const meta = await pdf.getMetadata().catch(() => ({ info: {}, metadata: null }))
  const info = meta?.info || {}
  const xmp = meta?.metadata

  let title = cleanString(info.Title)
  let author = cleanString(info.Author)

  if (xmp) {
    if (!title) title = cleanString(xmp.get?.("dc:title"))
    if (!author) author = cleanString(xmp.get?.("dc:creator"))
  }

  // Fallback: extract first page text and guess
  let firstPageText = ""
  try {
    const page = await pdf.getPage(1)
    const content = await page.getTextContent()
    firstPageText = content.items.map(it => it.str).join(" ")
  } catch { /* ignore */ }

  if (!title && firstPageText) {
    const firstLine = firstPageText.split(/\s{2,}|\n/).map(s => s.trim()).find(s => s && s.length > 2)
    if (firstLine) title = firstLine.slice(0, 120)
  }

  const isbn = findIsbn(firstPageText) || findIsbn(info.Keywords || "") || findIsbn(info.Subject || "")

  let cover = ""
  try {
    cover = await renderFirstPageCover(pdf)
  } catch (e) {
    console.error("Cover render failed:", e)
  }

  return {
    title,
    author,
    pages: pdf.numPages || 0,
    isbn,
    publisher: cleanString(info.Producer) || cleanString(info.Creator) || "",
    year: (() => {
      const d = info.CreationDate || info.ModDate || ""
      const m = String(d).match(/(\d{4})/)
      return m ? m[1] : ""
    })(),
    cover,
  }
}
