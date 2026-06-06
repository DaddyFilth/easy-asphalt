import {
  ArrowRight,
  BarChart3,
  Camera,
  CheckCircle2,
  Clock,
  Crown,
  DollarSign,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Ruler,
  Send,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

type FeatureButton = {
  title: string;
  detail: string;
  href: string;
  icon: LucideIcon;
  accent: string;
};

type Step = {
  title: string;
  copy: string;
  icon: LucideIcon;
};

const primaryCtaHref = "/estimator?start=camera";
const secondaryCtaHref = "/dashboard";

const featureButtons: FeatureButton[] = [
  {
    title: "Capture",
    detail: "Camera or upload",
    href: "/estimator?start=camera",
    icon: Camera,
    accent: "#39ff14",
  },
  {
    title: "Measure",
    detail: "AI boundary scan",
    href: "/estimator?feature=measure",
    icon: Ruler,
    accent: "#64d8ff",
  },
  {
    title: "Live View",
    detail: "Real-time overlay",
    href: "/live",
    icon: ImageIcon,
    accent: "#ffb84c",
  },
  {
    title: "Quote",
    detail: "Materials, labor, extras",
    href: "/estimator?feature=quote",
    icon: DollarSign,
    accent: "#d8ffe8",
  },
];

const materialOptions = [
  { id: "hotmix", label: "Hot Mix Asphalt", icon: "🛣️", border: "border-zinc-600", bg: "bg-zinc-800", color: "#a8a8a8" },
  { id: "millings", label: "Asphalt Millings", icon: "♻️", border: "border-zinc-500", bg: "bg-zinc-700", color: "#8a8a8a" },
  { id: "tar_and_chip", label: "Tar & Chip", icon: "🪨", border: "border-amber-700", bg: "bg-amber-900", color: "#d4a574" },
  { id: "gravel", label: "Gravel", icon: "⚫", border: "border-stone-500", bg: "bg-stone-700", color: "#b8a88a" },
];

const steps: Step[] = [
  {
    title: "Capture",
    copy: "Start with a driveway photo, then measure and quote.",
    icon: Camera,
  },
  {
    title: "Detect",
    copy: "AI maps the driveway boundary and calculates the square footage.",
    icon: Zap,
  },
  {
    title: "Price",
    copy: "Add material cost, labor cost, and job extras before the final quote.",
    icon: DollarSign,
  },
  {
    title: "Share",
    copy: "Save the accepted job and send a clean project summary.",
    icon: Send,
  },
];

const materials = [
  "Hot Mix Asphalt",
  "Asphalt Millings",
  "Tar & Chip",
  "Gravel",
];

const trustItems = [
  { label: "AI powered measuring", icon: Sparkles },
  { label: "GPS aware pricing", icon: MapPin },
  { label: "Secure device access", icon: Shield },
  { label: "Fast field workflow", icon: Clock },
];

export default function Home() {
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showEstimate, setShowEstimate] = useState(false);

  const generatePreview = trpc.projects.generateLandingPreview.useMutation();
  const pricingQuery = trpc.projects.getLandingPricing.useQuery(
    { material: (selectedMaterial ?? "hotmix") as "hotmix" | "millings" | "tar_and_chip" | "gravel", zipCode: "10001" },
    { enabled: !!selectedMaterial }
  );

  const handleMaterialSelect = async (material: string) => {
    setSelectedMaterial(material);
    try {
      const result = await generatePreview.mutateAsync({
        material: material as "hotmix" | "millings" | "tar_and_chip" | "gravel",
        photoUrl: `${window.location.origin}/landing-driveway-visual.png`,
      });
      if (result.previewUrl) setPreviewUrl(result.previewUrl);
    } catch {
      // Server may not have Gemini configured; CSS overlay fallback used
    }
  };

  const materialOverlay = materialOptions.find(m => m.id === selectedMaterial);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#1a2e28] text-white">
      <style>{`
        @keyframes landing-rise {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes landing-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        @keyframes landing-scan {
          0% { transform: translateY(-80%); opacity: 0; }
          18%, 82% { opacity: 1; }
          100% { transform: translateY(420%); opacity: 0; }
        }

        @keyframes landing-sheen {
          0% { transform: translateX(-120%) skewX(-18deg); opacity: 0; }
          18%, 55% { opacity: 0.42; }
          100% { transform: translateX(220%) skewX(-18deg); opacity: 0; }
        }

        @keyframes landing-border {
          0%, 100% { border-color: rgba(255,255,255,0.10); }
          50% { border-color: rgba(57,255,20,0.42); }
        }

        @media (prefers-reduced-motion: no-preference) {
          .landing-rise { animation: landing-rise 640ms ease both; }
          .landing-float { animation: landing-float 6s ease-in-out infinite; }
          .landing-scan { animation: landing-scan 3.6s ease-in-out infinite; }
          .landing-sheen::after { animation: landing-sheen 3.8s ease-in-out infinite; }
          .landing-border { animation: landing-border 4.2s ease-in-out infinite; }
        }

        .landing-sheen {
          position: relative;
          isolation: isolate;
          overflow: hidden;
        }

        .landing-sheen::after {
          content: "";
          position: absolute;
          inset: -35% auto -35% -45%;
          width: 34%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.78), transparent);
          pointer-events: none;
          z-index: -1;
        }
      `}</style>

      <header className="relative isolate overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/landing-driveway-visual.png')",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(26,46,40,0.92) 0%, rgba(26,46,40,0.78) 42%, rgba(26,46,40,0.30) 100%)",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-35"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#1a2e28] to-transparent"
        />

        <nav className="relative z-10 border-b border-white/10 bg-[#1a2e28]/72 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
            <a
              href="/"
              aria-label="DrivewayAI home"
              className="flex min-w-0 items-center gap-3"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#39ff14]/35 bg-[#39ff14]/12 shadow-[0_0_28px_rgba(57,255,20,0.24)]">
                <Ruler className="h-5 w-5 text-[#39ff14]" />
              </span>
              <span className="text-base font-black text-white">
                Driveway<span className="text-[#39ff14]">AI</span>
              </span>
            </a>

            <div className="flex items-center gap-2">
              <a
                href="/pricing"
                className="inline-flex h-10 items-center justify-center rounded-lg border border-purple-500/40 bg-purple-500/10 px-3 text-sm font-bold text-purple-300 transition hover:bg-purple-500/20 focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <Crown className="w-4 h-4 mr-2" />
                Premium
              </a>
              <a
                href={secondaryCtaHref}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-white/12 bg-white/8 px-3 text-sm font-bold text-white transition hover:bg-white/14 focus:outline-none focus:ring-2 focus:ring-[#64d8ff]"
              >
                Saved Projects
              </a>
              <a
                href={primaryCtaHref}
                className="landing-sheen hidden h-10 items-center justify-center gap-2 rounded-lg border border-[#39ff14]/40 bg-[#0f7c43] px-4 text-sm font-black text-white shadow-[0_10px_32px_rgba(57,255,20,0.22)] transition hover:-translate-y-0.5 hover:bg-[#119653] focus:outline-none focus:ring-2 focus:ring-[#d8ffe8] sm:inline-flex"
              >
                Open Estimator
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </nav>

        <section className="relative z-10 mx-auto grid min-h-0 max-w-7xl items-center gap-6 px-4 py-4 sm:min-h-[60svh] sm:gap-8 sm:px-6 sm:py-14 lg:grid-cols-[1.02fr_0.98fr] lg:px-8">
          <div className="landing-rise max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-lg border border-[#39ff14]/25 bg-[#39ff14]/10 px-3 py-2 text-xs font-black uppercase text-[#d8ffe8]">
              <Sparkles className="h-4 w-4 text-[#39ff14]" />
              AI sales estimator
            </span>

            <h1 className="mt-6 max-w-2xl text-[2.25rem] font-black leading-[0.98] text-white sm:text-6xl lg:text-7xl">
              Close driveway jobs faster.
            </h1>

            <p className="mt-5 max-w-xl text-base font-medium leading-7 text-[#d7e1dc] sm:text-lg sm:leading-8">
              Capture the driveway, map the surface, preview materials, and
              build the quote while you are still on site.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={primaryCtaHref}
                className="landing-sheen inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[#39ff14]/40 bg-[#0f7c43] px-6 text-base font-black text-white shadow-[0_18px_48px_rgba(57,255,20,0.26)] transition hover:-translate-y-0.5 hover:bg-[#119653] focus:outline-none focus:ring-2 focus:ring-[#d8ffe8]"
              >
                Open Estimator
                <ArrowRight className="h-5 w-5" />
              </a>
              <a
                href={secondaryCtaHref}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/14 bg-white/9 px-6 text-base font-bold text-white backdrop-blur transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-[#64d8ff]"
              >
                <BarChart3 className="h-5 w-5" />
                Saved Projects
              </a>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-2 md:grid-cols-4">
              {featureButtons.map(feature => {
                const Icon = feature.icon;

                return (
                  <a
                    key={feature.title}
                    href={feature.href}
                    className="landing-border group rounded-lg border border-white/10 bg-[#07100d]/72 p-3 backdrop-blur-md transition hover:-translate-y-1 hover:border-white/22 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#64d8ff]"
                  >
                    <span
                      className="mb-3 grid h-9 w-9 place-items-center rounded-lg border"
                      style={{
                        borderColor: `${feature.accent}55`,
                        backgroundColor: `${feature.accent}18`,
                        color: feature.accent,
                      }}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="block text-sm font-black text-white">
                      {feature.title}
                    </span>
                    <span className="mt-1 block text-xs font-semibold text-[#9fb1aa]">
                      {feature.detail}
                    </span>
                  </a>
                );
              })}
            </div>
          </div>

          <div className="landing-rise relative mx-auto w-full max-w-sm lg:max-w-md">
            {/* Driveway preview image */}
            <div className="overflow-hidden rounded-[2.5rem] border-4 border-zinc-700 bg-black shadow-[0_32px_90px_rgba(0,0,0,0.55)]">
              <div className="relative aspect-[4/3] overflow-hidden bg-zinc-900">
                <img
                  src="/landing-driveway-visual.png"
                  alt="Driveway preview"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-center text-sm font-semibold text-white/80">
                    Capture a driveway to get started
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </header>

      {/* ── Live Preview ── */}
      <section className="border-y border-white/8 bg-[#1f332d] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-xl">
            <span className="text-xs font-black uppercase text-[#39ff14]">
              Live Preview
            </span>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
              Try any material. See it instantly.
            </h2>
            <p className="mt-3 text-sm font-medium leading-6 text-[#9fb1aa]">
              Pick a surface type — the preview and pricing update in real time.
            </p>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-start">
            {/* Preview image */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-white/12 bg-[#06110a]/86 shadow-[0_32px_90px_rgba(0,0,0,0.55)]">
              {generatePreview.isPending ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <Loader2 className="h-8 w-8 animate-spin text-[#39ff14]" />
                </div>
              ) : null}
              <img
                src={previewUrl || "/landing-driveway-visual.png"}
                alt={selectedMaterial ? `${materialOptions.find(m => m.id === selectedMaterial)?.label} preview` : "Driveway preview"}
                className={`h-full w-full object-cover transition-opacity duration-500 ${generatePreview.isPending ? "opacity-30" : "opacity-100"}`}
              />
              {materialOverlay && !generatePreview.isPending && (
                <div
                  className="absolute inset-0 mix-blend-multiply pointer-events-none transition-opacity duration-500"
                  style={{ backgroundColor: materialOverlay.color, opacity: 0.35 }}
                />
              )}
              {selectedMaterial && (
                <div className="absolute bottom-3 left-3 right-3 grid grid-cols-3 gap-2">
                  <div className="rounded-lg border border-white/12 bg-[#07100d]/78 px-3 py-2 backdrop-blur">
                    <span className="block text-lg font-black text-white">
                      {pricingQuery.data?.pricePerSquareFoot ?? "—"}
                    </span>
                    <span className="text-xs font-bold text-[#9fb1aa]">per sq ft</span>
                  </div>
                  <div className="rounded-lg border border-white/12 bg-[#07100d]/78 px-3 py-2 backdrop-blur">
                    <span className="block text-lg font-black text-white">
                      {pricingQuery.data?.quantityNeeded ?? "—"}
                    </span>
                    <span className="text-xs font-bold text-[#9fb1aa]">needed</span>
                  </div>
                  <div className="rounded-lg border border-white/12 bg-[#07100d]/78 px-3 py-2 backdrop-blur">
                    <span className="block text-lg font-black text-[#39ff14]">
                      {pricingQuery.data?.totalCost ?? "—"}
                    </span>
                    <span className="text-xs font-bold text-[#9fb1aa]">total</span>
                  </div>
                </div>
              )}
            </div>

            {/* Material selector + pricing */}
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-3">
                {materialOptions.map(m => {
                  const isActive = selectedMaterial === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => handleMaterialSelect(m.id)}
                      className={`group rounded-lg border p-4 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#39ff14] ${
                        isActive
                          ? "border-[#39ff14]/60 bg-[#39ff14]/10 shadow-[0_0_24px_rgba(57,255,20,0.12)]"
                          : "border-white/10 bg-white/6 hover:border-white/22 hover:bg-white/10"
                      }`}
                    >
                      <span className="block text-2xl">{m.icon}</span>
                      <span className={`mt-2 block text-sm font-black transition-colors ${isActive ? "text-[#39ff14]" : "text-white"}`}>
                        {m.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {selectedMaterial && pricingQuery.data && (
                <div className="rounded-lg border border-white/10 bg-white/6 p-4">
                  <div className="flex items-center justify-between border-b border-white/8 pb-3">
                    <span className="text-xs font-semibold text-[#9fb1aa]">Supplied by</span>
                    <span className="text-sm font-bold text-white">{pricingQuery.data.supplier}</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#9fb1aa]">Price per sq ft</span>
                      <span className="font-bold text-white">{pricingQuery.data.pricePerSquareFoot}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#9fb1aa]">Price per ton</span>
                      <span className="font-bold text-white">${pricingQuery.data.pricePerTon.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#9fb1aa]">Quantity (1k sq ft)</span>
                      <span className="font-bold text-white">{pricingQuery.data.quantityNeeded}</span>
                    </div>
                  </div>
                </div>
              )}

              <a
                href="/estimator"
                className="landing-sheen inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-[#39ff14]/40 bg-[#0f7c43] px-6 text-base font-black text-white shadow-[0_18px_48px_rgba(57,255,20,0.2)] transition hover:-translate-y-0.5 hover:bg-[#119653] focus:outline-none focus:ring-2 focus:ring-[#d8ffe8]"
              >
                Open Estimator
                <ArrowRight className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/8 bg-[#1f332d] px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {trustItems.map(item => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/6 px-4 py-3"
              >
                <Icon className="h-5 w-5 shrink-0 text-[#64d8ff]" />
                <span className="text-sm font-bold text-[#d7e1dc]">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <span className="text-xs font-black uppercase text-[#ffb84c]">
              Workflow
            </span>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
              Everything a salesperson needs. Nothing extra.
            </h2>
          </div>

          <ol className="mt-8 grid gap-3 md:grid-cols-4">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <li
                  key={step.title}
                  className="landing-border rounded-lg border border-white/10 bg-[#233833] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] transition hover:-translate-y-1 hover:bg-[#2a423c]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-white/8 text-[#39ff14]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="font-mono text-xs font-black text-white/30">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-black text-white">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm font-medium leading-6 text-[#9fb1aa]">
                    {step.copy}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 rounded-lg border border-[#39ff14]/24 bg-[#213631] p-5 text-white shadow-[0_28px_80px_rgba(0,0,0,0.28)] md:grid-cols-[1fr_1.2fr] md:p-8">
          <div>
            <span className="text-xs font-black uppercase text-[#39ff14]">
              Materials
            </span>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              Pick the surface. Build the quote.
            </h2>
          </div>

          <div className="grid content-center gap-3 sm:grid-cols-2">
            {materials.map(material => (
              <span
                key={material}
                className="landing-border flex items-center justify-between rounded-lg border border-white/10 bg-white/8 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-white/12"
              >
                {material}
                <CheckCircle2 className="h-5 w-5 text-[#39ff14]" />
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-14 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-5 border-t border-white/10 pt-8 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-black text-white">
              Open the estimator and start the job.
            </h2>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#9fb1aa]">
              Fast capture, clean pricing, and a final sales flow that asks
              whether the client accepts before you save the invoice.
            </p>
          </div>
          <a
            href={primaryCtaHref}
            className="landing-sheen inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-[#39ff14]/40 bg-[#0f7c43] px-6 text-base font-black text-white shadow-[0_18px_48px_rgba(57,255,20,0.2)] transition hover:-translate-y-0.5 hover:bg-[#119653] focus:outline-none focus:ring-2 focus:ring-[#d8ffe8] sm:w-auto"
          >
            Open Estimator
            <ArrowRight className="h-5 w-5" />
          </a>
        </div>
      </section>

      <footer className="border-t border-white/8 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 text-sm font-semibold text-[#71857d] sm:flex-row sm:items-center sm:justify-between">
          <span>DrivewayAI &copy; 2026</span>
          <span>AI powered estimates for driveway sales teams.</span>
        </div>
      </footer>
    </main>
  );
}
