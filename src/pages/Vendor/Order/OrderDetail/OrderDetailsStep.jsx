import React, { useState } from "react";
import {
  MapPin,
  Phone,
  Mail,
  Star,
  CheckCircle2,
  Truck,
  RotateCcw,
  ShieldCheck,
  ZoomIn,
} from "lucide-react";

// ─── Orange left-border section heading ───────────────────────────────────────
const SectionHeading = ({ title }) => (
  <div className="flex items-center gap-2.5 mb-4">
    <div className="w-1 h-5 bg-[#FF6012] rounded-full" />
    <h3 className="text-base font-bold text-gray-900">{title}</h3>
  </div>
);

// ─── Attribute pill ────────────────────────────────────────────────────────────
const AttrPill = ({ label, value }) => (
  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-orange-200 bg-orange-50 text-sm">
    <span className="text-[#FF6012] font-semibold">{label}:</span>
    <span className="text-gray-700 font-medium">{value}</span>
  </span>
);

// ─── Spec row ──────────────────────────────────────────────────────────────────
const SpecRow = ({ label, value }) => (
  <div className="flex items-start gap-2">
    <span className="text-sm text-gray-400 font-medium w-28 flex-shrink-0">
      {label}
    </span>
    <span className="text-sm font-semibold text-gray-800">{value || "—"}</span>
  </div>
);

// ─── What's in the Box item ────────────────────────────────────────────────────
const BoxItem = ({ label }) => (
  <div className="flex items-center gap-2.5 px-4 py-3 bg-orange-50/60 border border-orange-100 rounded-xl">
    <CheckCircle2 className="w-4 h-4 text-[#FF6012] flex-shrink-0" />
    <span className="text-sm text-gray-700 font-medium">{label}</span>
  </div>
);

