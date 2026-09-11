import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Box,
  Clock3,
  Lightbulb,
  PackageX,
  Search,
  TrendingUp,
  X,
} from "lucide-react";
import {
  VENDOR_PRODUCT_HUB_INSIGHTS_ITEM,
  VENDOR_PRODUCT_SECTION_ITEMS,
} from "../../../config/productSection";
import apiClient from "../../../axios.config";
import { useAppContext } from "../../../context/AppContext";

const TIP_KEY = "ierada_vendor_product_hub_tip_dismissed";

const fmt = (n) => {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return Number(n).toLocaleString("en-IN");
};

const HUB_ITEMS = [
  ...VENDOR_PRODUCT_SECTION_ITEMS,
  VENDOR_PRODUCT_HUB_INSIGHTS_ITEM,
];

const ProductHub = () => {
  const { user } = useAppContext();
  const vendorId = user?.id || null;
  const [toolQuery, setToolQuery] = useState("");
  const [tipOpen, setTipOpen] = useState(
    () => localStorage.getItem(TIP_KEY) !== "1",
  );
  const [stats, setStats] = useState({
    loading: Boolean(vendorId),
    all: vendorId ? null : 0,
    published: vendorId ? null : 0,
    drafts: vendorId ? null : 0,
    oos: vendorId ? null : 0,
  });

  useEffect(() => {
    if (!vendorId) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get(
          `/product/getProductsByVendorId/${vendorId}`,
          { params: { page: 1, limit: 1 } },
        );
        if (cancelled) return;
        const s = res?.data?.data?.stats || {};
        setStats({
          loading: false,
          all: s.totalProducts ?? 0,
          published: s.publishedProducts ?? 0,
          drafts: s.draftProducts ?? 0,
          oos: s.lowStockProducts ?? 0,
        });
      } catch {
        if (!cancelled) {
          setStats({
            loading: false,
            all: 0,
            published: 0,
            drafts: 0,
            oos: 0,
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [vendorId]);

  const filteredItems = useMemo(() => {
    const q = toolQuery.trim().toLowerCase();
    if (!q) return HUB_ITEMS;
    return HUB_ITEMS.filter(
      (item) =>
        item.text.toLowerCase().includes(q) ||
        (item.description || "").toLowerCase().includes(q),
    );
  }, [toolQuery]);

  const dismissTip = () => {
    localStorage.setItem(TIP_KEY, "1");
    setTipOpen(false);
  };

  return (
    <div className="px-4 pb-5 text-slate-800">
      <section className="relative mb-5 overflow-hidden rounded-[24px] bg-gradient-to-r from-[#FFF6EF] via-[#FFF8F3] to-[#FFE9D8] px-5 py-[1.7rem] sm:px-8">
        <div className="grid items-center gap-3 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <div className="relative z-10 max-w-lg">
            <p className="mb-2 text-[11px] font-semibold tracking-[0.22em] text-[#E85A12]">
              CREATE  ·  MANAGE  ·  GROW
            </p>
            <h1 className="text-[26px] font-extrabold leading-[1.12] tracking-tight text-slate-950 sm:text-[29px]">
              Build a Better Catalog
              <br />
              for a Bigger Tomorrow
            </h1>
            <p className="mt-2.5 max-w-md text-[13px] leading-relaxed text-slate-600">
              Add products, manage inventory, optimise content and drive more
              sales with smart tools.
            </p>
            <Link
              to="/product/add"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#FF5500] px-4 py-2 text-[13px] font-semibold text-white shadow-[0_10px_22px_rgba(255,85,0,0.25)] hover:bg-[#e64d00]"
            >
              Add New Product
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="relative min-h-[153px]">
            <img
              src="/product-hub/catalog-box.png"
              alt=""
              className="relative z-10 mx-auto max-h-[187px] w-auto max-w-full object-contain lg:absolute lg:left-0 lg:top-1/2 lg:max-h-[204px] lg:-translate-y-1/2"
            />
            <img
              src="/product-hub/script.png"
              alt="Good Products Great Possibilities"
              className="pointer-events-none absolute -right-1 top-1 hidden w-[128px] lg:block"
            />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <section>
          <div className="mb-2.5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-[18px] font-bold text-slate-900">
                Product Management Tools
              </h2>
              <p className="mt-0.5 text-[13px] text-slate-500">
                Everything you need to manage your products efficiently.
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={toolQuery}
                onChange={(e) => setToolQuery(e.target.value)}
                placeholder="Search tools..."
                className="w-full rounded-full border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-[13px] outline-none focus:border-[#FF5500] focus:ring-2 focus:ring-[#FF5500]/15"
              />
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-7 text-center text-sm text-slate-400">
              No tools match “{toolQuery}”.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
              {filteredItems.map((item) => {
                const Icon = item.icon;
                const filled = Boolean(item.arrowFilled);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="group flex min-h-[113px] flex-col rounded-2xl border border-slate-100 bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.03)] transition-all hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-[0_12px_28px_rgba(255,85,0,0.08)]"
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFF1E8] text-[#FF5500]">
                        {Icon ? <Icon className="h-4 w-4" /> : null}
                      </div>
                      {item.badge ? (
                        <span className="rounded-full bg-[#FF5500] px-2 py-0.5 text-[10px] font-semibold text-white">
                          {item.badge}
                        </span>
                      ) : null}
                    </div>
                    <h3 className="text-[14px] font-semibold text-slate-900">
                      {item.text}
                    </h3>
                    <p className="mt-1 flex-1 text-[12px] leading-relaxed text-slate-500">
                      {item.description}
                    </p>
                    <span
                      className={`mt-2 inline-flex h-5 w-5 items-center justify-center rounded-full ${
                        filled
                          ? "bg-[#FF5500] text-white"
                          : "border border-[#FF5500] text-[#FF5500] group-hover:bg-[#FF5500] group-hover:text-white"
                      }`}
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <aside className="space-y-3.5">
          <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.03)]">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-900">
                <BarChart3 className="h-3.5 w-3.5 text-[#FF5500]" />
                Quick Stats
              </h3>
              <Link
                to="/product/list"
                className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#FF5500]"
              >
                View All
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  label: "Total Products",
                  value: stats.all,
                  icon: TrendingUp,
                  tint: "bg-emerald-50 text-emerald-600",
                },
                {
                  label: "Active Products",
                  value: stats.published,
                  icon: Box,
                  tint: "bg-sky-50 text-sky-600",
                },
                {
                  label: "Draft Products",
                  value: stats.drafts,
                  icon: Clock3,
                  tint: "bg-amber-50 text-amber-600",
                },
                {
                  label: "Out of Stock",
                  value: stats.oos,
                  icon: PackageX,
                  tint: "bg-rose-50 text-rose-500",
                },
              ].map((row) => {
                const Icon = row.icon;
                return (
                  <div
                    key={row.label}
                    className="rounded-xl border border-slate-100 bg-slate-50/70 p-1.5"
                  >
                    <span
                      className={`mb-1 inline-flex h-5 w-5 items-center justify-center rounded-md ${row.tint}`}
                    >
                      <Icon className="h-3 w-3" />
                    </span>
                    <p className="text-[13px] font-bold leading-none text-slate-900">
                      {stats.loading ? "…" : fmt(row.value)}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-500">{row.label}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {tipOpen ? (
            <div className="rounded-2xl border border-orange-100 bg-[#FFF6EE] p-3.5">
              <div className="mb-1.5 flex items-start justify-between gap-2">
                <h3 className="flex items-center gap-1.5 text-[14px] font-semibold text-slate-900">
                  <Lightbulb className="h-4 w-4 text-[#FF5500]" />
                  Pro Tip
                </h3>
                <button
                  type="button"
                  onClick={dismissTip}
                  className="rounded p-0.5 text-slate-400 hover:text-slate-700"
                  aria-label="Dismiss tip"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-[12.5px] leading-relaxed text-slate-600">
                Use SEO-friendly titles, quality images and complete
                specifications to get better visibility.
              </p>
              <Link
                to="/support"
                className="mt-2.5 inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#FF5500]"
              >
                View Listing Guidelines
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : null}

          <div className="rounded-2xl border border-slate-100 bg-white p-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.03)]">
            <h3 className="mb-1.5 flex items-center gap-1.5 text-[14px] font-semibold text-slate-900">
              <BookOpen className="h-4 w-4 text-sky-500" />
              Need Help?
            </h3>
            <p className="text-[12.5px] leading-relaxed text-slate-500">
              Check our help center for step-by-step guides, videos and best
              practices.
            </p>
            <Link
              to="/support"
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-[#FFF1E8] px-3 py-1.5 text-[12.5px] font-semibold text-[#FF5500] hover:bg-orange-100"
            >
              Go to Help Center
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ProductHub;
