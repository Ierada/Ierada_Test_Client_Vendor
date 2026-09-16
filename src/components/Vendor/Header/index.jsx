import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import { format } from "date-fns";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  Menu,
  MessageCircle,
  Search,
  X,
} from "lucide-react";
import { useAppContext } from "../../../context/AppContext";
import { getNotificationPreview } from "../../../services/api.notification";
import "react-datepicker/dist/react-datepicker.css";

const greetingForHour = (hour) => {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

const shopLabel = (user) =>
  user?.shopName ||
  user?.shop_name ||
  user?.brand_name ||
  user?.shop ||
  user?.name ||
  "Selling Partner";

const initialsOf = (name) => {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "S";
  return parts
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
};

const formatRange = (from, to) => {
  if (!from) return "Select dates";
  if (!to) return format(from, "MMM d, yyyy");
  return `${format(from, "MMM d")} – ${format(to, "MMM d, yyyy")}`;
};

const RangeButton = React.forwardRef(function RangeButton(
  { onClick, display },
  ref,
) {
  return (
    <button
      type="button"
      ref={ref}
      onClick={onClick}
      className="inline-flex h-[31px] shrink-0 items-center gap-2 rounded-full border border-[#E6E8EE] bg-white px-3 text-[12px] font-medium text-[#374151] hover:bg-gray-50"
    >
      <span className="whitespace-nowrap">{display}</span>
      <CalendarDays className="h-4 w-4 text-[#9CA3AF]" strokeWidth={1.75} />
    </button>
  );
});

const CalendarIconButton = React.forwardRef(function CalendarIconButton(
  { onClick, title },
  ref,
) {
  return (
    <button
      type="button"
      ref={ref}
      onClick={onClick}
      className="flex h-[31px] w-[31px] items-center justify-center text-[#4B5563]"
      title={title}
    >
      <CalendarDays className="h-5 w-5" />
    </button>
  );
});

const Header = ({
  sidebarOpen,
  setSidebarOpen,
  sidebarExpanded = false,
  dateRange,
  onDateRangeChange,
}) => {
  const { user } = useAppContext();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const searchRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  const greeting = useMemo(() => greetingForHour(new Date().getHours()), []);
  const shop = shopLabel(user);
  const initials = initialsOf(shop);
  const avatarSrc = user?.avatar || user?.profile_pic || user?.userAvatar || "";
  const from = dateRange?.from || null;
  const to = dateRange?.to || null;

  useEffect(() => {
    const fetchNotificationPreview = async () => {
      if (!user?.id) return;
      const res = await getNotificationPreview(user.id, { silent: true });
      if (res?.data) setNotifications(res.data);
    };
    fetchNotificationPreview();
  }, [user?.id]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (window.matchMedia("(min-width: 768px)").matches) {
          searchRef.current?.focus();
        } else {
          setMobileSearchOpen(true);
          setTimeout(() => mobileSearchRef.current?.focus(), 0);
        }
      }
      if (e.key === "Escape") setMobileSearchOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const unreadCount = (notifications || []).filter(
    (n) => n.unread || n.is_read === false || n.is_read === 0,
  ).length;

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchValue.trim();
    setMobileSearchOpen(false);
    navigate(q ? `/product/list?q=${encodeURIComponent(q)}` : "/product/list");
  };

  const searchField = (inputRef) => (
    <label className="relative block w-full">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
      <input
        ref={inputRef}
        type="text"
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        placeholder="Search orders, products, SKU, customers..."
        className="h-[31px] w-full rounded-full border border-[#E6E8EE] bg-[#F9FAFB] pl-10 pr-14 text-[12px] text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:border-[#D1D5DB] focus:bg-white"
      />
      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md border border-[#E5E7EB] bg-white px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-[#9CA3AF]">
        ⌘K
      </span>
    </label>
  );

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-20 h-[66px] border-b border-[#EEF0F4] bg-white transition-[margin] duration-150 ease-out ${
        sidebarExpanded ? "lg:ml-56" : "lg:ml-[72px]"
      }`}
    >
      <div className="hidden h-full items-center gap-6 px-6 md:grid md:grid-cols-[minmax(0,1fr)_minmax(280px,420px)_minmax(0,1fr)]">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg p-1 hover:bg-gray-100 lg:hidden"
          >
            {sidebarOpen ? (
              <X className="h-5 w-5 text-gray-700" />
            ) : (
              <Menu className="h-5 w-5 text-gray-700" />
            )}
          </button>
          <div className="min-w-0">
            <h1 className="truncate font-satoshi text-[15px] font-semibold leading-tight text-[#111827] lg:text-[17px]">
              {greeting}, {shop} <span aria-hidden="true">👋</span>
            </h1>
            <p className="truncate font-satoshi text-[10px] text-[#9CA3AF]">
              Here&apos;s what&apos;s happening with your business today.
            </p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="w-full">
          {searchField(searchRef)}
        </form>

        <div className="flex items-center justify-end gap-2.5">
          {onDateRangeChange ? (
            <DatePicker
              selectsRange
              startDate={from}
              endDate={to}
              onChange={(dates) => {
                const [start, end] = dates;
                onDateRangeChange({ from: start, to: end });
              }}
              maxDate={new Date()}
              customInput={<RangeButton display={formatRange(from, to)} />}
              popperClassName="z-[60]"
              popperPlacement="bottom-end"
            />
          ) : null}

          <div className="relative" ref={notificationRef}>
            <button
              type="button"
              onClick={() => {
                setShowNotifications((v) => !v);
                setShowProfile(false);
              }}
              className="relative flex h-[31px] w-[31px] items-center justify-center text-[#4B5563] hover:text-[#111827]"
              title="Notifications"
            >
              <Bell className="h-5 w-5" strokeWidth={1.75} />
              {unreadCount > 0 && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#EF4444]" />
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-gray-200 bg-white py-2 shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                  <h3 className="font-semibold text-gray-800">Notifications</h3>
                  <Link
                    to="/notifications"
                    onClick={() => setShowNotifications(false)}
                    className="text-xs text-[#FF6012]"
                  >
                    View all
                  </Link>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.slice(0, 6).map((notification) => (
                      <Link
                        to="/notifications"
                        key={notification.id}
                        onClick={() => setShowNotifications(false)}
                        className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        {notification.text ||
                          notification.title ||
                          notification.message}
                      </Link>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center text-sm text-gray-500">
                      No notifications
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <Link
            to="/chat"
            className="relative flex h-[31px] w-[31px] items-center justify-center text-[#4B5563] hover:text-[#111827]"
            title="Chat"
          >
            <MessageCircle className="h-5 w-5" strokeWidth={1.75} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#EF4444]" />
          </Link>

          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => {
                setShowProfile((v) => !v);
                setShowNotifications(false);
              }}
              className="flex items-center gap-1.5 rounded-full py-0.5 pl-0.5 pr-1 hover:bg-gray-50"
              title={shop}
            >
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={shop}
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EEF2FF] text-[10px] font-semibold text-[#4F46E5]">
                  {initials}
                </span>
              )}
              <ChevronDown className="h-3.5 w-3.5 text-[#9CA3AF]" />
            </button>
            {showProfile && (
              <div className="absolute right-0 z-50 mt-2 w-44 rounded-xl border border-gray-200 bg-white py-1 shadow-xl">
                <Link
                  to="/profile"
                  onClick={() => setShowProfile(false)}
                  className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Profile
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setShowProfile(false)}
                  className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Settings
                </Link>
                <Link
                  to="/logout"
                  onClick={() => setShowProfile(false)}
                  className="block px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Logout
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex h-full items-center gap-2 px-4 md:hidden">
        <button
          type="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="rounded-lg p-1 hover:bg-gray-100"
        >
          {sidebarOpen ? (
            <X className="h-5 w-5 text-gray-700" />
          ) : (
            <Menu className="h-5 w-5 text-gray-700" />
          )}
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-satoshi text-[14px] font-semibold text-[#111827]">
            {greeting}, {shop} <span aria-hidden="true">👋</span>
          </h1>
        </div>
        <button
          type="button"
          onClick={() => {
            setMobileSearchOpen(true);
            setTimeout(() => mobileSearchRef.current?.focus(), 0);
          }}
          className="flex h-[31px] w-[31px] items-center justify-center text-[#4B5563]"
          title="Search"
        >
          <Search className="h-5 w-5" />
        </button>
        {onDateRangeChange ? (
          <DatePicker
            selectsRange
            startDate={from}
            endDate={to}
            onChange={(dates) => {
              const [start, end] = dates;
              onDateRangeChange({ from: start, to: end });
            }}
            maxDate={new Date()}
            customInput={<CalendarIconButton title={formatRange(from, to)} />}
            popperClassName="z-[60]"
            popperPlacement="bottom-end"
          />
        ) : null}
        <Link
          to="/notifications"
          className="relative flex h-[31px] w-[31px] items-center justify-center text-[#4B5563]"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#EF4444]" />
          )}
        </Link>
        <Link
          to="/chat"
          className="relative flex h-[31px] w-[31px] items-center justify-center text-[#4B5563]"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#EF4444]" />
        </Link>
        <Link to="/profile" className="flex items-center">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={shop}
              className="h-7 w-7 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EEF2FF] text-[10px] font-semibold text-[#4F46E5]">
              {initials}
            </span>
          )}
        </Link>
      </div>

      {mobileSearchOpen && (
        <div className="absolute inset-x-0 top-0 z-30 flex h-[66px] items-center gap-2 border-b border-[#EEF0F4] bg-white px-4 md:hidden">
          <form onSubmit={handleSearch} className="flex-1">
            {searchField(mobileSearchRef)}
          </form>
          <button
            type="button"
            onClick={() => setMobileSearchOpen(false)}
            className="text-sm text-[#6B7280]"
          >
            Cancel
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;
