import React from "react";
import { useAppContext } from "../../../context/AppContext";
import BulkListingWizard from "../../../components/Vendor/BulkProductListing/BulkListingWizard";

export default function BulkProductListingPage() {
  const { user } = useAppContext();
  return (
    <BulkListingWizard
      mode="vendor"
      vendorId={user?.id}
      listPath="/product/list"
      mediaPath="/bulk-upload/media"
    />
  );
}
