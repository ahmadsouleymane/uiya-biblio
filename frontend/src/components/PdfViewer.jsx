import { useState, useCallback, useEffect, useRef } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X, Maximize2, Minimize2 } from "lucide-react"

// Worker servi depuis le CDN avec la version EXACTE de pdfjs (évite que Vite
// transforme le worker local, ce qui cassait l'affichage des PDF en dev).
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

const PDF_OPTIONS = {
  cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
}

export default function PdfViewer({ url, onClose }) {
  const [numPages, setNumPages] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [pageWidth, setPageWidth] = useState(0)
  const containerRef = useRef(null)

  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    setNumPages(numPages)
    setPageNumber(1)
  }, [])

  const goToPrev = useCallback(() => setPageNumber(p => Math.max(1, p - 1)), [])
  const goToNext = useCallback(() => setPageNumber(p => Math.min(numPages || 1, p + 1)), [numPages])
  const zoomIn = () => setScale(s => Math.min(3, s + 0.25))
  const zoomOut = () => setScale(s => Math.max(0.5, s - 0.25))

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.getElementById("pdf-viewer-container")?.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }

  // Sync l'état fullscreen avec l'API navigateur (ESC peut le fermer)
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", onFsChange)
    return () => document.removeEventListener("fullscreenchange", onFsChange)
  }, [])

  // Clavier : flèches + ESC
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") goToPrev()
      else if (e.key === "ArrowRight") goToNext()
      else if (e.key === "Escape" && !document.fullscreenElement) onClose?.()
      else if (e.key === "+") zoomIn()
      else if (e.key === "-") zoomOut()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [goToPrev, goToNext, onClose])

  // Largeur adaptative (responsive mobile)
  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setPageWidth(Math.min(containerRef.current.clientWidth - 24, 900))
      }
    }
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  return (
    <div
      id="pdf-viewer-container"
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "rgba(0,0,0,0.92)" }}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 gap-2" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
        <div className="flex items-center gap-1">
          <button onClick={goToPrev} disabled={pageNumber <= 1} className="p-2 rounded-lg text-white hover:bg-white/10 disabled:opacity-30 transition">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-white text-sm font-medium min-w-[80px] text-center">
            {pageNumber} / {numPages || "…"}
          </span>
          <button onClick={goToNext} disabled={pageNumber >= (numPages || 1)} className="p-2 rounded-lg text-white hover:bg-white/10 disabled:opacity-30 transition">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={zoomOut} disabled={scale <= 0.5} className="p-2 rounded-lg text-white hover:bg-white/10 disabled:opacity-30 transition">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-white text-xs font-medium min-w-[40px] text-center">{Math.round(scale * 100)}%</span>
          <button onClick={zoomIn} disabled={scale >= 3} className="p-2 rounded-lg text-white hover:bg-white/10 disabled:opacity-30 transition">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={toggleFullscreen} className="p-2 rounded-lg text-white hover:bg-white/10 transition ml-1">
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button onClick={onClose} className="p-2 rounded-lg text-white hover:bg-white/10 transition ml-1">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* PDF Content */}
      <div ref={containerRef} className="flex-1 overflow-auto flex justify-center py-4">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={(err) => console.error("PDF load error:", err)}
          options={PDF_OPTIONS}
          loading={
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent" />
            </div>
          }
          error={
            <div className="text-white text-center py-20 px-4">
              <p className="text-lg font-bold">Impossible de charger le PDF</p>
              <p className="text-sm mt-2 opacity-60">Vérifiez votre connexion ou que le fichier est valide</p>
            </div>
          }
        >
          {pageWidth > 0 && (
            <Page
              pageNumber={pageNumber}
              scale={scale}
              width={pageWidth}
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          )}
        </Document>
      </div>
    </div>
  )
}
