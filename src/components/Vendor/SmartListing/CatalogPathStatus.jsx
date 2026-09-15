import React from "react";
import { EMPTY_ATTRIBUTE_CATALOG_MESSAGE } from "./utils/variationHelpers";

export default function CatalogPathStatus({
  loading = false,
  error = "",
  empty = false,
  emptyMessage = EMPTY_ATTRIBUTE_CATALOG_MESSAGE,
  loadingText = "Loading options for this category…",
}) {
  if (loading) {
    return <p className="text-xs text-slate-500">{loadingText}</p>;
  }
  if (error) {
    return <p className="text-xs text-rose-600">{error}</p>;
  }
  if (empty) {
    return (
      <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
        {emptyMessage}
      </p>
    );
  }
  return null;
}
