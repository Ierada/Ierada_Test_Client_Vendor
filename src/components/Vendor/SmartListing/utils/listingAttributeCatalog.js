import { getAllColors } from "../../../../services/api.color";
import { getAllSizes } from "../../../../services/api.size";
import { getAllAttributes } from "../../../../services/api.attribute";
import {
  filterMastersByCatalog,
  listingAttributeQuery,
  listingSizeIds,
  selectedVariationColorIds,
  selectedVariationSizeIds,
} from "./variationHelpers";

export async function loadListingColorSizeCatalog(state, extra = {}) {
  const query = listingAttributeQuery(state);
  const selectedColorIds = (
    extra.colorIds || [
      state?.color_id,
      ...(state?.color_ids || []),
      ...selectedVariationColorIds(state),
    ]
  ).filter(Boolean);
  const selectedSizeIds = extra.sizeIds || [
    ...listingSizeIds(state),
    ...selectedVariationSizeIds(state),
  ];

  try {
    const [cRes, sRes, aRes] = await Promise.all([
      getAllColors({ silent: true }),
      getAllSizes({}, { silent: true }),
      query.categoryId
        ? getAllAttributes(query, { silent: true })
        : Promise.resolve({ status: 1, data: [] }),
    ]);
    const catalog = Array.isArray(aRes?.data) ? aRes.data : [];
    const failed = Boolean(query.categoryId && aRes && aRes.status === 0);
    const filtered = filterMastersByCatalog({
      colors: Array.isArray(cRes?.data) ? cRes.data : [],
      sizes: Array.isArray(sRes?.data) ? sRes.data : [],
      catalog: failed ? [] : catalog,
      selectedColorIds,
      selectedSizeIds,
    });
    return {
      ok: !failed,
      ...filtered,
      catalog: failed ? [] : catalog,
      error: failed
        ? aRes?.message || "Could not load attributes for this category."
        : "",
    };
  } catch {
    const filtered = filterMastersByCatalog({
      colors: [],
      sizes: [],
      catalog: [],
      selectedColorIds,
      selectedSizeIds,
    });
    return {
      ok: false,
      ...filtered,
      catalog: [],
      error: "Could not load attributes for this category.",
    };
  }
}

export async function loadListingAttributeCatalog(state) {
  const query = listingAttributeQuery(state);
  if (!query.categoryId) {
    return { ok: true, catalog: [], error: "" };
  }
  try {
    const attrRes = await getAllAttributes(query, { silent: true });
    const list = Array.isArray(attrRes?.data) ? attrRes.data : [];
    const seen = new Set();
    const catalog = list.filter((a) => {
      if (a?.id == null || seen.has(a.id)) return false;
      seen.add(a.id);
      return true;
    });
    if (attrRes?.status === 0) {
      return {
        ok: false,
        catalog: [],
        error: attrRes?.message || "Could not load attributes for this category.",
      };
    }
    return { ok: true, catalog, error: "" };
  } catch {
    return {
      ok: false,
      catalog: [],
      error: "Could not load attributes for this category.",
    };
  }
}
