import React, { useState, useRef, useEffect } from "react";
import { Search, Bell, Menu, X } from "lucide-react";
import { RiVerifiedBadgeFill } from "react-icons/ri";

import { useAppContext } from "../../../context/AppContext";
import { FaUserCircle } from "react-icons/fa";
import { getNotificationPreview } from "../../../services/api.notification";
import { IoMdNotifications } from "react-icons/io";

const Header = ({ sidebarOpen, setSidebarOpen }) => {
  const { user } = useAppContext();
  const [searchValue, setSearchValue] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  // const [notifications, setNotifications] = useState([
  //   { id: 1, text: 'New message received', unread: true },
  //   { id: 2, text: 'Your profile was updated', unread: false },
  // ]);
  const [notifications, setNotifications] = useState([]);

  const searchRef = useRef(null);
  const notificationRef = useRef(null);

  useEffect(() => {
    const fetchNotificationPreview = async () => {
      const res = await getNotificationPreview(user.id);
      res && setNotifications(res.data);
    };
    showNotifications && fetchNotificationPreview();
  }, [showNotifications]);

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
    <header className="lg:ml-56 h-20 fixed top-0 left-0 right-0  z-20 bg-white shadow transition-all duration-300">
      <div className="flex items-center justify-between p-4">
        {/* Menu Toggle Button - Only visible on mobile */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
        >
          {sidebarOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>

        {/* User Profile Section */}
        <div className="hidden md:flex items-center transition-all duration-300">
          <div className="relative w-12 h-12 rounded-full">
            {user?.avatar ? (
              <img
                src={user?.avatar}
                alt="User Profile"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <FaUserCircle className="w-full h-full object-cover text-gray-400 rounded-full" />
            )}
            <RiVerifiedBadgeFill className="absolute top-0 right-0 text-black text-xl" />
          </div>
          <div className="ml-2">
            <h2 className="font-satoshi text-black text-lg md:text-[20px] font-medium truncate">
              {user?.name || "Selling Partner"}
            </h2>
            <p className="text-sm md:text-[16px] font-satoshi font-medium text-gray-500 truncate">
              {user?.email}
            </p>
          </div>
        </div>

        {/* Right Section - Search and Notifications */}
        <div className="flex items-center justify-end space-x-2 md:space-x-4 flex-1 md:w-1/2 ml-4">
          {/* Search Bar */}
          {/* <form
            onSubmit={handleSearch}
            className="relative flex-1 max-w-xs md:max-w-md"
          >
            <input
              ref={searchRef}
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search"
              className="w-full py-2 pl-10 pr-4 rounded-lg border border-gray-300 focus:outline-none focus:border-black placeholder:text-gray-300 text-sm md:text-base"
            />
            <button
              type="submit"
              className="absolute left-3 top-1/2 transform -translate-y-1/2"
            >
              <Search className="h-5 w-5 text-gray-400" />
            </button>
          </form> */}

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-full text-gray-600 hover:bg-gray-100 relative"
            >
              <IoMdNotifications className="text-xl md:text-3xl" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-black text-white rounded-full w-2.5 h-2.5" />
              )}
              {/* <img
                src={Group1}
                alt='Notification Bell'
                className='w-6 h-6 md:w-8 md:h-8'
              />
              {unreadCount > 0 && (
                <span className='absolute top-1 right-1 bg-black text-white rounded-full w-2.5 h-2.5' />
              )} */}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-200">
                  <h3 className="font-semibold">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length > 0 &&
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
                        className={`px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center ${
                          notification.unread ? "bg-blue-50" : ""
                        }`}
                      >
                        <div className="flex-1">
                          <p
                            className={`text-sm ${
                              notification.unread ? "font-semibold" : ""
                            }`}
                          >
                            {notification.text}
                          </p>
                        </div>
                        {notification.unread && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full" />
                        )}
                      </a>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
