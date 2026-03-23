import Navbar from "../components/navbar";
import Footer from "../components/footer";
import {
  Search, ChevronRight, BookOpen, Users, Star, ArrowRight,
  UserCircle, BookMarked, Calendar, MapPin, Lightbulb,
  LogIn, UserPlus, Bookmark, X, CheckCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getBooks, getBookStats, getRecommendations } from "../api/book";
import { getSettings } from "../api/settings";
import { getEvents, registerForEvent, unregisterFromEvent } from "../api/event";
import { useUser } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import useOnline from "../hooks/useOnline";
import toast from "react-hot-toast";

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
import rebelle from "../assets/rebelle.jpg";
import etranger from "../assets/etranger.jpg";
import rue from "../assets/rue.jpg";
import allah from "../assets/allah.jpeg";
import hero from "../assets/hero.jpg";
import aventure from "../assets/aventure.jpg"

const categories = [
  { name: "Philosophie", img: phi },
  { name: "Droit", img: dr },
  { name: "Communication", img: com },
  { name: "Littérature Ivoirienne", img: liv },
  { name: "Littérature Africaine", img: lia },
  { name: "Développement Personnel", img: dp },
  { name: "Sciences Économiques", img: seg },
  { name: "Anglais", img: ang },
  { name: "Rédaction", img: red },
  { name: "Dictionnaires", img: dic },
];


const steps = [
  {
    number: "01",
    icon: <UserPlus className="w-6 h-6" />,
    title: "Crée ton compte",
    desc: "Inscris-toi gratuitement en quelques secondes avec ton email.",
  },
  {
    number: "02",
    icon: <Search className="w-6 h-6" />,
    title: "Trouve ton livre",
    desc: "Parcours le catalogue, filtre par catégorie ou cherche directement par titre ou auteur.",
  },
  {
    number: "03",
    icon: <Bookmark className="w-6 h-6" />,
    title: "Emprunte et lis",
    desc: "Passe à la bibliothèque avec ton QR code et récupère ton livre. Simple et rapide.",
  },
];

