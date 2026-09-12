import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import VendorHeader from "../components/Vendor/Header";
import VendorSidebar from "../components/Vendor/Sidebar";
import { Outlet } from "react-router-dom";
import { SectionPills } from "../components/Vendor/SectionHub";
import {
  VENDOR_PRODUCT_HUB_PATH,
  VENDOR_PRODUCT_SECTION_ITEMS,
  isVendorProductSectionPath,
} from "../config/productSection";

const VendorLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [railHover, setRailHover] = useState(false);
  const [isLg, setIsLg] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 1024 : true,
  );
  const leaveTimerRef = useRef(null);
  const location = useLocation();
  const expanded = isLg ? railHover : sidebarOpen;

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => {
      setIsLg(mq.matches);
      setSidebarOpen(mq.matches);
      if (!mq.matches) setRailHover(false);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!isLg) setSidebarOpen(false);
    setRailHover(false);
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  }, [location.pathname, isLg]);

  useEffect(() => {
    return () => {
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    };
  }, []);

  const openRail = () => {
    if (!isLg) return;
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    setRailHover(true);
  };

  const scheduleCloseRail = () => {
    if (!isLg) return;
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    // Instant open, short delay on leave so crossing icon edges does not flicker.
    leaveTimerRef.current = setTimeout(() => {
      setRailHover(false);
      leaveTimerRef.current = null;
    }, 120);
  };

  return (
    <div className="flex min-h-screen">
      <div
        onMouseEnter={openRail}
        onMouseLeave={scheduleCloseRail}
        className={`fixed inset-y-0 left-0 z-40 bg-[#FFF3EF] overflow-hidden transition-[width,transform,box-shadow] duration-150 ease-out ${
          isLg || sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${expanded ? "w-56 shadow-[8px_0_32px_rgba(26,43,72,0.10)]" : "w-[72px]"}`}
      >
        <VendorSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          expanded={expanded}
        />
      </div>

      <div
        className={`relative flex flex-1 flex-col min-w-0 bg-[#F5F6F8] transition-[margin] duration-150 ease-out ${
          expanded ? "lg:ml-56" : "lg:ml-[72px]"
        }`}
      >
        <VendorHeader
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          sidebarExpanded={expanded}
        />

        <main className="flex-grow min-w-0 mt-10">
          <div className="mx-auto max-w-screen-2xl">
            {isVendorProductSectionPath(location.pathname) ? (
              <SectionPills
                hubPath={VENDOR_PRODUCT_HUB_PATH}
                hubLabel="Products"
                items={VENDOR_PRODUCT_SECTION_ITEMS}
              />
            ) : null}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default VendorLayout;
