import {
  Zap,
  Share2,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Clock,
  Shield,
} from "lucide-react";

// ── Driveway SVG illustration ──────────────────────────────────────────
const DrivewaySVG = () => (
  <svg
    viewBox="0 0 480 320"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full h-full"
  >
    {/* Sky/background */}
    <rect width="480" height="320" fill="#0f172a" />
    {/* Grass */}
    <ellipse cx="240" cy="290" rx="260" ry="80" fill="#14532d" opacity="0.6" />
    {/* House silhouette */}
    <rect x="150" y="100" width="180" height="120" fill="#1e293b" />
    <polygon points="140,100 240,40 340,100" fill="#334155" />
    {/* Door */}
    <rect x="215" y="170" width="50" height="50" rx="4" fill="#0f172a" />
    <circle cx="258" cy="197" r="3" fill="#f59e0b" />
    {/* Windows */}
    <rect
      x="160"
      y="120"
      width="40"
      height="35"
      rx="3"
      fill="#1d4ed8"
      opacity="0.7"
    />
    <rect
      x="280"
      y="120"
      width="40"
      height="35"
      rx="3"
      fill="#1d4ed8"
      opacity="0.7"
    />
    {/* Window glow */}
    <rect
      x="160"
      y="120"
      width="40"
      height="35"
      rx="3"
      fill="#60a5fa"
      opacity="0.15"
    />
    <rect
      x="280"
      y="120"
      width="40"
      height="35"
      rx="3"
      fill="#60a5fa"
      opacity="0.15"
    />
    {/* Driveway — trapezoid */}
    <polygon points="190,220 290,220 320,300 160,300" fill="#1e293b" />
    {/* Asphalt texture lines */}
    <line
      x1="175"
      y1="260"
      x2="305"
      y2="260"
      stroke="#334155"
      strokeWidth="1"
      opacity="0.6"
    />
    <line
      x1="182"
      y1="278"
      x2="310"
      y2="278"
      stroke="#334155"
      strokeWidth="1"
      opacity="0.6"
    />
    {/* Corner detection dots */}
    <circle cx="190" cy="220" r="6" fill="#3b82f6" />
    <circle cx="290" cy="220" r="6" fill="#3b82f6" />
    <circle cx="320" cy="300" r="6" fill="#3b82f6" />
    <circle cx="160" cy="300" r="6" fill="#3b82f6" />
    {/* Corner lines overlay */}
    <polygon
      points="190,220 290,220 320,300 160,300"
      fill="none"
      stroke="#3b82f6"
      strokeWidth="2"
      strokeDasharray="6 3"
    />
    {/* Measurement badge */}
    <rect x="196" y="252" width="88" height="22" rx="11" fill="#1d4ed8" />
    <text
      x="240"
      y="267"
      textAnchor="middle"
      fill="white"
      fontSize="10"
      fontFamily="monospace"
      fontWeight="bold"
    >
      ~640 sq ft
    </text>
    {/* Stars */}
    <circle cx="60" cy="30" r="1.5" fill="white" opacity="0.6" />
    <circle cx="120" cy="15" r="1" fill="white" opacity="0.4" />
    <circle cx="380" cy="25" r="1.5" fill="white" opacity="0.6" />
    <circle cx="430" cy="50" r="1" fill="white" opacity="0.4" />
    <circle cx="50" cy="80" r="1" fill="white" opacity="0.3" />
    <circle cx="440" cy="10" r="2" fill="white" opacity="0.5" />
  </svg>
);

// ── Animated counter ──────────────────────────────────────────────────
const stats = [
  { value: "< 30s", label: "Time to estimate" },
  { value: "±5%", label: "Measurement accuracy" },
  { value: "4", label: "Material types" },
  { value: "100%", label: "Free to start" },
];

const steps = [
  {
    n: "01",
    title: "Capture",
    desc: "Snap a photo from any angle. Works with existing photos too.",
    color: "#3b82f6",
  },
  {
    n: "02",
    title: "Detect",
    desc: "AI maps your driveway corners and calculates exact square footage.",
    color: "#8b5cf6",
  },
  {
    n: "03",
    title: "Price",
    desc: "Get real material costs for your zip code—hotmix, millings, gravel, tar & chip.",
    color: "#10b981",
  },
  {
    n: "04",
    title: "Share",
    desc: "Send a professional estimate link directly to contractors.",
    color: "#f59e0b",
  },
];

