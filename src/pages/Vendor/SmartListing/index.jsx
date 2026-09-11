import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Link, useParams, useSearchParams } from "react-router-dom";
import { useAppContext } from "../../../context/AppContext";
import {
  CheckCircle2,
  Loader2,
  X,
  AlertCircle,
} from "lucide-react";
import { getCategories, getSubCategories, getInnerSubCategories } from "../../../services/api.category";
import { addProduct, updateProduct, deleteProduct } from "../../../services/api.product";
import { getAllSizes } from "../../../services/api.size";
import { getAllColors } from "../../../services/api.color";
import { getBrandAuthStatus, generateListingAiDraft, suggestListingCategory, generateListing3dImage } from "../../../services/api.smartListing";
import { getSettings } from "../../../services/api.settings";
import { previewListingSettlement } from "../../../services/api.settlement";
import { getShippingRates } from "../../../services/api.shippingRate";
import { saveProductDraft } from "../../../services/api.productDraft";
import { notifyOnFail, notifyOnSuccess, notifyOnWarning } from "../../../utils/notification/toast";
import { getApiErrorMessage } from "../../../utils/apiError";
import {
  firstValidationError,
  firstReviewErrorFocus,
  firstVariationMatrixError,
  formatPriceValidationToast,
  validateCategoryStepPricing,
  validateMrpAndSelling,
  validateSingleListingPricing,
  validateSmartListingState,
} from "../../../components/Vendor/SmartListing/utils/listingFieldValidation";
import { resolveCategoryGst } from "../../../services/api.categoryGst";
import {
  newStableId,
  loadLocalDraft,
  saveLocalDraft,
  clearLocalDraft,
} from "../../../components/Vendor/SmartListing/utils/draftStorage";
import { taxFromCategoryTree, mergeAiDraft, buildListingAiPayload } from "../../../components/Vendor/SmartListing/utils/aiDraft";
import { gstFromBands } from "../../../components/Vendor/SmartListing/utils/gstBands";
import innerHsnGstLookup from "../../../components/Vendor/SmartListing/utils/innerHsnGstLookup.json";
import { calcSettlement, applyPlatformFeeRules, omitLiveCommerceRates, suggestSku } from "../../../components/Vendor/SmartListing/utils/settlementCalc";
import { fileToSuggestPayload } from "../../../components/Vendor/SmartListing/utils/fileToSuggestPayload";
import { makeStudio3dFile, base64ToJpegFile } from "../../../components/Vendor/SmartListing/utils/studio3dImage";
import { buildSmartListingFormData, applyAutoListingPolicies } from "../../../components/Vendor/SmartListing/utils/buildFormData";
import { hydrateSmartListingFromProduct } from "../../../components/Vendor/SmartListing/utils/hydrateFromProduct";
import {
  hasRealSizeRow,
  sizeQueryFromListing,
  splitContextualSizes,
  sizePickerOptions,
  listingSizeIds,
  applySelectedSizeIdsToColorGroups,
  prefillColorGroupsFromCategorySizes,
  prefillColorGroupsFromSuggestedNames,
  applyParentDefaultsToEmptySizeRows,
  listingPatchFromPrefillGroups,
  variationListingStats,
  customListingStats,
  selectedVariationColorIds,
} from "../../../components/Vendor/SmartListing/utils/variationHelpers";
import {
  stashListingMedia,
  stripFilesForDraft,
  mergeCachedMedia,
  listingCoverPreviewSrc,
  fileToCoverPreviewUrl,
  seedFirstColorFromPrimaryGallery,
} from "../../../components/Vendor/SmartListing/utils/listingMediaCache";
import {
  applyStoredListingFiles,
  mergeHydratedProductMedia,
  switchListingTypeMedia,
  withSyncedMediaBuckets,
} from "../../../components/Vendor/SmartListing/utils/listingMediaByType";
import {
  saveListingFiles,
  loadListingFiles,
  clearListingFiles,
} from "../../../components/Vendor/SmartListing/utils/listingMediaStore";
import SearchablePicker from "../../../components/Vendor/SmartListing/SearchablePicker";
import VariationListingCanvas from "../../../components/Vendor/SmartListing/VariationListingCanvas";
import CustomVariationCanvas from "../../../components/Vendor/SmartListing/CustomVariationCanvas";
import ListingErrorBoundary from "../../../components/Vendor/SmartListing/ListingErrorBoundary";
import SmartListingSetupForm, {
  SETUP_STEPS,
  listingProgressStep,
  listingSectionFromScroll,
  scrollToListingSection,
  ListingPageHeader,
  SetupStepper,
  ListingRightRail,
  ListingStickyFooter,
} from "../../../components/Vendor/SmartListing/SmartListingSetupForm";
import {
  REVIEW_SECTIONS,
  AiReviewHeader,
  AiReviewNav,
  AiReviewFormCard,
  StorefrontPreviewCard,
  BankSettlementSummary,
} from "../../../components/Vendor/SmartListing/AiReviewStep";
import RequestSpecField from "../../../components/Vendor/SmartListing/RequestSpecField";
import SpecTemplateHints from "../../../components/Vendor/SmartListing/SpecTemplateHints";
import SizeChartPanel from "../../../components/Vendor/SmartListing/SizeChartPanel";
import {
  emptySizeChart,
  sizeLabelsFromState,
} from "../../../components/Vendor/SmartListing/utils/sizeChart";
import { findRestrictedHits } from "../../../components/Vendor/SmartListing/utils/restrictedClaims";
import {
  getBulkSession,
  advanceBulkSession,
  clearBulkSession,
  bulkSessionProgress,
  getPlannedType,
  typeLabel,
} from "../../../components/Vendor/SmartListing/utils/bulkSessionStorage";

function basicsStepsFor(listingType) {
  const base = [...SETUP_STEPS];
  if (listingType === "color_size" || listingType === "custom") return [...base, "matrix"];
  return base;
}

function isAi3dLabel(label) {
  return label === "ai_3d";
}

function listingPhotoFingerprint(file) {
  if (!file) return "";
  return `${file.name}|${file.size}|${file.lastModified}`;
}

/** Prefer front slot, else first real photo (skip AI 3D shots). */
function firstListingImageFile(state) {
  const files = state.files || [];
  const labels = state.mediaLabels || [];
  const frontIdx = labels.findIndex((l, i) => l?.label === "front" && files[i] instanceof File);
  if (frontIdx >= 0) return files[frontIdx];
  for (let i = 0; i < files.length; i += 1) {
    if (isAi3dLabel(labels[i]?.label)) continue;
    if (files[i] instanceof File) return files[i];
  }
  for (const g of state.colorGroups || []) {
    for (const m of g.media || []) {
      if (m instanceof File) return m;
      if (m?.file instanceof File) return m.file;
    }
  }
  return null;
}

const LISTING_TYPES = [
  { id: "single", title: "Single Listing", desc: "One price, one SKU" },
  { id: "color_size", title: "Color & Size Variation", desc: "Color × size matrix" },
  { id: "custom", title: "Custom Variation", desc: "Any number of custom attributes" },
];

const emptyState = () => ({
  brandType: "",
  brandAuthDocName: "",
  brandAuthFile: null,
  brandAuthDocType: "authorization_letter",
  brandAuthApproved: false,
  brandAuthStatus: "",
  listingType: "",
  category_id: "",
  sub_category_id: "",
  inner_sub_category_id: "",
  categoryTitle: "",
  subCategoryTitle: "",
  innerSubCategoryTitle: "",
  files: [],
  existingMedia: [],
  deleteMediaIds: [],
  coverPreviewUrl: "",
  mediaLabels: [],
  mediaByListingType: {},
  name: "",
  brand: "",
  shortDescription: "",
  countryOfOrigin: "India",
  hsn_code: "",
  gst: 0,
  keyFeatures: [],
  benefits: [],
  productDetails: "",
  generalInfo: "",
  specifications: [],
  whatsInTheBox: [],
  original_price: "",
  discounted_price: "",
  size_id: "",
  size_ids: [],
  color_id: "",
  color_ids: [],
  color_name: "",
  sku: "",
  barcode: "",
  stock: "",
  low_stock_threshold: 5,
  stock_management_mode: "self",
  allow_backorders: false,
  min_order_qty: 1,
  product_condition: "New",
  warrantyType: "",
  warrantyPeriod: "",
  warranty_info: "",
  package_weight: "",
  package_length: "",
  package_width: "",
  package_height: "",
  package_depth: "",
  volumetric_weight: 0,
  shipping_charges: 0,
  free_shipping: false,
  shipsFrom: "",
  shipsTo: "Pan India",
  deliveryTimeText: "3–7 business days",
  cod_available: true,
  return_window_days: 7,
  replacement_allowed: true,
  return_shipping_payer: "seller",
  metaTitle: "",
  metaDescription: "",
  metaKeywords: "",
  tags: [],
  visibility: "Hidden",
  listing_status: "draft",
  platformFee: 0,
  platform_fee_pct: 0,
  platform_fee_max: 0,
  default_return_window_days: 7,
  aiGeneratedSections: [],
  dirtySections: {},
  colorGroups: [],
  skipPrimaryColorImageDefault: false,
  sizeMedia: {},
  colorSizeAvailability: {},
  customAttrs: [
    { attribute_id: "", name: "", valuesText: "", values: [] },
    { attribute_id: "", name: "", valuesText: "", values: [] },
    { attribute_id: "", name: "", valuesText: "", values: [] },
    { attribute_id: "", name: "", valuesText: "", values: [] },
  ],
  customRows: [],
  customValueMedia: {},
  comboItems: [],
  isCombo: false,
  compliance: {
    sale_unit: "1 piece",
    fssai_license: "",
    manufacturer_name: "",
    manufacturer_address: "",
    packer_name: "",
    packer_address: "",
    importer_name: "",
    importer_address: "",
    net_quantity: "",
    net_quantity_unit: "",
    bis_isi_number: "",
    wpc_number: "",
    dangerous_goods: false,
    drug_disclaimer: false,
  },
  sizeChart: emptySizeChart("not_applicable"),
  size_labels: [],
});

function FieldError({ error, compact = false }) {
  if (!error) return null;
  return (
    <span
      className={`flex items-start gap-2 rounded-lg ${compact ? "px-1.5 py-1 text-[10px]" : "px-2.5 py-1.5 text-xs"} leading-snug`}
      style={{
        background: "linear-gradient(135deg, #fef2f2 0%, #ffffff 70%)",
        borderLeft: "4px solid #ef4444",
        color: "#991b1b",
        boxShadow: "0 4px 12px rgba(15, 23, 42, 0.06)",
      }}
    >
      <span
        className={`${compact ? "h-3.5 w-3.5 text-[9px]" : "h-4 w-4 text-[10px]"} mt-0.5 inline-flex shrink-0 items-center justify-center rounded-full font-bold`}
        style={{ background: "#fee2e2", color: "#b91c1c" }}
      >
        !
      </span>
      <span>{error}</span>
    </span>
  );
}

