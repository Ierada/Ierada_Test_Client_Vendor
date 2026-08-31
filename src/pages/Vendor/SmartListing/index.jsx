import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Link, useParams, useSearchParams } from "react-router-dom";
import { useAppContext } from "../../../context/AppContext";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Package,
  Sparkles,
  Upload,
  X,
  AlertCircle,
} from "lucide-react";
import { getCategories, getSubCategories, getInnerSubCategories } from "../../../services/api.category";
import { addProduct, updateProduct, deleteProduct } from "../../../services/api.product";
import { getBrandAuthStatus, generateListingAiDraft, suggestListingCategory } from "../../../services/api.smartListing";
import { getSettings } from "../../../services/api.settings";
import { getShippingRates } from "../../../services/api.shippingRate";
import { saveProductDraft } from "../../../services/api.productDraft";
import { notifyOnFail, notifyOnSuccess } from "../../../utils/notification/toast";
import { getApiErrorMessage } from "../../../utils/apiError";
import { resolveCategoryGst } from "../../../services/api.categoryGst";
import {
  newStableId,
  loadLocalDraft,
  saveLocalDraft,
  clearLocalDraft,
} from "../../../components/Vendor/SmartListing/utils/draftStorage";
import { taxFromCategoryTree, mergeAiDraft, buildListingAiPayload } from "../../../components/Vendor/SmartListing/utils/aiDraft";
import { gstFromBands } from "../../../components/Vendor/SmartListing/utils/gstBands";
import { BRAND_AUTH_DOC_TYPES, BRAND_AUTH_SLA_BUSINESS_DAYS } from "../../../components/Vendor/SmartListing/utils/brandAuthConfig";
import innerHsnGstLookup from "../../../components/Vendor/SmartListing/utils/innerHsnGstLookup.json";
import { calcSettlement, suggestSku } from "../../../components/Vendor/SmartListing/utils/settlementCalc";
import { fileToBase64 } from "../../../components/Vendor/SmartListing/utils/fileToBase64";
import { buildSmartListingFormData, applyAutoListingPolicies } from "../../../components/Vendor/SmartListing/utils/buildFormData";
import { hydrateSmartListingFromProduct } from "../../../components/Vendor/SmartListing/utils/hydrateFromProduct";
import {
  stashListingMedia,
  stripFilesForDraft,
  mergeCachedMedia,
} from "../../../components/Vendor/SmartListing/utils/listingMediaCache";
import SearchablePicker from "../../../components/Vendor/SmartListing/SearchablePicker";
import ColorSizeMatrix from "../../../components/Vendor/SmartListing/ColorSizeMatrix";
import CustomVariationMatrix from "../../../components/Vendor/SmartListing/CustomVariationMatrix";
import ComboBuilder from "../../../components/Vendor/SmartListing/ComboBuilder";
import ComplianceFields from "../../../components/Vendor/SmartListing/ComplianceFields";
import LabeledPhotoBoxes from "../../../components/Vendor/SmartListing/LabeledPhotoBoxes";
import ListingErrorBoundary from "../../../components/Vendor/SmartListing/ListingErrorBoundary";
import RequestSpecField from "../../../components/Vendor/SmartListing/RequestSpecField";
import SpecTemplateHints from "../../../components/Vendor/SmartListing/SpecTemplateHints";
import SizeChartGuide from "../../../components/Vendor/SmartListing/SizeChartGuide";
import { findRestrictedHits } from "../../../components/Vendor/SmartListing/utils/restrictedClaims";

function basicsStepsFor(listingType) {
  const base = ["brand", "type", "images", "category"];
  if (listingType === "color_size" || listingType === "custom") return [...base, "matrix"];
  if (listingType === "combo") return [...base, "combo"];
  return base;
}

const STEP_LABELS = {
  brand: "Brand",
  type: "Listing Type",
  category: "Category",
  images: "Images",
  matrix: "Variations",
  combo: "Combo",
  review: "AI Review",
};

const REVIEW_SECTIONS = [
  { id: "pricing", label: "Pricing & Inventory" },
  { id: "shipping", label: "Shipping Details" },
  { id: "compliance", label: "India Compliance" },
  { id: "product_info", label: "Product Information" },
  { id: "key_features", label: "Key Features" },
  { id: "description", label: "Product Description" },
  { id: "specifications", label: "Specifications" },
  { id: "whats_in_box", label: "What's in the Box" },
  { id: "benefits", label: "Benefits" },
  { id: "seo", label: "SEO Information" },
  { id: "size_chart", label: "Size Chart" },
];

const LISTING_TYPES = [
  { id: "single", title: "Single Listing", desc: "One price, one SKU" },
  { id: "combo", title: "Combo Listing", desc: "Bundle existing products" },
  { id: "color_size", title: "Color & Size Variation", desc: "Color × size matrix" },
  { id: "custom", title: "Custom Variation", desc: "Up to 4 custom attributes" },
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
  mediaLabels: [],
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
  customAttrs: [],
  customRows: [],
  comboItems: [],
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
});