// ─── Main component ────────────────────────────────────────────────────────────
const OrderDetailsStep = ({ orderData }) => {
  const [activeImg, setActiveImg] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  if (!orderData) return null;

  const { product, orderInfo, customer } = orderData;

  // Image gallery: use all images or fall back to single
  const images = product.images?.length
    ? product.images
    : product.image
    ? [product.image]
    : [];

  const parseSpecs = () => {
    let raw = product.specifications;
    if (!raw) return [];

    // Unwrap JSON string first
    if (typeof raw === "string") {
      const t = raw.trim();
      if (!t || t === "[]" || t === "{}") return [];
      try {
        raw = JSON.parse(t);
      } catch (_) {
        return [{ key: "Specification", value: t }];
      }
    }

    if (Array.isArray(raw)) {
      return raw
        .map((item) => {
          if (typeof item === "string") return { key: item, value: "" };
          // Backend shape: { feature, specification }
          if ("feature" in item || "specification" in item) {
            return {
              key: item.feature || item.label || item.key || "",
              value: item.specification || item.value || "",
            };
          }
          // Generic: { key, value } / { label, value } / { name, value }
          const vals = Object.values(item);
          return {
            key:
              item.key || item.label || item.name || Object.keys(item)[0] || "",
            value: item.value || item.description || vals[1] || "",
          };
        })
        .filter((s) => s.key || s.value);
    }

    if (typeof raw === "object") {
      return Object.entries(raw)
        .map(([k, v]) => ({ key: k, value: String(v ?? "") }))
        .filter((s) => s.key && s.value);
    }

    return [];
  };
  const specs = parseSpecs();

  const parseBox = () => {
    let raw = product.whatsInTheBox || product.whats_in_the_box;
    if (!raw) return [];
    console.log(raw);

    // Unwrap JSON string first
    if (typeof raw === "string") {
      const t = raw.trim();
      if (!t || t === "[]") return [];
      try {
        raw = JSON.parse(t);
      } catch (_) {
        // Not JSON — treat as comma-separated plain list
        return t
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }

    if (Array.isArray(raw)) {
      return raw
        .map((i) => {
          if (typeof i === "string") return i.trim();

          // ── Primary backend shape: { title, details } ──────────────────
          if (i.title !== undefined || i.details !== undefined) {
            const title = String(i.title || "").trim();
            const details = String(i.details || "").trim();
            if (title && details) return `${title} — ${details}`;
            return title || details || "";
          }

          // ── Other known shapes (fallbacks) ─────────────────────────────
          // { name, quantity } / { name, count } → "name × quantity"
          if (i.name !== undefined) {
            const qty = i.quantity || i.count || i.qty || "";
            return qty
              ? `${String(i.name).trim()} × ${qty}`
              : String(i.name).trim();
          }

          // { item } / { label } / { value } / { description } / { feature }
          const fallback =
            i.item ||
            i.label ||
            i.value ||
            i.description ||
            i.feature ||
            Object.values(i)[0] ||
            "";
          return String(fallback).trim();
        })
        .filter(Boolean);
    }

    // Plain string fallback
    if (typeof raw === "string") {
      return raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    return [];
  };
  const boxItems = parseBox();

  // Discount percentage
  const discountPct = (() => {
    const orig = parseFloat(product.originalPrice || product.mrp);
    const disc = parseFloat(product.discountedPrice);
    if (!orig || !disc || orig <= disc) return null;
    return Math.round(((orig - disc) / orig) * 100);
  })();

  return (
    <div className="w-full flex-1 flex flex-col overflow-y-auto bg-[#F6F7F9]">
      <div className="flex flex-col lg:flex-row gap-5 p-6 max-w-[1280px] mx-auto w-full pb-24">
        {/* ── LEFT PANEL ─────────────────────────────────────────────────── */}
        <div className="lg:w-[320px] flex-shrink-0 space-y-3">
          {/* Image gallery */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {/* Thumbnail column + main image */}
            <div className="flex gap-3 p-4">
              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex flex-col gap-2">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      className={`w-10 h-10 rounded-xl border-2 overflow-hidden flex-shrink-0 transition-all ${
                        activeImg === i
                          ? "border-[#FF6012]"
                          : "border-gray-100 hover:border-gray-300"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${product.name} ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Main image */}
              <div className="relative flex-1 bg-gray-50 rounded-xl overflow-hidden min-h-[220px] flex items-center justify-center">
                {images[activeImg] ? (
                  <img
                    src={images[activeImg]}
                    alt={product.name}
                    className="w-full h-full object-contain max-h-56 cursor-zoom-in"
                    onClick={() => setZoomed(true)}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-gray-300">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-2">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14"
                        />
                      </svg>
                    </div>
                    <span className="text-xs">No image</span>
                  </div>
                )}
                <button
                  onClick={() => setZoomed(true)}
                  className="absolute top-2 right-2 p-1.5 bg-white/80 hover:bg-white rounded-lg text-gray-500 hover:text-gray-700 transition-colors shadow-sm"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Image caption / view label */}
            {images[activeImg] && (
              <div className="px-4 pb-3 text-center">
                <p className="text-xs text-gray-400">
                  {product.brand ? `${product.brand} · ` : ""}
                  {product.name || "Product"} — View {activeImg + 1}
                </p>
              </div>
            )}

            {/* Brand pill */}
            {product.brand && (
              <div className="px-4 pb-4 flex justify-center">
                <span className="px-4 py-1.5 bg-orange-50 border border-orange-200 text-[#FF6012] text-sm font-bold rounded-full">
                  {product.brand}
                </span>
              </div>
            )}
          </div>

          {/* Delivery + Returns */}
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                <Truck className="w-4 h-4 text-[#FF6012]" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">Free Delivery</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Arrives in 2–4 days
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                <RotateCcw className="w-4 h-4 text-[#FF6012]" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">7-Day Returns</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Hassle-free policy
                </p>
              </div>
            </div>
          </div>

          {/* Warranty */}
          <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-4 h-4 text-[#FF6012]" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">
                1 Year Brand Warranty
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Official service centers across India
              </p>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ────────────────────────────────────────────────── */}
        <div className="flex-1 space-y-4 min-w-0">
          {/* Product info card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            {/* Brand · Category */}
            {(product.brand || product.category) && (
              <p className="text-sm font-bold text-[#FF6012] uppercase tracking-wide mb-2">
                {[product.brand, product.category].filter(Boolean).join(" · ")}
              </p>
            )}

            {/* Name + Price block */}
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="min-w-0">
                <h1 className="text-2xl font-black text-gray-900 leading-tight">
                  {product.name || "—"}
                </h1>
                {product.sku && (
                  <span className="inline-block mt-2 px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-mono rounded-lg">
                    {product.sku}
                  </span>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-3xl font-black text-gray-900">
                  {orderInfo.price}
                </p>
                {(product.mrp || product.originalPrice) && (
                  <div className="flex items-center justify-end gap-2 mt-1">
                    <span className="text-sm text-gray-400 line-through">
                      ₹
                      {Number(
                        product.mrp || product.originalPrice,
                      ).toLocaleString("en-IN")}
                    </span>
                    {discountPct && (
                      <span className="px-2 py-0.5 bg-red-500 text-white text-[11px] font-black rounded">
                        {discountPct}% Off
                      </span>
                    )}
                  </div>
                )}
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Incl. all taxes
                </p>
              </div>
            </div>

            {/* Attribute pills */}
            <div className="flex flex-wrap gap-2 mb-4">
              {product.color && (
                <AttrPill label="Colour" value={product.color} />
              )}
              {product.storage && (
                <AttrPill label="Storage" value={product.storage} />
              )}
              {product.ram && <AttrPill label="RAM" value={product.ram} />}
              {orderInfo.paymentType && (
                <AttrPill label="Payment" value={orderInfo.paymentType} />
              )}
              {product.size && <AttrPill label="Size" value={product.size} />}
            </div>

            {/* Order # + Qty + Date */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                Order{" "}
                <span className="font-bold text-gray-900">#{orderData.id}</span>
                &nbsp;·&nbsp; Qty:{" "}
                <span className="font-bold text-gray-900">
                  {product.quantity || 1}
                </span>
              </p>
              <p className="text-sm text-gray-500">
                Ordered:{" "}
                <span className="font-semibold text-gray-700">
                  {orderInfo.orderedDate} · {orderInfo.orderedTime}
                </span>
              </p>
            </div>
          </div>

          {/* Specifications */}
          {specs.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <SectionHeading title="Specifications" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-3.5">
                {specs.map((s, i) => (
                  <SpecRow key={i} label={s.key || s.label} value={s.value} />
                ))}
              </div>
            </div>
          )}

          {/* What's in the Box */}
          {boxItems.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <SectionHeading title="What's in the Box" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {boxItems.map((item, i) => (
                  <BoxItem key={i} label={item} />
                ))}
              </div>
            </div>
          )}

          {/* Customer Details */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <SectionHeading title="Customer Details" />
            <div className="flex items-start gap-5 flex-wrap">
              {/* Avatar + name + since + rating */}
              <div className="flex items-start gap-3 w-48 flex-shrink-0">
                <div className="w-11 h-11 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-[#FF6012]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    {customer.name || "—"}
                  </p>
                  {customer.since && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      Since {customer.since}
                    </p>
                  )}
                  {customer.stats?.rating && customer.stats.rating !== "—" && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-bold text-gray-700">
                        {customer.stats.rating}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact + address */}
              <div className="flex-1 space-y-2 min-w-0">
                {customer.address?.line1 && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-[#FF6012] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">
                      {customer.address.line1}
                      {customer.address.line2
                        ? ` — ${customer.address.line2}`
                        : ""}
                    </span>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#FF6012] flex-shrink-0" />
                    <span className="text-sm text-gray-600">
                      {customer.phone}
                    </span>
                  </div>
                )}
                {customer.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#FF6012] flex-shrink-0" />
                    <span className="text-sm text-gray-600">
                      {customer.email}
                    </span>
                  </div>
                )}
              </div>

              {/* Stats: orders + total spent */}
              {(customer.stats?.orders !== "—" ||
                customer.stats?.totalSpend !== "—") && (
                <div className="text-right flex-shrink-0">
                  {customer.stats?.orders && customer.stats.orders !== "—" && (
                    <div className="mb-2">
                      <p className="text-2xl font-black text-gray-900">
                        {customer.stats.orders}
                      </p>
                      <p className="text-xs text-gray-400 font-medium">
                        Orders
                      </p>
                    </div>
                  )}
                  {customer.stats?.totalSpend &&
                    customer.stats.totalSpend !== "—" && (
                      <div>
                        <p className="text-xl font-black text-gray-900">
                          {customer.stats.totalSpend}
                        </p>
                        <p className="text-xs text-gray-400 font-medium">
                          Total Spent
                        </p>
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Zoom lightbox */}
      {zoomed && images[activeImg] && (
        <div
          className="fixed inset-0 z-[200] bg-[black]/80 flex items-center justify-center p-8 cursor-zoom-out"
          onClick={() => setZoomed(false)}
        >
          <img
            src={images[activeImg]}
            alt={product.name}
            className="max-w-full max-h-full object-contain rounded-2xl"
          />
        </div>
      )}
    </div>
  );
};

export default OrderDetailsStep;
