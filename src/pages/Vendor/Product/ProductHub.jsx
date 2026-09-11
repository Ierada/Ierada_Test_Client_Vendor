import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  AlignJustify,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  FileText,
  Folder,
  Image,
  Lightbulb,
  Package,
  Plus,
} from "lucide-react";
import { VENDOR_PRODUCT_SECTION_ITEMS } from "../../../config/productSection";
import apiClient from "../../../axios.config";
import { useAppContext } from "../../../context/AppContext";

const NAVY = "#111827";
const ORANGE = "#F56C43";
const MUTED = "#98A2B3";

const fmt = (n) => {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return Number(n).toLocaleString("en-IN");
};

const TOOLS = [
  {
    ...VENDOR_PRODUCT_SECTION_ITEMS[0],
    description: "View and manage your listings, drafts, stock in one place.",
    action: "Go to Product List",
    icon: AlignJustify,
    iconWrap: "bg-[#F3E8FF] text-[#7C3AED]",
    card: "#FFFFFF",
  },
  {
    ...VENDOR_PRODUCT_SECTION_ITEMS[1],
    description: "Create a new product listing with Smart Listing and get found faster.",
    action: "Create a Product",
    icon: Plus,
    iconWrap: "bg-[#FFE8D6] text-[#F56C43]",
    card: "#FFF6EE",
  },
  {
    ...VENDOR_PRODUCT_SECTION_ITEMS[2],
    description: "Use Excel files to add, update or export multiple products.",
    action: "Open Bulk Manager",
    icon: Folder,
    iconWrap: "bg-[#EFE7FF] text-[#7C3AED]",
    card: "#F6F3FF",
  },
  {
    ...VENDOR_PRODUCT_SECTION_ITEMS[3],
    description: "Upload and manage your product images and media files.",
    action: "Open Media Manager",
    icon: Image,
    iconWrap: "bg-[#DCFCE7] text-[#16A34A]",
    card: "#F3FBF6",
  },
];

const TIPS = [
  {
    n: 1,
    title: "Upload clean images",
    body: "Use high-quality, well-lit images (at least 1000×1000 px).",
    tint: "bg-[#FFF1E8] text-[#F56C43]",
  },
  {
    n: 2,
    title: "Complete product details",
    body: "Add accurate title, description, category and specifications.",
    tint: "bg-[#F3E8FF] text-[#7C3AED]",
  },
  {
    n: 3,
    title: "Use Bulk Manager for Excel uploads",
    body: "Save time by managing multiple products with Excel files.",
    tint: "bg-[#E8F8EF] text-[#16A34A]",
  },
];

function PackageArt() {
  return (
    <svg viewBox="0 0 96 96" className="h-[72px] w-[72px] shrink-0" aria-hidden>
      <path d="M16 34 48 18l32 16v36L48 86 16 70z" fill="#F8C9A8" />
      <path d="M48 18 80 34v36L48 86z" fill="#F4B183" />
      <path d="M16 34 48 50v36L16 70z" fill="#E89A6A" />
      <path d="M16 34 48 18l32 16-32 16z" fill="#FBE0CC" />
      <path d="M32 26 48 18l16 8-16 8z" fill="#F56C43" />
      <rect x="40" y="30" width="16" height="8" rx="1.5" fill="#FFF7F0" />
    </svg>
  );
}

