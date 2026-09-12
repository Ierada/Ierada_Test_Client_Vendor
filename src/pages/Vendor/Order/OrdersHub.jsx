import { SectionHub } from "../../../components/Vendor/SectionHub";
import {
  VENDOR_ORDERS_SECTION_ITEMS,
  filterVendorOrderItems,
} from "../../../config/ordersSection";
import { useSidebarCounts } from "../../../components/Vendor/Sidebar/useSidebarCounts";
import { useAppContext } from "../../../context/AppContext";

const OrdersHub = () => {
  const { user } = useAppContext();
  const counts = useSidebarCounts(user);
  const items = filterVendorOrderItems(VENDOR_ORDERS_SECTION_ITEMS, {
    selfShipEnabled: counts.selfShipEnabled,
  });

  return (
    <div className="px-4 py-4">
      <SectionHub
        title="Orders"
        subtitle="Pipeline, self-ship, and returns — everything for fulfilling orders."
        items={items}
      />
    </div>
  );
};

export default OrdersHub;