function BookCard({ book, onClick }) {
  return (
    <div onClick={onClick} className="shrink-0 w-32 md:w-36 cursor-pointer group">
      <div className="aspect-[2/3] rounded-2xl overflow-hidden shadow-sm group-hover:shadow-lg transition-all duration-300">
        <img
          src={book.cover}
          alt={book.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <p className="mt-2 text-sm font-semibold truncate" style={{ color: "var(--fg)" }}>{book.title}</p>
      <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{Array.isArray(book.author) ? book.author[0] : book.author}</p>
    </div>
  );
}

function BookCardSkeleton() {
  return (
    <div className="shrink-0 w-32 md:w-36">
      <div className="aspect-[2/3] rounded-2xl skeleton" />
      <div className="mt-2 h-4 skeleton rounded w-4/5" />
      <div className="mt-1 h-3 skeleton rounded w-3/5" />
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { theme } = useTheme();
  const online = useOnline();
  const [search, setSearch] = useState("");
  const [books, setBooks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [events, setEvents] = useState([]);
  const [featuredBook, setFeaturedBook] = useState(undefined); // undefined = loading, null = none
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registering, setRegistering] = useState(false);
  const [registeredIds, setRegisteredIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem("registeredEvents") || "[]") } catch { return [] }
  });

  useEffect(() => {
    getBooks()
      .then(data => setBooks(Array.isArray(data) ? data : []))
      .finally(() => setLoadingBooks(false));
    getBookStats()
      .then(data => setStats(data))
      .catch(() => {});
    getEvents()
      .then(data => setEvents(Array.isArray(data) ? data.slice(0, 4) : []))
      .catch(() => {});
    getSettings()
      .then(data => setFeaturedBook(data.featuredBook || null))
      .catch(() => setFeaturedBook(null));
  }, []);

  useEffect(() => {
    if (user) {
      getRecommendations()
        .then(data => setRecommendations(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, [user]);

  const handleSearch = () => {
    if (!search.trim()) return;
    navigate(`/category/tous?search=${encodeURIComponent(search.trim())}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleRegister = async (eventId) => {
    if (!user) { navigate("/inscription"); return; }
    setRegistering(true);
    try {
      const isRegistered = registeredIds.includes(eventId);
      const res = isRegistered ? await unregisterFromEvent(eventId) : await registerForEvent(eventId);
      if (res.message) {
        const next = isRegistered
          ? registeredIds.filter(id => id !== eventId)
          : [...registeredIds, eventId];
        setRegisteredIds(next);
        localStorage.setItem("registeredEvents", JSON.stringify(next));
        // update count on selected event
        setSelectedEvent(ev => ev ? { ...ev, _registrationCount: res.count } : ev);
        toast.success(isRegistered ? "Désinscription effectuée" : "Inscription confirmée !");
      }
    } catch { toast.error("Erreur, réessaie"); }
    finally { setRegistering(false); }
  };

  const newBooks = books.slice(0, 8);
  const catalogBooks = books.slice(0, 12);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">
      <Navbar />

      {/* ── EVENT DETAIL MODAL ───────────────────────────── */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)" }}
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="relative w-full max-w-3xl max-h-[92vh] rounded-3xl overflow-hidden flex flex-col md:flex-row"
            style={{ background: "var(--surface)", display: "flex" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Poster */}
            <div className="md:w-5/12 shrink-0 relative h-44 sm:h-52 md:h-auto md:self-stretch" style={{ background: "var(--surface-alt)" }}>
              <img
                src={selectedEvent.poster}
                alt={selectedEvent.title}
                className="absolute inset-0 w-full h-full object-contain"
              />
              {new Date(selectedEvent.date) < new Date() && (
                <div className="absolute top-3 left-3">
                  <span className="px-3 py-1 rounded-full text-xs font-black" style={{ background: "var(--surface)", color: "var(--fg)" }}>Terminé</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 flex flex-col p-6 overflow-y-auto">
              <button
                onClick={() => setSelectedEvent(null)}
                className="self-end w-10 h-10 rounded-full flex items-center justify-center mb-3 shrink-0 hover:bg-[var(--row-hover)]"
              >
                <X className="w-4 h-4" />
              </button>

              <h2 className="font-black text-primary text-xl leading-tight mb-4">{selectedEvent.title}</h2>

              <div className="flex flex-col gap-2.5 mb-5">
                <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl" style={{ background: "rgba(167,30,60,0.06)" }}>
                  <Calendar className="w-4 h-4 shrink-0" style={{ color: "#A71E3C" }} />
                  <span className="text-sm font-bold capitalize" style={{ color: "#A71E3C" }}>
                    {new Date(selectedEvent.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl" style={{ background: "rgba(124,58,237,0.06)" }}>
                  <MapPin className="w-4 h-4 shrink-0" style={{ color: "#7c3aed" }} />
                  <span className="text-sm font-bold" style={{ color: "#7c3aed" }}>{selectedEvent.location}</span>
                </div>
              </div>

              <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--muted)" }}>{selectedEvent.description}</p>

              {/* CTA inscription */}
              {new Date(selectedEvent.date) >= new Date() && (
                user ? (
                  <button
                    onClick={() => handleRegister(selectedEvent._id)}
                    disabled={registering || !online}
                    title={!online ? "Action impossible hors ligne" : undefined}
                    className="w-full py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all"
                    style={{
                      background: !online ? "rgba(100,116,139,0.1)" : registeredIds.includes(selectedEvent._id) ? "rgba(5,150,105,0.08)" : (theme === "dark" ? "#d42040" : "#040848"),
                      color: !online ? "var(--muted)" : registeredIds.includes(selectedEvent._id) ? "#059669" : "#fff",
                      border: !online ? "1.5px solid #cbd5e1" : registeredIds.includes(selectedEvent._id) ? "1.5px solid #059669" : "none",
                      opacity: registering ? 0.6 : 1,
                      cursor: !online ? "not-allowed" : "pointer",
                    }}
                  >
                    {!online
                      ? "Inscription indisponible hors ligne"
                      : registeredIds.includes(selectedEvent._id)
                        ? <><CheckCircle className="w-4 h-4" /> Inscrit — Annuler</>
                        : "Je m'inscris à cet événement"
                    }
                  </button>
                ) : (
                  <div className="rounded-2xl p-4 text-center" style={{ background: "var(--border)", border: "1px dashed var(--border-md)" }}>
                    <p className="text-sm font-bold text-primary mb-3">Crée un compte pour t'inscrire à cet événement</p>
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => navigate("/inscription")}
                        className="px-5 py-2 rounded-xl text-sm font-black text-white"
                        style={{ background: "#A71E3C" }}
                      >
                        <UserPlus className="w-3.5 h-3.5 inline mr-1.5" />S'inscrire
                      </button>
                      <button
                        onClick={() => navigate("/connexion")}
                        className="px-5 py-2 rounded-xl text-sm font-semibold"
                        style={{ border: "1.5px solid var(--border-md)", color: "var(--fg)" }}
                      >
                        Se connecter
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: theme === "dark" ? "#100c0c" : "#040848", minHeight: `95vh`, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {/* Hero image background */}
        <img src={hero} alt="" className="absolute inset-0 w-full h-full object-cover opacity-[0.07] pointer-events-none" />

        {/* Dot grid */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.06]" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

        {/* Glows */}
        <div className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(167,30,60,0.22) 0%, transparent 65%)" }} />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(167,30,60,0.12) 0%, transparent 65%)" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full pointer-events-none blur-3xl" style={{ background: "rgba(255,255,255,0.02)" }} />

        <div className="relative z-10 w-full px-4 pt-16 pb-12 md:py-28 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">

            {/* ── Contenu gauche ── */}
            <div className="text-center lg:text-left">
              
              {/* Title */}
              <h1 className="text-[28px] sm:text-5xl md:text-6xl lg:text-[64px] font-black text-white leading-[1.05] mb-4 md:mb-5 tracking-tight">
                Explore.<br />Emprunte.<br />
                <span style={{ color: "#A71E3C" }}>Grandis.</span>
              </h1>

              {/* Subtitle */}
              <p className="text-white/45 text-sm md:text-base mb-4 md:mb-6 max-w-xs mx-auto lg:mx-0 leading-relaxed">
                260+ livres disponibles — explore, emprunte et suis tes lectures en un seul endroit.
              </p>

              {/* Stats pills */}
              <div className="flex items-center gap-2.5 justify-center lg:justify-start mb-5 md:mb-8 flex-wrap">
                <span className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <BookOpen className="w-3 h-3" /> 260+ livres
                </span>
                <span className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <Users className="w-3 h-3" /> 600+ membres
                </span>
                <span className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <Star className="w-3 h-3" /> Accès libre
                </span>
              </div>

              {/* Search */}
              <div className="relative max-w-md mx-auto lg:mx-0 mb-4 md:mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Titre, auteur, ISBN..."
                  className="w-full pl-11 pr-28 py-4 text-white placeholder-white/30 outline-none rounded-2xl transition-colors"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)", fontSize: "1rem" }}
                />
                <button
                  onClick={handleSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors"
                  style={{ background: "#A71E3C" }}
                >
                  Chercher
                </button>
              </div>

              {/* CTA */}
              {!user ? (
                <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                  <button
                    onClick={() => navigate("/inscription")}
                    className="inline-flex items-center gap-2 bg-white text-primary px-5 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-xl"
                    style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}
                  >
                    <UserPlus className="w-4 h-4" /> S'inscrire gratuitement
                  </button>
                  <button
                    onClick={() => navigate("/connexion")}
                    className="inline-flex items-center gap-2 text-white/75 hover:text-white px-5 py-3 rounded-xl font-semibold text-sm transition-colors"
                    style={{ border: "1px solid rgba(255,255,255,0.15)" }}
                  >
                    <LogIn className="w-4 h-4" /> Se connecter
                  </button>
                </div>
              ) : (
                <div></div>
              )}
            </div>

            {/* ── Collage livres ── */}
            <div className="flex justify-center lg:justify-end">
              {/* Mobile: fan de 3 livres */}
              <div className="relative w-56 h-44 sm:w-64 sm:h-52 lg:hidden mx-auto">
                <div className="absolute left-1/2 top-4 -translate-x-1/2 w-28 aspect-[2/3] rounded-2xl overflow-hidden z-20" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
                  <img src={rebelle} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="absolute left-6 top-8 w-22 aspect-[2/3] rounded-xl overflow-hidden z-10 -rotate-[14deg]" style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}>
                  <img src={etranger} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="absolute right-6 top-8 w-22 aspect-[2/3] rounded-xl overflow-hidden z-10 rotate-[14deg]" style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}>
                  <img src={allah} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-4 rounded-full blur-xl pointer-events-none" style={{ background: "rgba(167,30,60,0.5)" }} />
              </div>

              {/* Desktop: floating collage */}
              <div className="hidden lg:block relative h-[540px] w-full">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 aspect-[2/3] rounded-3xl overflow-hidden z-20 rotate-1" style={{ boxShadow: "0 30px 90px rgba(0,0,0,0.6)" }}>
                  <img src={rebelle} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="absolute top-6 left-8 w-32 aspect-[2/3] rounded-2xl overflow-hidden z-10 -rotate-6" style={{ boxShadow: "0 20px 50px rgba(0,0,0,0.45)" }}>
                  <img src={etranger} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="absolute top-10 right-6 w-28 aspect-[2/3] rounded-2xl overflow-hidden z-10 rotate-8" style={{ boxShadow: "0 20px 50px rgba(0,0,0,0.45)" }}>
                  <img src={rue} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="absolute bottom-12 left-12 w-28 aspect-[2/3] rounded-2xl overflow-hidden z-10 rotate-5" style={{ boxShadow: "0 20px 50px rgba(0,0,0,0.45)" }}>
                  <img src={allah} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="absolute bottom-8 right-10 w-32 aspect-[2/3] rounded-2xl overflow-hidden z-10 -rotate-4" style={{ boxShadow: "0 20px 50px rgba(0,0,0,0.45)" }}>
                  <img src={aventure} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-3xl pointer-events-none z-0" style={{ background: "rgba(167,30,60,0.2)" }} />
              </div>
            </div>

          </div>
        </div>
        
      </section>

      

      {/* ── COMMENT ÇA MARCHE ────────────────────────────── */}
      <section className="py-16 section-alt">
        <div className="w-full px-4">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-secondary mb-2">Simple & rapide</p>
            <h2 className="text-3xl md:text-4xl font-black text-primary">Comment ça marche ?</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="card relative rounded-3xl p-7 shadow-sm hover:shadow-md transition-shadow">
                <span className="absolute top-6 right-6 text-5xl font-black leading-none select-none" style={{ color: "var(--border-md)" }}>
                  {step.number}
                </span>
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                  style={{
                    background: theme === "dark" ? "rgba(167,30,60,0.12)" : "rgba(4,8,72,0.05)",
                    color: theme === "dark" ? "#d42040" : "#040848",
                  }}
                >
                  {step.icon}
                </div>
                <h3 className="font-black text-lg mb-2" style={{ color: "var(--fg)" }}>{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NOUVEAUTÉS ───────────────────────────────────── */}
      <section className="py-16">
        <div className="w-full">
          <div className="flex items-end justify-between gap-3 px-4 mb-8">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-secondary mb-1">Récemment ajoutés</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-primary">Nouveautés</h2>
            </div>
            <button
              onClick={() => navigate("/category/tous")}
              className="flex items-center gap-1.5 text-secondary font-semibold text-sm hover:gap-2.5 transition-all shrink-0"
            >
              Voir tout <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-5 px-4 overflow-x-auto hide-scrollbar pb-3">
            {loadingBooks
              ? Array(6).fill(0).map((_, i) => <BookCardSkeleton key={i} />)
              : newBooks.length > 0
                ? newBooks.map((book) => (
                    <BookCard key={book._id} book={book} onClick={() => navigate(`/book/${book._id}`)} />
                  ))
                : <p className="text-sm py-4" style={{ color: "var(--muted)" }}>Aucun livre disponible</p>
            }
          </div>
        </div>
      </section>

      {/* ── RECOMMANDATIONS ──────────────────────────────── */}
      {user && recommendations.length > 0 && (
        <section className="py-16 section-alt">
          <div className="w-full">
            <div className="flex items-end justify-between px-4 mb-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-secondary mb-1">Rien que pour toi</p>
                <h2 className="text-3xl md:text-4xl font-black text-primary flex items-center gap-2">
                  Recommandé pour vous
                </h2>
              </div>
            </div>
            <div className="flex gap-5 px-4 overflow-x-auto hide-scrollbar pb-3">
              {recommendations.map((book) => (
                <BookCard key={book._id} book={book} onClick={() => navigate(`/book/${book._id}`)} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── ACTIVITÉS ────────────────────────────────────── */}
      {events.length > 0 && (
        <section className="py-16 section-alt">
          <div className="w-full px-4">
            <div className="flex items-end justify-between gap-3 mb-10">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-widest text-secondary mb-1">Agenda</p>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-primary">Activités</h2>
              </div>
              <button
                onClick={() => navigate("/activity")}
                className="flex items-center gap-1.5 text-secondary font-semibold text-sm hover:gap-2.5 transition-all shrink-0"
              >
                Voir tout <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {events.map((event) => (
                <div
                  key={event._id}
                  onClick={() => setSelectedEvent(event)}
                  className="card rounded-3xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col cursor-pointer group"
                >
                  <div className="relative" style={{ aspectRatio: "1 / 1.414", background: "var(--surface-alt)" }}>
                    <img
                      src={event.poster}
                      alt={event.title}
                      className="absolute inset-0 w-full h-full object-contain"
                      onError={e => { e.target.parentElement.style.display = "none" }}
                    />
                  </div>
                  <div className="p-4 flex flex-col gap-3 flex-1">
                    <h3 className="font-bold text-sm leading-snug" style={{ color: "var(--fg)" }}>{event.title}</h3>
                    <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "var(--muted)" }}>{event.description}</p>
                    <div className="mt-auto flex flex-col gap-1.5 text-xs" style={{ color: "var(--muted)" }}>
                      <span className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-secondary shrink-0" />
                        {new Date(event.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                      </span>
                      <span className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-secondary shrink-0" />
                        {event.location}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CATÉGORIES ───────────────────────────────────── */}
      <section className="py-16">
        <div className="w-full px-4">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-secondary mb-1">Explorer</p>
              <h2 className="text-3xl md:text-4xl font-black text-primary">Catégories</h2>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3">
            {categories.map((cat, i) => (
              <div
                key={i}
                onClick={() => navigate(`/category/${encodeURIComponent(cat.name.toLowerCase())}`)}
                className="relative h-28 md:h-32 rounded-2xl overflow-hidden cursor-pointer group"
              >
                <img
                  src={cat.img}
                  alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent group-hover:from-primary/80 transition-colors duration-300" />
                <p className="absolute bottom-3 left-0 right-0 text-center text-white font-bold text-xs uppercase px-2 leading-tight">
                  {cat.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COUP DE CŒUR ─────────────────────────────────── */}
      {featuredBook && (
        <section className="py-16 section-alt">
          <div className="w-full px-4">
            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-widest text-secondary mb-1">Sélection</p>
              <h2 className="text-3xl md:text-4xl font-black text-primary">Coup de cœur</h2>
            </div>

            <div className="rounded-3xl overflow-hidden" style={{ background: theme === "dark" ? "#1a0d10" : "#040848" }}>
              <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-8 p-6 md:p-12">
                {/* Déco */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-secondary/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative shrink-0">
                  <div className="w-36 md:w-44 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500">
                    <img src={featuredBook.cover} alt={featuredBook.title} className="w-full h-full object-cover" />
                  </div>
                </div>

                <div className="relative text-white text-center md:text-left">
                  <span className="inline-block bg-secondary text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
                    Coup de cœur
                  </span>
                  <h3 className="text-3xl md:text-4xl font-black mb-1">{featuredBook.title}</h3>
                  <p className="text-white/55 mb-3 text-sm">
                    {Array.isArray(featuredBook.author) ? featuredBook.author[0] : featuredBook.author}
                  </p>
                  <div className="flex items-center gap-1 justify-center md:justify-start mb-5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-secondary text-secondary" />
                    ))}
                  </div>
                  <button
                    onClick={() => navigate(`/book/${featuredBook._id}`)}
                    className="inline-flex items-center gap-2 bg-secondary hover:bg-secondary/90 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors"
                  >
                    Voir le livre <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── CATALOGUE ────────────────────────────────────── */}
      {(loadingBooks || catalogBooks.length > 0) && <section className="py-16">
        <div className="w-full px-4">
          <div className="flex items-end justify-between gap-3 mb-8">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-secondary mb-1">Toute la collection</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-primary">Catalogue</h2>
            </div>
            <button
              onClick={() => navigate("/category/tous")}
              className="flex items-center gap-1.5 text-secondary font-semibold text-sm hover:gap-2.5 transition-all shrink-0"
            >
              Voir tout <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {loadingBooks
              ? Array(12).fill(0).map((_, i) => (
                  <div key={i}>
                    <div className="aspect-[2/3] rounded-2xl skeleton" />
                    <div className="mt-2 h-4 skeleton rounded w-4/5" />
                    <div className="mt-1 h-3 skeleton rounded w-3/5" />
                  </div>
                ))
              : catalogBooks.map((book) => (
                  <div
                    key={book._id + "-cat"}
                    onClick={() => navigate(`/book/${book._id}`)}
                    className="cursor-pointer group"
                  >
                    <div className="aspect-[2/3] rounded-2xl overflow-hidden shadow-sm group-hover:shadow-lg transition-all duration-300">
                      <img
                        src={book.cover}
                        alt={book.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <p className="mt-2 text-sm font-semibold truncate" style={{ color: "var(--fg)" }}>{book.title}</p>
                    <p className="text-xs truncate" style={{ color: "var(--muted)" }}>
                      {Array.isArray(book.author) ? book.author[0] : book.author}
                    </p>
                  </div>
                ))
            }
          </div>
        </div>
      </section>}

      {/* ── CITATION ─────────────────────────────────────── */}
      <section className="py-16" style={{ background: theme === "dark" ? "#100c0c" : "#040848", borderTop: theme === "dark" ? "1px solid rgba(167,30,60,0.15)" : "none" }}>
        <div className="w-full px-4 text-center">
          <Lightbulb className="w-8 h-8 text-secondary mx-auto mb-6 opacity-80" />
          <blockquote className="text-xl md:text-3xl font-black text-white leading-snug mb-5">
            « Un lecteur vit mille vies avant de mourir. Celui qui ne lit jamais n'en vit qu'une. »
          </blockquote>
          <p className="text-white/40 text-sm font-medium tracking-wide">— George R.R. Martin</p>
        </div>
      </section>

    

      <Footer />
    </div>
  );
}
