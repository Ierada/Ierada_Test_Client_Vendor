import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import VendorHeader from "../components/Vendor/Header";
import VendorSidebar from "../components/Vendor/Sidebar";
import { Menu, X } from "lucide-react";
import { Outlet } from "react-router-dom";

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
        className={`fixed inset-y-0 left-0 z-30 w-auto transform bg-white dark:bg-gray-800 transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <VendorSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
      </div>

      {/* Main content */}
      <div className="relative flex flex-1 flex-col lg:ml-20 bg-[#FFF3EF]">
        <VendorHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md lg:hidden hover:bg-gray-100 text-white"
          >
            {sidebarOpen ? (
              <X className="w-6 h-6" color="white" />
            ) : (
              <Menu className="w-6 h-6" color="white" />
            )}
          </button>
        </VendorHeader>

        <main className="flex-grow p-4 mt-20">
          <div className="mx-auto max-w-screen-2xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default VendorLayout;
