import { useState, useEffect } from "react";
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
  }, [location.pathname, isLg]);

  return (
    <div className="flex min-h-screen">
      <div
        onMouseEnter={() => {
          if (isLg) setRailHover(true);
        }}
        onMouseLeave={() => setRailHover(false)}
        className={`fixed inset-y-0 left-0 z-50 isolate bg-[#FFF3EF] border-r border-[#F3D9CF] overflow-hidden transition-[width,transform,box-shadow] duration-200 ease-out ${
          isLg || sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${expanded ? "w-64 shadow-[8px_0_32px_rgba(26,43,72,0.10)]" : "w-[72px]"}`}
      >
        <VendorSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          expanded={expanded}
        />
      </div>

      <div
        className="relative z-0 flex flex-1 flex-col min-w-0 lg:ml-[72px] bg-[#F5F6F8]"
      >
        <VendorHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="flex-grow min-w-0 mt-20">
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
