import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import LogoWhite from "/assets/logo/logo_white.svg";
import LogoIcon from "/assets/logo/login_logo.svg";
import { useAppContext } from "../../../context/AppContext";
import LogoutModal from "../LogoutModal";
import {
  LayoutDashboard,
  ShoppingCart,
  Building2,
  Settings,
  ArrowLeftRight,
  Megaphone,
  Star,
  HelpCircle,
  Youtube,
  LogOut,
  ArrowLeft,
  Bell,
  ChevronRight,
  FolderMinus,
  MessageCircleMore,
} from "lucide-react";
import { BsHandbag } from "react-icons/bs";

const SCROLL_POSITION_KEY = "vendorSidebarScroll";
const ACTIVE_MENU_KEY = "vendorActiveMenu";

const VendorSidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppContext();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const sidebarRef = useRef(null);
  const activeItemRef = useRef(null);

  const vendorMenuConfig = {
    mainMenuItems: [
      { text: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
      { text: "Orders", icon: BsHandbag, path: "/orders" },
      { text: "Products", icon: ShoppingCart, path: "/product" },
      { text: "Bulk Upload", icon: FolderMinus, path: "/bulk-upload" },
      { text: "Invoice/Bill", icon: MessageCircleMore, path: "/invoice" },
      { text: "Profile", icon: Building2, path: "/profile" },
      { text: "Settings", icon: Settings, path: "/settings" },
      { text: "Report", icon: ArrowLeftRight, path: "/report" },
      { text: "Advertising", icon: Megaphone, path: "/ads/history" },
      { text: "Review", icon: Star, path: "/review" },
      { text: "Support", icon: HelpCircle, path: "/support" },
      { text: "Training", icon: Youtube, path: "/training" },
      { text: "Notifications", icon: Bell, path: "/notifications" },
    ],
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setIsExpanded(true);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(ACTIVE_MENU_KEY);
    if (saved) setActiveSubmenu(saved);
    const scroll = localStorage.getItem(SCROLL_POSITION_KEY);
    if (scroll && sidebarRef.current)
      sidebarRef.current.scrollTop = Number(scroll);
  }, []);

  useEffect(() => {
    const saveScroll = () => {
      if (sidebarRef.current)
        localStorage.setItem(SCROLL_POSITION_KEY, sidebarRef.current.scrollTop);
    };
    window.addEventListener("beforeunload", saveScroll);
    return () => window.removeEventListener("beforeunload", saveScroll);
  }, []);

  const toggleSubmenu = (text) => {
    setActiveSubmenu(activeSubmenu === text ? null : text);
    localStorage.setItem(ACTIVE_MENU_KEY, activeSubmenu === text ? "" : text);
  };

  const handleNavigation = () => {
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const handleLogoutConfirm = () => {
    localStorage.clear();
    document.cookie.split(";").forEach((c) => {
      const name = c.split("=")[0].trim();
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });
    setSidebarOpen(false);
    setShowLogoutModal(false);
    navigate("/login");
  };

  const isActive = (path) => location.pathname.includes(path);

  const MenuItem = ({ item }) => {
    const Icon = item.icon;
    const active = isActive(item.path);

    return (
      <li className="group relative" ref={active ? activeItemRef : null}>
        <NavLink
          to={item.path}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden
            ${
              isActive
                ? "bg-button-gradient text-white shadow-sm"
                : "text-[#353535] hover:bg-button-gradient hover:text-white"
            }`
          }
          onClick={handleNavigation}
        >
          <div className="flex items-center gap-3 flex-1 z-10">
            <Icon
              className={`w-5 h-5 transition-all duration-300 ${
                active
                  ? "scale-110"
                  : "group-hover:scale-110 group-hover:text-white"
              }`}
            />
            <span
              className={`${
                isExpanded ? "" : "hidden"
              } text-[15px] font-satoshi font-medium transition-all duration-300 ${
                isExpanded ? "opacity-100" : "opacity-0 w-0"
              } ${active ? "" : "group-hover:text-white"}`}
            >
              {item.text}
            </span>
          </div>
          {active && isExpanded && (
            <ChevronRight className="w-4 h-4 animate-pulse" />
          )}
        </NavLink>

        {!isExpanded && (
          <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg">
            {item.text}
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
          </div>
        )}
      </li>
    );
  };

  return (
    <>
      <div
        className={`flex flex-col h-screen bg-white shadow-xl transition-all duration-300 ${
          isExpanded ? "w-64" : "w-20"
        } ${isMobile ? "w-64" : ""}`}
        onMouseEnter={() => !isMobile && setIsExpanded(true)}
        onMouseLeave={() => !isMobile && setIsExpanded(false)}
      >
        <div className="relative flex items-center justify-center p-5 my-4 overflow-hidden">
          <button
            onClick={() => navigate("/dashboard")}
            className="relative w-full flex items-center justify-center transition-all duration-300"
          >
            <img
              src={LogoIcon}
              className={`h-10 absolute transition-all duration-300 ${
                isExpanded
                  ? "opacity-0 scale-75 -translate-x-10"
                  : "opacity-100 scale-100 translate-x-0"
              }`}
              alt="Logo Icon"
            />
            <img
              src={LogoWhite}
              className={`h-10 rounded-lg transition-all duration-300 ${
                isExpanded
                  ? "opacity-100 scale-100 translate-x-0"
                  : "opacity-0 scale-75 translate-x-10"
              }`}
              alt="Logo"
            />
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-2 right-2 lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        <div
          className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400"
          ref={sidebarRef}
        >
          <ul className="space-y-1 px-3">
            {vendorMenuConfig.mainMenuItems.map((item, i) => (
              <MenuItem key={i} item={item} />
            ))}
          </ul>
        </div>

        <div className="p-3 border-t border-gray-100">
          <button
            onClick={() => setShowLogoutModal(true)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-[#353535] hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-300 group relative ${
              !isExpanded ? "justify-center" : ""
            }`}
          >
            <LogOut className="text-orange-400 w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
            <span
              className={`text-[15px] bg-button-gradient bg-clip-text text-transparent font-satoshi font-medium transition-all duration-300 ${
                isExpanded ? "opacity-100" : "opacity-0 w-0"
              }`}
            >
              Logout
            </span>

            {!isExpanded && (
              <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 bg-button-gradient bg-clip-text text-transparent text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg">
                Logout
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
              </div>
            )}
          </button>
        </div>
      </div>

      {showLogoutModal && (
        <LogoutModal
          isOpen={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          onConfirm={handleLogoutConfirm}
        />
      )}
    </>
  );
};

export default VendorSidebar;
