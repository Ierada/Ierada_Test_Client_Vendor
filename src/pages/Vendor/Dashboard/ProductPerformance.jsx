import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Heart, MousePointerClick, ShoppingCart } from "lucide-react";
import { useAppContext } from "../../../context/AppContext";
import { getVendorProductPerformance } from "../../../services/api.dashboard";

const int = (value) => Number(value || 0).toLocaleString("en-IN");

const periodLabel = (from, to) => {
  if (!from || !to) return "This week";
  const start = new Date(from);
  const end = new Date(to);
  const opts = { day: "numeric", month: "short" };
  return `${start.toLocaleDateString("en-IN", opts)} – ${end.toLocaleDateString("en-IN", opts)}`;
};

export default function ProductPerformance() {
  const { user } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getVendorProductPerformance(user.id);
        if (cancelled) return;
        if (res?.data) {
          setPayload(res.data);
        } else {
          setError("Could not load product performance.");
        }
      } catch {
        if (!cancelled) setError("Could not load product performance.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const products = payload?.products || [];
  const summary = payload?.summary || {};

  return (
    <div className="px-4 pb-6 pt-3 text-[black] lg:px-6">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[12px] text-[#6B7280]">
            <Link to="/dashboard" className="hover:underline">
              Dashboard
            </Link>
            <span className="mx-1">/</span>
            Product Performance
          </p>
          <h1 className="mt-1 font-satoshi text-[18px] font-semibold text-[#111827]">
            Product Performance
          </h1>
          <p className="text-[12px] text-[#6B7280]">
            {periodLabel(payload?.from, payload?.to)}
          </p>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2.5 md:grid-cols-4">
        {[
          { label: "Clicks", value: summary.clicks?.count, icon: MousePointerClick, wrap: "bg-[#F3E8FF]", color: "text-[#7C3AED]" },
          { label: "Views", value: summary.views?.count, icon: Eye, wrap: "bg-[#EFF6FF]", color: "text-[#2563EB]" },
          { label: "Wishlist", value: summary.wishlist?.count, icon: Heart, wrap: "bg-[#FFF7ED]", color: "text-[#EA580C]" },
          { label: "Add to Cart", value: summary.cart?.count, icon: ShoppingCart, wrap: "bg-[#ECFDF3]", color: "text-[#16A34A]" },
        ].map((item) => (
          <section
            key={item.label}
            className="rounded-xl border border-[#EEF0F4] bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
          >
            <div className="flex items-center gap-2">
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${item.wrap}`}>
                <item.icon className={`h-4 w-4 ${item.color}`} strokeWidth={1.8} />
              </span>
              <p className="text-[12px] text-[#6B7280]">{item.label}</p>
            </div>
            <p className="mt-2 font-satoshi text-[20px] font-semibold text-[#111827]">
              {loading ? "—" : int(item.value)}
            </p>
          </section>
        ))}
      </div>

      <section className="overflow-hidden rounded-xl border border-[#EEF0F4] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="border-b border-[#F3F4F6] px-3 py-2.5">
          <h2 className="font-satoshi text-[13px] font-semibold text-[#111827]">
            Products this week
          </h2>
        </div>
        {loading ? (
          <p className="px-3 py-10 text-center text-[12px] text-[#9CA3AF]">Loading…</p>
        ) : error ? (
          <p className="px-3 py-10 text-center text-[12px] text-[#DC2626]">{error}</p>
        ) : products.length === 0 ? (
          <p className="px-3 py-10 text-center text-[12px] text-[#9CA3AF]">
            No product activity this week
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-[13px]">
              <thead className="bg-[#F8F9FB] text-[11px] uppercase tracking-wide text-[#6B7280]">
                <tr>
                  <th className="px-3 py-2 font-medium">Product</th>
                  <th className="px-3 py-2 text-right font-medium">Clicks</th>
                  <th className="px-3 py-2 text-right font-medium">Views</th>
                  <th className="px-3 py-2 text-right font-medium">Wishlist</th>
                  <th className="px-3 py-2 text-right font-medium">Cart</th>
                </tr>
              </thead>
              <tbody>
                {products.map((row) => (
                  <tr key={row.product_id} className="border-t border-[#F3F4F6]">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        {row.image ? (
                          <img
                            src={row.image}
                            alt=""
                            className="h-10 w-10 rounded-lg object-cover"
                          />
                        ) : (
                          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F3F4F6] text-[10px] text-[#9CA3AF]">
                            —
                          </span>
                        )}
                        <p className="max-w-[280px] truncate font-medium text-[#111827]">
                          {row.name || `Product #${row.product_id}`}
                        </p>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold">{int(row.clicks)}</td>
                    <td className="px-3 py-2.5 text-right font-semibold">{int(row.views)}</td>
                    <td className="px-3 py-2.5 text-right font-semibold">{int(row.wishlist)}</td>
                    <td className="px-3 py-2.5 text-right font-semibold">{int(row.cart)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
