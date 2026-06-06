import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, BookOpen, FileText } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { getBooks } from "../api/book";
import Navbar from "../components/navbar"
import Footer from "../components/footer";
import AdvancedSearch from "../components/AdvancedSearch";
import { useTheme } from "../contexts/ThemeContext";

import phi from "../assets/phi.jpg";
import dr from "../assets/dr.jpg";
import com from "../assets/com.jpg";
import liv from "../assets/liv.jpg";
import lia from "../assets/lia.jpg";
import dp from "../assets/dp.jpg";
import seg from "../assets/seg.jpg";
import ang from "../assets/ang.jpg";
import red from "../assets/red.jpg";
import dic from "../assets/dic.jpg";

const categoryCovers = {
  philosophie: phi,
  droit: dr,
  communication: com,
  "littérature ivoirienne": liv,
  "littérature africaine": lia,
  "développement personnel": dp,
  "sciences économiques et de gestion": seg,
  "sciences économiques": seg,
  anglais: ang,
  rédaction: red,
  dictionnaires: dic,
};

export default function Category() {
  const { name } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const dark = theme === "dark";
  const [searchParams] = useSearchParams();

  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    author: "",
    publisher: "",
    yearFrom: "",
    yearTo: "",
    condition: "",
    available: false,
    pdfOnly: false,
    sortBy: "",
  });
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 24;

  const isTous = !name || name === "tous";
  const heroCover = categoryCovers[name?.toLowerCase()] || phi;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedFilters(filters), 400);
    return () => clearTimeout(t);
  }, [filters]);

  const buildParams = (p) => {
    const params = { page: p, limit: PAGE_SIZE };
    if (!isTous) params.category = name;
    if (debouncedFilters.search?.trim()) params.search = debouncedFilters.search.trim();
    if (debouncedFilters.author?.trim()) params.author = debouncedFilters.author.trim();
    if (debouncedFilters.publisher?.trim()) params.publisher = debouncedFilters.publisher.trim();
    if (debouncedFilters.yearFrom) params.yearFrom = debouncedFilters.yearFrom;
    if (debouncedFilters.yearTo) params.yearTo = debouncedFilters.yearTo;
    if (debouncedFilters.condition) params.condition = debouncedFilters.condition;
    if (debouncedFilters.available) params.available = "true";
    if (debouncedFilters.pdfOnly) params.pdfOnly = "true";
    if (debouncedFilters.sortBy) params.sortBy = debouncedFilters.sortBy;
    return params;
  };

  useEffect(() => {
    setLoading(true);
    setPage(1);
    getBooks(buildParams(1))
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.books || []);
        setBooks(list);
        setTotal(data?.total ?? list.length);
      })
      .catch(() => { setBooks([]); setTotal(0); })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, debouncedFilters]);

  const loadMore = () => {
    if (loadingMore || books.length >= total) return;
    const next = page + 1;
    setLoadingMore(true);
    getBooks(buildParams(next))
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.books || []);
        setBooks(prev => [...prev, ...list]);
        setPage(next);
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  };

  const filtered = books;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      <Navbar />

      {/* ── HEADER COMPACT ─────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ background: dark ? "#100c0c" : "#040848" }}>
        {/* Image de fond floutée */}
        <img
          src={heroCover}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-20 scale-110 blur-md pointer-events-none"
        />

        <div className="relative z-10 w-full px-4 pt-4 pb-5 space-y-4">
          {/* Ligne titre */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "rgba(255,255,255,0.12)" }}
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-white/50 text-xs font-semibold uppercase tracking-widest">
                {isTous ? "Catalogue" : "Catégorie"}
              </p>
              <h1 className="text-lg font-black text-white capitalize truncate leading-tight">
                {isTous ? "Tous les livres" : name}
              </h1>
            </div>
            <span
              className="shrink-0 text-xs font-bold px-3 py-1 rounded-full"
              style={{ background: "rgba(167,30,60,0.7)", color: "#fff" }}
            >
              {loading ? "…" : `${total} livre${total > 1 ? "s" : ""}`}
            </span>
          </div>

          {/* Recherche avancée */}
          <AdvancedSearch
            filters={filters}
            onChange={setFilters}
          />
        </div>
      </div>

      {/* ── GRILLE DE LIVRES ────────────────────────── */}
      <div className="w-full px-4 md:px-4 pt-4 pb-28">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            {Array(18).fill(0).map((_, i) => (
              <div key={i}>
                <div className="aspect-[2/3] rounded-xl skeleton" />
                <div className="mt-2 h-3 skeleton rounded w-4/5" />
                <div className="mt-1 h-2.5 skeleton rounded w-3/5" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
              <BookOpen className="w-8 h-8 text-gray-300" />
            </div>
            <p className="font-bold text-gray-500">Aucun livre trouvé</p>
            <p className="text-gray-400 text-sm mt-1">Essaie un autre filtre ou terme</p>
            {(filters.search || filters.author || filters.publisher || filters.yearFrom || filters.yearTo || filters.condition || filters.available) && (
              <button
                onClick={() => setFilters({ search: "", author: "", publisher: "", yearFrom: "", yearTo: "", condition: "", available: false, sortBy: "" })}
                className="mt-4 text-sm font-bold"
                style={{ color: "#A71E3C" }}
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            {filtered.map(book => (
              <div
                key={book._id}
                onClick={() => navigate(`/book/${book._id}`)}
                className="cursor-pointer group active:scale-95 transition-transform duration-150"
              >
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-sm group-hover:shadow-lg transition-shadow duration-300 bg-gray-100">
                  {book.cover ? (
                    <img
                      src={book.cover}
                      alt={book.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                  {book.availableCopies === 0 && (
                    <div className="absolute inset-0 bg-black/40 flex items-end justify-center pb-2">
                      <span className="bg-white/90 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Indispo
                      </span>
                    </div>
                  )}
                  {book.availableCopies > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-green-400 rounded-full shadow block" />
                  )}
                  {book.pdfFile && (
                    <span className="absolute top-1.5 left-1.5 flex items-center gap-0.5 bg-green-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow">
                      <FileText className="w-2.5 h-2.5" /> Ebook
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-xs font-semibold leading-tight line-clamp-2" style={{ color: "var(--fg)" }}>{book.title}</p>
                <p className="text-[11px] truncate mt-0.5" style={{ color: "var(--muted)" }}>
                  {Array.isArray(book.author) ? book.author[0] : book.author}
                </p>
              </div>
            ))}
          </div>
        )}

        {!loading && books.length > 0 && books.length < total && (
          <div className="flex justify-center mt-6">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="px-6 py-3 rounded-xl text-sm font-semibold disabled:opacity-50"
              style={{ background: dark ? "#d42040" : "#040848", color: "#fff" }}
            >
              {loadingMore ? "Chargement…" : `Charger plus (${books.length}/${total})`}
            </button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}