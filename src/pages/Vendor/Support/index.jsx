import React, { useEffect, useMemo, useState } from "react";
import { Bot, Headphones, MessageCircle, Paperclip, Send } from "lucide-react";
import * as supportApi from "../../../services/api.supportV1";
import { useSupportSocket } from "../../../hooks/useSupportSocket";
import { notifyOnFail, notifyOnSuccess } from "../../../utils/notification/toast";

const countWords = (value) =>
  value.trim().split(/\s+/).filter(Boolean).length;

const buildSubject = ({ category, productName, lastUserMessage }) => {
  const hint = lastUserMessage.replace(/\s+/g, " ").trim().slice(0, 48);
  const parts = [
    category || "Support request",
    productName ? `Product: ${productName}` : null,
    hint || null,
  ].filter(Boolean);
  return parts.join(" \u00b7 ").slice(0, 120);
};

const SupportPage = () => {
  const [context, setContext] = useState(null);
  const [categories, setCategories] = useState([]);
  const [supportStatus, setSupportStatus] = useState(null);
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [showHumanForm, setShowHumanForm] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [reply, setReply] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formProductId, setFormProductId] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [subjectTouched, setSubjectTouched] = useState(false);

  const loadTickets = async () => {
    const res = await supportApi.listTickets();
    if (res.data?.status === 1) setTickets(res.data.data || []);
  };

  useEffect(() => {
    Promise.all([
      supportApi.getContext(),
      supportApi.getCategories(),
      supportApi.startBotSession(),
      supportApi.getStatus(),
    ])
      .then(([ctxRes, catRes, botRes, statusRes]) => {
        if (ctxRes.data?.status === 1) setContext(ctxRes.data.data);
        if (catRes.data?.status === 1) setCategories(catRes.data.data || []);
        if (botRes.data?.status === 1) {
          setSessionId(botRes.data.data.session_id);
          setMessages([{ role: "bot", text: botRes.data.data.greeting }]);
        }
        if (statusRes.data?.status === 1) setSupportStatus(statusRes.data.data);
        return loadTickets();
      })
      .catch((err) => notifyOnFail(err?.response?.data?.message || "Unable to load support"));
  }, []);

  const products = context?.products || [];
  const profile = context?.profile;

  const lastUserMessage = useMemo(
    () => [...messages].reverse().find((item) => item.role === "user")?.text || "",
    [messages]
  );

  useEffect(() => {
    if (!showHumanForm || subjectTouched) return;
    const product = products.find((p) => String(p.id) === String(formProductId));
    setFormSubject(
      buildSubject({ category: formCategory, productName: product?.name, lastUserMessage })
    );
  }, [showHumanForm, subjectTouched, formCategory, formProductId, lastUserMessage, products]);

  const openHumanForm = () => {
    setShowHumanForm(true);
    setSubjectTouched(false);
    setFormCategory("");
    setFormProductId("");
    setFormDescription(lastUserMessage || "");
    setAttachmentName("");
    setFormSubject(buildSubject({ category: "", productName: "", lastUserMessage }));
  };

  const sendBotMessage = async (event) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || !sessionId || busy) return;
    setInput("");
    setMessages((current) => [...current, { role: "user", text }]);
    setBusy(true);
    try {
      const res = await supportApi.askBot({ session_id: sessionId, message: text });
      if (res.data?.status === 1) {
        setMessages((current) => [...current, { role: "bot", text: res.data.data.answer }]);
      } else {
        notifyOnFail(res.data?.message || "Something went wrong");
      }
    } catch (err) {
      notifyOnFail(err?.response?.data?.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const submitTicket = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const category = String(form.get("category") || "");
    const description = String(form.get("description") || "").trim();
    const subject = String(form.get("subject") || "").trim();

    if (countWords(description) < 30) {
      notifyOnFail("Please describe the issue in at least 30 words");
      return;
    }
    if (!subject) {
      notifyOnFail("Subject is required");
      return;
    }

    form.set("subject", subject);
    form.set("description", description);
    form.set("bot_session_id", sessionId);
    form.set("channel", "chat");
    setBusy(true);
    try {
      const res = await supportApi.createTicket(form);
      if (res.data?.status !== 1) {
        notifyOnFail(res.data?.message || "Failed to create ticket");
        return;
      }
      notifyOnSuccess(`Ticket ${res.data.data.ticket_number} created`);
      setShowHumanForm(false);
      await loadTickets();
      await openTicket(res.data.data.id);
    } catch (err) {
      notifyOnFail(err?.response?.data?.message || "Failed to create ticket");
    } finally {
      setBusy(false);
    }
  };

  const openTicket = async (id) => {
    const res = await supportApi.getTicket(id);
    if (res.data?.status === 1) setSelectedTicket(res.data.data);
  };

  useSupportSocket(selectedTicket?.id || null, () => {
    if (selectedTicket) void openTicket(selectedTicket.id);
  });

  const sendReply = async (event) => {
    event.preventDefault();
    if (!selectedTicket || !reply.trim()) return;
    const form = new FormData();
    form.set("message", reply.trim());
    form.set("channel", "chat");
    try {
      const res = await supportApi.replyToTicket(selectedTicket.id, form);
      if (res.data?.status === 1) {
        setReply("");
        await openTicket(selectedTicket.id);
      } else {
        notifyOnFail(res.data?.message || "Failed to send reply");
      }
    } catch (err) {
      notifyOnFail(err?.response?.data?.message || "Failed to send reply");
    }
  };

  return (
    <main className="p-4 md:p-6 lg:p-8 space-y-6">
      <h2 className="text-2xl font-semibold">Support</h2>

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <Bot className="text-primary-100" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold">Vendor Support Assistant</h3>
              {supportStatus && (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    supportStatus.online ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${supportStatus.online ? "bg-green-600" : "bg-gray-400"}`} />
                  {supportStatus.online ? "Support online" : "Support offline"}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">Ask about orders, invoices, payouts or products.</p>
          </div>
        </div>

        {supportStatus && !supportStatus.online && supportStatus.offline_message && (
          <div className="mb-3 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-800">
            {supportStatus.offline_message}
          </div>
        )}

        <div className="h-72 space-y-3 overflow-y-auto rounded-xl bg-gray-50 p-3">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm ${
                message.role === "user" ? "ml-auto bg-primary-100 text-white" : "bg-white"
              }`}
            >
              {message.text}
            </div>
          ))}
        </div>
        <form onSubmit={sendBotMessage} className="mt-3 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about orders, invoices, payouts or products..."
            className="min-w-0 flex-1 rounded-lg border px-3 py-2"
          />
          <button className="cursor-pointer rounded-lg bg-primary-100 p-2 text-white" disabled={busy}>
            <Send size={18} />
          </button>
        </form>
        <div className="mt-3">
          <button
            type="button"
            onClick={openHumanForm}
            disabled={!messages.some((item) => item.role === "user")}
            className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-primary-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Headphones size={17} /> Connect with vendor support
          </button>
        </div>
      </section>

      {showHumanForm && (
        <form onSubmit={submitTicket} className="grid gap-3 rounded-2xl border bg-white p-5">
          <h3 className="font-bold">Help us with a few details</h3>

          {!profile?.email && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Email</label>
              <input name="contact_email" type="email" required className="w-full rounded-lg border p-2" />
            </div>
          )}
          {!profile?.phone && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Phone</label>
              <input name="contact_phone" required className="w-full rounded-lg border p-2" />
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Issue type</label>
            <select
              name="category"
              required
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
              className="w-full cursor-pointer rounded-lg border p-2"
            >
              <option value="">Select issue</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Related product (optional)</label>
            <select
              name="product_id"
              value={formProductId}
              onChange={(e) => setFormProductId(e.target.value)}
              className="w-full cursor-pointer rounded-lg border p-2"
            >
              <option value="">Not product-specific</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Subject</label>
            <input
              name="subject"
              required
              value={formSubject}
              onChange={(e) => {
                setSubjectTouched(true);
                setFormSubject(e.target.value);
              }}
              className="w-full rounded-lg border p-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Describe the issue</label>
            <textarea
              name="description"
              required
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Please share what happened and any order, invoice or payout details that can help us..."
              className="min-h-28 w-full rounded-lg border p-2"
            />
            <p className={`mt-1 text-xs ${countWords(formDescription) >= 30 ? "text-green-600" : "text-gray-500"}`}>
              {countWords(formDescription)}/30 words minimum
            </p>
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm hover:border-primary-100">
            <Paperclip size={18} className="shrink-0 text-primary-100" />
            <span className="min-w-0 flex-1">
              <span className="block font-medium">Add attachment</span>
              <span className="block truncate text-xs text-gray-500">
                {attachmentName || "Image or PDF (optional)"}
              </span>
            </span>
            <input
              name="attachment"
              type="file"
              accept="image/*,.pdf"
              className="sr-only"
              onChange={(e) => setAttachmentName(e.target.files?.[0]?.name || "")}
            />
          </label>

          <button
            disabled={busy}
            className="cursor-pointer rounded-lg bg-primary-100 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Create ticket &amp; start chat
          </button>
        </form>
      )}

      <section className="rounded-2xl border bg-white p-5">
        <h3 className="mb-3 font-bold">My tickets</h3>
        {tickets.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-gray-50 p-6 text-center">
            <p className="font-medium">No tickets yet</p>
            <p className="mt-1 text-sm text-gray-500">
              When you connect with support, your tickets will show up here.
            </p>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {tickets.map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => openTicket(ticket.id)}
                className="cursor-pointer rounded-xl border p-3 text-left hover:border-primary-100"
              >
                <div className="font-semibold">{ticket.ticket_number}</div>
                <div className="text-sm">{ticket.subject}</div>
                <div className="text-xs text-gray-500">{ticket.status}</div>
              </button>
            ))}
          </div>
        )}
      </section>

      {selectedTicket && (
        <section className="rounded-2xl border bg-white p-5">
          <div className="mb-3 flex items-center gap-2 font-bold">
            <MessageCircle size={18} /> {selectedTicket.ticket_number}
          </div>
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {(selectedTicket.replies || []).map((item) => (
              <div
                key={item.id}
                className={`rounded-lg p-2 text-sm ${item.is_admin_reply ? "bg-blue-50" : "bg-gray-100"}`}
              >
                <strong>{item.is_admin_reply ? "Support" : "You"}:</strong> {item.message}
              </div>
            ))}
          </div>
          {!["Closed", "Resolved"].includes(selectedTicket.status) && (
            <form onSubmit={sendReply} className="mt-3 flex gap-2">
              <input
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                className="flex-1 rounded-lg border p-2"
                placeholder="Reply..."
              />
              <button className="cursor-pointer rounded-lg bg-primary-100 px-4 text-white">Send</button>
            </form>
          )}
        </section>
      )}
    </main>
  );
};

export default SupportPage;
