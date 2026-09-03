import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import VendorHeader from "../components/Vendor/Header";
import VendorSidebar from "../components/Vendor/Sidebar";
import { Menu, X } from "lucide-react";
import { Outlet } from "react-router-dom";
import { SectionPills } from "../components/Vendor/SectionHub";
import {
  VENDOR_PRODUCT_HUB_PATH,
  VENDOR_PRODUCT_SECTION_ITEMS,
  isVendorProductSectionPath,
  isVendorProductWizardPath,
} from "../config/productSection";

const VendorLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(true);
      else setSidebarOpen(false);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }, [location.pathname]);
  
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-white dark:bg-gray-800 transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <VendorSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
      </div>

      {/* Main content */}
      <div className={`relative flex flex-1 flex-col bg-[#FFF3EF] transition-all duration-300 min-w-0 ${
        sidebarOpen ? "lg:ml-64" : "lg:ml-0"
      }`}>
        <VendorHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="flex-grow mt-20">
          <div className="mx-auto max-w-screen-2xl">
            {isVendorProductSectionPath(location.pathname) &&
            !isVendorProductWizardPath(location.pathname) ? (
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
