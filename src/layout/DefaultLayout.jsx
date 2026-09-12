import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import VendorHeader from "../components/Vendor/Header";
import VendorSidebar from "../components/Vendor/Sidebar";
import { Outlet } from "react-router-dom";
import { SectionPills } from "../components/Vendor/SectionHub";
import { ConfirmDialogHost } from "../utils/confirmDialog";
import { useAppContext } from "../context/AppContext";
import { useSidebarCounts } from "../components/Vendor/Sidebar/useSidebarCounts";
import {
  VENDOR_PRODUCT_HUB_PATH,
  VENDOR_PRODUCT_SECTION_ITEMS,
  isVendorProductSectionPath,
  isVendorProductWizardPath,
  isSmartListingCanvasPath,
} from "../config/productSection";
import {
  VENDOR_ORDERS_HUB_PATH,
  VENDOR_ORDERS_SECTION_ITEMS,
  filterVendorOrderItems,
  isVendorOrdersSectionPath,
  isVendorOrderDetailPath,
} from "../config/ordersSection";
import {
  VENDOR_PAYMENTS_HUB_PATH,
  VENDOR_PAYMENTS_SECTION_ITEMS,
  isVendorPaymentsSectionPath,
  isVendorPaymentDetailPath,
} from "../config/paymentsSection";

const VendorLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [railHover, setRailHover] = useState(false);
  const [isLg, setIsLg] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 1024 : true,
  );
  const leaveTimerRef = useRef(null);
  const location = useLocation();
  const { user } = useAppContext();
  const counts = useSidebarCounts(user);
  const expanded = isLg ? railHover : sidebarOpen;
  const smartListingCanvas = isSmartListingCanvasPath(location.pathname);

  const orderItems = useMemo(
    () =>
      filterVendorOrderItems(VENDOR_ORDERS_SECTION_ITEMS, {
        selfShipEnabled: counts.selfShipEnabled,
      }),
    [counts.selfShipEnabled],
  );

  const sectionPills = [
    {
      show:
        isVendorProductSectionPath(location.pathname) &&
        !isVendorProductWizardPath(location.pathname),
      hubPath: VENDOR_PRODUCT_HUB_PATH,
      hubLabel: "Products",
      items: VENDOR_PRODUCT_SECTION_ITEMS,
    },
    {
      show:
        isVendorOrdersSectionPath(location.pathname) &&
        !isVendorOrderDetailPath(location.pathname),
      hubPath: VENDOR_ORDERS_HUB_PATH,
      hubLabel: "Orders",
      items: orderItems,
    },
    {
      show:
        isVendorPaymentsSectionPath(location.pathname) &&
        !isVendorPaymentDetailPath(location.pathname),
      hubPath: VENDOR_PAYMENTS_HUB_PATH,
      hubLabel: "Payments",
      items: VENDOR_PAYMENTS_SECTION_ITEMS,
    },
  ].find((s) => s.show);

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
    leaveTimerRef.current = setTimeout(() => {
      setRailHover(false);
      leaveTimerRef.current = null;
    }, 120);
  };

  return (
    <div className="flex min-h-screen">
      <ConfirmDialogHost />
      <div
        onMouseEnter={openRail}
        onMouseLeave={scheduleCloseRail}
        className={`fixed inset-y-0 left-0 z-50 isolate bg-[#FFF3EF] border-r border-[#F3D9CF] overflow-hidden transition-[width,transform,box-shadow] duration-150 ease-out ${
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
        className={`relative z-0 flex flex-1 flex-col min-w-0 bg-[#F5F6F8] transition-[margin] duration-150 ease-out ${
          expanded ? "lg:ml-56" : "lg:ml-[72px]"
        } ${smartListingCanvas ? "bg-[#F8FAFC]" : ""}`}
      >
        {smartListingCanvas ? null : (
          <VendorHeader
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            sidebarExpanded={expanded}
          />
        )}

        <main
          className={`flex-grow min-w-0 ${smartListingCanvas ? "" : "mt-10"}`}
        >
          <div className={smartListingCanvas ? "" : "mx-auto max-w-screen-2xl"}>
            {sectionPills ? (
              <SectionPills
                hubPath={sectionPills.hubPath}
                hubLabel={sectionPills.hubLabel}
                items={sectionPills.items}
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
