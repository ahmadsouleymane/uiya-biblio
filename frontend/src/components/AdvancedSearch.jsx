import { useState } from "react"
import { Search, ChevronDown, ChevronUp, X } from "lucide-react"

const CATEGORIES = [
  "Philosophie", "Droit", "Communication", "Littérature ivoirienne",
  "Littérature africaine", "Développement personnel",
  "Sciences économiques et de gestion", "Anglais", "Rédaction", "Dictionnaires",
]

const CONDITIONS = [
  { value: "", label: "Toutes conditions" },
  { value: "neuf", label: "Neuf" },
  { value: "bon", label: "Bon état" },
  { value: "usé", label: "Usé" },
  { value: "endommagé", label: "Endommagé" },
]

const SORT_OPTIONS = [
  { value: "", label: "Pertinence" },
  { value: "title", label: "Titre A → Z" },
  { value: "-title", label: "Titre Z → A" },
  { value: "year", label: "Plus récent" },
  { value: "-year", label: "Plus ancien" },
  { value: "available", label: "Disponibles en premier" },
]

export default function AdvancedSearch({ filters, onChange, onSearch }) {
  const [open, setOpen] = useState(false)

  const activeCount = [
    filters.author,
    filters.publisher,
    filters.yearFrom,
    filters.yearTo,
    filters.condition,
    filters.available,
    filters.sortBy,
  ].filter(Boolean).length

  const reset = () => {
    onChange({
      ...filters,
      author: "",
      publisher: "",
      yearFrom: "",
      yearTo: "",
      condition: "",
      available: false,
      sortBy: "",
    })
  }

  const handleKey = (e) => {
    if (e.key === "Enter") onSearch?.()
  }

  return (
    <div>
      {/* Ligne principale : recherche texte + toggle filtres */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: "rgba(255,255,255,0.4)" }}
          />
          <input
            type="text"
            value={filters.search || ""}
            onChange={e => onChange({ ...filters, search: e.target.value })}
            onKeyDown={handleKey}
            placeholder="Titre, auteur, ISBN…"
            className="w-full h-12 pl-11 pr-4 rounded-2xl text-sm font-medium outline-none"
            style={{
              background: "rgba(255,255,255,0.10)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#fff",
            }}
          />
        </div>
        <button
          onClick={() => setOpen(o => !o)}
          className="h-12 px-4 rounded-2xl text-xs font-bold flex items-center gap-2 shrink-0 transition-all"
          style={{
            background: open || activeCount > 0 ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.12)",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.18)",
          }}
        >
          Filtres
          {activeCount > 0 && (
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center font-black text-white"
              style={{ background: "#A71E3C", fontSize: "0.625rem" }}
            >
              {activeCount}
            </span>
          )}
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Panel avancé */}
      {open && (
        <div
          className="mt-2 rounded-2xl p-4 space-y-3"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
        >
          {/* Ligne 1 : Auteur + Éditeur */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1">Auteur</label>
              <input
                type="text"
                value={filters.author || ""}
                onChange={e => onChange({ ...filters, author: e.target.value })}
                placeholder="Nom de l'auteur"
                className="w-full h-10 px-3 rounded-xl text-sm outline-none"
                style={{
                  background: "rgba(255,255,255,0.10)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "#fff",
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1">Éditeur</label>
              <input
                type="text"
                value={filters.publisher || ""}
                onChange={e => onChange({ ...filters, publisher: e.target.value })}
                placeholder="Nom de l'éditeur"
                className="w-full h-10 px-3 rounded-xl text-sm outline-none"
                style={{
                  background: "rgba(255,255,255,0.10)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "#fff",
                }}
              />
            </div>
          </div>

          {/* Ligne 2 : Année de → à */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1">Année (de)</label>
              <input
                type="number"
                value={filters.yearFrom || ""}
                onChange={e => onChange({ ...filters, yearFrom: e.target.value })}
                placeholder="1900"
                min="1900"
                max={new Date().getFullYear()}
                className="w-full h-10 px-3 rounded-xl text-sm outline-none"
                style={{
                  background: "rgba(255,255,255,0.10)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "#fff",
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1">Année (à)</label>
              <input
                type="number"
                value={filters.yearTo || ""}
                onChange={e => onChange({ ...filters, yearTo: e.target.value })}
                placeholder={String(new Date().getFullYear())}
                min="1900"
                max={new Date().getFullYear()}
                className="w-full h-10 px-3 rounded-xl text-sm outline-none"
                style={{
                  background: "rgba(255,255,255,0.10)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "#fff",
                }}
              />
            </div>
          </div>

          {/* Ligne 3 : Condition + Trier par */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1">État</label>
              <select
                value={filters.condition || ""}
                onChange={e => onChange({ ...filters, condition: e.target.value })}
                className="w-full h-10 px-3 rounded-xl text-sm outline-none"
                style={{
                  background: "rgba(255,255,255,0.10)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: filters.condition ? "#fff" : "rgba(255,255,255,0.5)",
                }}
              >
                {CONDITIONS.map(c => (
                  <option key={c.value} value={c.value} style={{ background: "#1e293b", color: "#fff" }}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1">Trier par</label>
              <select
                value={filters.sortBy || ""}
                onChange={e => onChange({ ...filters, sortBy: e.target.value })}
                className="w-full h-10 px-3 rounded-xl text-sm outline-none"
                style={{
                  background: "rgba(255,255,255,0.10)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "#fff",
                }}
              >
                {SORT_OPTIONS.map(s => (
                  <option key={s.value} value={s.value} style={{ background: "#1e293b", color: "#fff" }}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Ligne 4 : Disponibles + Réinitialiser */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.available || false}
                onChange={e => onChange({ ...filters, available: e.target.checked })}
                className="w-4 h-4 rounded accent-crimson"
                style={{ accentColor: "#A71E3C" }}
              />
              <span className="text-sm font-semibold text-white/80">Disponibles uniquement</span>
            </label>

            {activeCount > 0 && (
              <button
                onClick={reset}
                className="flex items-center gap-1.5 text-xs font-bold"
                style={{ color: "rgba(255,255,255,0.55)" }}
                onMouseEnter={e => e.currentTarget.style.color = "#fff"}
                onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.55)"}
              >
                <X className="w-3.5 h-3.5" /> Réinitialiser
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
