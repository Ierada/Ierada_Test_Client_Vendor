import React, { useState, useRef, useEffect } from "react";
import { Search, Bell, Menu, X, Mail } from "lucide-react";
import { RiVerifiedBadgeFill } from "react-icons/ri";
import { FaUserCircle } from "react-icons/fa";
import { IoMdNotifications } from "react-icons/io";
import { useAppContext } from "../../../context/AppContext";
import { getNotificationPreview } from "../../../services/api.notification";

const Header = ({ sidebarOpen, setSidebarOpen }) => {
  const { user } = useAppContext();
  const [searchValue, setSearchValue] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const searchRef = useRef(null);
  const notificationRef = useRef(null);

  useEffect(() => {
    const fetchNotificationPreview = async () => {
      const res = await getNotificationPreview(user.id);
      res && setNotifications(res.data);
    };
    showNotifications && fetchNotificationPreview();
  }, [showNotifications, user.id]);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    console.log("Searching for:", searchValue);
  };

  const unreadCount = notifications?.filter((n) => n.unread).length;

  return (
    <header className="lg:ml-20 h-20 fixed top-0 left-0 right-0 z-20 bg-white border-b border-gray-200 transition-all duration-300">
      <div className="flex items-center justify-end h-full px-6">
        {/* Menu Toggle Button - Only visible on mobile */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {sidebarOpen ? (
            <X className="w-6 h-6 text-gray-700" />
          ) : (
            <Menu className="w-6 h-6 text-gray-700" />
          )}
        </button>

        {/* Search Bar - Left Side */}
        {/* <div className="relative flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              ref={searchRef}
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSearch(e);
                }
              }}
              placeholder="Search product"
              className="w-full py-3 pl-12 pr-4 rounded-full border border-gray-200 bg-gray-50 focus:outline-none focus:bg-white focus:border-gray-300 placeholder:text-gray-400 text-sm transition-all"
            />
          </div>
        </div> */}

        {/* Right Section - Icons and User Profile */}
        <div className="flex items-center space-x-4 ml-6">
          {/* Message Icon */}
          {/* <button className="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
            <Mail className="w-6 h-6 text-gray-600" />
            <span className="absolute top-1.5 right-1.5 flex items-center justify-center min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-semibold rounded-full px-1">
              2
            </span>
          </button> */}

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Bell className="w-6 h-6 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex items-center justify-center min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-semibold rounded-full px-1">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-800">Notifications</h3>
                  {unreadCount > 0 && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {unreadCount} unread
                    </p>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <a
                        href="notifications"
                        key={notification.id}
                        onClick={(e) => {
                          if (
                            window.location.pathname.endsWith("notifications")
                          ) {
                            e.preventDefault();
                          }
                        }}
                        className={`px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-start gap-3 transition-colors ${
                          notification.unread ? "bg-blue-50/50" : ""
                        }`}
                      >
                        <div className="flex-1">
                          <p
                            className={`text-sm ${
                              notification.unread
                                ? "font-medium text-gray-900"
                                : "text-gray-600"
                            }`}
                          >
                            {notification.text}
                          </p>
                        </div>
                        {notification.unread && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />
                        )}
                      </a>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center text-gray-500 text-sm">
                      No notifications
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px h-10 bg-gray-200" />

          {/* User Profile Section */}
          <div className="hidden md:flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-full flex-shrink-0">
              {user?.avatar ? (
                <img
                  src={user?.avatar}
                  alt="User Profile"
                  className="w-full h-full object-cover rounded-full border-2 border-gray-100"
                />
              ) : (
                <FaUserCircle className="w-full h-full text-gray-400 rounded-full" />
              )}
            </div>
            <div className="flex flex-col">
              <h2 className="font-semibold text-gray-900 text-sm leading-tight">
                {user?.name || "Selling Partner"}
              </h2>
              <p className="text-xs text-gray-500 leading-tight">Admin</p>
            </div>
          </div>

          {/* Mobile User Profile */}
          <div className="md:hidden relative w-10 h-10 rounded-full flex-shrink-0">
            {user?.avatar ? (
              <img
                src={user?.avatar}
                alt="User Profile"
                className="w-full h-full object-cover rounded-full border-2 border-gray-100"
              />
            ) : (
              <FaUserCircle className="w-full h-full text-gray-400 rounded-full" />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
