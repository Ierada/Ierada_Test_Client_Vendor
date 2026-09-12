import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAppContext } from "../../../context/AppContext";
import LogoutModal from "../LogoutModal";
import { useSidebarCounts } from "./useSidebarCounts";
import { vendorMenuConfig } from "./menuConfig";
import BrandHeader from "./BrandHeader";
import SearchBar from "./SearchBar";
import MenuItem from "./MenuItem";
import UserProfile from "./UserProfile";
import { Crown } from "lucide-react";
import { endVendorSessionAndRedirect } from "../../../utils/userIdentifier";
import { markAuthSessionEnded } from "../../../utils/authSession";
import { logoutThisDevice } from "../../../services/api.auth";

const SCROLL_POSITION_KEY = "vendorSidebarScroll";

const VendorSidebar = ({ setSidebarOpen, expanded = true }) => {
  const { user } = useAppContext();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const sidebarRef = useRef(null);
  const counts = useSidebarCounts(user);
  const menuItems = vendorMenuConfig.mainMenuItems;

  useEffect(() => {
    const scroll = localStorage.getItem(SCROLL_POSITION_KEY);
    if (scroll && sidebarRef.current) sidebarRef.current.scrollTop = Number(scroll);
  }, []);

  useEffect(() => {
    const saveScroll = () => {
      if (sidebarRef.current) {
        localStorage.setItem(SCROLL_POSITION_KEY, sidebarRef.current.scrollTop);
      }
    };
    window.addEventListener("beforeunload", saveScroll);
    return () => window.removeEventListener("beforeunload", saveScroll);
  }, []);

  const handleNavigation = useCallback(() => {
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }, [setSidebarOpen]);

  const handleLogoutConfirm = useCallback(() => {
    setSidebarOpen(false);
    setShowLogoutModal(false);
    markAuthSessionEnded();
    logoutThisDevice().finally(() => {
      endVendorSessionAndRedirect({ redirect: true, replace: true });
    });
  }, [setSidebarOpen]);

  return (
    <>
      <div
        className={`flex flex-col h-screen bg-[#FFF3EF] ${
          expanded ? "w-56" : "w-[72px]"
        }`}
      >
        <BrandHeader setSidebarOpen={setSidebarOpen} expanded={expanded} />
        <SearchBar expanded={expanded} />
        <div
          className="flex-grow overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent hover:scrollbar-thumb-gray-300 py-2"
          ref={sidebarRef}
        >
          <ul className={`space-y-1 ${expanded ? "px-3" : "px-1"}`}>
            {menuItems.map((item) => (
              <MenuItem
                key={item.path}
                item={item}
                counts={counts}
                handleNavigation={handleNavigation}
                expanded={expanded}
              />
            ))}
          </ul>
        </div>
        {expanded ? (
          <div className="mx-3 mb-3 rounded-2xl bg-gradient-to-br from-orange-50 to-white border border-orange-100 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-4 h-4 text-primary-100" />
              <p className="text-sm font-bold text-slate-800">Pro Seller</p>
            </div>
            <p className="text-[11px] text-gray-500 mb-2">
              Unlock premium tools and faster payouts.
            </p>
            <button
              type="button"
              className="w-full py-2 rounded-lg bg-[#FF6012] text-white text-xs font-semibold"
            >
              Upgrade Plan
            </button>
          </div>
        ) : (
          <div className="px-3 mb-2 flex justify-center">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
              <Crown className="w-4 h-4 text-primary-100" />
            </div>
          </div>
        )}
        <UserProfile
          user={user}
          onLogout={() => setShowLogoutModal(true)}
          expanded={expanded}
        />
      </div>
      {showLogoutModal ? (
        <LogoutModal
          isOpen={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          onConfirm={handleLogoutConfirm}
        />
      ) : null}
    </>
  );
};

export default React.memo(VendorSidebar);
