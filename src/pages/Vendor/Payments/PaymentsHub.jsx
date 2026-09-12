import { SectionHub } from "../../../components/Vendor/SectionHub";
import { VENDOR_PAYMENTS_SECTION_ITEMS } from "../../../config/paymentsSection";

const PaymentsHub = () => (
  <div className="px-4 py-4">
    <SectionHub
      title="Payments"
      subtitle="Settlements, transactions, advice notes, and GST — in one place."
      items={VENDOR_PAYMENTS_SECTION_ITEMS}
    />
  </div>
);

export default PaymentsHub;