const materials = [
  {
    name: "Hot Mix Asphalt",
    tag: "Most popular",
    color: "#1e293b",
    accent: "#3b82f6",
    desc: "Durable, smooth finish. Best for long driveways.",
  },
  {
    name: "Asphalt Millings",
    tag: "Budget pick",
    color: "#1e293b",
    accent: "#10b981",
    desc: "Recycled material, eco-friendly and affordable.",
  },
  {
    name: "Tar & Chip",
    tag: "Unique look",
    color: "#1e293b",
    accent: "#f59e0b",
    desc: "Textured stone surface, great traction.",
  },
  {
    name: "Gravel",
    tag: "Low cost",
    color: "#1e293b",
    accent: "#8b5cf6",
    desc: "Easy install, excellent drainage.",
  },
];

export default function Home() {
  const primaryCtaHref = "/estimator";
  const primaryCtaLabel = "Open Estimator";
  const secondaryCtaHref = "/dashboard";

  return (
    <>
      <main className="min-[1120px]:hidden min-h-screen overflow-x-hidden bg-[#0c120f] text-slate-100">
        <nav className="sticky top-0 z-50 border-b border-white/8 bg-[#0c120f]/92 backdrop-blur">
          <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="8" fill="#059669" />
                <polygon
                  points="8,24 16,8 24,24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <line
                  x1="10"
                  y1="19"
                  x2="22"
                  y2="19"
                  stroke="white"
                  strokeWidth="2"
                />
              </svg>
              <span className="text-base font-extrabold text-white">
                Driveway<span className="text-emerald-400">AI</span>
              </span>
            </div>
            <a
              href={secondaryCtaHref}
              className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm font-semibold text-slate-100"
            >
              Saved Projects
            </a>
          </div>
        </nav>

        <section className="border-b border-white/6 px-4 pb-8 pt-8">
          <div className="mx-auto flex max-w-xl flex-col gap-6">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Powered by OpenAI Vision
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-black leading-tight text-white">
                Measure your driveway from one photo.
              </h1>
              <p className="text-base leading-7 text-slate-300">
                Snap a picture, detect the driveway shape, estimate square
                footage, and price materials in under 30 seconds.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <a
                href={primaryCtaHref}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 text-base font-bold text-white shadow-[0_8px_24px_rgba(16,185,129,0.35)]"
              >
                {primaryCtaLabel}
                <ArrowRight size={18} />
              </a>
              <a
                href={secondaryCtaHref}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/6 px-5 py-3.5 text-base font-semibold text-slate-100"
              >
                View Projects
                <Share2 size={18} />
              </a>
            </div>

            <div className="overflow-hidden rounded-3xl border border-blue-400/20 bg-[#0d1729] shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
              <div className="flex items-center gap-2 border-b border-white/6 bg-[#0f172a] px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span className="ml-2 text-xs text-slate-500">
                  drivewayai.app/estimator
                </span>
              </div>
              <div className="bg-[#0d1729] p-3">
                <div className="overflow-hidden rounded-2xl border border-blue-500/10">
                  <DrivewaySVG />
                </div>
              </div>
              <div className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-slate-400">Detected area</span>
                <span className="font-bold text-emerald-300">640 sq ft</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {stats.map(item => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/8 bg-white/5 p-4"
                >
                  <div className="text-2xl font-black text-white">
                    {item.value}
                  </div>
                  <div className="mt-1 text-sm text-slate-400">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-8">
          <div className="mx-auto max-w-xl space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-300">
                How It Works
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">
                Four fast steps to a clean estimate
              </h2>
            </div>
            <ol className="space-y-3">
              {steps.map(step => (
                <li
                  key={step.n}
                  className="rounded-2xl border border-white/8 bg-white/5 p-4"
                >
                  <div className="mb-2 flex items-center gap-3">
                    <span
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-black"
                      style={{
                        background: `${step.color}22`,
                        color: step.color,
                      }}
                    >
                      {step.n}
                    </span>
                    <span className="text-lg font-bold text-white">
                      {step.title}
                    </span>
                  </div>
                  <p className="text-sm leading-6 text-slate-300">
                    {step.desc}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-t border-white/6 px-4 py-8">
          <div className="mx-auto max-w-xl space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-300">
                Materials
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">
                Instant material pricing
              </h2>
            </div>
            <div className="space-y-3">
              {materials.map(material => (
                <article
                  key={material.name}
                  className="rounded-2xl border bg-[#0d1729] p-4"
                  style={{ borderColor: `${material.accent}33` }}
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h3 className="text-base font-bold text-white">
                      {material.name}
                    </h3>
                    <span
                      className="rounded-full px-2.5 py-1 text-xs font-semibold"
                      style={{
                        background: `${material.accent}18`,
                        border: `1px solid ${material.accent}33`,
                        color: material.accent,
                      }}
                    >
                      {material.tag}
                    </span>
                  </div>
                  <p className="text-sm leading-6 text-slate-300">
                    {material.desc}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-8">
          <div className="mx-auto grid max-w-xl gap-3 rounded-3xl border border-white/8 bg-white/5 p-4">
            {[
              {
                icon: <MapPin size={18} />,
                title: "Zip-aware pricing",
                desc: "Material cost is based on regional pricing near the project.",
              },
              {
                icon: <Clock size={18} />,
                title: "Fast capture",
                desc: "Grant permissions once and start capturing driveway photos right away.",
              },
              {
                icon: <Shield size={18} />,
                title: "Device workspace",
                desc: "The app keeps estimates, AI previews, and saved projects tied to this device workspace automatically.",
              },
            ].map(item => (
              <div
                key={item.title}
                className="flex gap-3 rounded-2xl border border-white/8 bg-[#0d1729] p-4"
              >
                <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-300">
                  {item.icon}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-white/6 px-4 py-10">
          <div className="mx-auto max-w-xl rounded-3xl border border-white/8 bg-[#0d1729] p-6 text-center">
            <h2 className="text-2xl font-black text-white">
              Ready to measure your driveway?
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Grant permissions once, capture the driveway, then build a full
              material and labor estimate from the same workflow.
            </p>
            <div className="mt-5 flex flex-col gap-3">
              <a
                href={primaryCtaHref}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 text-base font-bold text-white"
              >
                {primaryCtaLabel}
                <ArrowRight size={18} />
              </a>
              <a
                href={secondaryCtaHref}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/6 px-5 py-3.5 text-base font-semibold text-slate-100"
              >
                Open Projects
                <BarChart3 size={18} />
              </a>
            </div>
          </div>
        </section>

        <footer className="border-t border-white/6 px-4 py-6">
          <div className="mx-auto flex max-w-xl flex-col gap-2 text-sm text-slate-500">
            <span className="font-semibold text-slate-400">
              DrivewayAI © 2026
            </span>
            <span>Powered by OpenAI Vision and regional pricing data.</span>
          </div>
        </footer>
      </main>

      <div
        className="hidden min-[1120px]:block min-h-screen overflow-x-auto"
        style={{
          background: "#0c120f",
          WebkitOverflowScrolling: "touch",
          overscrollBehaviorX: "contain",
        }}
      >
        <div
          className="min-h-screen"
          style={{
            background: "#0c120f",
            color: "#e2e8f0",
            fontFamily: "system-ui, sans-serif",
            minWidth: 1120,
          }}
        >
          {/* ── Global keyframes ── */}
          <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(1);   opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        @keyframes scan {
          0%   { top: 10%; opacity: 1; }
          90%  { top: 85%; opacity: 1; }
          100% { top: 85%; opacity: 0; }
        }
        .fade-up   { animation: fadeUp 0.7s ease both; }
        .delay-1   { animation-delay: 0.1s; }
        .delay-2   { animation-delay: 0.2s; }
        .delay-3   { animation-delay: 0.35s; }
        .delay-4   { animation-delay: 0.5s; }
        .float-anim { animation: float 4s ease-in-out infinite; }
        .scan-line {
          position: absolute; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, transparent, #10b981, transparent);
          animation: scan 3s ease-in-out infinite;
          box-shadow: 0 0 8px #10b981;
        }
        .glow-blue  { box-shadow: 0 0 32px rgba(16,185,129,0.28); }
        .glow-green { box-shadow: 0 0 24px rgba(16,185,129,0.25); }
        .card-hover { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.5); }
        .btn-primary {
          background: linear-gradient(135deg, #047857, #10b981);
          color: white; border: none; border-radius: 10px;
          padding: 14px 32px; font-size: 16px; font-weight: 700;
          cursor: pointer; transition: all 0.2s ease;
          box-shadow: 0 4px 20px rgba(16,185,129,0.35);
          display: inline-flex; align-items: center; gap: 8px;
          text-decoration: none;
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(16,185,129,0.5); }
        .btn-secondary {
          background: rgba(255,255,255,0.06); color: #cbd5e1;
          border: 1px solid rgba(255,255,255,0.12); border-radius: 10px;
          padding: 14px 28px; font-size: 15px; font-weight: 600;
          cursor: pointer; transition: all 0.2s ease;
          display: inline-flex; align-items: center; gap: 8px;
          text-decoration: none;
        }
        .btn-secondary:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.22); color: white; }
        .grid-dots {
          background-image: radial-gradient(rgba(148,163,184,0.08) 1px, transparent 1px);
          background-size: 28px 28px;
        }
        .noise::after {
          content: '';
          position: absolute; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
          opacity: 0.4;
        }
        .step-line::after {
          content: '';
          position: absolute; top: 22px; left: calc(50% + 28px);
          width: calc(100% - 56px); height: 1px;
          background: linear-gradient(90deg, rgba(59,130,246,0.4), rgba(59,130,246,0.05));
        }
        `}</style>

          {/* ── NAV ── */}
          <nav
            style={{
              position: "sticky",
              top: 0,
              zIndex: 50,
              background: "rgba(12,18,15,0.88)",
              backdropFilter: "blur(16px)",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              style={{
                maxWidth: 1100,
                margin: "0 auto",
                padding: "0 24px",
                height: 64,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              {/* Logo */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <rect width="32" height="32" rx="8" fill="#059669" />
                  <polygon
                    points="8,24 16,8 24,24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <line
                    x1="10"
                    y1="19"
                    x2="22"
                    y2="19"
                    stroke="white"
                    strokeWidth="2"
                  />
                  <circle cx="8" cy="24" r="2" fill="#60a5fa" />
                  <circle cx="24" cy="24" r="2" fill="#60a5fa" />
                  <circle cx="16" cy="8" r="2" fill="#60a5fa" />
                </svg>
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: 18,
                    color: "white",
                    letterSpacing: "-0.3px",
                  }}
                >
                  Driveway<span style={{ color: "#10b981" }}>AI</span>
                </span>
              </div>
              {/* Nav actions */}
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <a
                  href="/dashboard"
                  className="btn-secondary"
                  style={{ padding: "9px 18px", fontSize: 14 }}
                >
                  Saved Projects
                </a>
                <a
                  href="/estimator"
                  className="btn-primary"
                  style={{ padding: "9px 20px", fontSize: 14 }}
                >
                  Launch Estimator <ArrowRight size={14} />
                </a>
              </div>
            </div>
          </nav>

          {/* ── HERO ── */}
          <section
            className="grid-dots noise"
            style={{
              position: "relative",
              overflow: "hidden",
              padding: "80px 24px 60px",
            }}
          >
            {/* Glow orbs */}
            <div
              style={{
                position: "absolute",
                top: -100,
                left: "20%",
                width: 500,
                height: 500,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(16,185,129,0.16) 0%, transparent 70%)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: -80,
                right: "10%",
                width: 400,
                height: 400,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)",
                pointerEvents: "none",
              }}
            />

            <div
              style={{
                maxWidth: 1100,
                margin: "0 auto",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 48,
                alignItems: "center",
              }}
            >
              {/* Left — copy */}
              <div>
                <div
                  className="fade-up"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: "rgba(16,185,129,0.12)",
                    border: "1px solid rgba(16,185,129,0.25)",
                    borderRadius: 99,
                    padding: "5px 14px",
                    marginBottom: 24,
                    fontSize: 13,
                    color: "#a7f3d0",
                    fontWeight: 600,
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "#10b981",
                      display: "inline-block",
                      position: "relative",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        inset: -3,
                        borderRadius: "50%",
                        background: "#10b981",
                        animation: "pulse-ring 1.5s ease-out infinite",
                      }}
                    />
                  </span>
                  Powered by OpenAI Vision
                </div>

                <h1
                  className="fade-up delay-1"
                  style={{
                    fontSize: "clamp(2rem, 4vw, 3.2rem)",
                    fontWeight: 900,
                    lineHeight: 1.1,
                    letterSpacing: "-1px",
                    color: "white",
                    marginBottom: 20,
                  }}
                >
                  Measure any driveway
                  <br />
                  <span
                    style={{
                      background: "linear-gradient(135deg, #10b981, #f59e0b)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    in under 30 seconds.
                  </span>
                </h1>

                <p
                  className="fade-up delay-2"
                  style={{
                    fontSize: 17,
                    lineHeight: 1.7,
                    color: "#94a3b8",
                    maxWidth: 460,
                    marginBottom: 32,
                  }}
                >
                  Snap a photo. AI detects your driveway boundary, calculates
                  square footage, fetches real material prices for your zip
                  code, and generates a contractor-ready estimate.
                </p>

                <div
                  className="fade-up delay-3"
                  style={{
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                    marginBottom: 40,
                  }}
                >
                  <a href="/estimator" className="btn-primary">
                    Open Estimator <ArrowRight size={16} />
                  </a>
                  <a href="/dashboard" className="btn-secondary">
                    View Projects
                  </a>
                </div>

                <div
                  className="fade-up delay-4"
                  style={{ display: "flex", gap: 20, flexWrap: "wrap" }}
                >
                  {[
                    "No measurements needed",
                    "Works on any phone",
                    "Instant pricing",
                  ].map(t => (
                    <div
                      key={t}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 13,
                        color: "#64748b",
                      }}
                    >
                      <CheckCircle2 size={14} style={{ color: "#10b981" }} />
                      {t}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right — SVG mockup */}
              <div
                className="fade-up delay-2 float-anim"
                style={{ position: "relative" }}
              >
                <div
                  className="glow-blue"
                  style={{
                    borderRadius: 20,
                    overflow: "hidden",
                    border: "1px solid rgba(59,130,246,0.2)",
                    background: "#0d1729",
                  }}
                >
                  {/* Mock phone chrome */}
                  <div
                    style={{
                      background: "#0f172a",
                      padding: "10px 16px",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: "#ef4444",
                      }}
                    />
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: "#f59e0b",
                      }}
                    />
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: "#10b981",
                      }}
                    />
                    <div
                      style={{
                        flex: 1,
                        background: "rgba(255,255,255,0.05)",
                        borderRadius: 6,
                        height: 20,
                        marginLeft: 8,
                        display: "flex",
                        alignItems: "center",
                        paddingLeft: 8,
                      }}
                    >
                      <span style={{ fontSize: 11, color: "#475569" }}>
                        drivewayai.app/estimator
                      </span>
                    </div>
                  </div>
                  {/* Scan line animation overlay */}
                  <div style={{ position: "relative" }}>
                    <div className="scan-line" />
                    <DrivewaySVG />
                  </div>
                  {/* Result badge */}
                  <div
                    style={{
                      padding: "12px 16px",
                      background: "#0d1729",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ fontSize: 13, color: "#94a3b8" }}>
                      Detected area
                    </div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: "#3b82f6",
                      }}
                    >
                      640 sq ft — $2,180
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats bar */}
            <div
              style={{
                maxWidth: 1100,
                margin: "56px auto 0",
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 1,
                background: "rgba(255,255,255,0.05)",
                borderRadius: 16,
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              {stats.map((s, i) => (
                <div
                  key={i}
                  style={{
                    padding: "24px",
                    background: "rgba(13,23,41,0.9)",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "clamp(1.4rem, 2.5vw, 2rem)",
                      fontWeight: 900,
                      color: "white",
                      letterSpacing: "-0.5px",
                    }}
                  >
                    {s.value}
                  </div>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── HOW IT WORKS ── */}
          <section style={{ padding: "96px 24px", position: "relative" }}>
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>
              <div style={{ textAlign: "center", marginBottom: 64 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#3b82f6",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    marginBottom: 12,
                  }}
                >
                  How it works
                </div>
                <h2
                  style={{
                    fontSize: "clamp(1.8rem, 3vw, 2.5rem)",
                    fontWeight: 900,
                    color: "white",
                    letterSpacing: "-0.5px",
                  }}
                >
                  Four steps to your estimate
                </h2>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 24,
                  position: "relative",
                }}
              >
                {steps.map((s, i) => (
                  <div
                    key={i}
                    className="card-hover"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 16,
                      padding: "28px 24px",
                      position: "relative",
                      borderTop: `3px solid ${s.color}`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 40,
                        fontWeight: 900,
                        color: s.color,
                        opacity: 0.18,
                        lineHeight: 1,
                        marginBottom: 12,
                        fontFamily: "monospace",
                      }}
                    >
                      {s.n}
                    </div>
                    <h3
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color: "white",
                        marginBottom: 10,
                      }}
                    >
                      {s.title}
                    </h3>
                    <p
                      style={{
                        fontSize: 14,
                        lineHeight: 1.7,
                        color: "#64748b",
                      }}
                    >
                      {s.desc}
                    </p>
                    <div
                      style={{
                        position: "absolute",
                        top: 20,
                        right: 20,
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: `${s.color}22`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 800,
                          color: s.color,
                        }}
                      >
                        {i + 1}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── MATERIALS ── */}
          <section style={{ padding: "0 24px 96px" }}>
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>
              <div style={{ textAlign: "center", marginBottom: 56 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#10b981",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    marginBottom: 12,
                  }}
                >
                  Materials
                </div>
                <h2
                  style={{
                    fontSize: "clamp(1.8rem, 3vw, 2.5rem)",
                    fontWeight: 900,
                    color: "white",
                    letterSpacing: "-0.5px",
                  }}
                >
                  Every surface, priced instantly
                </h2>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 20,
                }}
              >
                {materials.map((m, i) => (
                  <div
                    key={i}
                    className="card-hover"
                    style={{
                      background: "#0d1729",
                      border: `1px solid ${m.accent}33`,
                      borderRadius: 16,
                      padding: "28px",
                      display: "flex",
                      gap: 20,
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: `${m.accent}18`,
                        border: `1px solid ${m.accent}40`,
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 4,
                          background: m.accent,
                          opacity: 0.8,
                        }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          marginBottom: 6,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 16,
                            fontWeight: 800,
                            color: "white",
                          }}
                        >
                          {m.name}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: m.accent,
                            background: `${m.accent}18`,
                            padding: "2px 8px",
                            borderRadius: 99,
                            border: `1px solid ${m.accent}33`,
                          }}
                        >
                          {m.tag}
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: 14,
                          color: "#64748b",
                          lineHeight: 1.6,
                        }}
                      >
                        {m.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── TRUST BADGES ── */}
          <section style={{ padding: "0 24px 96px" }}>
            <div
              style={{
                maxWidth: 1100,
                margin: "0 auto",
                background: "linear-gradient(135deg, #0d1729, #0a1628)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 24,
                padding: "48px",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 40,
                  alignItems: "center",
                }}
              >
                {[
                  {
                    icon: <Zap size={22} style={{ color: "#f59e0b" }} />,
                    title: "Instant results",
                    desc: "AI processes your photo in seconds — no waiting, no back-and-forth.",
                  },
                  {
                    icon: <MapPin size={22} style={{ color: "#3b82f6" }} />,
                    title: "Local pricing",
                    desc: "Material costs are fetched for your exact zip code in real-time.",
                  },
                  {
                    icon: <Shield size={22} style={{ color: "#10b981" }} />,
                    title: "Contractor-ready",
                    desc: "Shareable links with full measurement breakdowns professionals trust.",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: 16,
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          color: "white",
                          marginBottom: 4,
                        }}
                      >
                        {item.title}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: "#64748b",
                          lineHeight: 1.6,
                        }}
                      >
                        {item.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── CTA ── */}
          <section style={{ padding: "0 24px 96px" }}>
            <div
              style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}
            >
              <h2
                style={{
                  fontSize: "clamp(2rem, 4vw, 3rem)",
                  fontWeight: 900,
                  color: "white",
                  letterSpacing: "-0.5px",
                  marginBottom: 16,
                }}
              >
                Ready to measure your driveway?
              </h2>
              <p
                style={{
                  fontSize: 17,
                  color: "#64748b",
                  marginBottom: 36,
                  lineHeight: 1.7,
                }}
              >
                No tape measure. No contractor visit. Just a photo and 30
                seconds.
              </p>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <a
                  href="/estimator"
                  className="btn-primary"
                  style={{ fontSize: 17, padding: "16px 36px" }}
                >
                  Open Estimator <ArrowRight size={18} />
                </a>
                <a
                  href="/dashboard"
                  className="btn-secondary"
                  style={{ fontSize: 17, padding: "16px 36px" }}
                >
                  Saved Projects
                </a>
              </div>
            </div>
          </section>

          {/* ── FOOTER ── */}
          <footer
            style={{
              borderTop: "1px solid rgba(255,255,255,0.06)",
              padding: "28px 24px",
            }}
          >
            <div
              style={{
                maxWidth: 1100,
                margin: "0 auto",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
                  <rect width="32" height="32" rx="8" fill="#1d4ed8" />
                  <polygon
                    points="8,24 16,8 24,24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <line
                    x1="10"
                    y1="19"
                    x2="22"
                    y2="19"
                    stroke="white"
                    strokeWidth="2"
                  />
                </svg>
                <span
                  style={{ fontWeight: 700, fontSize: 15, color: "#475569" }}
                >
                  DriveWayAI &copy; 2026
                </span>
              </div>
              <span style={{ fontSize: 13, color: "#334155" }}>
                Powered by OpenAI Vision &amp; real-time regional pricing
              </span>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}
