import { useState, useCallback } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X, Maximize2, Minimize2 } from "lucide-react"

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString()

export default function PdfViewer({ url, onClose }) {
  const [numPages, setNumPages] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    setNumPages(numPages)
    setPageNumber(1)
  }, [])

  const goToPrev = () => setPageNumber(p => Math.max(1, p - 1))
  const goToNext = () => setPageNumber(p => Math.min(numPages || 1, p + 1))
  const zoomIn = () => setScale(s => Math.min(3, s + 0.25))
  const zoomOut = () => setScale(s => Math.max(0.5, s - 0.25))

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.getElementById("pdf-viewer-container")?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

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
      <div className="flex-1 overflow-auto flex justify-center py-4">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent" />
            </div>
          }
          error={
            <div className="text-white text-center py-20">
              <p className="text-lg font-bold">Impossible de charger le PDF</p>
              <p className="text-sm mt-2 opacity-60">Vérifiez que le fichier est valide</p>
            </div>
          }
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer={true}
            renderAnnotationLayer={true}
          />
        </Document>
      </div>
    </div>
  )
}
