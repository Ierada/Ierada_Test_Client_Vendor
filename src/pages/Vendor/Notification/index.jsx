import React, { useState, useEffect, useRef } from "react";
import {
  deleteNotification,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../../../services/api.notification";
import { useAppContext } from "../../../context/AppContext";
import {
  MdShoppingBag,
  MdPayment,
  MdSettings,
  MdNotificationsNone,
} from "react-icons/md";

const TABS = [
  { key: "all", label: "All" },
  { key: "orders", label: "Orders" },
  { key: "payments", label: "Payments" },
  { key: "system", label: "System" },
];

const ORDER_TYPES = new Set(["orders", "product", "review", "shipping"]);
const PAYMENT_TYPES = new Set(["payments"]);
const SYSTEM_TYPES = new Set([
  "kyc", "support", "ticket", "joinus", "emailsubscribe",
  "chat", "blogcomment", "wishlist",
]);

const getTabForType = (type) => {
  if (ORDER_TYPES.has(type)) return "orders";
  if (PAYMENT_TYPES.has(type)) return "payments";
  if (SYSTEM_TYPES.has(type)) return "system";
  return "system";
};

const TYPE_CONFIG = {
  orders: { icon: MdShoppingBag, bg: "bg-orange-50", iconColor: "text-orange-500" },
  product: { icon: MdShoppingBag, bg: "bg-blue-50", iconColor: "text-blue-500" },
  review: { icon: MdShoppingBag, bg: "bg-purple-50", iconColor: "text-purple-500" },
  shipping: { icon: MdShoppingBag, bg: "bg-teal-50", iconColor: "text-teal-500" },
  payments: { icon: MdPayment, bg: "bg-green-50", iconColor: "text-green-500" },
  kyc: { icon: MdSettings, bg: "bg-indigo-50", iconColor: "text-indigo-500" },
  support: { icon: MdSettings, bg: "bg-red-50", iconColor: "text-red-500" },
  ticket: { icon: MdSettings, bg: "bg-amber-50", iconColor: "text-amber-500" },
  joinus: { icon: MdSettings, bg: "bg-gray-100", iconColor: "text-gray-500" },
  emailsubscribe: { icon: MdSettings, bg: "bg-gray-100", iconColor: "text-gray-500" },
  chat: { icon: MdSettings, bg: "bg-gray-100", iconColor: "text-gray-500" },
  blogcomment: { icon: MdSettings, bg: "bg-gray-100", iconColor: "text-gray-500" },
  wishlist: { icon: MdSettings, bg: "bg-gray-100", iconColor: "text-gray-500" },
};

const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min${minutes > 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const VendorNotification = () => {
  const { user, setTriggerHeaderCounts } = useAppContext();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const hasFetched = useRef(false);

  const fetchNotifications = async (reset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const currentOffset = reset ? 0 : offset;
      const res = await getNotifications(user.id, 50, currentOffset);
      if (res?.data) {
        setNotifications((prev) => (reset ? res.data : [...prev, ...res.data]));
        setOffset(reset ? 50 : currentOffset + 50);
        setHasMore(res.data.length === 50);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshNotifications = async () => {
    setOffset(0);
    setHasMore(true);
    await fetchNotifications(true);
  };

  const handleNotificationRead = async (id) => {
    await markNotificationAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setTriggerHeaderCounts((prev) => !prev);
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setTriggerHeaderCounts((prev) => !prev);
  };

  const handleDeleteNotification = async (id) => {
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setTriggerHeaderCounts((prev) => !prev);
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchNotifications(true);
    }
  }, [user.id]);

  const filtered =
    activeTab === "all"
      ? notifications
      : notifications.filter((n) => getTabForType(n.type) === activeTab);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen mb-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-[32px] font-semibold text-gray-900">Notifications</h1>
          <p className="text-gray-500 text-[14px]">
            Stay updated with order fulfillment, payouts status, and system integrations alerts.
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-[13px] font-medium text-orange-500 border border-orange-300 rounded-lg px-4 py-2 hover:bg-orange-50 transition"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6">
        {TABS.map((tab) => {
          const count =
            tab.key === "all"
              ? notifications.length
              : notifications.filter((n) => getTabForType(n.type) === tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2 rounded-full text-[13px] font-medium transition ${
                activeTab === tab.key
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Notification List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <MdNotificationsNone className="w-16 h-16 text-gray-300 mb-3" />
            <p className="text-gray-400 text-sm font-medium">
              {loading ? "Loading notifications..." : "No notifications found"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((notification) => {
              const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.joinus;
              const Icon = config.icon;
              return (
                <div
                  key={notification.id}
                  onClick={() => !notification.is_read && handleNotificationRead(notification.id)}
                  className={`flex items-center gap-4 px-4 py-4 rounded-xl transition cursor-pointer ${
                    !notification.is_read
                      ? "bg-orange-50/60 hover:bg-orange-50"
                      : "bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${config.bg}`}>
                    <Icon className={`w-5 h-5 ${config.iconColor}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-semibold text-gray-900 truncate">
                        {notification.title || "Notification"}
                      </p>
                      {!notification.is_read && (
                        <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[13px] text-gray-500 mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                  </div>

                  {/* Time */}
                  <span className="text-[12px] text-gray-400 whitespace-nowrap shrink-0">
                    {timeAgo(notification.created_at)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Load More */}
        {hasMore && filtered.length > 0 && (
          <div className="pt-4 text-center">
            <button
              onClick={() => fetchNotifications(false)}
              disabled={loading}
              className="text-[13px] font-medium text-orange-500 hover:underline disabled:opacity-50"
            >
              {loading ? "Loading..." : "Load more"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorNotification;
