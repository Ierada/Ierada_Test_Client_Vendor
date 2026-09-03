import { SectionHub } from "../../../components/Vendor/SectionHub";
import { VENDOR_PRODUCT_SECTION_ITEMS } from "../../../config/productSection";

const ProductHub = () => (
  <div className="px-4 py-6">
    <SectionHub
      title="Products"
      subtitle="Choose a tool. Bulk Manager and Media live here — not in the sidebar."
      items={VENDOR_PRODUCT_SECTION_ITEMS}
    />
  </div>
);

export default ProductHub;