export default function ProductHub() {
  const { user } = useAppContext();
  const vendorId = user?.id || null;
  const [stats, setStats] = useState({
    loading: Boolean(vendorId),
    error: false,
    total: vendorId ? null : 0,
    active: vendorId ? null : 0,
    drafts: vendorId ? null : 0,
    lowStock: vendorId ? null : 0,
  });

  useEffect(() => {
    if (!vendorId) {
      setStats({
        loading: false,
        error: false,
        total: 0,
        active: 0,
        drafts: 0,
        lowStock: 0,
      });
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get(`/product/getProductsByVendorId/${vendorId}`, {
          params: { page: 1, limit: 1 },
        });
        if (cancelled) return;
        const payload = res?.data;
        const s = payload?.data?.stats || {};
        setStats({
          loading: false,
          error: payload?.status !== 1,
          total: s.totalProducts ?? 0,
          active: s.publishedProducts ?? 0,
          drafts: s.draftProducts ?? 0,
          lowStock: s.lowStockProducts ?? 0,
        });
      } catch {
        if (!cancelled) {
          setStats({
            loading: false,
            error: true,
            total: 0,
            active: 0,
            drafts: 0,
            lowStock: 0,
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [vendorId]);

  const statCards = [
    {
      label: "Total Listings",
      value: stats.total,
      to: "/product/list",
      icon: Package,
      tint: "bg-[#FFF1E8] text-[#F56C43]",
    },
    {
      label: "Active Listings",
      value: stats.active,
      to: "/product/list",
      icon: CheckCircle2,
      tint: "bg-[#E8F8EF] text-[#16A34A]",
    },
    {
      label: "Drafts",
      value: stats.drafts,
      to: "/product/list?tab=draft",
      icon: FileText,
      tint: "bg-[#E8F1FF] text-[#2563EB]",
    },
    {
      label: "Low Stock",
      value: stats.lowStock,
      to: "/product/list",
      icon: AlertTriangle,
      tint: "bg-[#FFF1E8] text-[#F56C43]",
    },
  ];

  return (
    <div className="px-4 pb-10 pt-1 sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-[30px] font-extrabold leading-none tracking-tight sm:text-[32px]" style={{ color: NAVY }}>
            Products
          </h1>
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed" style={{ color: MUTED }}>
            Manage your product listings, create new products, and keep your catalog up to date.
          </p>
        </div>
        <aside
          className="flex w-full max-w-[340px] items-center justify-between gap-3 rounded-[18px] px-5 py-4 lg:shrink-0"
          style={{ background: "#FFF6EE" }}
        >
          <div className="min-w-0">
            <p className="text-[15px] font-bold leading-snug" style={{ color: NAVY }}>
              Grow your business with great products
            </p>
            <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: MUTED }}>
              Quality listings bring more customers.
            </p>
          </div>
          <PackageArt />
        </aside>
      </div>

      <section className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              to={card.to}
              className="rounded-[18px] bg-white px-5 py-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-[13px] font-medium" style={{ color: MUTED }}>
                  {card.label}
                </p>
                <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${card.tint}`}>
                  <Icon className="h-4 w-4" strokeWidth={2.1} />
                </span>
              </div>
              <p className="mt-4 text-[28px] font-extrabold tabular-nums leading-none" style={{ color: NAVY }}>
                {stats.loading ? (
                  <span className="inline-block h-7 w-16 animate-pulse rounded-md bg-slate-100" />
                ) : (
                  fmt(card.value)
                )}
              </p>
            </Link>
          );
        })}
      </section>
      {stats.error ? (
        <p className="mt-2 text-[12px]" style={{ color: MUTED }}>
          Listing counts could not be loaded. Tools below still work.
        </p>
      ) : null}

      <div className="mt-5 grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]">
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {TOOLS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="group flex min-h-[176px] flex-col rounded-[18px] p-5"
                style={{ background: item.card }}
              >
                <span className={`mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl ${item.iconWrap}`}>
                  <Icon className="h-5 w-5" strokeWidth={2.1} />
                </span>
                <h2 className="text-[16px] font-bold" style={{ color: NAVY }}>
                  {item.text}
                </h2>
                <p className="mt-1.5 flex-1 text-[13px] leading-relaxed" style={{ color: MUTED }}>
                  {item.description}
                </p>
                <span
                  className="mt-5 inline-flex items-center gap-1 text-[13px] font-semibold"
                  style={{ color: ORANGE }}
                >
                  {item.action}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </section>

        <aside className="rounded-[18px] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <h3 className="mb-5 inline-flex items-center gap-2 text-[15px] font-bold" style={{ color: NAVY }}>
            <Lightbulb className="h-[18px] w-[18px]" style={{ color: "#F5A524" }} />
            Quick Tips for Sellers
          </h3>
          <ol className="space-y-4">
            {TIPS.map((tip) => (
              <li key={tip.n} className="flex gap-3">
                <span
                  className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${tip.tint}`}
                >
                  {tip.n}
                </span>
                <div className="min-w-0">
                  <p className="text-[13.5px] font-semibold" style={{ color: NAVY }}>
                    {tip.title}
                  </p>
                  <p className="mt-0.5 text-[12.5px] leading-relaxed" style={{ color: MUTED }}>
                    {tip.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-5 flex items-start gap-2 border-t border-slate-100 pt-4">
            <BarChart3 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#60A5FA" }} />
            <p className="text-[12.5px] leading-relaxed" style={{ color: MUTED }}>
              Great products build great businesses. Keep your catalog fresh and complete!
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
