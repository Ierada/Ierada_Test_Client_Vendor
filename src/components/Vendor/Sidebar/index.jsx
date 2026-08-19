import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useAppContext } from "../../../context/AppContext";
import LogoutModal from "../LogoutModal";
import { useSidebarCounts } from "./useSidebarCounts";
import { vendorMenuConfig } from "./menuConfig";
import BrandHeader from "./BrandHeader";
import SearchBar from "./SearchBar";
import MenuItem from "./MenuItem";
import UserProfile from "./UserProfile";
import { endVendorSessionAndRedirect } from "../../../utils/userIdentifier";
import { markAuthSessionEnded } from "../../../utils/authSession";
import { logoutThisDevice } from "../../../services/api.auth";

const SCROLL_POSITION_KEY = "vendorSidebarScroll";

const VendorSidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const { user } = useAppContext();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const sidebarRef = useRef(null);
  const [openSubMenus, setOpenSubMenus] = useState({ Orders: false });
  const [hoveredSubMenu, setHoveredSubMenu] = useState(null);

  const counts = useSidebarCounts(user);

  const menuItems = useMemo(() => {
    if (counts.selfShipEnabled) return vendorMenuConfig.mainMenuItems;
    return vendorMenuConfig.mainMenuItems.map((item) => {
      if (item.text !== "Orders" || !item.subItems) return item;
      return {
        ...item,
        subItems: item.subItems.filter((s) => s.text !== "Self Ship"),
      };
    });
  }, [counts.selfShipEnabled]);

  useEffect(() => {
    const scroll = localStorage.getItem(SCROLL_POSITION_KEY);
    if (scroll && sidebarRef.current) sidebarRef.current.scrollTop = Number(scroll);
  }, []);

  useEffect(() => {
    const saveScroll = () => {
      if (sidebarRef.current) localStorage.setItem(SCROLL_POSITION_KEY, sidebarRef.current.scrollTop);
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

  const toggleSubMenu = useCallback((name) => {
    setOpenSubMenus((prev) => ({ ...prev, [name]: !prev[name] }));
  }, []);

  return (
    <>
      <div className="flex flex-col h-screen bg-white border-r border-[#EAECF0] w-64">
        <BrandHeader setSidebarOpen={setSidebarOpen} />
        <SearchBar />
        <div className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent hover:scrollbar-thumb-gray-300 py-2" ref={sidebarRef}>
          <ul className="space-y-1 px-3">
            {menuItems.map((item, i) => (
              <MenuItem key={i} item={item} counts={counts} openSubMenus={openSubMenus} toggleSubMenu={toggleSubMenu} hoveredSubMenu={hoveredSubMenu} setHoveredSubMenu={setHoveredSubMenu} handleNavigation={handleNavigation} />
            ))}
          </ul>
        </div>
        <UserProfile user={user} onLogout={() => setShowLogoutModal(true)} />
      </div>
      {showLogoutModal && <LogoutModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} onConfirm={handleLogoutConfirm} />}
    </>
  );
};

export default React.memo(VendorSidebar);
