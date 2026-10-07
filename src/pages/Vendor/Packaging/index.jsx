import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  packagingCheckout,
  packagingOrder,
  packagingOrders,
  packagingImageSrc,
  packagingPhotoUrl,
  packagingQuery,
  packagingReceived,
  packagingShop,
  packagingVerify,
} from "../../../services/api.packaging";
import { notifyOnFail, notifyOnSuccess, notifyOnWarning } from "../../../utils/notification/toast";

const inputClass = "w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[#F47954]";

function money(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function Thumb({ file }) {
  const [src, setSrc] = useState("");
  const [blob, setBlob] = useState("");
  const tried = useRef(false);
  useEffect(() => {
    tried.current = false;
    setSrc(packagingImageSrc(file));
    setBlob("");
  }, [file]);
  useEffect(() => () => { if (blob) URL.revokeObjectURL(blob); }, [blob]);
  if (!file || !src) return <div className="h-24 w-full bg-[#FFF1EC]" />;
  return (
    <img
      src={src}
      alt=""
      className="h-24 w-full object-cover"
      onError={() => {
        if (tried.current || !file) {
          setSrc("");
          return;
        }
        tried.current = true;
        packagingPhotoUrl(file).then((next) => { setBlob(next); setSrc(next); }).catch(() => setSrc(""));
      }}
    />
  );
}

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Payment window could not be opened"));
    document.body.appendChild(script);
  });
}

const emptyAddress = { name: "", phone: "", line: "", city: "", state: "", zip: "" };

