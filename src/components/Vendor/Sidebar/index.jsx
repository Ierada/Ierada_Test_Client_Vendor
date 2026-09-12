import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useAppContext } from "../../../context/AppContext";
import LogoutModal from "../LogoutModal";
import { useSidebarCounts } from "./useSidebarCounts";
import { vendorMenuConfig } from "./menuConfig";
import BrandHeader from "./BrandHeader";
import MenuItem from "./MenuItem";
import { LogOut } from "lucide-react";
import { endVendorSessionAndRedirect } from "../../../utils/userIdentifier";
import { markAuthSessionEnded } from "../../../utils/authSession";
import { logoutThisDevice } from "../../../services/api.auth";

const SCROLL_POSITION_KEY = "vendorSidebarScroll";

const VendorSidebar = ({ sidebarOpen, setSidebarOpen, expanded = true }) => {
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
      <div
        className={`flex flex-col h-full max-h-screen bg-[#FFF3EF] py-2 overflow-hidden overflow-x-hidden ${
          expanded ? "w-56" : "w-[72px]"
        }`}
      >
        <BrandHeader setSidebarOpen={setSidebarOpen} expanded={expanded} />
        <div
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain px-1"
          ref={sidebarRef}
          style={{
            overflowAnchor: "none",
            scrollbarGutter: "stable",
            scrollbarWidth: "thin",
            scrollbarColor: "#c4c4c4 #f3f4f6",
          }}
        >
          <ul className={`pb-4 space-y-1 ${expanded ? "px-2" : "px-1"}`}>
            {menuItems.map((item, i) => (
              <MenuItem
                key={i}
                item={item}
                counts={counts}
                openSubMenus={openSubMenus}
                toggleSubMenu={toggleSubMenu}
                hoveredSubMenu={hoveredSubMenu}
                setHoveredSubMenu={setHoveredSubMenu}
                handleNavigation={handleNavigation}
                expanded={expanded}
              />
            ))}
          </ul>
        </div>
        <div className="flex-shrink-0 border-t border-[#F3D9CF] mt-1 mb-2 px-2 pt-2 bg-[#FFF3EF]">
          <ul className="space-y-1">
            <li className={`rounded group transition-all duration-200 ${expanded ? "p-2" : "p-1"}`}>
              <button
                type="button"
                onClick={() => setShowLogoutModal(true)}
                title="Logout"
                className={`w-full text-[#353535] group-hover:bg-[#FF60121C] group-hover:text-[#FF6012]
                text-[15px] font-satoshi font-normal inline-flex items-center transition-all duration-200 rounded ${
                  expanded ? "px-2 py-2 gap-4" : "justify-center px-0 py-2"
                }`}
              >
                <LogOut className="w-5 h-5 transition-colors duration-200 group-hover:text-[#FF6012]" />
                {expanded ? (
                  <span className="transition-colors duration-200">Logout</span>
                ) : null}
              </button>
            </li>
          </ul>
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

export default React.memo(VendorSidebar);