function Field({ label, required, optional, children, error }) {
  const showOptional = optional ?? !required;
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-gray-700">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
        {showOptional && !required ? (
          <span className="text-gray-400 font-normal text-xs ml-1.5">optional</span>
        ) : null}
      </span>
      {children}
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500";

export default function SmartListing({ mode = "vendor", vendorId: vendorIdProp = null }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const freshStart = searchParams.get("fresh") === "1";
  const { user } = useAppContext();
  const { id: editProductId } = useParams();
  const isEditMode = !!editProductId;
  const vendorId = vendorIdProp || user?.id || null;
  const [phase, setPhase] = useState("basics"); // basics | review
  const [step, setStep] = useState("brand");
  const [reviewSection, setReviewSection] = useState("pricing");
  const [state, setState] = useState(emptyState);
  const [stableId] = useState(() => {
    if (freshStart) return newStableId(mode);
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
  const [aiGenerating, setAiGenerating] = useState(false);
  const [categorySuggesting, setCategorySuggesting] = useState(false);
  const categorySuggestToken = useRef(0);
  const [saveHint, setSaveHint] = useState("Ready");
  const [banner, setBanner] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const autosaveTimer = useRef(null);

  const patch = useCallback((partial) => {
    setState((prev) => {
      const next = { ...prev, ...partial };
      stashListingMedia(stableId, next);
      return next;
    });
  }, [stableId]);

  const patchSection = useCallback((section, partial) => {
    setState((prev) => ({
      ...prev,
      ...partial,
      dirtySections: { ...(prev.dirtySections || {}), [section]: true },
    }));
  }, []);

  const steps = useMemo(
    () => basicsStepsFor(state.listingType),
    [state.listingType],
  );

  // Load product for Smart edit
  useEffect(() => {
    if (!editProductId) return;
    let cancelled = false;
    (async () => {
      try {
        const hydrated = await hydrateSmartListingFromProduct(editProductId);
        if (cancelled) return;
        setState((prev) => ({ ...prev, ...hydrated }));
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
        const next = mergeCachedMedia(stableId, { ...prev, ...local.payload }, prev);
        stashListingMedia(stableId, next);
        return next;
      });
      if (local.phase) setPhase(local.phase);
      if (local.step) setStep(local.step);
      if (local.reviewSection) setReviewSection(local.reviewSection);
      setSaveHint("Restored local draft");
    }
  }, [stableId, editProductId, freshStart]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [catRes, subRes, innerRes, settingsRes, ratesRes] =
          await Promise.all([
            getCategories(),
            getSubCategories(),
            getInnerSubCategories(),
            getSettings(),
            getShippingRates(),
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
          patch({
            platform_fee_pct: settingsRes.data.platform_fee || 0,
            platform_fee_max: settingsRes.data.platform_fee_max_charge || 0,
            default_return_window_days:
              settingsRes.data.default_return_window_days ?? 7,
            platformFee: 0,
          });
        }
        if (ratesRes?.status === 1) {
          setShippingRates(
            (ratesRes.data || [])
              .map((r) => ({ maxWeight: r.maxWeight, charge: r.charge }))
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

  // Volumetric + shipping charge
  useEffect(() => {
    const L = Number(state.package_length) || 0;
    const W = Number(state.package_width) || 0;
    const H = Number(state.package_height) || 0;
    const vol = L && W && H ? (L * W * H) / 5000 : 0;
    const weight = Math.max(Number(state.package_weight) || 0, vol);
    let charge = 0;
    if (!state.free_shipping && shippingRates.length) {
      const match = shippingRates.find((r) => weight <= r.maxWeight);
      charge = match
        ? match.charge
        : shippingRates[shippingRates.length - 1]?.charge || 0;
    }
    const sale = Number(state.discounted_price) || 0;
    const pct = Number(state.platform_fee_pct) || 0;
    const maxCap = Number(state.platform_fee_max) || 0;
    let fee = Math.round(((sale * pct) / 100) * 100) / 100;
    if (maxCap > 0) fee = Math.min(fee, maxCap);
    patch({
      volumetric_weight: Math.round(vol * 1000) / 1000,
      shipping_charges: charge,
      platformFee: fee,
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
      f instanceof File ? URL.createObjectURL(f) : null,
    );
  }, [state.files]);

  useEffect(() => {
    return () => {
      previewUrls.forEach((u) => {
        try {
          if (u) URL.revokeObjectURL(u);
        } catch {
          /* ignore */
        }
      });
    };
  }, [previewUrls]);

  const settlement = useMemo(
    () =>
      calcSettlement({
        mrp: state.original_price,
        sellingPrice: state.discounted_price,
        gstPercent: state.gst,
        shippingCharges: state.shipping_charges,
        platformFee: state.platformFee,
        freeShipping: state.free_shipping,
      }),
    [state],
  );

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

  const runCategorySuggest = useCallback(async () => {
    const file = state.files?.[0];
    if (!file || !state.listingType) return;
    const token = ++categorySuggestToken.current;
    setCategorySuggesting(true);
    try {
      const image_base64 = await fileToBase64(file);
      const res = await suggestListingCategory({
        image_base64,
        mime_type: file.type || "image/jpeg",
        listing_type: state.listingType,
      });
      if (token !== categorySuggestToken.current) return;
      if (res?.status === 1 && res?.data) {
        const d = res.data;
        patch({
          category_id: String(d.category_id),
          sub_category_id: String(d.sub_category_id),
          inner_sub_category_id: d.inner_sub_category_id
            ? String(d.inner_sub_category_id)
            : "",
          categoryTitle: d.categoryTitle || "",
          subCategoryTitle: d.subCategoryTitle || "",
          innerSubCategoryTitle: d.innerSubCategoryTitle || "",
        });
        setBanner({
          type: "info",
          text: "Category auto-selected from your photo — change below if needed.",
        });
      }
    } catch {
      /* pick manually */
    } finally {
      if (token === categorySuggestToken.current) setCategorySuggesting(false);
    }
  }, [state.files, state.listingType, patch]);

  useEffect(() => {
    categorySuggestToken.current += 1;
  }, [state.files?.[0]?.name, state.files?.[0]?.lastModified]);

  useEffect(() => {
    if (step === "category" && state.files?.length && !state.category_id) {
      runCategorySuggest();
    }
  }, [step, state.files?.length, state.category_id, runCategorySuggest]);

  const validateBasicsStep = () => {
    const err = {};
    if (step === "brand" && !state.brandType) err.brandType = "Select brand type";
    if (step === "brand" && state.brandType === "branded" && !state.brandAuthDocName && !state.brandAuthFile) {
      err.brandAuth = "Upload brand authorization document";
    }
    if (step === "type" && !state.listingType) err.listingType = "Select listing type";
    if (step === "category") {
      if (!state.category_id) err.category_id = "Required";
      if (!state.sub_category_id) err.sub_category_id = "Required";
    }
    if (step === "images") {
      const needsParentImages =
        state.listingType === "single" || state.listingType === "combo";
      if (needsParentImages && (!state.files || state.files.length === 0)) {
        err.files = "Add at least one product image";
      }
    }
    if (step === "matrix" && state.listingType === "color_size") {
      const ok = (state.colorGroups || []).some(
        (g) =>
          g.color_id &&
          (g.sizes || []).some((s) => s.size_id) &&
          (g.media || []).length,
      );
      if (!ok) err.matrix = "Add color, size rows, and at least one image per color";
    }
    if (step === "matrix" && state.listingType === "custom") {
      const ok = (state.customRows || []).some(
        (r) => r.enabled && r.attributes?.length,
      );
      if (!ok) err.matrix = "Generate custom matrix and keep at least one row enabled";
    }
    if (step === "combo") {
      if (!(state.comboItems || []).length) err.combo = "Add at least one combo component";
    }
    setFieldErrors(err);
    return Object.keys(err).length === 0;
  };

  const goNextBasics = () => {
    if (!validateBasicsStep()) return;
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
      const last = steps[steps.length - 1] || "category";
      setStep(last);
      return;
    }
    const idx = steps.indexOf(step);
    if (idx > 0) setStep(steps[idx - 1]);
    else navigate("/product");
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
    try {
      let draft = null;
      let source = "local";
      try {
        const res = await generateListingAiDraft(buildListingAiPayload(state, user));
        if (runId !== runAiGenerate._seq) return;
        if (res?.status === 1 && res?.data?.draft) {
          draft = res.data.draft;
          source = res.data.source || "openai";
        }
      } catch (apiErr) {
        if (runId !== runAiGenerate._seq) return;
        console.warn("Listing AI API failed, using local fallback:", apiErr);
      }

      if (runId !== runAiGenerate._seq) return;

      const merged = mergeAiDraft(state, {
        forceOverwrite: confirmedOverwrite,
        draft,
        vendorContext: user || {},
      });
      if (!merged.sku) merged.sku = suggestSku(merged.name, merged.brand);
      setState(merged);
      setPhase("review");
      setReviewSection("pricing");
      notifyOnSuccess(
        source === "openai"
          ? confirmedOverwrite
            ? "AI regenerated all sections (high quality)"
            : "AI draft ready — edited sections were kept"
          : "Basic draft ready (AI unavailable — review carefully)",
      );
    } catch (e) {
      if (runId !== runAiGenerate._seq) return;
      setBanner({
        type: "error",
        text: "Could not auto-generate content. You can fill sections manually.",
      });
      setPhase("review");
      setReviewSection("pricing");
    } finally {
      if (runId === runAiGenerate._seq) setAiGenerating(false);
    }
  };

  const discardDraft = async () => {
    const savedId = editProductId || state.productId;
    const msg = savedId
      ? "Discard this draft? It will be permanently deleted."
      : "Discard this listing progress? Your local draft will be cleared.";
    if (!window.confirm(msg)) return;
    try {
      if (savedId) {
        const res = await deleteProduct(savedId);
        if (res?.status !== 1) {
          notifyOnFail(res?.message || "Could not discard draft");
          return;
        }
      }
      clearLocalDraft(stableId);
      notifyOnSuccess(savedId ? "Draft discarded" : "Listing progress cleared");
      navigate("/product?tab=draft");
    } catch (e) {
      notifyOnFail(getApiErrorMessage(e, "Could not discard draft"));
    }
  };

  const submitListing = async ({ asDraft }) => {
    if (!asDraft) {
      if (!state.name?.trim() || !state.hsn_code || !state.discounted_price) {
        setReviewSection("product_info");
        setBanner({
          type: "error",
          text: "Name, HSN and selling price are required.",
        });
        return;
      }
      if (state.listingType === "single" && !state.files?.length) {
        setBanner({ type: "error", text: "Add at least one image before submit." });
        return;
      }
      if (state.listingType === "color_size") {
        const ok = (state.colorGroups || []).some(
          (g) => g.color_id && (g.sizes || []).some((s) => s.size_id),
        );
        if (!ok) {
          setBanner({ type: "error", text: "Complete Color × Size matrix before submit." });
          return;
        }
      }
      if (state.listingType === "custom") {
        const ok = (state.customRows || []).some((r) => r.enabled);
        if (!ok) {
          setBanner({ type: "error", text: "Enable at least one custom variation row." });
          return;
        }
      }
      if (state.listingType === "combo" && !(state.comboItems || []).length) {
        setBanner({ type: "error", text: "Add combo components before submit." });
        return;
      }
      if (state.listingType === "combo" && !state.files?.length) {
        setBanner({ type: "error", text: "Add at least one cover image for the combo listing." });
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
        text: "Branded listings need Admin-approved brand authorization before publish. Save as draft, then publish after approval.",
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
          [state.brand, state.innerSubCategoryTitle || state.subCategoryTitle || state.categoryTitle]
            .filter(Boolean)
            .join(" ") ||
          "Untitled draft",
      };

      const { formData } = buildSmartListingFormData(draftState, { asDraft });
      const pid = state.productId || editProductId;
      const res = pid
        ? await updateProduct(pid, formData)
        : await addProduct(formData);
      if (res?.status === 1) {
        clearLocalDraft(stableId);
        notifyOnSuccess(
          asDraft
            ? "Draft saved — find it under Products → Draft. You can add a new listing anytime."
            : "Product listed successfully",
        );
        navigate(asDraft ? "/product?tab=draft" : "/product");
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
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
        <div>
          <Link to="/product" className="text-sm text-blue-600">
            Back to products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ListingErrorBoundary>
    <div className="min-h-screen bg-slate-50 pb-28">
      <div className="border-b bg-white px-4 py-3 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-blue-600 font-semibold">
              Smart Product Listing
            </p>
            <h1 className="text-lg font-semibold text-gray-900">
              {isEditMode ? "Edit listing" : phase === "basics" ? "Provide Basics" : "Review & Edit AI Generated Information"}
            </h1>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            <span>{saveHint}</span>
            <Link
              to={
                isEditMode
                  ? `/product/edit-classic/${editProductId}`
                  : "/product/add-classic"
              }
              className="text-blue-600 hover:underline"
            >
              Classic form
            </Link>
          </div>
        </div>
        {!isEditMode ? (
          <ListingStepper phase={phase} step={step} steps={steps} />
        ) : null}
      </div>

      {banner ? (
        <div
          className={`max-w-7xl mx-auto mt-4 px-4 ${
            banner.type === "error" ? "text-red-700 bg-red-50" : "text-amber-800 bg-amber-50"
          } border rounded-xl py-3 px-4 text-sm flex gap-2`}
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{banner.text}</span>
          <button type="button" className="ml-auto" onClick={() => setBanner(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : null}

      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          {phase === "basics" ? (
            <BasicsPanel
              step={step}
              state={state}
              patch={patch}
              fieldErrors={fieldErrors}
              categorySuggesting={categorySuggesting}
              onSuggestCategory={runCategorySuggest}
              categories={categories}
              filteredSubs={filteredSubs}
              filteredInners={filteredInners}
              vendorId={vendorId}
              onBrandTypeSelected={(t) => {
                if (t === "generic") setStep("type");
              }}
            />
          ) : (
            <ReviewPanel
              reviewSection={reviewSection}
              setReviewSection={setReviewSection}
              state={state}
              patch={patch}
              patchSection={patchSection}
              runAiGenerate={runAiGenerate}
              aiGenerating={aiGenerating}
              hideSeo
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

        <aside className="lg:col-span-4 space-y-3 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
          <RightRail state={state} settlement={settlement} previewUrl={previewUrls[0]} />
        </aside>
      </div>

      <footer className="fixed bottom-0 inset-x-0 bg-white border-t z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {(isEditMode ||
              state.productId ||
              phase === "review" ||
              state.files?.length ||
              state.category_id) && (
              <button
                type="button"
                disabled={submitting}
                onClick={discardDraft}
                className="px-4 py-2 rounded-xl border border-red-200 text-red-700 text-sm font-medium disabled:opacity-50"
              >
                Discard draft
              </button>
            )}
            <button
              type="button"
              disabled={submitting}
              onClick={() => submitListing({ asDraft: true })}
              className="px-4 py-2 rounded-xl border text-sm font-medium disabled:opacity-50"
            >
              Save as Draft
            </button>
            {phase === "basics" ? (
              <button
                type="button"
                disabled={aiGenerating}
                onClick={goNextBasics}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold disabled:opacity-50"
              >
                {aiGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Writing listing…
                  </>
                ) : step === steps[steps.length - 1] ? (
                  <>
                    <Sparkles className="w-4 h-4" /> Next: AI Auto Generate
                  </>
                ) : (
                  <>
                    Next <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={() => submitListing({ asDraft: false })}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {isEditMode ? "Update Listing" : "Submit Listing"}
              </button>
            )}
          </div>
        </div>
      </footer>
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
  onSuggestCategory,
  categories,
  filteredSubs,
  filteredInners,
  vendorId,
  onBrandTypeSelected,
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-5">
      {step === "brand" ? (
        <>
          <h2 className="font-semibold text-gray-900">Brand Type</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {["branded", "generic"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  patch({ brandType: t });
                  onBrandTypeSelected?.(t);
                }}
                className={`text-left rounded-xl border p-4 ${
                  state.brandType === t ? "border-blue-500 bg-blue-50" : "border-gray-200"
                }`}
              >
                <div className="font-medium capitalize">{t} Product</div>
                <p className="text-xs text-gray-500 mt-1">
                  {t === "branded"
                    ? "Requires brand authorization document"
                    : "No brand certificate required"}
                </p>
              </button>
            ))}
          </div>
          {fieldErrors.brandType ? (
            <p className="text-xs text-red-600">{fieldErrors.brandType}</p>
          ) : null}
          {state.brandType === "generic" ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-1">
              <p className="text-sm font-medium text-emerald-900">
                Generic product — no brand certificate needed
              </p>
              <p className="text-xs text-emerald-800">
                Click Next to choose listing type (Single, Combo, Color & Size, or Custom).
              </p>
            </div>
          ) : null}
          {state.brandType === "branded" ? (
            <div className="space-y-2 border rounded-xl p-4 bg-slate-50">
              <p className="text-sm font-medium">Brand Authorization</p>
              <p className="text-xs text-gray-500">
                Upload one allowed proof. Publish is blocked until Admin approves
                (SLA: {BRAND_AUTH_SLA_BUSINESS_DAYS} business days). Save as draft meanwhile.
              </p>
              <label className="block text-xs font-medium text-gray-700">
                Document type
                <select
                  className={inputCls + " mt-1"}
                  value={state.brandAuthDocType || "authorization_letter"}
                  onChange={(e) => patch({ brandAuthDocType: e.target.value })}
                >
                  {BRAND_AUTH_DOC_TYPES.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </label>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (f.size > 5 * 1024 * 1024) {
                    notifyOnFail("Max 5MB");
                    return;
                  }
                  patch({ brandAuthFile: f, brandAuthDocName: f.name });
                }}
              />
              {state.brandAuthDocName ? (
                <p className="text-xs text-emerald-700">Uploaded: {state.brandAuthDocName}</p>
              ) : null}
              {state.brandAuthStatus ? (
                <p className={`text-xs ${state.brandAuthApproved ? "text-emerald-700" : "text-amber-700"}`}>
                  Auth status: {state.brandAuthStatus}
                  {state.brandAuthApproved ? " — publish allowed" : " — save as draft until approved"}
                </p>
              ) : null}
              {fieldErrors.brandAuth ? (
                <p className="text-xs text-red-600">{fieldErrors.brandAuth}</p>
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}

      {step === "type" ? (
        <>
          <h2 className="font-semibold text-gray-900">Listing Type</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {LISTING_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => patch({ listingType: t.id })}
                className={`text-left rounded-xl border p-4 ${
                  state.listingType === t.id ? "border-blue-500 bg-blue-50" : "border-gray-200"
                }`}
              >
                <div className="font-medium">{t.title}</div>
                <p className="text-xs text-gray-500 mt-1">{t.desc}</p>
              </button>
            ))}
          </div>
          {fieldErrors.listingType ? (
            <p className="text-xs text-red-600">{fieldErrors.listingType}</p>
          ) : null}
        </>
      ) : null}

      {step === "matrix" ? (
        <>
          {state.listingType === "color_size" ? (
            <ColorSizeMatrix state={state} patch={patch} />
          ) : (
            <CustomVariationMatrix state={state} patch={patch} />
          )}
          {fieldErrors.matrix ? (
            <p className="text-xs text-red-600">{fieldErrors.matrix}</p>
          ) : null}
        </>
      ) : null}

      {step === "combo" ? (
        <>
          <ComboBuilder state={state} patch={patch} vendorId={vendorId} />
          {fieldErrors.combo ? (
            <p className="text-xs text-red-600">{fieldErrors.combo}</p>
          ) : null}
        </>
      ) : null}

      {step === "images" ? (
        <>
          <h2 className="font-semibold text-gray-900">Upload Product Images</h2>
          <p className="text-xs text-gray-500">
            {state.listingType === "color_size" || state.listingType === "custom"
              ? "Add cover photos first — category will be suggested from your image on the next step."
              : "Upload front photo first — we will suggest category on the next step."}
          </p>
          <LabeledPhotoBoxes state={state} patch={patch} fieldError={fieldErrors.files} />
        </>
      ) : null}

      {step === "category" ? (
        <>
          <h2 className="font-semibold text-gray-900">Category & pricing</h2>
          {categorySuggesting ? (
            <p className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 inline-flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Detecting category from your photo…
            </p>
          ) : state.category_id ? (
            <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
              Category pre-filled from your image — adjust if incorrect.
              {onSuggestCategory ? (
                <button
                  type="button"
                  className="ml-2 underline text-emerald-800"
                  onClick={onSuggestCategory}
                >
                  Re-detect
                </button>
              ) : null}
            </p>
          ) : (
            <p className="text-xs text-gray-500">
              Select category manually or{" "}
              {onSuggestCategory ? (
                <button type="button" className="text-blue-600 underline" onClick={onSuggestCategory}>
                  detect from photo
                </button>
              ) : (
                "upload a clearer front photo on the previous step"
              )}
              .
            </p>
          )}
          <div className="grid gap-3">
            <Field label="Category" required error={fieldErrors.category_id}>
              <SearchablePicker
                value={state.category_id}
                onChange={(id) =>
                  patch({
                    category_id: id,
                    sub_category_id: "",
                    inner_sub_category_id: "",
                  })
                }
                placeholder="Search category"
                searchPlaceholder="Search category…"
                options={categories.map((c) => ({ id: c.id, label: c.name }))}
                error={fieldErrors.category_id}
              />
            </Field>
            <Field label="Sub Category" required error={fieldErrors.sub_category_id}>
              <SearchablePicker
                value={state.sub_category_id}
                onChange={(id) =>
                  patch({
                    sub_category_id: id,
                    inner_sub_category_id: "",
                  })
                }
                placeholder="Search subcategory"
                searchPlaceholder="Search subcategory…"
                options={filteredSubs.map((c) => ({ id: c.id, label: c.name }))}
                error={fieldErrors.sub_category_id}
              />
            </Field>
            <Field label="Inner Sub Category" optional>
              <SearchablePicker
                value={state.inner_sub_category_id}
                onChange={(id) => patch({ inner_sub_category_id: id })}
                placeholder="Search inner subcategory"
                searchPlaceholder="Search inner subcategory…"
                options={filteredInners.map((c) => ({ id: c.id, label: c.name }))}
              />
            </Field>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="HSN Code" required>
                <input
                  className={inputCls}
                  value={state.hsn_code}
                  onChange={(e) => patch({ hsn_code: e.target.value })}
                  placeholder="Autofill after category, or type"
                />
              </Field>
              <Field label="GST %" optional>
                <input
                  type="number"
                  className={inputCls}
                  value={state.gst}
                  onChange={(e) => patch({ gst: e.target.value })}
                />
              </Field>
              <Field label="MRP (₹)" required>
                <input
                  type="number"
                  className={inputCls}
                  value={state.original_price}
                  onChange={(e) => patch({ original_price: e.target.value })}
                />
              </Field>
              <Field label="Selling price (₹)" required>
                <input
                  type="number"
                  className={inputCls}
                  value={state.discounted_price}
                  onChange={(e) => patch({ discounted_price: e.target.value })}
                />
              </Field>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function ReviewPanel({ reviewSection, setReviewSection, state, patch, patchSection, runAiGenerate, aiGenerating, sizeChartUrl, hideSeo = false }) {
  const ai = (id) => state.aiGeneratedSections?.includes(id);
  const dirty = (id) => !!(state.dirtySections || {})[id];
  const sections = hideSeo
    ? REVIEW_SECTIONS.filter((s) => s.id !== "seo")
    : REVIEW_SECTIONS;

  useEffect(() => {
    if (hideSeo && reviewSection === "seo") setReviewSection("pricing");
  }, [hideSeo, reviewSection, setReviewSection]);

  return (
    <div className="grid md:grid-cols-12 gap-4">
      <nav className="md:col-span-4 space-y-1">
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setReviewSection(s.id)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between ${
              reviewSection === s.id ? "bg-blue-50 text-blue-800 font-medium" : "hover:bg-gray-50"
            }`}
          >
            {s.label}
            <span className="flex gap-1">
              {dirty(s.id) ? (
                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">Edited</span>
              ) : null}
              {ai(s.id) ? (
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">AI</span>
              ) : null}
            </span>
          </button>
        ))}
        <button
          type="button"
          disabled={aiGenerating}
          onClick={() => runAiGenerate({ confirmDirty: true })}
          className="w-full mt-3 inline-flex items-center justify-center gap-2 text-sm border rounded-xl py-2 disabled:opacity-50"
        >
          {aiGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Generating…
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" /> Regenerate All
            </>
          )}
        </button>
      </nav>
      <div className="md:col-span-8 bg-white rounded-2xl border p-5 space-y-4">
        {ai(reviewSection) ? (
          <span className="inline-flex text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full">
            AI Generated
          </span>
        ) : null}

        {reviewSection === "product_info" ? (
          <div className="grid gap-3">
            <Field label="Product Name" required>
              <input className={inputCls} value={state.name} onChange={(e) => patch({ name: e.target.value })} />
            </Field>
            <Field label="Short Description">
              <textarea
                className={inputCls}
                rows={5}
                value={state.shortDescription}
                onChange={(e) => patch({ shortDescription: e.target.value })}
                placeholder="3–5 lines — product-specific summary for shoppers"
              />
            </Field>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Brand">
                <input className={inputCls} value={state.brand} onChange={(e) => patch({ brand: e.target.value })} />
              </Field>
              <Field label="Country of Origin">
                <input
                  className={inputCls}
                  value={state.countryOfOrigin}
                  onChange={(e) => patch({ countryOfOrigin: e.target.value })}
                />
              </Field>
              <Field label="HSN Code" required>
                <input className={inputCls} value={state.hsn_code} onChange={(e) => patch({ hsn_code: e.target.value })} />
              </Field>
              <Field label="GST %">
                <input
                  type="number"
                  className={inputCls}
                  value={state.gst}
                  onChange={(e) => patch({ gst: e.target.value })}
                />
              </Field>
              <Field label="MRP (₹)" required>
                <input
                  type="number"
                  className={inputCls}
                  value={state.original_price}
                  onChange={(e) => patch({ original_price: e.target.value })}
                />
              </Field>
              <Field label="Selling price (₹)" required>
                <input
                  type="number"
                  className={inputCls}
                  value={state.discounted_price}
                  onChange={(e) => patch({ discounted_price: e.target.value })}
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
              className={inputCls}
              rows={8}
              value={state.productDetails?.replace(/<[^>]+>/g, "") || ""}
              onChange={(e) =>
                patch({
                  productDetails: `<p>${e.target.value}</p>`,
                  generalInfo: `<p>${e.target.value}</p>`,
                })
              }
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
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="MRP" required>
              <input
                type="number"
                className={inputCls}
                value={state.original_price}
                onChange={(e) => patch({ original_price: e.target.value })}
              />
            </Field>
            <Field label="Selling Price" required>
              <input
                type="number"
                className={inputCls}
                value={state.discounted_price}
                onChange={(e) => patch({ discounted_price: e.target.value })}
              />
            </Field>
            <Field label="SKU">
              <input className={inputCls} value={state.sku} onChange={(e) => patch({ sku: e.target.value })} />
            </Field>
            <Field label="Stock" required>
              <input
                type="number"
                className={inputCls}
                value={state.stock}
                onChange={(e) => patch({ stock: e.target.value })}
              />
            </Field>
            <Field label="Low Stock Alert">
              <input
                type="number"
                className={inputCls}
                value={state.low_stock_threshold}
                onChange={(e) => patch({ low_stock_threshold: e.target.value })}
              />
            </Field>
            <Field label="Min Order Qty">
              <input
                type="number"
                className={inputCls}
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

        {reviewSection === "compliance" ? (
          <ComplianceFields state={state} patch={patch} />
        ) : null}

        {reviewSection === "size_chart" ? (
          <SizeChartGuide
            sizeChartUrl={sizeChartUrl}
            categoryHint={[state.innerSubCategoryTitle, state.subCategoryTitle, state.categoryTitle].filter(Boolean).join(" ")}
          />
        ) : null}

        {reviewSection === "seo" && !hideSeo ? (
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
            <Field label="Weight (g)" required>
              <input
                type="number"
                className={inputCls}
                value={state.package_weight}
                onChange={(e) => patch({ package_weight: e.target.value })}
              />
            </Field>
            <Field label="Volumetric (kg)">
              <input className={inputCls} value={state.volumetric_weight} readOnly />
            </Field>
            {["package_length", "package_width", "package_height"].map((k) => (
              <Field key={k} label={k.replace("package_", "").toUpperCase() + " (cm)"}>
                <input
                  type="number"
                  className={inputCls}
                  value={state[k]}
                  onChange={(e) => patch({ [k]: e.target.value })}
                />
              </Field>
            ))}
            <Field label="Ships From">
              <input className={inputCls} value={state.shipsFrom} onChange={(e) => patch({ shipsFrom: e.target.value })} />
            </Field>
            <p className="sm:col-span-2 text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
              Ships to Pan India, delivery time, return window ({state.return_window_days ?? 7} days for returnable categories), COD, shipping charges, and replacement rules are applied automatically from admin settings and your category.
            </p>
          </div>
        ) : null}
      </div>
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
        className="text-sm text-blue-600"
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
        className="text-sm text-blue-600"
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
        className="text-sm text-blue-600"
        onClick={() => onChange([...list, { title: "", details: "" }])}
      >
        + Add item
      </button>
    </div>
  );
}

function ListingStepper({ phase, step, steps }) {
  const flowSteps = [...steps, "review"];
  const activeId = phase === "review" ? "review" : step;
  const activeIdx = Math.max(0, flowSteps.indexOf(activeId));

  return (
    <div className="max-w-7xl mx-auto px-4 pb-3 overflow-x-auto border-t border-slate-100 pt-3">
      <ol className="flex items-center gap-0.5 min-w-max">
        {flowSteps.map((id, idx) => {
          const done = idx < activeIdx;
          const active = idx === activeIdx;
          const label = STEP_LABELS[id] || id;
          return (
            <li key={id} className="flex items-center">
              {idx > 0 ? (
                <span
                  className={`w-5 sm:w-8 h-px shrink-0 ${done ? "bg-blue-400" : "bg-gray-200"}`}
                  aria-hidden
                />
              ) : null}
              <span
                className={`inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full border text-[11px] sm:text-xs whitespace-nowrap ${
                  active
                    ? "bg-blue-600 text-white border-blue-600 font-medium"
                    : done
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-white text-gray-400 border-gray-200"
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    active
                      ? "bg-white/25 text-white"
                      : done
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {done ? "✓" : idx + 1}
                </span>
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function RightRail({ state, settlement, previewUrl }) {
  const off = settlement.discountPct > 0 ? `${settlement.discountPct}% OFF` : null;
  return (
    <>
      <div className="bg-white rounded-2xl border p-3 space-y-2">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Package className="w-4 h-4" /> Preview on IERADA
        </h3>
        <div className="relative h-36 sm:h-40 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={state.name || "Product"}
              className="w-full h-full object-cover"
            />
          ) : (
            <Upload className="w-8 h-8 text-gray-300" />
          )}
          {off ? (
            <span className="absolute top-2 left-2 bg-rose-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded">
              {off}
            </span>
          ) : null}
        </div>
        <p className="text-[11px] text-amber-700">★★★★☆ 4.2 · IERADA preview</p>
        <p className="font-medium text-sm line-clamp-2">{state.name || "Product name"}</p>
        <p className="text-xs text-gray-500 line-clamp-2">{state.shortDescription || "Short description"}</p>
        <p className="text-sm">
          <span className="font-semibold text-emerald-700">
            ₹{settlement.sale || "—"}
          </span>{" "}
          {settlement.mrp > settlement.sale ? (
            <span className="text-gray-400 line-through text-xs">₹{settlement.mrp}</span>
          ) : null}
        </p>
      </div>
      <div className="bg-white rounded-2xl border p-3 space-y-1.5 text-sm">
        <h3 className="font-semibold text-sm">Bank Settlement Summary</h3>
        <Row k="MRP" v={settlement.mrp} />
        <Row k="Sale" v={settlement.sale} />
        <Row k="Discount %" v={`${settlement.discountPct}%`} raw />
        <Row k="GST (est. breakup)" v={settlement.gstAmount} />
        <Row k="TDS (2%)" v={settlement.tds} />
        <Row k="Shipping (seller)" v={settlement.shipping} />
        <Row k="Platform fee" v={settlement.platformFee} />
        <Row k="You Earn" v={settlement.youEarn} strong />
        <p className="text-[11px] text-gray-400 pt-1">
          Rates are provisional until Ops confirms commission/TDS rules.
        </p>
      </div>
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 text-xs text-amber-900 space-y-1">
        <p className="font-semibold">Listing Tips</p>
        <p>Use clear primary photo on white/clean background.</p>
        <p>Confirm HSN/GST after category select.</p>
        <p>Save draft anytime — resume won’t create duplicates.</p>
      </div>
    </>
  );
}

function Row({ k, v, strong, raw }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-gray-500">{k}</span>
      <span className={strong ? "font-semibold text-emerald-700" : ""}>
        {raw ? v : `₹${v ?? 0}`}
      </span>
    </div>
  );
}