export default function PackagingShop() {
  const [tab, setTab] = useState("shop");
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [address, setAddress] = useState(emptyAddress);
  const [orders, setOrders] = useState([]);
  const [open, setOpen] = useState(null);
  const [query, setQuery] = useState({ subject: "", message: "", file: null });
  const [paying, setPaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [gateways, setGateways] = useState({ razorpay: false, payu: false });
  const [gateway, setGateway] = useState("");
  const [params, setParams] = useSearchParams();

  const loadShop = () => {
    setLoading(true);
    packagingShop()
      .then((body) => {
        setItems(body.items || []);
        setGateways(body.gateways || { razorpay: false, payu: false });
        setGateway((current) => {
          if (current) return current;
          if (body.gateways?.razorpay) return "razorpay";
          if (body.gateways?.payu) return "payu";
          return "";
        });
        if (body.address) {
          setAddress((prev) => (prev.line ? prev : { ...emptyAddress, ...body.address }));
        }
      })
      .catch((err) => notifyOnFail(err.message))
      .finally(() => setLoading(false));
  };

  const loadOrders = () => {
    packagingOrders()
      .then((body) => setOrders(body.orders || []))
      .catch((err) => notifyOnFail(err.message));
  };

  useEffect(() => {
    loadShop();
    loadOrders();
    const flag = params.get("payu");
    if (!flag) return;
    if (flag === "placed") notifyOnSuccess(params.get("order") ? `Order ${params.get("order")} placed` : "Packaging order placed");
    else if (flag === "refunded") notifyOnWarning("The payment was refunded because the order could not be placed.");
    else if (flag === "failed") notifyOnFail("Payment was not completed. Nothing was charged.");
    else notifyOnWarning("Payment is being confirmed. Nothing has been refunded.");
    params.delete("payu");
    params.delete("order");
    setParams(params, { replace: true });
  }, []);

  const add = (item) => {
    if (!item.is_active) {
      notifyOnFail("This item is not available");
      return;
    }
    if (Number(item.stock) < Number(item.min_qty)) {
      notifyOnFail("Not enough stock for this quantity");
      return;
    }
    const found = cart.find((row) => row.id === item.id);
    const nextQty = found ? found.qty + item.min_qty : item.min_qty;
    if (nextQty > item.stock) {
      notifyOnFail("Not enough stock for this quantity");
      return;
    }
    if (nextQty % item.min_qty !== 0) {
      notifyOnFail(`Order in packs of ${item.min_qty}`);
      return;
    }
    if (item.max_qty && nextQty > Number(item.max_qty)) {
      notifyOnFail(`Maximum quantity is ${item.max_qty}`);
      return;
    }
    setCart((prev) => {
      if (found) return prev.map((row) => (row.id === item.id ? { ...row, qty: nextQty } : row));
      return [...prev, { ...item, qty: item.min_qty }];
    });
  };

  const total = useMemo(() => cart.reduce((sum, row) => {
    const base = row.unit_price * row.qty;
    return sum + base + (base * row.gst_percent) / 100;
  }, 0), [cart]);

  const pay = async () => {
    if (!cart.length) {
      notifyOnFail("Your packaging cart is empty");
      return;
    }
    if (!address.name || !address.phone || !address.line || !address.city || !address.state || !address.zip) {
      notifyOnFail("Enter the full delivery address");
      return;
    }
    setPaying(true);
    try {
      if (!gateway) {
        notifyOnFail("Choose Razorpay or PayU");
        setPaying(false);
        return;
      }
      const session = await packagingCheckout({
        items: cart.map((row) => ({ material_id: row.id, qty: row.qty })),
        address,
        gateway,
      });
      if (session.gateway === "payu") {
        const form = document.createElement("form");
        form.method = "POST";
        form.action = session.url;
        Object.entries(session.params || {}).forEach(([name, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = name;
          input.value = value == null ? "" : String(value);
          form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
        return;
      }
      await loadRazorpay();
      await new Promise((resolve, reject) => {
        const checkout = new window.Razorpay({
          key: session.key_id,
          amount: Math.round(Number(session.amount) * 100),
          currency: "INR",
          name: "Ierada",
          description: "Packaging material",
          order_id: session.razorpay_order_id,
          prefill: { name: session.seller_name, email: session.email, contact: session.phone },
          handler: (response) => resolve(response),
          modal: { ondismiss: () => reject(new Error("Payment window closed. Nothing was charged.")) },
        });
        checkout.on("payment.failed", (resp) => {
          reject(new Error(resp?.error?.description || "Payment failed. Nothing was charged."));
        });
        checkout.open();
      }).then(async (response) => {
        const placed = await packagingVerify({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        });
        notifyOnSuccess(placed.message || "Packaging order placed");
        setCart([]);
        setTab("orders");
        loadOrders();
        loadShop();
      });
    } catch (err) {
      if (err.refunded) notifyOnWarning(err.message);
      else notifyOnFail(err.message || "Payment could not be completed");
    } finally {
      setPaying(false);
    }
  };

  const showOrder = (id) => {
    packagingOrder(id).then((body) => setOpen(body.order)).catch((err) => notifyOnFail(err.message));
  };

  const markReceived = async () => {
    if (!open) return;
    if (open.status !== "delivered") {
      notifyOnFail("Abhi delivered mark nahi hua");
      return;
    }
    try {
      const body = await packagingReceived(open.id);
      notifyOnSuccess(body.message || "Marked as received");
      setOpen(body.order);
      loadOrders();
    } catch (err) {
      notifyOnFail(err.message);
    }
  };

  const sendQuery = async () => {
    if (!open) return;
    if (open.status !== "received") {
      notifyOnFail("A query can be raised only after you mark the order received");
      return;
    }
    if (!query.subject.trim() || !query.message.trim()) {
      notifyOnFail("Subject and message are required");
      return;
    }
    if (query.file && query.file.size > 2 * 1024 * 1024) {
      notifyOnFail("Photo must be under 2 MB");
      return;
    }
    const form = new FormData();
    form.append("subject", query.subject.trim());
    form.append("message", query.message.trim());
    if (query.file) form.append("packaging_query", query.file);
    try {
      const body = await packagingQuery(open.id, form);
      notifyOnSuccess(body.message || "Query sent");
      setQuery({ subject: "", message: "", file: null });
      setOpen(body.order);
    } catch (err) {
      notifyOnFail(err.message);
    }
  };

  const reorder = () => {
    if (!open?.items?.length) return;
    const next = [];
    open.items.forEach((line) => {
      const live = items.find((item) => item.id === line.material_id);
      const qty = Number(line.qty);
      if (!live || !live.is_active) {
        notifyOnWarning(`${line.name} is not available now`);
        return;
      }
      if (!Number.isInteger(qty) || qty < Number(live.min_qty) || qty % Number(live.min_qty) !== 0) {
        notifyOnWarning(`${line.name} no longer matches the minimum order`);
        return;
      }
      if (live.max_qty && qty > Number(live.max_qty)) {
        notifyOnWarning(`${line.name} is above the maximum order of ${live.max_qty}`);
        return;
      }
      if (qty > Number(live.stock)) {
        notifyOnWarning(`${line.name} does not have enough stock`);
        return;
      }
      next.push({ ...live, qty });
    });
    if (!next.length) {
      notifyOnFail("None of those items can be ordered again");
      return;
    }
    setCart(next);
    setTab("shop");
    setOpen(null);
    notifyOnSuccess("Cart filled. Pay again to place a new order.");
  };

  return (
    <div className="min-h-full bg-[#FFF8F6] p-4 md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#F6D2C6] bg-white px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#F47954]">Ierada packaging</p>
          <h1 className="text-xl font-semibold text-gray-900">Packaging material</h1>
          <p className="text-sm text-gray-500">Prepaid with Razorpay or PayU. This is not a customer order.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className={`rounded-md px-3 py-2 text-sm ${tab === "shop" ? "bg-[#F47954] text-white" : "bg-gray-100"}`} onClick={() => setTab("shop")}>Shop</button>
          <button type="button" className={`rounded-md px-3 py-2 text-sm ${tab === "orders" ? "bg-[#F47954] text-white" : "bg-gray-100"}`} onClick={() => { setTab("orders"); loadOrders(); }}>My orders</button>
        </div>
      </div>
      {tab === "shop" ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div>
            {loading ? <p className="text-sm text-gray-500">Loading…</p> : null}
            {!loading && items.length === 0 ? <div className="rounded-xl border border-dashed p-8 text-center text-sm text-gray-500">No packaging is available right now.</div> : null}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
              {items.map((item) => (
                <article key={item.id} className="flex flex-col overflow-hidden rounded-xl border border-[#F6D2C6] bg-white shadow-sm">
                  <div className="h-1 bg-[#F47954]" />
                  <Thumb file={item.thumbnail} />
                  <div className="flex flex-1 flex-col p-2.5">
                    <h2 className="text-sm font-medium leading-tight text-gray-900">{item.name}</h2>
                    <p className="text-xs text-gray-500">{item.size_label}</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{money(item.unit_price)}</p>
                    <p className="text-[11px] text-gray-500">{item.length_cm} × {item.breadth_cm} × {item.height_cm} cm</p>
                    <p className="text-[11px] text-gray-500">Min {item.min_qty}{item.max_qty ? ` · max ${item.max_qty}` : ""} · stock {item.stock}</p>
                    <button type="button" className="mt-3 w-full rounded-md bg-[#F47954] py-2 text-sm font-medium text-white" onClick={() => add(item)}>Add to cart</button>
                  </div>
                </article>
              ))}
            </div>
          </div>
          <aside className="h-fit rounded-2xl border border-[#F6D2C6] bg-white p-4 shadow-sm">
            <h2 className="font-medium">Cart</h2>
            {cart.length === 0 ? <p className="mt-2 text-sm text-gray-500">Add a pack to continue.</p> : null}
            {cart.map((row) => (
              <div key={row.id} className="mt-2 flex items-center justify-between text-sm">
                <span>{row.name} ({row.size_label}) × {row.qty}</span>
                <button type="button" className="text-xs text-red-600" onClick={() => setCart(cart.filter((item) => item.id !== row.id))}>Remove</button>
              </div>
            ))}
            <p className="mt-3 text-sm font-medium">Total {money(total)}</p>
            <p className="mt-3 text-xs text-gray-500">The server checks price, size, and stock again before charging.</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" disabled={!gateways.razorpay} onClick={() => setGateway("razorpay")} className={`rounded-md border px-2 py-2 text-sm ${gateway === "razorpay" ? "border-[#F47954] bg-[#FFF1EC] text-[#F47954]" : "border-gray-200"} disabled:opacity-40`}>Razorpay</button>
              <button type="button" disabled={!gateways.payu} onClick={() => setGateway("payu")} className={`rounded-md border px-2 py-2 text-sm ${gateway === "payu" ? "border-[#F47954] bg-[#FFF1EC] text-[#F47954]" : "border-gray-200"} disabled:opacity-40`}>PayU</button>
            </div>
            <div className="mt-3 grid gap-2">
              {["name", "phone", "line", "city", "state", "zip"].map((key) => (
                <input
                  key={key}
                  className={inputClass}
                  placeholder={key === "line" ? "Street address" : key === "zip" ? "PIN code" : key[0].toUpperCase() + key.slice(1)}
                  value={address[key] || ""}
                  onChange={(e) => setAddress({ ...address, [key]: e.target.value })}
                />
              ))}
            </div>
            <button type="button" disabled={paying} className="mt-3 w-full rounded-md bg-[#F47954] py-2 text-sm text-white disabled:opacity-60" onClick={pay}>
              {paying ? "Waiting for payment…" : "Pay now"}
            </button>
          </aside>
        </div>
      ) : (
        <div className="grid gap-3">
          {orders.length === 0 ? <div className="rounded-xl border border-dashed p-8 text-center text-sm text-gray-500">No packaging orders yet. An order appears only after payment.</div> : null}
          {orders.map((order) => (
            <button key={order.id} type="button" onClick={() => showOrder(order.id)} className="rounded-2xl border border-[#F6D2C6] bg-white p-4 text-left shadow-sm">
              <div className="flex justify-between gap-2">
                <span>
                  <span className="block text-xs uppercase tracking-wide text-[#F47954]">Order ID</span>
                  <span className="font-medium">{order.order_number}</span>
                </span>
                <span className="text-xs capitalize text-[#F47954]">{String(order.status).replace(/_/g, " ")}</span>
              </div>
              <p className="mt-1 text-sm text-gray-600">{money(order.total)} · {(order.items || []).length} items</p>
            </button>
          ))}
        </div>
      )}
      {open ? (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/40">
          <div className="h-full w-full max-w-lg overflow-y-auto bg-white p-5">
            <div className="mb-2 flex justify-between">
              <h2 className="text-lg font-semibold">{open.order_number}</h2>
              <button type="button" onClick={() => setOpen(null)}>Close</button>
            </div>
            <p className="text-sm capitalize">Status: {String(open.status).replace(/_/g, " ")} · Payment {open.payment_status}</p>
            <p className="text-sm">Amount {money(open.total)} · Invoice {open.invoice_number}</p>
            {open.cancel_note ? <p className="mt-2 text-sm text-red-700">Cancelled: {open.cancel_note}. Payment refunded.</p> : null}
            {open.tracking_number ? <p className="mt-2 text-sm">{open.courier_name} · {open.tracking_number} · {open.dispatch_date || ""}</p> : null}
            <ul className="mt-3 space-y-1 text-sm">
              {(open.items || []).map((item) => <li key={item.line_code || item.sku}>{item.line_code ? `${item.line_code} · ` : ""}{item.name} ({item.size_label}) {item.length_cm}×{item.breadth_cm}×{item.height_cm} cm × {item.qty}</li>)}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className="rounded-md border px-3 py-2 text-sm" onClick={reorder}>Reorder</button>
              <button
                type="button"
                className={`rounded-md bg-[#F47954] px-3 py-2 text-sm text-white ${open.status !== "delivered" ? "opacity-50" : ""}`}
                onClick={markReceived}
              >
                Mark received
              </button>
            </div>
            {open.status !== "delivered" && open.status !== "received" ? <p className="mt-1 text-xs text-gray-500">Received stays off until Ierada marks it delivered.</p> : null}
            {open.status === "received" ? (
              <div className="mt-4 grid gap-2">
                <h3 className="font-medium">Ask a question</h3>
                <p className="text-xs text-gray-500">This does not return the order or refund it.</p>
                <input className={inputClass} placeholder="Subject" value={query.subject} onChange={(e) => setQuery({ ...query, subject: e.target.value })} />
                <textarea className={inputClass} placeholder="Message" value={query.message} onChange={(e) => setQuery({ ...query, message: e.target.value })} />
                <input className={inputClass} type="file" accept="image/*" onChange={(e) => setQuery({ ...query, file: e.target.files?.[0] || null })} />
                <button type="button" className="rounded-md border px-3 py-2 text-sm" onClick={sendQuery}>Send query</button>
              </div>
            ) : null}
            {(open.queries || []).map((row) => (
              <div key={row.id} className="mt-3 rounded-lg border p-3 text-sm">
                <p className="font-medium">{row.subject} · {row.status}</p>
                <p>{row.message}</p>
                {row.admin_reply ? <p className="mt-1 text-gray-600">Ierada: {row.admin_reply}</p> : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