function Field({ label, required, optional, children, error, hint }) {
  const showOptional = optional ?? !required;
  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] font-medium text-slate-400">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
        {showOptional && !required ? (
          <span className="text-slate-400 font-normal text-[11px] ml-1">optional</span>
        ) : null}
      </span>
      {children}
      {error ? <FieldError error={error} /> : hint ? (
        <span className="text-xs text-gray-500">{hint}</span>
      ) : null}
    </label>
  );
}

function ListingBanner({ banner, onClose }) {
  if (!banner) return null;
  const isErr = banner.type === "error";
  return (
    <div className="max-w-7xl mx-auto mt-3 px-4">
      <div
        className="flex items-center gap-2 rounded-lg py-2 px-3 text-[13px]"
        style={
          isErr
            ? {
                background: "linear-gradient(135deg, #fef2f2 0%, #ffffff 70%)",
                borderLeft: "4px solid #ef4444",
                color: "#991b1b",
                boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
              }
            : {
                background: "linear-gradient(135deg, #fffbeb 0%, #ffffff 70%)",
                borderLeft: "4px solid #f59e0b",
                color: "#92400e",
              }
        }
      >
        <span
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
          style={
            isErr
              ? { background: "#fee2e2", color: "#b91c1c" }
              : { background: "#fef3c7", color: "#b45309" }
          }
        >
          !
        </span>
        <span className="flex-1 font-medium leading-snug">{banner.text}</span>
        <button type="button" className="ml-auto opacity-55 hover:opacity-80" onClick={onClose}>
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-gray-200 px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#F56C43]/20 focus:border-[#F56C43] bg-white";

function inputClsErr(error) {
  return error
    ? `${inputCls} border-red-500 bg-red-50 focus:ring-red-500/25 focus:border-red-500`
    : inputCls;
}

function sellMaxAttr(mrp) {
  const n = Number(mrp);
  if (!Number.isFinite(n) || n <= 1) return undefined;
  return String(Math.round((n - 0.01) * 100) / 100);
}

function mrpMinAttr(sell) {
  const n = Number(sell);
  if (!Number.isFinite(n) || n <= 0) return "1";
  return String(Math.max(1, Math.round((n + 0.01) * 100) / 100));
}

function PriceRuleChip({ error, okText }) {
  const isErr = !!error;
  return (
    <span
      className="flex items-start gap-2 rounded-lg px-2 py-1 text-[11px] leading-snug"
      style={
        isErr
          ? {
              background: "linear-gradient(135deg, #fef2f2 0%, #ffffff 70%)",
              borderLeft: "4px solid #ef4444",
              color: "#991b1b",
            }
          : {
              background: "linear-gradient(135deg, #fff7ed 0%, #ffffff 70%)",
              borderLeft: "4px solid #F56C43",
              color: "#9a3412",
            }
      }
    >
      <span
        className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
        style={
          isErr
            ? { background: "#fee2e2", color: "#b91c1c" }
            : { background: "#ffedd5", color: "#F56C43" }
        }
      >
        {isErr ? "!" : "i"}
      </span>
      <span>{error || okText}</span>
    </span>
  );
}

function PricePairFields({ state, patch, mrpErr, sellErr, mrpLabel = "MRP (₹)", sellLabel = "Selling price (₹)", mrpId, sellId, readOnly = false }) {
  const lockedCls =
    "w-full rounded-xl border border-gray-200 px-3 py-2 text-[13px] bg-slate-50 text-slate-700 cursor-not-allowed focus:outline-none focus:ring-0";
  return (
    <div className="w-full col-span-full space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <Field label={mrpLabel} required>
          <input
            id={mrpId}
            type="number"
            min={mrpMinAttr(state.discounted_price)}
            step="0.01"
            readOnly={readOnly}
            tabIndex={readOnly ? -1 : undefined}
            className={readOnly ? lockedCls : inputClsErr(mrpErr)}
            value={state.original_price}
            onChange={readOnly ? undefined : (e) => patch({ original_price: e.target.value })}
          />
        </Field>
        <Field label={sellLabel} required>
          <input
            id={sellId}
            type="number"
            min="1"
            max={sellMaxAttr(state.original_price)}
            step="0.01"
            readOnly={readOnly}
            tabIndex={readOnly ? -1 : undefined}
            className={readOnly ? lockedCls : inputClsErr(sellErr)}
            value={state.discounted_price}
            onChange={readOnly ? undefined : (e) => patch({ discounted_price: e.target.value })}
          />
        </Field>
      </div>
      {readOnly ? null : (
      <div className="grid sm:grid-cols-2 gap-2">
        <PriceRuleChip error={mrpErr} okText="Must be greater than selling price" />
        <PriceRuleChip error={sellErr} okText="Must be less than MRP" />
      </div>
      )}
      {state.listingType === "color_size" ? (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          Color × Size listing: publish uses each size row&apos;s MRP, selling price and stock (Variations step). These two fields are defaults only.
        </p>
      ) : null}
    </div>
  );
}

function SizeColorPairFields({ state, patch, fieldErrors = {}, readOnly = false }) {
  const [colors, setColors] = useState([]);
  const [sizeSplit, setSizeSplit] = useState({
    all: [],
    contextual: [],
    rest: [],
    totalContextual: 0,
  });
  const sizeOptions = useMemo(() => sizePickerOptions(sizeSplit), [sizeSplit]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cRes, sRes] = await Promise.all([
          getAllColors({ silent: true }),
          getAllSizes(sizeQueryFromListing(state), { silent: true }),
        ]);
        if (cancelled) return;
        setColors(cRes?.data || []);
        setSizeSplit(splitContextualSizes(sRes?.data || [], sRes?.meta, state));
      } catch {
        /* pickers stay empty */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [state.category_id, state.sub_category_id, state.inner_sub_category_id]);

  return (
    <div className="w-full col-span-full grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      <Field label="Size" required error={fieldErrors.size_ids}>
        <div id="ai-review-size">
          <SearchablePicker
            compact
            multiple
            required
            disabled={readOnly}
            error={fieldErrors.size_ids ? " " : undefined}
            value={listingSizeIds(state)}
            onChange={(ids) => {
              const size_ids = Array.isArray(ids) ? ids : ids ? [ids] : [];
              const size_id = size_ids[0] || "";
              const size_labels = sizeOptions
                .filter((o) => size_ids.map(String).includes(String(o.id)))
                .map((o) => o.label)
                .filter(Boolean);
              const next = { size_ids, size_id, size_labels };
              if (state.listingType === "color_size") {
                next.colorGroups = applySelectedSizeIdsToColorGroups(
                  state.colorGroups,
                  size_ids,
                  state,
                );
              }
              patch(next);
            }}
            placeholder="Select size"
            searchPlaceholder="Search size..."
            options={sizeOptions}
          />
        </div>
      </Field>
      <Field label="Colour" required error={fieldErrors.color_id}>
        <div id="ai-review-color">
          <SearchablePicker
            compact
            required
            disabled={readOnly}
            error={fieldErrors.color_id ? " " : undefined}
            value={state.color_id || ""}
            onChange={(id) => {
              const c = colors.find((x) => String(x.id) === String(id));
              const sid = id ? String(id) : "";
              const color_ids = sid
                ? [...new Set([sid, ...selectedVariationColorIds(state)])]
                : selectedVariationColorIds(state).filter((x) => x !== String(state.color_id || ""));
              const next = {
                color_id: sid || color_ids[0] || "",
                color_ids,
                color_name: c?.name || "",
              };
              if (state.listingType === "color_size") {
                const groups = state.colorGroups || [];
                const distinctColors = new Set(
                  groups.map((g) => g.color_id || g.color?.id).filter(Boolean).map(String),
                );
                if (groups.length && distinctColors.size <= 1) {
                  next.colorGroups = groups.map((g, i) =>
                    i === 0
                      ? { ...g, color_id: sid || "", color_name: c?.name || "" }
                      : g,
                  );
                }
              }
              patch(next);
            }}
            placeholder="Select colour"
            searchPlaceholder="Search colour…"
            options={colors.map((c) => ({ id: c.id, label: c.name }))}
          />
        </div>
      </Field>
    </div>
  );
}

function showPriceErr(liveErr, submitErr, value) {
  if (value !== "" && value != null) return liveErr || submitErr;
  return submitErr || null;
}

function livePriceErr(state, fieldErrors) {
  const isMatrix =
    state.listingType === "color_size" || state.listingType === "custom";
  const hasMrp = state.original_price !== "" && state.original_price != null;
  const hasSell = state.discounted_price !== "" && state.discounted_price != null;
  const live = isMatrix
    ? hasMrp || hasSell
      ? validateMrpAndSelling(state.original_price, state.discounted_price)
      : {}
    : validateSingleListingPricing(state);
  const leaked = isMatrix ? {} : fieldErrors;
  return {
    original_price: showPriceErr(
      live.original_price,
      leaked.original_price,
      state.original_price,
    ),
    discounted_price: showPriceErr(
      live.discounted_price,
      leaked.discounted_price,
      state.discounted_price,
    ),
    stock: showPriceErr(live.stock, leaked.stock, state.stock),
    gst: showPriceErr(live.gst, leaked.gst ?? fieldErrors.gst, state.gst),
    low_stock_threshold: showPriceErr(
      live.low_stock_threshold,
      leaked.low_stock_threshold,
      state.low_stock_threshold,
    ),
    min_order_qty: showPriceErr(live.min_order_qty, leaked.min_order_qty, state.min_order_qty),
  };
}

export default function SmartListing({ mode = "vendor", vendorId: vendorIdProp = null }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const freshStart = searchParams.get("fresh") === "1";
  const bulkMode = searchParams.get("bulk") === "1";
  const openReview = searchParams.get("review") === "1";
  const { user } = useAppContext();
  const { id: editProductId } = useParams();
  const isEditMode = !!editProductId;
  const vendorId = vendorIdProp || user?.id || null;
  const [phase, setPhase] = useState(openReview ? "review" : "basics"); // basics | review
  const [step, setStep] = useState("brand");
  const [reviewSection, setReviewSection] = useState("product_info");
  const [state, setState] = useState(emptyState);
  const isPublishedLive =
    String(state.listing_status || "").toLowerCase() === "published" ||
    String(state.visibility || "").toLowerCase() === "published";
  const [bulkSession, setBulkSession] = useState(() =>
    bulkMode && !editProductId ? getBulkSession() : null,
  );
  const [stableId, setStableId] = useState(() => {
    if (freshStart || bulkMode) return newStableId(mode);
    const existing = loadLocalDraft();
    return existing?.stableId || newStableId(mode);
  });
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [innerSubCategories, setInnerSubCategories] = useState([]);
  const [shippingRates, setShippingRates] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [generating3d, setGenerating3d] = useState(false);
  const [categorySuggesting, setCategorySuggesting] = useState(false);
  const categorySuggestToken = useRef(0);
  const categorySuggestFp = useRef("");
  const sizePrefillKeyRef = useRef("");
  const listingStepLockRef = useRef(false);
  const [saveHint, setSaveHint] = useState("Ready");
  const [banner, setBanner] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [supportPhone, setSupportPhone] = useState("9211736358");
  const autosaveTimer = useRef(null);
  const priceToastKey = useRef("");

  useEffect(() => {
    const bothFilled =
      state.original_price !== "" &&
      state.original_price != null &&
      state.discounted_price !== "" &&
      state.discounted_price != null;
    if (!bothFilled) {
      priceToastKey.current = "";
      return;
    }
    const live = validateMrpAndSelling(state.original_price, state.discounted_price);
    const msg = formatPriceValidationToast(live);
    if (!msg) {
      priceToastKey.current = "";
      return;
    }
    if (priceToastKey.current === msg) return;
    priceToastKey.current = msg;
    notifyOnWarning({ title: "Please check prices", message: msg });
  }, [state.original_price, state.discounted_price]);

  const patch = useCallback((partial) => {
    listingStepLockRef.current = false;
    setState((prev) => {
      const resolved = typeof partial === "function" ? partial(prev) : partial;
      if (!resolved || typeof resolved !== "object") return prev;
      let next = prev;
      if (
        Object.prototype.hasOwnProperty.call(resolved, "listingType") &&
        String(resolved.listingType || "") !== String(prev.listingType || "")
      ) {
        const { listingType: nextType, ...rest } = resolved;
        next = { ...switchListingTypeMedia(prev, nextType), ...rest };
        if (nextType !== "single") next.isCombo = false;
      } else {
        next = { ...prev, ...resolved };
      }
      next = withSyncedMediaBuckets(next);
      stashListingMedia(stableId, next);
      return next;
    });
  }, [stableId]);

  useEffect(() => {
    if (state.listingType !== "combo" && step !== "combo") return;
    if (state.listingType === "combo") patch({ listingType: "single", isCombo: true });
    if (step === "combo") setStep(state.brandType ? "type" : "brand");
  }, [state.listingType, state.brandType, step, patch]);

  const applyColorSizePrefill = useCallback(async (fromState, { suggestedNames } = {}) => {
    if (fromState.listingType !== "color_size") return null;
    if (hasRealSizeRow(fromState.colorGroups)) return null;
    if (!fromState.category_id) return null;
    const res = await getAllSizes(sizeQueryFromListing(fromState), { silent: true });
    if (!res || res.status !== 1) return false;
    const data = res.data || [];
    const meta = res.meta || {};
    let groups = prefillColorGroupsFromCategorySizes(data, fromState, meta);
    if (!groups && suggestedNames?.length) {
      groups = prefillColorGroupsFromSuggestedNames(suggestedNames, data, fromState);
    }
    return groups;
  }, []);

  const patchSection = useCallback((section, partial) => {
    setState((prev) => ({
      ...prev,
      ...partial,
      dirtySections: { ...(prev.dirtySections || {}), [section]: true },
    }));
  }, []);

  const applyBulkSlotState = useCallback((sessionOverride) => {
    const session = sessionOverride || getBulkSession();
    const planned = getPlannedType(session);
    const next = emptyState();
    if (planned) {
      next.listingType = planned;
    }
    setState(next);
    setPhase("basics");
    setStep("brand");
    setReviewSection("product_info");
    setFieldErrors({});
    if (planned === "combo") {
      setBanner({
        type: "info",
        text: "This slot is planned as Combo — add products that already exist in your catalog. If they are not ready yet, Skip and do singles/variations first.",
      });
    } else if (planned) {
      setBanner({
        type: "info",
        text: `Planned type for this listing: ${typeLabel(planned)}. You can still change type on the Listing Type step.`,
      });
    } else {
      setBanner(null);
    }
    setSaveHint(planned ? `Bulk · ${typeLabel(planned)}` : "Ready");
  }, []);

  const resetForNextBulkListing = useCallback(() => {
    clearLocalDraft(stableId);
    clearListingFiles(stableId);
    const newId = newStableId(mode);
    setStableId(newId);
    applyBulkSlotState();
  }, [mode, stableId, applyBulkSlotState]);

  const skipBulkListing = useCallback(() => {
    if (!bulkMode) return;
    const ok = window.confirm(
      "Skip this listing without saving? You can finish it later as a new listing.",
    );
    if (!ok) return;
    const session = bulkSession || getBulkSession();
    if (!session) return;
    const next = advanceBulkSession({
      listingType: state.listingType || getPlannedType(session) || "any",
      status: "skipped",
    });
    setBulkSession(next);
    if (!next || next.completed >= next.total) {
      clearBulkSession();
      notifyOnSuccess("Bulk session finished (some skipped).");
      navigate("/bulk-upload");
      return;
    }
    clearLocalDraft(stableId);
    clearListingFiles(stableId);
    const newId = newStableId(mode);
    setStableId(newId);
    applyBulkSlotState(next);
    notifyOnSuccess(
      `Skipped · next ${next.completed + 1}/${next.total}${
        getPlannedType(next) ? ` (${typeLabel(getPlannedType(next))})` : ""
      }`,
    );
  }, [
    bulkMode,
    bulkSession,
    state.listingType,
    stableId,
    mode,
    applyBulkSlotState,
    navigate,
  ]);

  const bulkProgress = useMemo(
    () => bulkSessionProgress(bulkSession),
    [bulkSession],
  );

  // First slot: apply planned type when entering bulk mode
  useEffect(() => {
    if (!bulkMode || isEditMode || !bulkSession) return;
    if ((bulkSession.completed || 0) > 0) return;
    const planned = getPlannedType(bulkSession);
    if (planned && !state.listingType) {
      setState((prev) => {
        const next = withSyncedMediaBuckets(switchListingTypeMedia(prev, planned));
        stashListingMedia(stableId, next);
        return next;
      });
      if (planned === "combo") {
        setBanner({
          type: "info",
          text: "This slot is planned as Combo — components must already exist in catalog.",
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on bulk session start
  }, [bulkMode, isEditMode, bulkSession?.id]);

  const steps = useMemo(
    () => basicsStepsFor(state.listingType),
    [state.listingType],
  );

  useEffect(() => {
    if (phase !== "basics") return;
    if (!SETUP_STEPS.includes(step)) return;
    if (listingStepLockRef.current) return;
    const next = listingProgressStep(state);
    const order = SETUP_STEPS;
    if (order.indexOf(next) > order.indexOf(step)) setStep(next);
  }, [
    phase,
    step,
    state.brandType,
    state.listingType,
    state.category_id,
    state.files,
  ]);

  useEffect(() => {
    if (phase !== "basics") return;
    const onScroll = () => {
      if (!SETUP_STEPS.includes(step) && step !== "brand") return;
      const id = listingSectionFromScroll();
      if (id && id !== step) setStep(id);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [phase, step]);

  // Load product for Smart edit
  useEffect(() => {
    if (!editProductId) return;
    let cancelled = false;
    (async () => {
      try {
        const hydrated = await hydrateSmartListingFromProduct(editProductId);
        if (cancelled) return;
        setState((prev) => {
          const media = mergeHydratedProductMedia(prev, hydrated);
          const next = withSyncedMediaBuckets({ ...prev, ...hydrated, ...media });
          stashListingMedia(stableId, next);
          return next;
        });
        setPhase("review");
        setReviewSection("product_info");
        setSaveHint("Loaded product for edit");
      } catch (e) {
        if (!cancelled) {
          setBanner({
            type: "error",
            text: getApiErrorMessage(e, "Could not load product for edit. Use Classic form."),
          });
        }
      }
    })();
    return () => { cancelled = true; };
  }, [editProductId]);

  // Brand-auth approval status (publish gate)
  useEffect(() => {
    if (state.brandType !== "branded") return;
    const vid = vendorId || state.vendor_id || user?.id;
    if (!vid) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await getBrandAuthStatus({
          vendor_id: vid,
          product_id: state.productId || editProductId || undefined,
        });
        if (cancelled || res?.status !== 1) return;
        const approved = !!res.data?.approved;
        const status = res.data?.status || "none";
        setState((prev) => {
          if (prev.brandAuthApproved === approved && prev.brandAuthStatus === status) {
            return prev;
          }
          return { ...prev, brandAuthApproved: approved, brandAuthStatus: status };
        });
      } catch {
        /* soft — server still enforces */
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: only re-fetch on identity keys
  }, [state.brandType, state.vendor_id, state.productId, vendorId, editProductId, user?.id]);

  // Restore local draft once (skip when editing existing product or fresh Add Product)
  useEffect(() => {
    if (editProductId || freshStart) return;
    const local = loadLocalDraft(stableId) || loadLocalDraft();
    if (local?.payload) {
      setState((prev) => {
        const payload = { ...omitLiveCommerceRates(local.payload) };
        if (payload.listingType === "combo") {
          payload.isCombo = true;
          payload.listingType = "single";
        }
        const next = mergeCachedMedia(stableId, { ...prev, ...payload }, prev);
        stashListingMedia(stableId, next);
        return next;
      });
      if (local.phase && local.phase !== "review") setPhase(local.phase);
      const restoredStep = local.step === "combo" ? "type" : local.step;
      if (restoredStep && restoredStep !== "combo") setStep(restoredStep);
      if (local.reviewSection && local.reviewSection !== "compliance") {
        setReviewSection(local.reviewSection);
      }
      setSaveHint("Restored local draft");
    }
  }, [stableId, editProductId, freshStart]);

  // Photos are blobs, so localStorage cannot hold them — pull them back from IndexedDB.
  useEffect(() => {
    if (freshStart) return undefined;
    let cancelled = false;
    (async () => {
      const stored = await loadListingFiles(stableId);
      if (cancelled || !stored) return;
      setState((prev) => {
        const next = applyStoredListingFiles(prev, stored);
        if (!(prev.brandAuthFile instanceof File) && stored.brandAuthFile) {
          next.brandAuthFile = stored.brandAuthFile;
        }
        if (stored.groups.length && (prev.colorGroups || []).length) {
          const firstColorId = String(selectedVariationColorIds(next)[0] || next.color_id || "");
          next.colorGroups = prev.colorGroups.map((g) => {
            const key = g.key ?? g.color_id ?? g.color?.id ?? null;
            if (
              firstColorId &&
              key != null &&
              String(key) === firstColorId &&
              !next.skipPrimaryColorImageDefault
            ) {
              return g;
            }
            if ((g.media || []).some((f) => f instanceof File)) return g;
            if (key == null) return g;
            const hit = stored.groups.find((s) => String(s.key) === String(key));
            if (!hit?.media?.length) return g;
            return { ...g, media: hit.media };
          });
        }
        const seeded = seedFirstColorFromPrimaryGallery(
          next,
          selectedVariationColorIds(next),
        );
        if (seeded.changed) next.colorGroups = seeded.colorGroups;
        if (stored.sizeGroups?.length) {
          const sizeMedia = { ...(prev.sizeMedia || {}) };
          stored.sizeGroups.forEach((g) => {
            if (!g?.key || !g.media?.length) return;
            const bucket = sizeMedia[g.key] || { media: [], existingMedia: [] };
            if ((bucket.media || []).some((f) => f instanceof File)) return;
            sizeMedia[g.key] = { ...bucket, media: g.media };
          });
          next.sizeMedia = sizeMedia;
        }
        if (stored.customRowGroups?.length && (prev.customRows || []).length) {
          next.customRows = prev.customRows.map((r, i) => {
            const key = r.grouping_key ?? String(i);
            if ((r.media || []).some((f) => f instanceof File)) return r;
            const hit = stored.customRowGroups.find((s) => String(s.key) === String(key));
            if (!hit?.media?.length) return r;
            return { ...r, media: hit.media };
          });
        }
        if (stored.customValueGroups?.length) {
          const valueMedia = { ...(prev.customValueMedia || {}) };
          stored.customValueGroups.forEach((g) => {
            if (!g?.key || !g.media?.length) return;
            const bucket = valueMedia[g.key] || { media: [], existingMedia: [] };
            if ((bucket.media || []).some((f) => f instanceof File)) return;
            valueMedia[g.key] = { ...bucket, media: g.media };
          });
          next.customValueMedia = valueMedia;
        }

        if (next === prev) return prev;
        stashListingMedia(stableId, next);
        return next;
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [stableId, freshStart]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [catRes, subRes, innerRes, settingsRes, ratesRes] =
          await Promise.all([
            getCategories({ silent: true }),
            getSubCategories({ silent: true }),
            getInnerSubCategories({ silent: true }),
            getSettings({ silent: true }),
            // Shipping rates need a vendor token; don't block the listing form if this call fails.
            getShippingRates({ silent: true }).catch(() => null),
          ]);
        if (cancelled) return;
        if (catRes?.status !== 1 && !catRes?.data) {
          setLoadError("Could not load categories. Check connection and retry.");
        }
        setCategories(
          (catRes?.data || []).map((c) => ({
            id: c.id,
            name: c.title,
            hsn_code: c.hsn_code,
            tax: c.tax ?? c.gst,
          })),
        );
        setSubCategories(
          (subRes?.data || []).map((c) => ({
            id: c.id,
            name: c.title,
            categoryId: c.cat_id,
            hsn_code: c.hsn_code,
            tax: c.tax ?? c.gst,
            is_returnable: c.is_returnable,
          })),
        );
        setInnerSubCategories(
          (innerRes?.data || []).map((c) => ({
            id: c.id,
            name: c.title,
            subCategoryId: c.sub_cat_id,
            hsn_code: c.hsn_code,
            tax: c.tax ?? c.gst,
            size_chart_image: c.size_chart_image || null,
            replacement_allowed: c.replacement_allowed !== false,
          })),
        );
        if (settingsRes?.status === 1) {
          const phone =
            settingsRes.data.support_phone ||
            settingsRes.data.contact_phone ||
            settingsRes.data.phone ||
            settingsRes.data.helpline;
          if (phone) setSupportPhone("9211736358");
          patch({
            platform_fee_pct: Number(settingsRes.data.platform_fee) || 0,
            platform_fee_max: Number(settingsRes.data.platform_fee_max_charge) || 0,
            default_return_window_days:
              settingsRes.data.default_return_window_days ?? 7,
          });
        }
        const ratesPayload = ratesRes?.data;
        const ratesList = Array.isArray(ratesPayload)
          ? ratesPayload
          : Array.isArray(ratesPayload?.data)
            ? ratesPayload.data
            : [];
        if (ratesRes?.status === 1 || ratesList.length) {
          setShippingRates(
            ratesList
              .map((r) => ({
                maxWeight: Number(r.maxWeight ?? r.max_weight),
                charge: Number(r.charge),
              }))
              .filter((r) => Number.isFinite(r.maxWeight) && Number.isFinite(r.charge))
              .sort((a, b) => a.maxWeight - b.maxWeight),
          );
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(
            getApiErrorMessage(e, "Unable to reach the server. Please retry."),
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [patch]);

  // HSN / GST autofill from taxonomy
  useEffect(() => {
    const category = categories.find((c) => String(c.id) === String(state.category_id));
    const subCategory = subCategories.find(
      (c) => String(c.id) === String(state.sub_category_id),
    );
    const innerSubCategory = innerSubCategories.find(
      (c) => String(c.id) === String(state.inner_sub_category_id),
    );
    const tax = taxFromCategoryTree({ category, subCategory, innerSubCategory });
    const lookup = state.inner_sub_category_id
      ? innerHsnGstLookup[String(state.inner_sub_category_id)]
      : null;
    const next = {
      categoryTitle: category?.name || "",
      subCategoryTitle: subCategory?.name || "",
      innerSubCategoryTitle: innerSubCategory?.name || "",
      gst_raw: lookup?.gst_raw || "",
      gst_mixed: !!lookup?.mixed,
    };
    // Prefer Ops export when present (until DB migrate applied everywhere)
    if (lookup?.hsn) next.hsn_code = lookup.hsn;
    else if (tax.hsn_code) next.hsn_code = tax.hsn_code;
    const bandGst = gstFromBands(
      lookup?.bands,
      state.discounted_price,
      lookup?.tax != null ? lookup.tax : tax.gst,
    );
    if (bandGst != null) next.gst = bandGst;
    else if (lookup?.tax != null) next.gst = lookup.tax;
    else if (tax.gst != null) next.gst = tax.gst;
    patch(
      applyAutoListingPolicies(next, {
        subCategory,
        innerSubCategory,
        defaultReturnWindowDays: state.default_return_window_days ?? 7,
      }),
    );
  }, [
    state.category_id,
    state.sub_category_id,
    state.inner_sub_category_id,
    state.discounted_price,
    state.default_return_window_days,
    categories,
    subCategories,
    innerSubCategories,
    patch,
  ]);

  // Volumetric (kg) + shipping charge from Admin weight slabs (chargeable grams).
  useEffect(() => {
    const L = Number(state.package_length) || 0;
    const W = Number(state.package_width) || 0;
    const H = Number(state.package_height) || 0;
    const volKg = L && W && H ? (L * W * H) / 5000 : 0;
    const deadGrams = Number(state.package_weight) || 0;
    const volGrams = volKg * 1000;
    const chargeableGrams = Math.max(deadGrams, volGrams);
    let charge = 0;
    if (!state.free_shipping && shippingRates.length && chargeableGrams > 0) {
      const match = shippingRates.find((r) => chargeableGrams <= Number(r.maxWeight));
      charge = match
        ? Number(match.charge) || 0
        : Number(shippingRates[shippingRates.length - 1]?.charge) || 0;
    }
    const sale = Number(state.discounted_price) || 0;
    const fee = applyPlatformFeeRules(
      sale,
      state.platform_fee_pct,
      state.platform_fee_max,
    );
    patch({
      volumetric_weight: Math.round(volKg * 1000) / 1000,
      shipping_charges: charge,
      platformFee: fee.amount,
    });
  }, [
    state.package_length,
    state.package_width,
    state.package_height,
    state.package_weight,
    state.free_shipping,
    state.discounted_price,
    state.platform_fee_pct,
    state.platform_fee_max,
    shippingRates,
    patch,
  ]);

  // Autosave local + server (debounced)
  useEffect(() => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(async () => {
      const payload = stripFilesForDraft(state);
      stashListingMedia(stableId, state);
      saveListingFiles(stableId, state);
      saveLocalDraft(stableId, {
        payload,
        phase,
        step,
        reviewSection,
      });
      setSaveHint("Saving…");
      setSaving(true);
      try {
        const res = await saveProductDraft({
          stable_id: stableId,
          listing_type:
            state.listingType === "combo"
              ? "combo"
              : state.listingType === "single"
                ? "single"
                : "variation",
          step: phase === "basics" ? step : reviewSection,
          vendor_id: vendorId || undefined,
          payload: {
            ...payload,
            vendor_id: vendorId || undefined,
          },
        });
        if (res?.status === 1) setSaveHint("All changes saved");
        else setSaveHint(res?.message || "Saved locally (server draft pending)");
      } catch {
        setSaveHint("Saved locally — server unreachable");
      } finally {
        setSaving(false);
      }
    }, 900);
    return () => clearTimeout(autosaveTimer.current);
  }, [state, phase, step, reviewSection, stableId, vendorId]);

  const previewUrls = useMemo(() => {
    return (state.files || []).map((f) =>
      f instanceof File ? URL.createObjectURL(f) : typeof f === "string" ? f : f?.url || null,
    );
  }, [state.files]);

  const coverPreviewSrc = useMemo(
    () => listingCoverPreviewSrc(state, previewUrls),
    [state, previewUrls],
  );

  useEffect(() => {
    const first = (state.files || []).find((f) => f instanceof File);
    if (!first) return undefined;
    let cancelled = false;
    fileToCoverPreviewUrl(first).then((url) => {
      if (cancelled || !url || url === state.coverPreviewUrl) return;
      patch({ coverPreviewUrl: url });
    });
    return () => {
      cancelled = true;
    };
  }, [state.files, state.coverPreviewUrl, patch]);

  useEffect(() => {
    return () => {
      previewUrls.forEach((u) => {
        try {
          if (u && String(u).startsWith("blob:")) URL.revokeObjectURL(u);
        } catch {
          /* ignore */
        }
      });
    };
  }, [previewUrls]);

  const localSettlement = useMemo(
    () => ({
      ...calcSettlement({
        mrp: state.original_price,
        sellingPrice: state.discounted_price,
        gstPercent: state.gst,
        shippingCharges: state.shipping_charges,
        platformFee: state.platformFee,
        freeShipping: state.free_shipping,
      }),
      platform_fee_pct: Number(state.platform_fee_pct) || 0,
      platform_fee_max: Number(state.platform_fee_max) || 0,
    }),
    [
      state.original_price,
      state.discounted_price,
      state.gst,
      state.shipping_charges,
      state.platformFee,
      state.platform_fee_pct,
      state.platform_fee_max,
      state.free_shipping,
    ],
  );
  const [remoteSettlement, setRemoteSettlement] = useState(null);
  const settlement = remoteSettlement
    ? { ...localSettlement, ...remoteSettlement }
    : localSettlement;

  const footerStats = useMemo(() => {
    if (state.listingType !== "color_size" && state.listingType !== "custom") return null;
    const inr2 = (n) => {
      const v = Number(n);
      if (!Number.isFinite(v) || v <= 0) return "₹ —";
      return `₹${v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };
    const earnFromRow = (row) =>
      calcSettlement({
        mrp: row.original_price,
        sellingPrice: row.discounted_price,
        gstPercent: state.gst,
        shippingCharges: state.shipping_charges,
        platformFee: state.platformFee,
        freeShipping: state.free_shipping,
      }).youEarn;
    const stats =
      state.listingType === "custom"
        ? customListingStats(state, earnFromRow)
        : variationListingStats(state, earnFromRow);
    const sellRange =
      stats.minSell && stats.maxSell && stats.minSell !== stats.maxSell
        ? `${inr2(stats.minSell)} – ${inr2(stats.maxSell)}`
        : inr2(stats.minSell || stats.maxSell);
    return {
      baseMrp: inr2(stats.baseMrp),
      sellRange,
      variantCount: String(stats.variantCount || 0),
      totalStock: `${stats.totalStock || 0} Units`,
      youEarn: inr2(stats.youEarnTotal || settlement?.youEarn),
    };
  }, [
    state.listingType,
    state.colorGroups,
    state.customRows,
    state.original_price,
    state.discounted_price,
    state.gst,
    state.shipping_charges,
    state.platformFee,
    state.free_shipping,
    settlement?.youEarn,
  ]);

  useEffect(() => {
    const saleRaw = state.discounted_price;
    const mrpRaw = state.original_price;
    const sale = Number(saleRaw);
    const mrp = Number(mrpRaw);
    const hasSale = saleRaw !== "" && saleRaw != null && Number.isFinite(sale) && sale > 0;
    const hasMrp = mrpRaw !== "" && mrpRaw != null && Number.isFinite(mrp) && mrp > 0;
    if (!hasSale && !hasMrp) {
      setRemoteSettlement(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await previewListingSettlement({
          original_price: state.original_price,
          discounted_price: state.discounted_price,
          gst: state.gst,
          hsn_code: state.hsn_code,
          shipping_charges: state.shipping_charges,
          free_shipping: state.free_shipping,
          package_weight: state.package_weight,
          package_length: state.package_length,
          package_width: state.package_width,
          package_height: state.package_height,
          volumetric_weight: state.volumetric_weight,
          category_id: state.category_id,
          sub_category_id: state.sub_category_id,
          inner_sub_category_id: state.inner_sub_category_id,
          size_ids: listingSizeIds(state),
          color_id: state.color_id,
        });
        if (res?.status === 1 && res.data) {
          setRemoteSettlement(res.data);
          const fee = res.data.platformFee;
          const pct = res.data.platform_fee_pct;
          const max = res.data.platform_fee_max;
          const next = {};
          if (fee != null && Number(fee) !== Number(state.platformFee || 0)) {
            next.platformFee = fee;
          }
          if (pct != null && Number(pct) !== Number(state.platform_fee_pct || 0)) {
            next.platform_fee_pct = pct;
          }
          if (max != null && Number(max) !== Number(state.platform_fee_max || 0)) {
            next.platform_fee_max = max;
          }
          if (
            res.data.shipping != null &&
            Number(res.data.shipping) !== Number(state.shipping_charges || 0)
          ) {
            next.shipping_charges = res.data.shipping;
          }
          if (Object.keys(next).length) patch(next);
        }
      } catch {
        /* keep local calc */
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [
    state.original_price,
    state.discounted_price,
    state.gst,
    state.hsn_code,
    state.shipping_charges,
    state.free_shipping,
    state.category_id,
    state.sub_category_id,
    state.inner_sub_category_id,
    state.size_ids,
    state.size_id,
    state.color_id,
    state.package_weight,
    state.package_length,
    state.package_width,
    state.package_height,
    patch,
  ]);

  const filteredSubs = useMemo(
    () =>
      subCategories.filter(
        (s) => String(s.categoryId) === String(state.category_id),
      ),
    [subCategories, state.category_id],
  );
  const filteredInners = useMemo(
    () =>
      innerSubCategories.filter(
        (s) => String(s.subCategoryId) === String(state.sub_category_id),
      ),
    [innerSubCategories, state.sub_category_id],
  );

  // GST price-band resolve (no-op until Ops fills category_gst_rules)
  useEffect(() => {
    let cancelled = false;
    const price = Number(state.discounted_price || state.original_price);
    if (!state.category_id || !Number.isFinite(price) || price <= 0) return;
    (async () => {
      try {
        const res = await resolveCategoryGst({
          category_id: state.category_id,
          sub_category_id: state.sub_category_id || undefined,
          inner_sub_category_id: state.inner_sub_category_id || undefined,
          price,
        });
        if (cancelled || res?.status !== 1 || !res?.data) return;
        const rule = res.data;
        patch({
          ...(rule.gst_percent != null ? { gst: rule.gst_percent } : {}),
          ...(rule.hsn_code ? { hsn_code: rule.hsn_code } : {}),
        });
      } catch {
        /* soft — keep category autofill */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    state.category_id,
    state.sub_category_id,
    state.inner_sub_category_id,
    state.discounted_price,
    state.original_price,
    patch,
  ]);

  const runCategorySuggest = useCallback(async ({ force = false } = {}) => {
    const file = firstListingImageFile(state);
    if (!file) return;
    const fp = listingPhotoFingerprint(file);
    if (!force && categorySuggestFp.current === fp) return;
    categorySuggestFp.current = fp;
    const token = ++categorySuggestToken.current;
    setCategorySuggesting(true);
    try {
      const payload = await fileToSuggestPayload(file);
      const res = await suggestListingCategory({
        ...payload,
        listing_type: state.listingType || "single",
      });
      if (token !== categorySuggestToken.current) return;
      if (res?.status === 1 && res?.data) {
        const d = res.data;
        const catPatch = {
          category_id: String(d.category_id),
          sub_category_id: String(d.sub_category_id),
          inner_sub_category_id: d.inner_sub_category_id
            ? String(d.inner_sub_category_id)
            : "",
          categoryTitle: d.categoryTitle || "",
          subCategoryTitle: d.subCategoryTitle || "",
          innerSubCategoryTitle: d.innerSubCategoryTitle || "",
        };
        const nextState = { ...state, ...catPatch };
        let colorGroups;
        try {
          colorGroups = await applyColorSizePrefill(nextState);
          if (colorGroups === false) colorGroups = undefined;
        } catch {
          /* effect retries */
        }
        patch({
          ...catPatch,
          ...(colorGroups ? listingPatchFromPrefillGroups(colorGroups, nextState) : {}),
        });
        setBanner({
          type: "info",
          text: `Category auto-selected: ${[d.categoryTitle, d.subCategoryTitle, d.innerSubCategoryTitle].filter(Boolean).join(" › ")}`,
        });
      } else if (force) {
        setBanner({
          type: "error",
          text:
            res?.message ||
            "Could not detect category from photo — pick category manually.",
        });
      }
    } catch (e) {
      if (force) {
        setBanner({
          type: "error",
          text: getApiErrorMessage(
            e,
            "Could not detect category from photo — pick category manually.",
          ),
        });
      }
    } finally {
      if (token === categorySuggestToken.current) setCategorySuggesting(false);
    }
  }, [
    state.files,
    state.mediaLabels,
    state.colorGroups,
    state.listingType,
    state.name,
    state.original_price,
    state.discounted_price,
    state.stock,
    patch,
    applyColorSizePrefill,
  ]);

  useEffect(() => {
    const file = firstListingImageFile(state);
    if (!file) return;
    const fp = listingPhotoFingerprint(file);
    if (categorySuggestFp.current === fp) return;
    runCategorySuggest();
  }, [
    state.files,
    state.mediaLabels,
    state.colorGroups,
    runCategorySuggest,
  ]);

  const runGenerate3d = useCallback(async () => {
    const file = firstListingImageFile(state);
    if (!file) {
      notifyOnWarning("Upload a product photo first");
      return;
    }
    setGenerating3d(true);
    try {
      let outFile = null;
      try {
        const payload = await fileToSuggestPayload(file);
        const res = await generateListing3dImage(payload);
        const b64 = res?.data?.image_base64 || res?.data?.b64_json;
        if (res?.status === 1 && b64) {
          const mime = res.data.mime_type || "image/png";
          const name = mime.includes("png") ? "ai-3d-studio.png" : "ai-3d-studio.jpg";
          outFile = base64ToJpegFile(b64, name);
        }
      } catch {
        /* canvas fallback */
      }
      if (!outFile) outFile = await makeStudio3dFile(file);
      const files = [...(state.files || [])];
      const mediaLabels = [...(state.mediaLabels || [])];
      while (mediaLabels.length < files.length) {
        mediaLabels.push({ label: `extra${mediaLabels.length}` });
      }
      files.push(outFile);
      mediaLabels.push({
        label: "ai_3d",
        alt_text: `${state.name || "Product"} — 3D studio`,
      });
      patch({ files, mediaLabels });
      setBanner({
        type: "info",
        text: "3D studio image added at the end of the gallery.",
      });
    } catch (e) {
      setBanner({
        type: "error",
        text: getApiErrorMessage(e, "Could not generate a 3D image."),
      });
    } finally {
      setGenerating3d(false);
    }
  }, [state, patch]);

  const hasSizeIds = useMemo(
    () => hasRealSizeRow(state.colorGroups),
    [state.colorGroups],
  );

  useEffect(() => {
    if (state.listingType !== "color_size") return;
    if (!state.category_id) return;
    const prefillKey = [
      state.category_id,
      state.sub_category_id || "",
      state.inner_sub_category_id || "",
    ].join("|");
    if (hasSizeIds) {
      sizePrefillKeyRef.current = prefillKey;
      const filled = applyParentDefaultsToEmptySizeRows(state.colorGroups, state);
      if (filled) patch({ colorGroups: filled });
      return;
    }
    if (sizePrefillKeyRef.current === prefillKey) return;
    let cancelled = false;
    (async () => {
      try {
        const groups = await applyColorSizePrefill({
          listingType: state.listingType,
          category_id: state.category_id,
          sub_category_id: state.sub_category_id,
          inner_sub_category_id: state.inner_sub_category_id,
          original_price: state.original_price,
          discounted_price: state.discounted_price,
          stock: state.stock,
          colorGroups: state.colorGroups,
          color_id: state.color_id,
          color_name: state.color_name,
          size_ids: state.size_ids,
          size_id: state.size_id,
        });
        if (cancelled) return;
        if (groups === false) return;
        sizePrefillKeyRef.current = prefillKey;
        if (groups) patch(listingPatchFromPrefillGroups(groups, state));
      } catch {
        /* soft */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    state.listingType,
    state.category_id,
    state.sub_category_id,
    state.inner_sub_category_id,
    state.original_price,
    state.discounted_price,
    state.stock,
    hasSizeIds,
    applyColorSizePrefill,
    patch,
  ]);

  const validateBasicsStep = () => {
    const err = {};
    const setupPage = SETUP_STEPS.includes(step);
    if (setupPage || step === "brand") {
      if (!state.brandType) err.brandType = "Select brand type";
      if (state.brandType === "branded" && !state.brandAuthDocName && !state.brandAuthFile) {
        err.brandAuth = "Upload brand authorization document";
      }
    }
    if (setupPage || step === "type") {
      if (!state.listingType) err.listingType = "Select listing type";
    }
    if (setupPage || step === "category") {
      if (!state.category_id) err.category_id = "Required";
      if (!state.sub_category_id) err.sub_category_id = "Required";
      Object.assign(err, validateCategoryStepPricing(state));
    }
    if (setupPage || step === "images") {
      const needsParentImages =
        state.listingType === "single" ||
        state.listingType === "combo" ||
        state.listingType === "color_size" ||
        state.listingType === "custom" ||
        !state.listingType;
      const photoCount =
        (state.files || []).length + (state.existingMedia || []).length;
      if (needsParentImages && photoCount === 0) {
        err.files = "Add at least one product image";
      }
    }
    if (step === "matrix" && state.listingType === "color_size") {
      const photoCount =
        (state.files || []).length + (state.existingMedia || []).length;
      const ok = (state.colorGroups || []).some(
        (g) =>
          (g.color_id || g.color?.id) &&
          (g.sizes || []).some((s) => s.size_id || s.size?.id),
      );
      if (!ok) err.matrix = "Generate at least one color × size combination";
      else {
        const missingColorImages = (state.colorGroups || []).some(
          (g) =>
            (g.color_id || g.color?.id) &&
            !(g.media || []).length &&
            !(g.existingMedia || []).length,
        );
        if (missingColorImages && photoCount === 0) {
          err.matrix = "Add gallery images or at least one image per color";
        } else {
          const matrixPriceErr = firstVariationMatrixError(state);
          if (matrixPriceErr) err.matrix = matrixPriceErr;
        }
      }
    }
    if (step === "matrix" && state.listingType === "custom") {
      const ok = (state.customRows || []).some(
        (r) => r.enabled && r.attributes?.length,
      );
      if (!ok) err.matrix = "Generate custom matrix and keep at least one row enabled";
      else {
        const matrixPriceErr = firstVariationMatrixError(state);
        if (matrixPriceErr) err.matrix = matrixPriceErr;
      }
    }
    setFieldErrors(err);
    return err;
  };

  const goNextBasics = () => {
    const err = validateBasicsStep();
    if (Object.keys(err).length) {
      const text =
        formatPriceValidationToast(err) ||
        firstValidationError(err) ||
        "Please fix the highlighted fields before continuing.";
      setBanner({ type: "error", text });
      notifyOnFail({ title: "Please check", message: text });
      return;
    }
    setBanner(null);
    if (SETUP_STEPS.includes(step)) {
      const extra = steps.find((s) => !SETUP_STEPS.includes(s));
      if (extra) {
        setStep(extra);
        return;
      }
      runAiGenerate();
      return;
    }
    const idx = steps.indexOf(step);
    if (idx < steps.length - 1) {
      setStep(steps[idx + 1]);
      return;
    }
    runAiGenerate();
  };

  const goBack = () => {
    setBanner(null);
    if (phase === "review") {
      setPhase("basics");
      setStep(state.listingType === "color_size" || state.listingType === "custom" ? "matrix" : "category");
      return;
    }
    if (step === "matrix") {
      setStep("category");
      requestAnimationFrame(() => scrollToListingSection("category"));
      return;
    }
    if (SETUP_STEPS.includes(step)) {
      navigate("/product/list");
      return;
    }
    setStep("category");
  };

  const runAiGenerate = async (opts = {}) => {
    let confirmedOverwrite = true;
    if (opts.forceOverwrite === true) {
      confirmedOverwrite = true;
    } else if (opts.confirmDirty) {
      confirmedOverwrite = window.confirm(
        "Overwrite sections you already edited? Cancel keeps your edits and only fills untouched sections.",
      );
    }

    const runId = (runAiGenerate._seq = (runAiGenerate._seq || 0) + 1);
    setAiGenerating(true);
    setBanner(null);
    setPhase("review");
    setReviewSection("product_info");
    try {
      let draft = null;
      let source = "local";
      try {
        const res = await generateListingAiDraft(
          await buildListingAiPayload(state, user),
        );
        if (runId !== runAiGenerate._seq) return;
        if (res?.status === 1 && res?.data?.draft) {
          draft = res.data.draft;
          source = res.data.source || "openai";
        } else if (res?.message) {
          notifyOnWarning(res.message);
        }
      } catch (apiErr) {
        if (runId !== runAiGenerate._seq) return;
        console.warn("Listing AI API failed, using local fallback:", apiErr);
        notifyOnWarning(
          getApiErrorMessage(apiErr, "Listing AI unavailable — filled a basic draft."),
        );
      }

      if (runId !== runAiGenerate._seq) return;

      const merged = mergeAiDraft(state, {
        forceOverwrite: confirmedOverwrite,
        draft,
        vendorContext: user || {},
      });
      if (!merged.sku) merged.sku = suggestSku(merged.name, merged.brand);
      try {
        const groups = await applyColorSizePrefill(merged, {
          suggestedNames: draft?.suggestedSizes,
        });
        if (groups && groups !== false) {
          Object.assign(merged, listingPatchFromPrefillGroups(groups, merged));
        }
      } catch {
        /* category effect still prefills */
      }
      setState(merged);
      notifyOnSuccess(
        source === "local"
          ? "Basic draft ready (AI unavailable — review carefully)"
          : confirmedOverwrite
            ? "AI regenerated all sections (high quality)"
            : "AI draft ready — edited sections were kept",
      );
    } catch (e) {
      if (runId !== runAiGenerate._seq) return;
      setBanner({
        type: "error",
        text: "Could not auto-generate content. You can fill sections manually.",
      });
    } finally {
      if (runId === runAiGenerate._seq) setAiGenerating(false);
    }
  };

  const discardDraft = async () => {
    const savedId = editProductId || state.productId;
    const msg = savedId
      ? "Discard this draft? It will be permanently deleted and cannot be undone."
      : "Discard this listing? All local progress, images, and variant data will be cleared.";
    if (!window.confirm(msg)) return;

    setDiscarding(true);
    try {
      if (autosaveTimer.current) {
        clearTimeout(autosaveTimer.current);
        autosaveTimer.current = null;
      }
      if (savedId) {
        const res = await deleteProduct(savedId);
        if (res?.status !== 1) {
          notifyOnFail(res?.message || "Could not discard draft");
          return;
        }
        clearLocalDraft(stableId);
        clearListingFiles(stableId);
        notifyOnSuccess("Draft discarded");
        navigate("/product", { replace: true });
        return;
      }

      clearLocalDraft(stableId);
      clearListingFiles(stableId);
      const nextId = newStableId(mode);
      setStableId(nextId);
      setState(emptyState());
      setPhase("basics");
      setStep("brand");
      setReviewSection("product_info");
      setFieldErrors({});
      setBanner(null);
      setSaveHint("Draft discarded");
      notifyOnSuccess("Listing progress cleared");
      navigate("/product", { replace: true });
    } catch (e) {
      notifyOnFail(getApiErrorMessage(e, "Could not discard draft"));
    } finally {
      setDiscarding(false);
    }
  };

  const submitListing = async ({ asDraft }) => {
    if (!asDraft) {
      const vErr = validateSmartListingState(state);
      if (state.listingType === "single" && !state.files?.length) {
        vErr.files = "Add at least one image before submit";
      }
      if (state.listingType === "combo" && !state.files?.length) {
        vErr.files = "Add at least one cover image for the combo listing";
      }
      const firstErr = firstValidationError(vErr);
      if (firstErr) {
        const focus = firstReviewErrorFocus(vErr);
        if (focus?.phase === "basics") {
          setPhase("basics");
          setStep(
            focus.step === "matrix" && state.listingType === "combo"
              ? "combo"
              : focus.step || "images",
          );
        } else if (focus?.section) {
          setPhase("review");
          setReviewSection(focus.section);
          window.setTimeout(() => {
            const el = focus.fieldId ? document.getElementById(focus.fieldId) : null;
            el?.scrollIntoView({ behavior: "smooth", block: "center" });
            el?.focus();
          }, 80);
        }
        const text = vErr.matrix
          ? vErr.matrix
          : formatPriceValidationToast(vErr) || firstErr;
        setFieldErrors(vErr);
        setBanner({ type: "error", text });
        notifyOnFail({ title: "Please fill required fields", message: text });
        return;
      }
    }

    // branded publish blocked client — need approved auth (server also enforces)
    if (
      !asDraft &&
      state.brandType === "branded" &&
      !state.brandAuthApproved
    ) {
      setBanner({
        type: "error",
        text: "Branded listings need Admin-approved brand authorization before publish request. Save as draft, then request publish after approval.",
      });
      return;
    }

    setSubmitting(true);
    setBanner(null);
    try {
      // Always create/update a real Product row for drafts so they appear under
      // Products → Draft and can be edited later.
      const draftState = {
        ...state,
        vendor_id: vendorId || state.vendor_id,
        name:
          state.name?.trim() ||
          state.innerSubCategoryTitle ||
          state.subCategoryTitle ||
          state.categoryTitle ||
          "Untitled draft",
      };

      const { formData } = buildSmartListingFormData(draftState, {
        asDraft: isPublishedLive ? false : asDraft,
        requestPublish: isPublishedLive ? false : !asDraft,
      });
      const pid = state.productId || editProductId;
      const res = pid
        ? await updateProduct(pid, formData)
        : await addProduct(formData);
      if (res?.status === 1) {
        clearLocalDraft(stableId);
        clearListingFiles(stableId);
        const session = bulkSession || getBulkSession();
        const hasMoreBulk =
          bulkMode &&
          session &&
          (session.completed || 0) + 1 < session.total;

        if (hasMoreBulk) {
          const next = advanceBulkSession({
            listingType: state.listingType || "any",
            productId: res?.data?.id || pid || null,
            status: "saved",
          });
          setBulkSession(next);
          resetForNextBulkListing();
          const nextType = getPlannedType(next);
          notifyOnSuccess(
            asDraft
              ? `Listing ${(next?.completed || 1)}/${next?.total} draft saved${
                  nextType ? ` · next: ${typeLabel(nextType)}` : ""
                }`
              : `Listing ${(next?.completed || 1)}/${next?.total} sent for review${
                  nextType ? ` · next: ${typeLabel(nextType)}` : ""
                }`,
          );
        } else {
          if (bulkMode) {
            advanceBulkSession({
              listingType: state.listingType || "any",
              productId: res?.data?.id || pid || null,
              status: "saved",
            });
            clearBulkSession();
          }
          notifyOnSuccess(
            isPublishedLive
              ? "Listing updated. Publish status stays with Admin."
              : asDraft
                ? bulkMode
                  ? "All bulk listings saved as draft."
                  : "Draft saved — find it under Products → Draft. You can add a new listing anytime."
                : bulkMode
                  ? "All bulk listings submitted for review."
                  : "Publish request sent — Admin will review and publish.",
          );
          navigate(
            isPublishedLive || !asDraft ? "/product" : "/product?tab=draft",
          );
        }
      } else {
        setBanner({
          type: "error",
          text: res?.message || "Could not save listing. Please fix and retry.",
        });
      }
    } catch (error) {
      setBanner({
        type: "error",
        text: getApiErrorMessage(error, "Unable to reach the server. Draft is kept locally."),
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loadError) {
    return (
      <div className="p-6 max-w-lg mx-auto text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
        <h1 className="text-lg font-semibold">Couldn’t load listing tools</h1>
        <p className="text-sm text-gray-600">{loadError}</p>
        <button
          type="button"
          className="px-4 py-2 bg-primary-100 text-white rounded-xl text-sm font-semibold"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
        <div>
          <Link to="/product" className="text-sm text-primary-100">
            Back to products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ListingErrorBoundary>
    <div className={`min-h-screen pb-36 font-inter text-slate-800 ${phase === "review" ? "bg-[#FFF8F4]" : "bg-[#F8FAFC]"}`}>
      <div className="sticky top-0 z-20 bg-white" style={{ boxShadow: "0 1px 0 #F1F5F9" }}>
        <ListingPageHeader
          user={user}
          supportPhone={supportPhone}
          listingType={state.listingType}
          bulkProgress={bulkProgress}
          skipBulkListing={skipBulkListing}
          onExitBulk={() => {
            if (window.confirm("Stop bulk session? Progress is saved per listing already submitted.")) {
              clearBulkSession();
              navigate("/bulk-upload");
            }
          }}
        />
        {phase === "basics" ? (
          <SetupStepper
            phase={phase}
            step={step}
            listingType={state.listingType}
            state={state}
            onSelect={(id) => {
              listingStepLockRef.current = true;
              if (id === "review") {
                setPhase("review");
                return;
              }
              setPhase("basics");
              setStep(id);
              requestAnimationFrame(() => scrollToListingSection(id));
            }}
          />
        ) : (
          <AiReviewHeader
            aiGenerating={aiGenerating}
            onRegenerate={() => runAiGenerate({ confirmDirty: true })}
            onEdit={() => {
              setReviewSection("product_info");
              requestAnimationFrame(() =>
                document.getElementById("ai-review-name")?.focus(),
              );
            }}
          />
        )}
      </div>

      {banner ? <ListingBanner banner={banner} onClose={() => setBanner(null)} /> : null}

      <div
        className={`w-full max-w-[1400px] mx-auto px-4 lg:px-5 py-5 ${
          phase === "review"
            ? ""
            : "grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_272px] gap-4 lg:gap-5"
        }`}
      >
        {phase === "basics" ? (
          <>
            <div className="min-w-0">
              <BasicsPanel
                step={step}
                state={state}
                patch={patch}
                fieldErrors={fieldErrors}
                categorySuggesting={categorySuggesting}
                onDetectCategory={() => runCategorySuggest({ force: true })}
                onGenerateAi={runGenerate3d}
                onContinueToAi={goNextBasics}
                aiGenerating={generating3d}
                listingAiGenerating={aiGenerating}
                categories={categories}
                filteredSubs={filteredSubs}
                filteredInners={filteredInners}
                vendorId={vendorId}
              />
            </div>
            <aside className="w-full max-w-[272px] lg:max-w-none space-y-3 lg:sticky lg:top-[136px] lg:self-start">
              <ListingRightRail state={state} settlement={settlement} previewUrl={coverPreviewSrc} />
            </aside>
          </>
        ) : (
          <ReviewPanel
            reviewSection={reviewSection}
            setReviewSection={setReviewSection}
            state={state}
            patch={patch}
            patchSection={patchSection}
            fieldErrors={fieldErrors}
            settlement={settlement}
            previewUrl={coverPreviewSrc}
            shippingRates={shippingRates}
            sizeChartUrl={
              state.sizeChartUrl ||
              innerSubCategories.find(
                (c) => String(c.id) === String(state.inner_sub_category_id),
              )?.size_chart_image ||
              null
            }
          />
        )}
      </div>

      <ListingStickyFooter
        onBack={goBack}
        saveHint={saveHint}
        saving={saving}
        submitting={submitting}
        discarding={discarding}
        isPublishedLive={isPublishedLive}
        showDraft={!isPublishedLive}
        showBack={phase === "basics" && step === "matrix"}
        stats={
          (state.listingType === "color_size" || state.listingType === "custom") &&
          (step === "matrix" || phase === "review")
            ? footerStats
            : null
        }
        onSaveDraft={() => submitListing({ asDraft: true })}
        onDiscard={discardDraft}
        phase={phase}
        primaryVariant={
          phase === "basics" || (phase === "review" && reviewSection !== "size_chart")
            ? "next"
            : "publish"
        }
        onPrimary={
          phase === "basics"
            ? goNextBasics
            : phase === "review" && reviewSection !== "size_chart"
              ? () => {
                  const idx = REVIEW_SECTIONS.findIndex((s) => s.id === reviewSection);
                  const next = REVIEW_SECTIONS[idx + 1];
                  if (next) {
                    setReviewSection(next.id);
                    window.requestAnimationFrame(() => {
                      document
                        .getElementById("ai-review-form-card")
                        ?.scrollIntoView({ behavior: "smooth", block: "start" });
                    });
                  }
                }
              : () => submitListing({ asDraft: false })
        }
        aiGenerating={aiGenerating}
        primaryLabel={
          phase === "basics"
            ? aiGenerating
              ? "Writing listing…"
              : SETUP_STEPS.includes(step) && steps.some((s) => !SETUP_STEPS.includes(s))
                ? "Next →"
                : "Next: AI Auto Generate →"
            : phase === "review" && reviewSection !== "size_chart"
              ? "Next →"
              : isPublishedLive
                ? "Save changes"
                : isEditMode
                  ? "Update & Request Publish"
                  : "Request Publish"
        }
      />
    </div>
    </ListingErrorBoundary>
  );
}

function BasicsPanel({
  step,
  state,
  patch,
  fieldErrors,
  categorySuggesting,
  onDetectCategory,
  onGenerateAi,
  onContinueToAi,
  aiGenerating,
  listingAiGenerating,
  categories,
  filteredSubs,
  filteredInners,
  vendorId,
}) {
  const catPriceErr = validateCategoryStepPricing(state);
  const mrpErr = showPriceErr(catPriceErr.original_price, fieldErrors.original_price, state.original_price);
  const sellErr = showPriceErr(catPriceErr.discounted_price, fieldErrors.discounted_price, state.discounted_price);
  const gstErr = showPriceErr(catPriceErr.gst, fieldErrors.gst, state.gst);

  if (step !== "matrix") {
    return (
      <SmartListingSetupForm
        state={state}
        patch={patch}
        fieldErrors={fieldErrors}
        categories={categories}
        filteredSubs={filteredSubs}
        filteredInners={filteredInners}
        categorySuggesting={categorySuggesting}
        onDetectCategory={onDetectCategory}
        onGenerateAi={onGenerateAi}
        aiGenerating={aiGenerating}
        pricingBlock={
          state.category_id ? (
          <div className="grid sm:grid-cols-2 gap-3 pt-2">
            <Field label="HSN Code" required>
              <input
                className={inputCls}
                value={state.hsn_code}
                onChange={(e) => patch({ hsn_code: e.target.value })}
                placeholder="Autofill after category, or type"
              />
            </Field>
            <Field label="GST %" optional error={gstErr}>
              <input
                type="number"
                min="0"
                step="0.01"
                className={inputClsErr(gstErr)}
                value={state.gst}
                onChange={(e) => patch({ gst: e.target.value })}
              />
            </Field>
            <PricePairFields
              state={state}
              patch={patch}
              mrpErr={mrpErr}
              sellErr={sellErr}
            />
            <SizeColorPairFields state={state} patch={patch} fieldErrors={fieldErrors} />
          </div>
          ) : null
        }
      />
    );
  }

  return (
    <div className={state.listingType === "color_size" || state.listingType === "custom" ? "space-y-5" : "bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-5"}>
      {step === "matrix" ? (
        <>
          {state.listingType === "color_size" ? (
            <VariationListingCanvas
              state={state}
              patch={patch}
              fieldError={fieldErrors.matrix}
              onGenerateAi={onGenerateAi}
              aiGenerating={aiGenerating}
              categorySuggesting={categorySuggesting}
            />
          ) : (
            <CustomVariationCanvas
              state={state}
              patch={patch}
              fieldError={fieldErrors.matrix}
              onGenerateAi={onGenerateAi}
              onContinueToAi={onContinueToAi}
              aiGenerating={listingAiGenerating}
              categorySuggesting={categorySuggesting}
            />
          )}
          {fieldErrors.matrix ? (
            <p className="text-xs text-red-600">{fieldErrors.matrix}</p>
          ) : null}
        </>
      ) : null}

    </div>
  );
}
function ReviewPanel({
  reviewSection,
  setReviewSection,
  state,
  patch,
  patchSection,
  fieldErrors = {},
  sizeChartUrl,
  settlement,
  previewUrl,
  shippingRates = [],
}) {
  const ai = (id) => state.aiGeneratedSections?.includes(id);
  const dirty = (id) => !!(state.dirtySections || {})[id];
  const priceErr = livePriceErr(state, fieldErrors);
  const sections = REVIEW_SECTIONS;
  const activeMeta = sections.find((s) => s.id === reviewSection) || sections[0];

  useEffect(() => {
    if (reviewSection === "compliance") setReviewSection("shipping");
  }, [reviewSection, setReviewSection]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)_272px] gap-4 lg:gap-5">
      <AiReviewNav
        sections={sections}
        reviewSection={reviewSection}
        setReviewSection={setReviewSection}
        isAi={ai}
        isDirty={dirty}
      />
      <div className="min-w-0">
        <AiReviewFormCard
          title={activeMeta.label}
          aiGenerated={ai(reviewSection)}
          hideHeader={reviewSection === "size_chart"}
        >
        {reviewSection === "product_info" ? (
          <div className="grid gap-3">
            <Field label="Product Name" required>
              <textarea
                id="ai-review-name"
                className={`${inputCls} min-h-[48px] h-[52px] max-h-[88px] resize-y leading-snug`}
                rows={2}
                value={state.name}
                onChange={(e) => patch({ name: e.target.value })}
              />
            </Field>
            <Field label="Short Description">
              <textarea
                className={`${inputCls} min-h-[176px] h-44 resize-y leading-relaxed`}
                rows={8}
                value={state.shortDescription}
                onChange={(e) => patch({ shortDescription: e.target.value })}
                placeholder="3–5 lines — product-specific summary for shoppers"
              />
            </Field>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Brand">
                <input className={inputCls} value={state.brand} onChange={(e) => patch({ brand: e.target.value })} />
              </Field>
              <Field label="HSN Code" required>
                <input id="ai-review-hsn" className={inputClsErr(fieldErrors.hsn_code)} value={state.hsn_code} onChange={(e) => patch({ hsn_code: e.target.value })} />
              </Field>
              <Field label="GST Percentage" error={priceErr.gst}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={inputClsErr(priceErr.gst)}
                  value={state.gst}
                  onChange={(e) => patch({ gst: e.target.value })}
                />
              </Field>
              <Field label="Country of Origin">
                <input
                  className={inputCls}
                  value={state.countryOfOrigin}
                  onChange={(e) => patch({ countryOfOrigin: e.target.value })}
                />
              </Field>
              {state.gst_mixed ? (
                <p className="sm:col-span-2 text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  Mixed GST ({state.gst_raw || "multi-slab"}): rate follows sale price vs ₹1000 slab (textile 5%/12%, footwear 12%/18%). Current applied: {state.gst}%.
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {reviewSection === "key_features" ? (
          <ListEditor
            label="Key Features"
            values={state.keyFeatures}
            onChange={(keyFeatures) => patch({ keyFeatures })}
          />
        ) : null}

        {reviewSection === "description" ? (
          <Field label="Product Description">
            <textarea
              id="ai-review-description"
              className={`${inputCls} min-h-[320px] h-80 resize-y leading-relaxed`}
              rows={14}
              value={state.productDetails?.replace(/<[^>]+>/g, "") || ""}
              onChange={(e) =>
                patch({
                  productDetails: `<p>${e.target.value}</p>`,
                  generalInfo: `<p>${e.target.value}</p>`,
                })
              }
              onInput={(e) => {
                e.currentTarget.style.height = "auto";
                e.currentTarget.style.height = `${Math.max(320, e.currentTarget.scrollHeight)}px`;
              }}
            />
          </Field>
        ) : null}

        {reviewSection === "specifications" ? (
          <div className="space-y-3">
            <SpecEditor
              specs={state.specifications}
              onChange={(specifications) =>
                patchSection
                  ? patchSection("specifications", { specifications })
                  : patch({ specifications })
              }
            />
            <SpecTemplateHints
              categoryId={state.category_id}
              subCategoryId={state.sub_category_id}
              innerSubCategoryId={state.inner_sub_category_id}
              specs={state.specifications}
              onApply={(specifications) =>
                patchSection
                  ? patchSection("specifications", { specifications })
                  : patch({ specifications })
              }
            />
            <RequestSpecField
              categoryId={state.category_id}
              subCategoryId={state.sub_category_id}
              innerSubCategoryId={state.inner_sub_category_id}
            />
          </div>
        ) : null}

        {reviewSection === "whats_in_box" ? (
          <BoxEditor
            items={state.whatsInTheBox}
            onChange={(whatsInTheBox) => patch({ whatsInTheBox })}
          />
        ) : null}

        {reviewSection === "benefits" ? (
          <ListEditor
            label="Benefits"
            values={state.benefits}
            onChange={(benefits) => patch({ benefits })}
          />
        ) : null}

        {reviewSection === "pricing" ? (
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <PricePairFields
              state={state}
              patch={patch}
              mrpErr={priceErr.original_price}
              sellErr={priceErr.discounted_price}
              mrpLabel="MRP"
              sellLabel="Selling Price"
              mrpId="ai-review-mrp"
              sellId="ai-review-sale"
              readOnly
            />
            {state.listingType === "color_size" || state.listingType === "custom" ? (
              <p className="w-full col-span-full text-xs text-slate-500 bg-[#FFF5F0] border border-[#FDE4D8] rounded-lg px-3 py-2">
                {state.listingType === "custom"
                  ? "Custom attributes, MRP, selling price and stock for each SKU were set on Configure Custom Variations."
                  : "Color, size, MRP, selling price and stock for each SKU were set on Configure Variation."}
              </p>
            ) : (
              <SizeColorPairFields state={state} patch={patch} fieldErrors={fieldErrors} readOnly />
            )}
            <Field label="SKU">
              <input className={inputCls} value={state.sku} onChange={(e) => patch({ sku: e.target.value })} />
            </Field>
            <Field label="Stock" required error={priceErr.stock}>
              <input
                id="ai-review-stock"
                type="number"
                min="1"
                step="1"
                className={inputClsErr(priceErr.stock)}
                value={state.stock}
                onChange={(e) => patch({ stock: e.target.value })}
              />
            </Field>
            <Field label="Low Stock Alert" error={priceErr.low_stock_threshold}>
              <input
                type="number"
                min="0"
                step="1"
                className={inputClsErr(priceErr.low_stock_threshold)}
                value={state.low_stock_threshold}
                onChange={(e) => patch({ low_stock_threshold: e.target.value })}
              />
            </Field>
            <Field label="Min Order Qty" error={priceErr.min_order_qty}>
              <input
                id="ai-review-min-qty"
                type="number"
                min="1"
                step="1"
                className={inputClsErr(priceErr.min_order_qty)}
                value={state.min_order_qty}
                onChange={(e) => patch({ min_order_qty: e.target.value })}
              />
            </Field>
            <Field label="Condition">
              <select
                className={inputCls}
                value={state.product_condition}
                onChange={(e) => patch({ product_condition: e.target.value })}
              >
                <option>New</option>
                <option>Refurbished</option>
              </select>
            </Field>
            <Field label="Warranty Type">
              <input
                className={inputCls}
                value={state.warrantyType}
                onChange={(e) => patch({ warrantyType: e.target.value })}
              />
            </Field>
            <Field label="Warranty Period">
              <input
                className={inputCls}
                value={state.warrantyPeriod}
                onChange={(e) => patch({ warrantyPeriod: e.target.value })}
              />
            </Field>
          </div>
        ) : null}

        {reviewSection === "size_chart" ? (
          <SizeChartPanel
            sizeChart={state.sizeChart}
            sizeChartUrl={sizeChartUrl}
            aiSuggested={ai("size_chart")}
            categoryHint={[state.innerSubCategoryTitle, state.subCategoryTitle, state.categoryTitle, state.name].filter(Boolean).join(" ")}
            sizeLabels={sizeLabelsFromState(state)}
            onChange={(sizeChart) =>
              patchSection
                ? patchSection("size_chart", { sizeChart })
                : patch({ sizeChart })
            }
          />
        ) : null}

        {reviewSection === "seo" ? (
          <div className="grid gap-3">
            <Field label="Meta Title">
              <input className={inputCls} value={state.metaTitle} onChange={(e) => patch({ metaTitle: e.target.value })} />
            </Field>
            <Field label="Meta Description">
              <textarea
                className={inputCls}
                rows={3}
                value={state.metaDescription}
                onChange={(e) => patch({ metaDescription: e.target.value })}
              />
            </Field>
            <Field label="Meta Keywords">
              <input
                className={inputCls}
                value={state.metaKeywords}
                onChange={(e) => patch({ metaKeywords: e.target.value })}
              />
            </Field>
            {(() => {
              const hits = findRestrictedHits(
                [state.metaTitle, state.metaDescription, state.metaKeywords, state.name, state.productDetails].join(" "),
              );
              if (!hits.length) return null;
              return (
                <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  Soft warning — avoid restricted claims: {hits.join(", ")}. AI draft already scrubs these; please revise before publish.
                </p>
              );
            })()}
          </div>
        ) : null}

        {reviewSection === "shipping" ? (
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Weight (g)" required error={fieldErrors.package_weight}>
              <input
                id="ai-review-package_weight"
                type="number"
                className={inputClsErr(fieldErrors.package_weight)}
                value={state.package_weight}
                onChange={(e) => patch({ package_weight: e.target.value })}
              />
            </Field>
            <Field
              label="Volumetric (kg)"
              optional={false}
              hint="Auto-calculated from L × W × H ÷ 5000. Not editable."
            >
              <input
                className={`${inputCls} bg-gray-100 text-gray-600 cursor-not-allowed`}
                value={state.volumetric_weight}
                readOnly
                disabled
                tabIndex={-1}
              />
            </Field>
            {["package_length", "package_width", "package_height"].map((k) => (
              <Field
                key={k}
                label={k.replace("package_", "").toUpperCase() + " (cm)"}
                required
                optional={false}
                error={fieldErrors[k]}
              >
                <input
                  id={`ai-review-${k}`}
                  type="number"
                  min="0.01"
                  step="0.01"
                  className={inputClsErr(fieldErrors[k])}
                  value={state[k]}
                  onChange={(e) => patch({ [k]: e.target.value })}
                />
              </Field>
            ))}
            <Field
              label="Shipping charges (₹)"
              optional={false}
              hint={
                shippingRates.length
                  ? "From Admin → Settings → Fulfillment (weight slabs in grams). Chargeable weight is max(dead weight g, volumetric kg × 1000)."
                  : "No rows in Admin → Settings → Fulfillment yet. Add weight slabs there (max weight g + charge ₹)."
              }
            >
              <input
                className={`${inputCls} bg-gray-100 text-gray-600 cursor-not-allowed`}
                value={state.shipping_charges ?? 0}
                readOnly
                disabled
                tabIndex={-1}
              />
            </Field>
            <Field label="Ships From">
              <input className={inputCls} value={state.shipsFrom} onChange={(e) => patch({ shipsFrom: e.target.value })} />
            </Field>
            <p className="sm:col-span-2 text-xs text-gray-600 bg-[#FFF5F0] border border-[#FDE4D8] rounded-lg px-3 py-2">
              Ships to Pan India, delivery time, return window ({state.return_window_days ?? 7} days for returnable categories), COD, shipping charges, and replacement rules are applied automatically from admin settings and your category.
            </p>
          </div>
        ) : null}
        </AiReviewFormCard>
      </div>
      <aside className="w-full space-y-3 lg:sticky lg:top-[148px] lg:self-start">
        <StorefrontPreviewCard state={state} previewUrl={previewUrl} settlement={settlement} />
        <BankSettlementSummary state={state} settlement={settlement} />
      </aside>
    </div>
  );
}

function ListEditor({ label, values, onChange }) {
  const list = values?.length ? values : [""];
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      {list.map((v, i) => (
        <div key={i} className="flex gap-2">
          <input
            className={inputCls}
            value={v}
            onChange={(e) => {
              const next = [...list];
              next[i] = e.target.value;
              onChange(next.filter((x, idx) => x || idx === next.length - 1));
            }}
          />
          <button
            type="button"
            className="px-2 text-gray-400"
            onClick={() => onChange(list.filter((_, idx) => idx !== i))}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        className="text-sm font-semibold"
        style={{ color: "#F56C43" }}
        onClick={() => onChange([...list, ""])}
      >
        + Add
      </button>
    </div>
  );
}

function SpecEditor({ specs, onChange }) {
  const list = specs?.length ? specs : [{ feature: "", specification: "" }];
  return (
    <div className="space-y-2">
      {list.map((row, i) => (
        <div key={i} className="grid grid-cols-2 gap-2">
          <input
            className={inputCls}
            placeholder="Feature"
            value={row.feature || ""}
            onChange={(e) => {
              const next = [...list];
              next[i] = { ...next[i], feature: e.target.value };
              onChange(next);
            }}
          />
          <input
            className={inputCls}
            placeholder="Value"
            value={row.specification || ""}
            onChange={(e) => {
              const next = [...list];
              next[i] = { ...next[i], specification: e.target.value };
              onChange(next);
            }}
          />
        </div>
      ))}
      <button
        type="button"
        className="text-sm font-semibold"
        style={{ color: "#F56C43" }}
        onClick={() => onChange([...list, { feature: "", specification: "" }])}
      >
        + Add row
      </button>
    </div>
  );
}

function BoxEditor({ items, onChange }) {
  const list = items?.length ? items : [{ title: "", details: "" }];
  return (
    <div className="space-y-2">
      {list.map((row, i) => (
        <div key={i} className="grid grid-cols-2 gap-2">
          <input
            className={inputCls}
            placeholder="Item"
            value={row.title || ""}
            onChange={(e) => {
              const next = [...list];
              next[i] = { ...next[i], title: e.target.value };
              onChange(next);
            }}
          />
          <input
            className={inputCls}
            placeholder="Details"
            value={row.details || ""}
            onChange={(e) => {
              const next = [...list];
              next[i] = { ...next[i], details: e.target.value };
              onChange(next);
            }}
          />
        </div>
      ))}
      <button
        type="button"
        className="text-sm font-semibold"
        style={{ color: "#F56C43" }}
        onClick={() => onChange([...list, { title: "", details: "" }])}
      >
        + Add item
      </button>
    </div>
  );
}
