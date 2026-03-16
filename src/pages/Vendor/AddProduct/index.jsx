import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import { Eye, Plus, X, Copy, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { BsQuestionCircle } from "react-icons/bs";
import { CiImageOn, CiVideoOn } from "react-icons/ci";
import { useNavigate, useParams } from "react-router-dom";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import slugify from "slugify";
import ImageGuidelinesModal from "../../../components/Vendor/Models/ImageGuidelinesModal";
import config from "../../../config/config";
import { useAppContext } from "../../../context/AppContext";
import { getAllAttributes } from "../../../services/api.attribute";
import {
  getCategories,
  getInnerSubCategories,
  getSubCategories,
} from "../../../services/api.category";
import { getAllColors } from "../../../services/api.color";
import { getAllFabricsByStatus } from "../../../services/api.fabric";
import {
  addProduct,
  getProductById,
  updateProduct,
} from "../../../services/api.product";
import { getSettings } from "../../../services/api.settings";
import { getAllSizes } from "../../../services/api.size";
import {
  notifyOnFail,
  notifyOnSuccess,
} from "../../../utils/notification/toast";
import {
  generateAutoSKU,
  validateSKUFormat,
  checkDuplicateSKUInVariations,
  validatePriceLogic,
  validateMainProductFields,
  validateVariationsData,
  validateMediaRequirements,
  getDiscountPercentage,
} from "../../../utils/productValidation";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { GripVertical } from "lucide-react";

const SHIPPING_RATES = [
  { maxWeight: 500, charge: 80 },
  { maxWeight: 1000, charge: 160 },
  { maxWeight: 1500, charge: 240 },
  { maxWeight: 2000, charge: 320 },
  { maxWeight: 2500, charge: 400 },
  { maxWeight: 3000, charge: 480 },
  { maxWeight: 3500, charge: 560 },
  { maxWeight: 4000, charge: 640 },
  { maxWeight: 4500, charge: 720 },
  { maxWeight: Infinity, charge: 800 },
];

const GST_SLABS = [0, 5, 12, 18, 28];

// ── Default custom variation row ──────────────────────────────────────────────
const createDefaultCustomVariation = () => ({
  attributes: [{ attribute_id: "", attribute_value: "" }], // up to 4
  stock: "",
  original_price: "",
  discounted_price: "",
  sku: "",
  barcode: "",
  media: [],
});

// ── Default color-size variation ──────────────────────────────────────────────
const createDefaultColorVariation = () => ({
  color_id: "",
  media: [],
  sizes: [
    {
      size_id: "",
      stock: "",
      original_price: "",
      discounted_price: "",
      sku: "",
      barcode: "",
    },
  ],
});

const AddEditProduct = () => {
  const { id } = useParams();
  const { user } = useAppContext();
  const vendorId = user.id;
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [variationMode, setVariationMode] = useState("color_size");
  const [categories, setCategories] = useState([]);
  const [fabrics, setFabrics] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [innerSubCategories, setInnerSubCategories] = useState([]);
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [filteredSubCategories, setFilteredSubCategories] = useState([]);
  const [filteredInnerSubCategories, setFilteredInnerSubCategories] = useState(
    [],
  );
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [selectedCategoryDetails, setSelectedCategoryDetails] = useState(null);
  const [selectedSubCategoryDetails, setSelectedSubCategoryDetails] =
    useState(null);
  const [selectedInnerSubCategoryDetails, setSelectedInnerSubCategoryDetails] =
    useState(null);
  const [deletedMediaIds, setDeletedMediaIds] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    specifications: [],
    general_info: "",
    product_details: "",
    warranty_info: "",
    base_price: 0,
    original_price: "",
    discounted_price: "",
    type: "",
    tags: [],
    sku: "",
    hsn_code: "",
    barcode: "",
    stock: "",
    low_stock_threshold: "",
    platform_fee: 0,
    package_weight: 0,
    volumetric_weight: 0,
    package_length: 0,
    package_width: 0,
    package_height: 0,
    package_depth: 0,
    gst: 0,
    shipping_charges: 0,
    visibility: "Hidden",
    category_id: "",
    sub_category_id: "",
    inner_sub_category_id: "",
    fabric_id: "",
    vendor_id: vendorId,
    meta_title: "",
    meta_description: "",
    slug: "",
    status: true,
    is_variation: false,
    is_featured: false,
    productFiles: [],
    whats_in_the_box: [],
  });
  const [specifications, setSpecifications] = useState([
    { feature: "", specification: "" },
  ]);
  const [whatsInTheBox, setWhatsInTheBox] = useState([
    { title: "", details: "" },
  ]);
  const [variations, setVariations] = useState([createDefaultColorVariation()]);
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    url: "",
    type: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({
    isOpen: false,
    type: "",
    message: "",
  });
  const [expandedVariations, setExpandedVariations] = useState([]);
  const [calculatedShipping, setCalculatedShipping] = useState(0);
  const [settingsShipping, setSettingsShipping] = useState(0);
  const [productDetailsCharCount, setProductDetailsCharCount] = useState(0);
  const [variationErrors, setVariationErrors] = useState({});
  const [mainProductErrors, setMainProductErrors] = useState({});
  const [priceErrors, setPriceErrors] = useState({ main: "", variations: [] });
  const MAX_PRODUCT_DETAILS_CHARS = 3000;

  useEffect(() => {
    const fetchData = async () => {
      const [catRes, subRes, innerRes, colorRes, settingsRes, attrRes] =
        await Promise.all([
          getCategories(),
          getSubCategories(),
          getInnerSubCategories(),
          getAllColors(),
          getSettings(),
          getAllAttributes(),
        ]);

      setCategories(
        catRes.data?.map((c) => ({
          id: c.id,
          name: c.title,
          type: c.type,
          hsn_code: c.hsn_code,
          gst: c.gst,
        })) || [],
      );
      setSubCategories(
        subRes.data?.map((c) => ({
          id: c.id,
          name: c.title,
          categoryId: c.cat_id,
          hsn_code: c.hsn_code,
          gst: c.gst,
        })) || [],
      );
      setInnerSubCategories(
        innerRes.data?.map((c) => ({
          id: c.id,
          name: c.title,
          subCategoryId: c.sub_cat_id,
          hsn_code: c.hsn_code,
          gst: c.gst,
        })) || [],
      );
      setColors(colorRes.status === 1 ? colorRes.data : []);
      setAttributes(attrRes.status === 1 ? attrRes.data : []);
      if (settingsRes.status === 1) {
        setSettingsShipping(settingsRes.data.shipping_charge || 0);
        setFormData((prev) => ({
          ...prev,
          platform_fee: settingsRes.data.platform_fee,
        }));
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchSizes = async () => {
      try {
        const query = {};
        if (formData.category_id) query.categoryId = formData.category_id;
        if (formData.sub_category_id)
          query.subCategoryId = formData.sub_category_id;
        if (formData.inner_sub_category_id)
          query.innerSubCategoryId = formData.inner_sub_category_id;
        const res = await getAllSizes(query);
        if (res.status === 1)
          setSizes(res.data?.map((s) => ({ ...s, id: String(s.id) })) || []);
      } catch (error) {
        console.error("Error fetching sizes:", error);
      }
    };
    fetchSizes();
  }, [
    formData.category_id,
    formData.sub_category_id,
    formData.inner_sub_category_id,
  ]);

  useEffect(() => {
    const getAllFabrics = async () => {
      const query = {};
      if (formData.category_id) query.categoryId = formData.category_id;
      if (formData.sub_category_id) query.subCatId = formData.sub_category_id;
      if (formData.inner_sub_category_id)
        query.innerSubCatId = formData.inner_sub_category_id;
      const res = await getAllFabricsByStatus(query);
      setFabrics(res?.map((data) => ({ id: data.id, name: data.name })) || []);
    };
    getAllFabrics();
  }, [
    formData.category_id,
    formData.sub_category_id,
    formData.inner_sub_category_id,
  ]);

  useEffect(() => {
    if (isEditMode) fetchProductData();
  }, [id]);

  useEffect(() => {
    if (formData.category_id) {
      const category = categories.find(
        (c) => c.id === parseInt(formData.category_id),
      );
      setSelectedCategoryDetails(category);
      if (category?.type)
        setFormData((prev) => ({ ...prev, type: category.type }));
    }
  }, [formData.category_id, categories]);

  useEffect(() => {
    if (formData.sub_category_id) {
      const subCategory = subCategories.find(
        (sc) => sc.id === parseInt(formData.sub_category_id),
      );
      setSelectedSubCategoryDetails(subCategory);
    }
  }, [formData.sub_category_id, subCategories]);

  useEffect(() => {
    if (formData.inner_sub_category_id) {
      const innerSubCategory = innerSubCategories.find(
        (isc) => isc.id === parseInt(formData.inner_sub_category_id),
      );
      setSelectedInnerSubCategoryDetails(innerSubCategory);
    }
  }, [formData.inner_sub_category_id, innerSubCategories]);

  useEffect(() => {
    if (formData.category_id && subCategories.length > 0) {
      setFilteredSubCategories(
        subCategories.filter(
          (sc) => sc.categoryId === parseInt(formData.category_id),
        ),
      );
    } else {
      setFilteredSubCategories([]);
    }
  }, [formData.category_id, subCategories]);

  useEffect(() => {
    if (formData.sub_category_id && innerSubCategories.length > 0) {
      setFilteredInnerSubCategories(
        innerSubCategories.filter(
          (isc) => isc.subCategoryId === parseInt(formData.sub_category_id),
        ),
      );
    } else {
      setFilteredInnerSubCategories([]);
    }
  }, [formData.sub_category_id, innerSubCategories]);

  useEffect(() => {
    if (parseInt(formData.low_stock_threshold) > parseInt(formData.stock)) {
      setFormData((prev) => ({ ...prev, low_stock_threshold: formData.stock }));
    }
  }, [formData.stock, formData.low_stock_threshold]);

  useEffect(() => {
    const l = parseFloat(formData.package_length) || 0;
    const w = parseFloat(formData.package_width) || 0;
    const h = parseFloat(formData.package_height) || 0;
    const volWeight = Math.round((l * w * h) / 5000);
    setFormData((prev) => ({ ...prev, volumetric_weight: volWeight }));
  }, [
    formData.package_length,
    formData.package_width,
    formData.package_height,
  ]);

  useEffect(() => {
    const deadWeight = Number(formData.package_weight) || 0;
    const volWeight = Number(formData.volumetric_weight) || 0;
    const chargeableWeight = Math.max(deadWeight, volWeight);
    const dynamicCharge = getDynamicShippingCharge(chargeableWeight);
    setCalculatedShipping(dynamicCharge);
    setFormData((prev) => ({ ...prev, shipping_charges: dynamicCharge }));
  }, [formData.package_weight, formData.volumetric_weight]);

  // ────────────────────────────────────────────────────────────────────────────
  //  Fetch product for edit mode
  // ────────────────────────────────────────────────────────────────────────────
  const fetchProductData = async () => {
    try {
      const res = await getProductById(id);
      if (res.status !== 1) return;
      const p = res.data;

      const parsedTags =
        typeof p.tags === "string" ? JSON.parse(p.tags) : p.tags || [];
      const parsedSpecs =
        typeof p.specifications === "string"
          ? JSON.parse(p.specifications)
          : p.specifications || [];
      setSpecifications(
        parsedSpecs.length > 0
          ? parsedSpecs
          : [{ feature: "", specification: "" }],
      );

      const parsedWhatsInTheBox =
        typeof p.whats_in_the_box === "string"
          ? JSON.parse(p.whats_in_the_box)
          : p.whats_in_the_box || [{ title: "", details: "" }];
      setWhatsInTheBox(
        parsedWhatsInTheBox.length > 0
          ? parsedWhatsInTheBox
          : [{ title: "", details: "" }],
      );

      const updatedFormData = {
        ...p,
        tags: parsedTags,
        specifications: parsedSpecs,
        whats_in_the_box: parsedWhatsInTheBox,
        category_id: p.category_id || "",
      };

      setTimeout(() => {
        setFormData(updatedFormData);
        if (p.variationMode) setVariationMode(p.variationMode);

        if (p.variations && p.variations.length > 0) {
          let formattedVariations = [];

          if (p.variationMode === "color_size") {
            formattedVariations = p.variations.map((group) => ({
              color_id: group.color_id?.toString() || "",
              media: group.media || [],
              sizes: (group.sizes || []).map((size) => ({
                size_id: size.size_id?.toString() || "",
                stock: size.stock != null ? String(size.stock) : "",
                original_price:
                  size.original_price != null
                    ? String(size.original_price)
                    : "",
                discounted_price:
                  size.discounted_price != null
                    ? String(size.discounted_price)
                    : "",
                sku: size.sku || "",
                barcode: size.barcode || "",
              })),
            }));
          } else {
            // custom mode: p.variations = [{grouping_key, attributes:[…], stock, …, media}]
            formattedVariations = p.variations.map((v) => ({
              attributes:
                Array.isArray(v.attributes) && v.attributes.length > 0
                  ? v.attributes.map((a) => ({
                      attribute_id: a.attribute_id?.toString() || "",
                      attribute_value: a.attribute_value || "",
                    }))
                  : [{ attribute_id: "", attribute_value: "" }],
              stock: v.stock != null ? String(v.stock) : "",
              original_price:
                v.original_price != null ? String(v.original_price) : "",
              discounted_price:
                v.discounted_price != null ? String(v.discounted_price) : "",
              sku: v.sku || "",
              barcode: v.barcode || "",
              media: v.media || [],
            }));
          }

          setVariations(formattedVariations);
        }

        setDeletedMediaIds([]);

        if (p.media) {
          updatedFormData.productFiles = p.media.map((media) => ({
            id: media.id,
            url: media.url,
            type: media.type,
            preview: media.url,
          }));
        }
      }, 0);
    } catch (err) {
      console.error(err);
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  //  Helpers
  // ────────────────────────────────────────────────────────────────────────────
  const getDynamicShippingCharge = (weightInGrams) => {
    if (!weightInGrams || weightInGrams <= 0) return 0;
    for (const rate of SHIPPING_RATES) {
      if (weightInGrams <= rate.maxWeight) return rate.charge;
    }
    return SHIPPING_RATES[SHIPPING_RATES.length - 1].charge;
  };

  const handleGenerateMainSKU = () => {
    setFormData((prev) => ({ ...prev, sku: generateAutoSKU() }));
    setMainProductErrors((prev) => ({ ...prev, main_sku: "" }));
  };

  const handleGenerateVariationSKU = (varIdx, sizeIdx = null) => {
    const newSku = generateAutoSKU();
    if (variationMode === "color_size" && sizeIdx !== null) {
      setVariations((prev) => {
        const updated = [...prev];
        updated[varIdx].sizes[sizeIdx].sku = newSku;
        return updated;
      });
    } else {
      // custom mode: sku is at variation level
      setVariations((prev) => {
        const updated = [...prev];
        updated[varIdx].sku = newSku;
        return updated;
      });
    }
    setVariationErrors((prev) => {
      const updated = { ...prev };
      if (updated[varIdx]) {
        if (sizeIdx !== null) {
          if (updated[varIdx]?.sizes?.[sizeIdx])
            delete updated[varIdx].sizes[sizeIdx].sku;
        } else {
          delete updated[varIdx].sku;
        }
      }
      return updated;
    });
  };

  const generateMediaIndices = useCallback((mediaList) => {
    const newFiles = [];
    const indices = [];
    mediaList.forEach((media) => {
      if (media.file instanceof File) {
        newFiles.push(media.file);
        indices.push(newFiles.length - 1);
      } else if (media.id) {
        indices.push(`existing_${media.id}`);
      }
    });
    return { newFiles, indices };
  }, []);

  const generateSlug = (text) =>
    slugify(text, { lower: true, strict: true, trim: true });

  const validateImageDimensions = (file) =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () =>
        resolve(img.naturalWidth >= 512 && img.naturalHeight >= 682);
      img.src = URL.createObjectURL(file);
    });

  // ────────────────────────────────────────────────────────────────────────────
  //  Handlers
  // ────────────────────────────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "name") {
      const newSlug = generateSlug(value);
      const capitalizedValue = value.replace(/\b\w/g, (char) =>
        char.toUpperCase(),
      );
      setFormData((prev) => ({
        ...prev,
        [name]: capitalizedValue,
        slug: newSlug,
        meta_title: `${value} | IERADA`,
      }));
      setPriceErrors((prev) => ({ ...prev, main: "" }));
    } else if (name === "category_id") {
      setFormData((prev) => ({
        ...prev,
        category_id: value,
        sub_category_id: "",
        inner_sub_category_id: "",
      }));
    } else if (name === "sub_category_id") {
      setFormData((prev) => ({
        ...prev,
        sub_category_id: value,
        inner_sub_category_id: "",
      }));
    } else if (name === "low_stock_threshold") {
      const threshold = Math.min(
        parseInt(value),
        parseInt(formData.stock) || 0,
      );
      setFormData((prev) => ({
        ...prev,
        [name]: isNaN(threshold) ? "" : threshold,
      }));
    } else if (name === "original_price" || name === "discounted_price") {
      const newValue = parseFloat(value) || 0;
      setFormData((prev) => ({ ...prev, [name]: value }));
      const originalPrice =
        name === "original_price"
          ? newValue
          : parseFloat(formData.original_price) || 0;
      const discountedPrice =
        name === "discounted_price"
          ? newValue
          : parseFloat(formData.discounted_price) || 0;
      if (
        discountedPrice >= originalPrice &&
        originalPrice !== 0 &&
        discountedPrice !== 0
      ) {
        setPriceErrors((prev) => ({
          ...prev,
          main: "Selling price must be lower than original price",
        }));
      } else {
        setPriceErrors((prev) => ({ ...prev, main: "" }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
      setPriceErrors((prev) => ({ ...prev, main: "" }));
    }
  };

  // ── Color-size variation handlers ─────────────────────────────────────────
  const handleVariationChange = (idx, field, value) => {
    setVariations((prev) => {
      const updated = [...prev];
      updated[idx][field] = value;
      return updated;
    });
  };

  const handleSizeChange = (varIdx, sizeIdx, field, value) => {
    setVariations((prev) => {
      const updated = [...prev];
      updated[varIdx].sizes[sizeIdx][field] = value;
      // Auto-populate main pricing fields from first variation, first size
      if (
        !isEditMode &&
        varIdx === 0 &&
        sizeIdx === 0 &&
        ["stock", "original_price", "discounted_price"].includes(field)
      ) {
        setFormData((fd) => ({ ...fd, [field]: value }));
      }
      if (["original_price", "discounted_price"].includes(field)) {
        const op =
          parseFloat(updated[varIdx].sizes[sizeIdx].original_price) || 0;
        const dp =
          parseFloat(updated[varIdx].sizes[sizeIdx].discounted_price) || 0;
        setPriceErrors((prev) => {
          const newErrs = [...(prev.variations || [])];
          newErrs[varIdx] = newErrs[varIdx] || { sizes: [] };
          newErrs[varIdx].sizes[sizeIdx] =
            dp >= op && op > 0 && dp > 0
              ? "Selling price must be lower than original price"
              : "";
          return { ...prev, variations: newErrs };
        });
      }
      if (field === "sku") {
        setVariationErrors((prev) => {
          const updated = { ...prev };
          if (updated[varIdx]?.sizes?.[sizeIdx]) {
            delete updated[varIdx].sizes[sizeIdx].sku;
          }
          return updated;
        });
      }
      return updated;
    });
  };

  // ── Custom variation handlers ─────────────────────────────────────────────

  /** Update a field at variation row level (stock, sku, price, etc.) */
  const handleCustomVariationChange = (varIdx, field, value) => {
    setVariations((prev) => {
      const updated = [...prev];
      updated[varIdx] = { ...updated[varIdx], [field]: value };
      return updated;
    });
    if (
      !isEditMode &&
      varIdx === 0 &&
      ["stock", "original_price", "discounted_price"].includes(field)
    ) {
      setFormData((fd) => ({ ...fd, [field]: value }));
    }
    // Clear corresponding error
    setVariationErrors((prev) => {
      const updated = { ...prev };
      if (updated[varIdx]) delete updated[varIdx][field];
      return updated;
    });
  };

  /** Update a single attribute pair within a variation */
  const handleCustomAttributeChange = (varIdx, attrIdx, field, value) => {
    setVariations((prev) => {
      const updated = [...prev];
      const attrs = [...updated[varIdx].attributes];
      attrs[attrIdx] = { ...attrs[attrIdx], [field]: value };
      updated[varIdx] = { ...updated[varIdx], attributes: attrs };
      return updated;
    });
    setVariationErrors((prev) => {
      const updated = { ...prev };
      if (updated[varIdx]?.attrErrors?.[attrIdx]) {
        delete updated[varIdx].attrErrors[attrIdx][field];
      }
      return updated;
    });
  };

  /** Add an attribute to a variation (max 4) */
  const addAttributeToVariation = (varIdx) => {
    setVariations((prev) => {
      const updated = [...prev];
      if (updated[varIdx].attributes.length >= 4) return updated;
      updated[varIdx] = {
        ...updated[varIdx],
        attributes: [
          ...updated[varIdx].attributes,
          { attribute_id: "", attribute_value: "" },
        ],
      };
      return updated;
    });
  };

  /** Remove an attribute from a variation */
  const removeAttributeFromVariation = (varIdx, attrIdx) => {
    setVariations((prev) => {
      const updated = [...prev];
      const attrs = updated[varIdx].attributes.filter((_, i) => i !== attrIdx);
      updated[varIdx] = {
        ...updated[varIdx],
        attributes:
          attrs.length > 0
            ? attrs
            : [{ attribute_id: "", attribute_value: "" }],
      };
      return updated;
    });
  };

  /** Add a new custom variation row */
  const addCustomVariation = () => {
    setVariations((prev) => [...prev, createDefaultCustomVariation()]);
  };

  /** Remove a custom variation row */
  const removeCustomVariation = (varIdx) => {
    setVariations((prev) => prev.filter((_, i) => i !== varIdx));
    setVariationErrors((prev) => {
      const updated = { ...prev };
      delete updated[varIdx];
      return updated;
    });
  };

  // ── Color-size add/remove helpers ─────────────────────────────────────────
  const addColorVariation = () => {
    setVariations((prev) => [...prev, createDefaultColorVariation()]);
  };

  const addSizeToColor = (colorIndex) => {
    setVariations((prev) => {
      const updated = [...prev];
      updated[colorIndex].sizes.push({
        size_id: "",
        stock: "",
        original_price: "",
        discounted_price: "",
        sku: "",
        barcode: "",
      });
      return updated;
    });
  };

  const removeColorVariation = (colorIndex) => {
    setVariations((prev) => prev.filter((_, i) => i !== colorIndex));
  };

  const removeSizeFromColor = (colorIndex, sizeIndex) => {
    setVariations((prev) => {
      const updated = [...prev];
      updated[colorIndex].sizes = updated[colorIndex].sizes.filter(
        (_, i) => i !== sizeIndex,
      );
      return updated;
    });
  };

  const onDragEnd = (result) => {
    const { source, destination, type } = result;
    if (!destination) return;
    if (
      source.index === destination.index &&
      source.droppableId === destination.droppableId
    )
      return;

    if (type === "VARIATION") {
      // Reorder top-level variations (both modes)
      setVariations((prev) => {
        const updated = [...prev];
        const [moved] = updated.splice(source.index, 1);
        updated.splice(destination.index, 0, moved);
        return updated;
      });
      // Also reorder expandedVariations state to keep UI in sync
      setExpandedVariations((prev) => {
        const updated = [...prev];
        const [moved] = updated.splice(source.index, 1);
        updated.splice(destination.index, 0, moved);
        return updated;
      });
    }

    if (type === "COLOR_SIZE") {
      // Reorder sizes within a color — droppableId = "sizes-{colorIndex}"
      const colorIndex = parseInt(source.droppableId.replace("sizes-", ""));
      setVariations((prev) => {
        const updated = [...prev];
        const sizes = [...updated[colorIndex].sizes];
        const [moved] = sizes.splice(source.index, 1);
        sizes.splice(destination.index, 0, moved);
        updated[colorIndex] = { ...updated[colorIndex], sizes };
        return updated;
      });
    }
  };

  // ── File handling ─────────────────────────────────────────────────────────
  const handleFileChange = async (e, variationIndex) => {
    const files = Array.from(e.target.files);
    const validFiles = [];
    for (const file of files) {
      if (file.type.startsWith("image/")) {
        const valid = await validateImageDimensions(file);
        if (!valid) {
          notifyOnFail(`Image ${file.name} must be at least 512x682px`);
          continue;
        }
      }
      validFiles.push({
        file,
        type: file.type.startsWith("image/") ? "image" : "video",
        preview: URL.createObjectURL(file),
      });
    }
    if (validFiles.length === 0) return;

    if (
      formData.is_variation &&
      variationIndex !== null &&
      variationIndex !== undefined
    ) {
      setVariations((prev) => {
        const updated = [...prev];
        const existingNames = new Set(
          updated[variationIndex].media.map((m) => m.file?.name || m.url),
        );
        const unique = validFiles.filter(
          (f) => !existingNames.has(f.file.name),
        );
        updated[variationIndex].media = [
          ...updated[variationIndex].media,
          ...unique,
        ];
        return updated;
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        productFiles: [...prev.productFiles, ...validFiles],
      }));
    }
  };

  const handleRemoveFile = (index, variationIndex = null) => {
    if (
      formData.is_variation &&
      variationIndex !== null &&
      variationIndex !== undefined
    ) {
      setVariations((prev) => {
        const updated = [...prev];
        const mediaItem = updated[variationIndex].media[index];
        if (mediaItem.id) setDeletedMediaIds((d) => [...d, mediaItem.id]);
        if (mediaItem.preview) URL.revokeObjectURL(mediaItem.preview);
        updated[variationIndex].media = updated[variationIndex].media.filter(
          (_, i) => i !== index,
        );
        return updated;
      });
    } else {
      setFormData((prev) => {
        const item = prev.productFiles[index];
        if (item.id) setDeletedMediaIds((d) => [...d, item.id]);
        if (item.preview) URL.revokeObjectURL(item.preview);
        return {
          ...prev,
          productFiles: prev.productFiles.filter((_, i) => i !== index),
        };
      });
    }
  };

  // ── Specifications ────────────────────────────────────────────────────────
  const handleSpecificationChange = (index, field, value) => {
    if (specifications.length > 7 && field === "feature") return;
    const newSpecifications = [...specifications];
    newSpecifications[index][field] = value;
    setSpecifications(newSpecifications);
  };

  const addSpecification = () => {
    if (specifications.length >= 7) return;
    setSpecifications([...specifications, { feature: "", specification: "" }]);
    setFormData({
      ...formData,
      specifications: [...specifications, { feature: "", specification: "" }],
    });
  };

  const removeSpecification = (index) => {
    setSpecifications(specifications.filter((_, i) => i !== index));
    setFormData({
      ...formData,
      specifications: specifications.filter((_, i) => i !== index),
    });
  };

  // ── What's in the Box ─────────────────────────────────────────────────────
  const handleWhatsInTheBoxChange = (index, field, value) => {
    if (whatsInTheBox.length > 4 && field === "title") return;
    const newWhatsInTheBox = [...whatsInTheBox];
    newWhatsInTheBox[index][field] = value;
    setWhatsInTheBox(newWhatsInTheBox);
    setFormData((prev) => ({ ...prev, whats_in_the_box: newWhatsInTheBox }));
  };

  const addWhatsInTheBox = () => {
    if (whatsInTheBox.length >= 4) return;
    const newItems = [...whatsInTheBox, { title: "", details: "" }];
    setWhatsInTheBox(newItems);
    setFormData((prev) => ({ ...prev, whats_in_the_box: newItems }));
  };

  const removeWhatsInTheBox = (index) => {
    if (whatsInTheBox.length <= 1) return;
    const newItems = whatsInTheBox.filter((_, i) => i !== index);
    setWhatsInTheBox(newItems);
    setFormData((prev) => ({ ...prev, whats_in_the_box: newItems }));
  };

  // ────────────────────────────────────────────────────────────────────────────
  //  Submit
  // ────────────────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    // Validate main product fields
    const mainValidation = validateMainProductFields(formData);
    if (!mainValidation.valid) {
      setMainProductErrors(mainValidation.errors);
      const firstError = Object.values(mainValidation.errors)[0];
      setNotification({
        isOpen: true,
        type: "error",
        message: firstError || "Please fix validation errors",
      });
      return;
    }

    // Validate variations
    if (formData.is_variation) {
      const variationValidation = validateVariationsData(
        variations,
        variationMode,
      );
      if (!variationValidation.valid) {
        setVariationErrors(variationValidation.errors);
        const errorMessages = [];
        Object.entries(variationValidation.errors).forEach(
          ([varIdx, errors]) => {
            if (typeof errors === "object" && errors !== null) {
              Object.entries(errors).forEach(([field, error]) => {
                if (field === "sizes" && errors.sizes?.details) {
                  errors.sizes.details.forEach((sizeErr, sIdx) => {
                    if (sizeErr && typeof sizeErr === "object") {
                      Object.entries(sizeErr).forEach(([sField, sError]) => {
                        errorMessages.push(
                          `Variation ${parseInt(varIdx) + 1}, Size ${
                            sIdx + 1
                          }: ${sError}`,
                        );
                      });
                    }
                  });
                } else if (field === "attrErrors" && Array.isArray(error)) {
                  error.forEach((attrErr, aIdx) => {
                    if (attrErr) {
                      Object.entries(attrErr).forEach(([aField, aError]) => {
                        errorMessages.push(
                          `Variation ${parseInt(varIdx) + 1}, Attr ${
                            aIdx + 1
                          }: ${aError}`,
                        );
                      });
                    }
                  });
                } else if (typeof error === "string") {
                  errorMessages.push(
                    `Variation ${parseInt(varIdx) + 1}: ${error}`,
                  );
                }
              });
            }
          },
        );
        setNotification({
          isOpen: true,
          type: "error",
          message:
            errorMessages.slice(0, 3).join(" | ") ||
            "Please fix variation errors",
        });
        return;
      }

      // SKU duplicate check
      const duplicates = checkDuplicateSKUInVariations(
        variations,
        variationMode,
      );
      if (duplicates.hasDuplicate) {
        setNotification({
          isOpen: true,
          type: "error",
          message: `Duplicate SKUs found: ${duplicates.duplicates
            .map((d) => d.sku)
            .join(", ")}`,
        });
        return;
      }
    }

    // Validate media
    if (formData.is_variation) {
      for (let i = 0; i < variations.length; i++) {
        const mediaValidation = validateMediaRequirements(
          variations[i].media,
          true,
        );
        if (!mediaValidation.valid) {
          setNotification({
            isOpen: true,
            type: "error",
            message: `Variation ${i + 1}: ${mediaValidation.error}`,
          });
          return;
        }
      }
    } else {
      const mediaValidation = validateMediaRequirements(
        formData.productFiles,
        false,
      );
      if (!mediaValidation.valid) {
        setNotification({
          isOpen: true,
          type: "error",
          message: mediaValidation.error,
        });
        return;
      }
    }

    const sellingPrice = parseFloat(formData.discounted_price) || 0;
    const tdsAmount = sellingPrice * 0.02;
    const bankSettlementAmount = sellingPrice - tdsAmount;

    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, val]) => {
      if (
        [
          "productFiles",
          "variations",
          "specifications",
          "whats_in_the_box",
        ].includes(key)
      )
        return;
      if (key === "fabric_id" && !val) return;
      if (key === "gst" && !val) {
        formDataToSend.append(key, 0);
        return;
      }
      formDataToSend.append(
        key,
        typeof val === "object" && key !== "specifications"
          ? JSON.stringify(val)
          : val,
      );
    });
    formDataToSend.append("specifications", JSON.stringify(specifications));
    formDataToSend.append("whats_in_the_box", JSON.stringify(whatsInTheBox));

    if (deletedMediaIds.length > 0) {
      formDataToSend.append("delete_media", JSON.stringify(deletedMediaIds));
    }

    formDataToSend.delete("tds_amount");
    formDataToSend.delete("bank_settlement_amount");
    formDataToSend.append("tds_amount", parseFloat(tdsAmount));
    formDataToSend.append(
      "bank_settlement_amount",
      parseFloat(bankSettlementAmount),
    );

    const allNewFiles = [];
    const variationMediaMapping = [];

    if (formData.is_variation) {
      const variationsForSubmit = [];

      if (variationMode === "color_size") {
        // variationIndex = color group order  →  sequence
        // sizeIndex      = size order within color  →  size_sequence
        variations.forEach((variation, variationIndex) => {
          const groupingKey = parseInt(variation.color_id);
          if (!groupingKey) return;

          // ── Media indices for this color group ──────────────────────────────
          const { newFiles: variationNewFiles, indices } = generateMediaIndices(
            variation.media || [],
          );
          const fileStartIndex = allNewFiles.length;
          allNewFiles.push(...variationNewFiles);
          const globalIndices = indices.map((idx) =>
            typeof idx === "number" ? fileStartIndex + idx : idx,
          );
          if (globalIndices.length > 0) {
            variationMediaMapping.push({
              grouping_key: groupingKey,
              file_indices: globalIndices,
            });
          }

          // ── One DB row per size ─────────────────────────────────────────────
          variation.sizes.forEach((size, sizeIndex) => {
            variationsForSubmit.push({
              color_id: groupingKey,
              size_id: parseInt(size.size_id) || null,
              attribute_id: null,
              attribute_value: null,
              attributes: null,
              grouping_key: String(groupingKey),
              sequence: variationIndex, // color group order
              size_sequence: sizeIndex, // size order within this color
              stock: size.stock,
              original_price: size.original_price,
              discounted_price: size.discounted_price,
              sku: size.sku,
              barcode: size.barcode || null,
            });
          });
        });
      } else {
        // custom mode — each variation row is independent; no size_sequence needed
        variations.forEach((variation, variationIndex) => {
          if (!variation.attributes || variation.attributes.length === 0)
            return;

          const groupingKey = String(variationIndex);

          // ── Media indices ───────────────────────────────────────────────────
          const { newFiles: variationNewFiles, indices } = generateMediaIndices(
            variation.media || [],
          );
          const fileStartIndex = allNewFiles.length;
          allNewFiles.push(...variationNewFiles);
          const globalIndices = indices.map((idx) =>
            typeof idx === "number" ? fileStartIndex + idx : idx,
          );
          if (globalIndices.length > 0) {
            variationMediaMapping.push({
              grouping_key: groupingKey,
              file_indices: globalIndices,
            });
          }

          variationsForSubmit.push({
            color_id: null,
            size_id: null,
            attribute_id: variation.attributes[0]?.attribute_id
              ? parseInt(variation.attributes[0].attribute_id)
              : null,
            attribute_value: variation.attributes[0]?.attribute_value || null,
            attributes: variation.attributes.map((a) => ({
              attribute_id: parseInt(a.attribute_id),
              attribute_value: a.attribute_value,
            })),
            grouping_key: groupingKey,
            sequence: variationIndex, // variation row order
            size_sequence: 0, // unused in custom mode
            stock: variation.stock,
            original_price: variation.original_price,
            discounted_price: variation.discounted_price,
            sku: variation.sku,
            barcode: variation.barcode || null,
          });
        });
      }

      formDataToSend.append("variations", JSON.stringify(variationsForSubmit));
      formDataToSend.append(
        "variation_media",
        JSON.stringify(variationMediaMapping),
      );
    } else {
      const { newFiles, indices } = generateMediaIndices(formData.productFiles);
      allNewFiles.push(...newFiles);
      if (indices.length > 0) {
        formDataToSend.append("media_indices", JSON.stringify(indices));
      }
    }

    allNewFiles.forEach((file) => formDataToSend.append("files", file));

    setIsSubmitting(true);
    try {
      const response = isEditMode
        ? await updateProduct(id, formDataToSend)
        : await addProduct(formDataToSend);
      if (response.status === 1) {
        setNotification({
          isOpen: true,
          type: "success",
          message: isEditMode
            ? "Product updated successfully!"
            : "Product created successfully!",
        });
        setTimeout(
          () => navigate(`${config.VITE_BASE_VENDOR_URL}/product`),
          2000,
        );
      } else {
        setNotification({
          isOpen: true,
          type: "error",
          message:
            response.message || "Failed to submit product. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error submitting product:", error);
      setNotification({
        isOpen: true,
        type: "error",
        message:
          "Error submitting product. Please check your connection and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeNotification = () =>
    setNotification({ isOpen: false, type: "", message: "" });
  const toggleVariation = (index) => {
    setExpandedVariations((prev) => {
      const newArr = [...prev];
      newArr[index] = !newArr[index];
      return newArr;
    });
  };

  // ────────────────────────────────────────────────────────────────────────────
  //  Render helpers
  // ────────────────────────────────────────────────────────────────────────────
  const renderMediaPreview = (file, index, variationIndex = null) => (
    <div key={index} className="relative group">
      {file.type === "image" ? (
        <img
          src={file.preview || file.url}
          alt="preview"
          className="w-20 h-20 object-cover rounded-2xl border"
        />
      ) : (
        <video
          src={file.preview || file.url}
          className="w-20 h-20 object-cover rounded-2xl border"
        />
      )}
      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center gap-2">
        <button
          onClick={() =>
            setPreviewModal({
              isOpen: true,
              url: file.preview || file.url,
              type: file.type,
            })
          }
          className="p-1 bg-white rounded-full text-gray-700 hover:text-gray-900"
        >
          <Eye size={16} />
        </button>
        <button
          onClick={() => handleRemoveFile(index, variationIndex)}
          className="p-1 bg-white rounded-full text-red-500 hover:text-red-700"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );

  const renderMediaUploadSection = (variationIndex = null) => {
    const mediaArray =
      variationIndex !== null
        ? variations[variationIndex]?.media || []
        : formData.productFiles;
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-xl cursor-pointer hover:bg-gray-200 text-sm">
            <CiImageOn size={18} />
            <span>Add Images</span>
            <span className="text-red-500">*</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFileChange(e, variationIndex)}
            />
          </label>
          <label className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-xl cursor-pointer hover:bg-gray-200 text-sm">
            <CiVideoOn size={18} />
            <span>Add Video</span>
            <input
              type="file"
              accept="video/*"
              multiple
              className="hidden"
              onChange={(e) => handleFileChange(e, variationIndex)}
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-3">
          {mediaArray.map((file, index) =>
            renderMediaPreview(file, index, variationIndex),
          )}
        </div>
      </div>
    );
  };

  const renderPreviewModal = () =>
    previewModal.isOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-4 rounded-2xl max-w-4xl max-h-[90vh] overflow-auto">
          <div className="flex justify-end mb-2">
            <button
              onClick={() =>
                setPreviewModal({ isOpen: false, url: "", type: "" })
              }
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>
          {previewModal.type === "image" ? (
            <img
              src={previewModal.url}
              alt="preview"
              className="max-w-full max-h-[80vh] object-contain"
            />
          ) : (
            <video
              src={previewModal.url}
              controls
              className="max-w-full max-h-[80vh]"
            />
          )}
        </div>
      </div>
    );

  const TooltipHint = ({ id, content }) => (
    <>
      <BsQuestionCircle
        size={14}
        className="text-gray-500 cursor-pointer ml-1"
        data-tooltip-id={id}
        data-tooltip-content={content}
      />
      <Tooltip
        id={id}
        place="top"
        effect="solid"
        className="!text-xs !max-w-xs !z-[9999]"
      />
    </>
  );

  const renderCustomVariations = () => {
    return (
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="custom-variations" type="VARIATION">
          {(provided) => (
            <div
              className="space-y-6"
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {variations.map((variation, varIdx) => {
                const attrs = variation.attributes || [
                  { attribute_id: "", attribute_value: "" },
                ];
                const usedAttrIds = new Set(
                  attrs.map((a) => String(a.attribute_id)).filter(Boolean),
                );

                return (
                  <Draggable
                    key={`custom-var-${varIdx}`}
                    draggableId={`custom-var-${varIdx}`}
                    index={varIdx}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`border-2 border-gray-200 rounded-2xl overflow-hidden bg-white ${
                          snapshot.isDragging
                            ? "shadow-xl ring-2 ring-blue-300"
                            : ""
                        }`}
                      >
                        {/* ── Header row ── */}
                        <div className="bg-gray-50 px-4 py-2 flex items-center justify-between border-b">
                          <div className="flex items-center gap-2">
                            {/* Drag handle */}
                            <div
                              {...provided.dragHandleProps}
                              className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
                              title="Drag to reorder"
                            >
                              <GripVertical size={18} />
                            </div>
                            <span className="font-semibold text-sm text-gray-700">
                              Variation {varIdx + 1}
                            </span>
                          </div>
                          {variations.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeCustomVariation(varIdx)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X size={18} />
                            </button>
                          )}
                        </div>

                        <div className="p-4 space-y-4">
                          {/* ── Attribute type headers + value inputs ── */}
                          <div>
                            {/* Attribute type dropdowns row */}
                            <div className="flex items-end gap-2 flex-wrap mb-1">
                              {attrs.map((attr, attrIdx) => {
                                // Filter out already-selected attribute_ids in other columns
                                const otherUsedIds = new Set(
                                  attrs
                                    .filter((_, i) => i !== attrIdx)
                                    .map((a) => String(a.attribute_id))
                                    .filter(Boolean),
                                );
                                return (
                                  <div
                                    key={attrIdx}
                                    className="flex flex-col"
                                    style={{ minWidth: 130 }}
                                  >
                                    <div className="flex items-center gap-1 mb-0.5">
                                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        Attribute {attrIdx + 1}
                                      </label>
                                      {attrIdx > 0 && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            removeAttributeFromVariation(
                                              varIdx,
                                              attrIdx,
                                            )
                                          }
                                          className="text-red-400 hover:text-red-600 ml-1"
                                          title="Remove attribute"
                                        >
                                          <X size={12} />
                                        </button>
                                      )}
                                    </div>
                                    <select
                                      value={attr.attribute_id || ""}
                                      onChange={(e) =>
                                        handleCustomAttributeChange(
                                          varIdx,
                                          attrIdx,
                                          "attribute_id",
                                          e.target.value,
                                        )
                                      }
                                      className={`rounded-lg border px-2 py-1.5 text-sm focus:border-black focus:ring-black ${
                                        variationErrors[varIdx]?.attrErrors?.[
                                          attrIdx
                                        ]?.attribute_id
                                          ? "border-red-500"
                                          : "border-gray-300"
                                      }`}
                                    >
                                      <option value="">Select Type</option>
                                      {attributes.map((a) => (
                                        <option
                                          key={a.id}
                                          value={a.id}
                                          disabled={otherUsedIds.has(
                                            String(a.id),
                                          )}
                                        >
                                          {a.name}
                                        </option>
                                      ))}
                                    </select>
                                    {variationErrors[varIdx]?.attrErrors?.[
                                      attrIdx
                                    ]?.attribute_id && (
                                      <p className="text-xs text-red-600 mt-0.5">
                                        {
                                          variationErrors[varIdx].attrErrors[
                                            attrIdx
                                          ].attribute_id
                                        }
                                      </p>
                                    )}
                                  </div>
                                );
                              })}

                              {/* Add Attribute button */}
                              {attrs.length < 4 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    addAttributeToVariation(varIdx)
                                  }
                                  className="flex items-center gap-1 px-2 py-1.5 text-xs text-blue-600 hover:text-blue-800 border border-dashed border-blue-400 rounded-lg self-end mb-0"
                                  title="Add attribute column"
                                >
                                  <Plus size={14} /> Add Attr
                                </button>
                              )}
                            </div>

                            {/* Attribute value inputs + pricing row */}
                            <div
                              className="grid gap-2 items-start mt-2"
                              style={{
                                gridTemplateColumns: `repeat(${attrs.length}, minmax(120px,1fr)) minmax(70px,90px) minmax(90px,120px) minmax(90px,120px) minmax(90px,120px) minmax(130px,160px) 36px`,
                              }}
                            >
                              {/* Attribute value inputs */}
                              {attrs.map((attr, attrIdx) => (
                                <div key={attrIdx} className="flex flex-col">
                                  <label className="text-xs font-medium text-gray-600 mb-1">
                                    {attributes.find(
                                      (a) =>
                                        String(a.id) ===
                                        String(attr.attribute_id),
                                    )?.name || `Value ${attrIdx + 1}`}
                                    <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    placeholder={`e.g., ${
                                      attrIdx === 0
                                        ? "Model A"
                                        : attrIdx === 1
                                        ? "Red"
                                        : attrIdx === 2
                                        ? "Large"
                                        : "Other"
                                    }`}
                                    value={attr.attribute_value || ""}
                                    onChange={(e) =>
                                      handleCustomAttributeChange(
                                        varIdx,
                                        attrIdx,
                                        "attribute_value",
                                        e.target.value,
                                      )
                                    }
                                    className={`rounded-lg border px-2 py-1.5 text-sm ${
                                      variationErrors[varIdx]?.attrErrors?.[
                                        attrIdx
                                      ]?.attribute_value
                                        ? "border-red-500"
                                        : "border-gray-300"
                                    }`}
                                  />
                                  {variationErrors[varIdx]?.attrErrors?.[
                                    attrIdx
                                  ]?.attribute_value && (
                                    <p className="text-xs text-red-600 mt-0.5">
                                      {
                                        variationErrors[varIdx].attrErrors[
                                          attrIdx
                                        ].attribute_value
                                      }
                                    </p>
                                  )}
                                </div>
                              ))}

                              {/* Stock */}
                              <div className="flex flex-col">
                                <label className="text-xs font-medium text-gray-600 mb-1">
                                  Stock <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="number"
                                  onKeyDown={(e) =>
                                    e.key === "e" && e.preventDefault()
                                  }
                                  min={0}
                                  value={variation.stock}
                                  onChange={(e) =>
                                    handleCustomVariationChange(
                                      varIdx,
                                      "stock",
                                      e.target.value,
                                    )
                                  }
                                  className={`rounded-lg border px-2 py-1.5 text-sm ${
                                    variationErrors[varIdx]?.stock
                                      ? "border-red-500"
                                      : "border-gray-300"
                                  }`}
                                />
                                {variationErrors[varIdx]?.stock && (
                                  <p className="text-xs text-red-600 mt-0.5">
                                    {variationErrors[varIdx].stock}
                                  </p>
                                )}
                              </div>

                              {/* Original Price */}
                              <div className="flex flex-col">
                                <label className="text-xs font-medium text-gray-600 mb-1">
                                  Original Pr.{" "}
                                  <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="number"
                                  onKeyDown={(e) =>
                                    e.key === "e" && e.preventDefault()
                                  }
                                  min={0}
                                  value={variation.original_price}
                                  onChange={(e) =>
                                    handleCustomVariationChange(
                                      varIdx,
                                      "original_price",
                                      e.target.value,
                                    )
                                  }
                                  className={`rounded-lg border px-2 py-1.5 text-sm ${
                                    variationErrors[varIdx]?.original_price
                                      ? "border-red-500"
                                      : "border-gray-300"
                                  }`}
                                />
                                {variationErrors[varIdx]?.original_price && (
                                  <p className="text-xs text-red-600 mt-0.5">
                                    {variationErrors[varIdx].original_price}
                                  </p>
                                )}
                              </div>

                              {/* Selling Price */}
                              <div className="flex flex-col">
                                <label className="text-xs font-medium text-gray-600 mb-1">
                                  Selling Pr.{" "}
                                  <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="number"
                                  onKeyDown={(e) =>
                                    e.key === "e" && e.preventDefault()
                                  }
                                  min={0}
                                  value={variation.discounted_price}
                                  onChange={(e) =>
                                    handleCustomVariationChange(
                                      varIdx,
                                      "discounted_price",
                                      e.target.value,
                                    )
                                  }
                                  className={`rounded-lg border px-2 py-1.5 text-sm ${
                                    variationErrors[varIdx]?.discounted_price ||
                                    variationErrors[varIdx]?.price
                                      ? "border-red-500"
                                      : "border-gray-300"
                                  }`}
                                />
                                {(variationErrors[varIdx]?.discounted_price ||
                                  variationErrors[varIdx]?.price) && (
                                  <p className="text-xs text-red-600 mt-0.5">
                                    {variationErrors[varIdx].discounted_price ||
                                      variationErrors[varIdx].price}
                                  </p>
                                )}
                              </div>

                              {/* Barcode */}
                              <div className="flex flex-col">
                                <label className="text-xs font-medium text-gray-600 mb-1">
                                  Barcode
                                </label>
                                <input
                                  type="text"
                                  value={variation.barcode}
                                  onChange={(e) =>
                                    handleCustomVariationChange(
                                      varIdx,
                                      "barcode",
                                      e.target.value,
                                    )
                                  }
                                  className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                                />
                              </div>

                              {/* SKU */}
                              <div className="flex flex-col">
                                <label className="text-xs font-medium text-gray-600 mb-1">
                                  SKU <span className="text-red-500">*</span>
                                </label>
                                <div className="flex gap-1">
                                  <input
                                    type="text"
                                    value={variation.sku}
                                    onChange={(e) =>
                                      handleCustomVariationChange(
                                        varIdx,
                                        "sku",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="e.g., PROD-001"
                                    className={`flex-1 rounded-lg border px-2 py-1.5 text-sm ${
                                      variationErrors[varIdx]?.sku
                                        ? "border-red-500"
                                        : "border-gray-300"
                                    }`}
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleGenerateVariationSKU(varIdx)
                                    }
                                    title="Auto-generate SKU"
                                    className="px-2 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                                  >
                                    <RefreshCw size={14} />
                                  </button>
                                </div>
                                {variationErrors[varIdx]?.sku && (
                                  <p className="text-xs text-red-600 mt-0.5">
                                    {variationErrors[varIdx].sku}
                                  </p>
                                )}
                              </div>

                              {/* Spacer for remove button column – nothing here */}
                              <div />
                            </div>
                          </div>

                          {/* ── Media section ── */}
                          <div className="pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium text-gray-600">
                                Media
                              </span>
                              <button
                                className="flex items-center gap-1 text-sm text-gray-500"
                                onClick={() => setIsGuideModalOpen(true)}
                                type="button"
                              >
                                <BsQuestionCircle size={13} />
                              </button>
                            </div>
                            {renderMediaUploadSection(varIdx)}
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
              <button
                type="button"
                onClick={addCustomVariation}
                className="flex items-center gap-2 text-primary-100 hover:text-blue-700 font-medium"
              >
                <Plus size={20} /> Add Variation
              </button>
            </div>
          )}
        </Droppable>
      </DragDropContext>
    );
  };

  return (
    <div className="flex gap-6 p-6 min-h-screen">
      <div className="flex-1 space-y-6 overflow-y-auto scrollbar-hide">
        <h1 className="text-3xl font-bold mb-4">
          {isEditMode ? "Edit Product" : "Create a New Product"}
        </h1>

        {/* ── Product Information ── */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-lg font-semibold mb-4">Product Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                Product Name <span className="text-red-600">*</span>
                <TooltipHint
                  id="name-tooltip"
                  content="Enter the full product name as it should appear to customers"
                />
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="mt-1 capitalize block w-full rounded-2xl border-gray-300 shadow-sm focus:border-black focus:ring-black"
              />
            </div>
            <input type="hidden" name="type" value={formData.type} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                  Category <span className="text-red-600">*</span>
                </label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm"
                >
                  <option value="" disabled>
                    Select Category
                  </option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                  Subcategory <span className="text-red-600">*</span>
                </label>
                <select
                  name="sub_category_id"
                  value={formData.sub_category_id}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm"
                  disabled={!formData.category_id}
                >
                  <option value="" disabled>
                    Select Subcategory
                  </option>
                  {filteredSubCategories.map((sc) => (
                    <option key={sc.id} value={sc.id}>
                      {sc.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                  Inner Subcategory <span className="text-red-600">*</span>
                </label>
                <select
                  name="inner_sub_category_id"
                  value={formData.inner_sub_category_id}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm"
                  disabled={!formData.sub_category_id}
                >
                  <option value="" disabled>
                    Select Inner Subcategory
                  </option>
                  {filteredInnerSubCategories.map((isc) => (
                    <option key={isc.id} value={isc.id}>
                      {isc.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Fabric
                </label>
                <select
                  name="fabric_id"
                  value={formData.fabric_id}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm"
                >
                  <option value="" disabled>
                    Select Fabric
                  </option>
                  {fabrics.map((fabric) => (
                    <option key={fabric.id} value={fabric.id}>
                      {fabric.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Display HSN Code and GST Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                  HSN Code <span className="text-red-600">*</span>
                  <TooltipHint
                    id="hsn-tooltip"
                    content="Harmonized System Nomenclature code for taxation."
                  />
                </label>
                <input
                  type="text"
                  name="hsn_code"
                  value={formData.hsn_code}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm focus:border-black focus:ring-black"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                    GST Percentage <span className="text-red-600">*</span>
                    <TooltipHint
                      id="gst-amount-tooltip"
                      content="GST percentage applied to this product."
                    />
                  </label>
                  <select
                    name="gst"
                    value={formData.gst}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm focus:border-black focus:ring-black"
                  >
                    <option value="" disabled>
                      Select GST %
                    </option>
                    {GST_SLABS.map((slab) => (
                      <option key={slab} value={slab}>
                        {slab}%
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                General Info
              </label>
              <CKEditor
                editor={ClassicEditor}
                data={formData.general_info}
                onChange={(event, editor) =>
                  setFormData((prev) => ({
                    ...prev,
                    general_info: editor.getData(),
                  }))
                }
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Product Details
                </label>
                <span
                  className={`text-sm ${
                    productDetailsCharCount > MAX_PRODUCT_DETAILS_CHARS
                      ? "text-red-600"
                      : "text-gray-500"
                  }`}
                >
                  {productDetailsCharCount} / {MAX_PRODUCT_DETAILS_CHARS}
                </span>
              </div>
              <CKEditor
                editor={ClassicEditor}
                data={formData.product_details}
                config={{
                  toolbar: [
                    "bold",
                    "italic",
                    "bulletedList",
                    "numberedList",
                    "|",
                    "undo",
                    "redo",
                  ],
                }}
                onChange={(event, editor) => {
                  const data = editor.getData();
                  const plainText = data.replace(/<[^>]+>/g, "").trim();
                  const charCount = plainText.length;
                  setProductDetailsCharCount(charCount);
                  if (charCount <= MAX_PRODUCT_DETAILS_CHARS) {
                    setFormData((prev) => ({ ...prev, product_details: data }));
                  } else {
                    editor.setData(formData.product_details);
                  }
                }}
                onReady={(editor) => {
                  const initial = editor
                    .getData()
                    .replace(/<[^>]+>/g, "")
                    .trim();
                  setProductDetailsCharCount(initial.length);
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Warranty Info
              </label>
              <CKEditor
                editor={ClassicEditor}
                data={formData.warranty_info}
                onChange={(event, editor) =>
                  setFormData((prev) => ({
                    ...prev,
                    warranty_info: editor.getData(),
                  }))
                }
              />
            </div>
          </div>
        </div>

        {/* ── What's in the Box ── */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-lg font-semibold mb-4">What's in the Box</h2>
          <div className="space-y-4">
            {whatsInTheBox?.map((item, index) => (
              <div key={index} className="flex gap-4 items-start">
                <div className="flex-1">
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) =>
                      handleWhatsInTheBoxChange(index, "title", e.target.value)
                    }
                    placeholder="Item Title"
                    className="w-full rounded-2xl border-gray-300 shadow-sm"
                    maxLength={50}
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={item.details}
                    onChange={(e) =>
                      handleWhatsInTheBoxChange(
                        index,
                        "details",
                        e.target.value,
                      )
                    }
                    placeholder="Details"
                    className="w-full rounded-2xl border-gray-300 shadow-sm"
                    maxLength={100}
                  />
                </div>
                {whatsInTheBox.length > 1 && (
                  <button
                    onClick={() => removeWhatsInTheBox(index)}
                    className="text-red-500 hover:text-red-700 mt-7"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            ))}
            {whatsInTheBox.length < 4 && (
              <button
                onClick={addWhatsInTheBox}
                className="flex items-center gap-2 text-primary-100 hover:text-blue-700"
              >
                <Plus size={20} /> Add Item (Max 4)
              </button>
            )}
          </div>
        </div>

        {/* ── Variations ── */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Variations</h2>
            <div className="flex items-center gap-6">
              {formData.is_variation && (
                <div className="flex gap-4 items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="mode"
                      checked={variationMode === "color_size"}
                      onChange={() => {
                        setVariationMode("color_size");
                        setVariations([createDefaultColorVariation()]);
                      }}
                    />
                    <span>Color + Size</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="mode"
                      checked={variationMode === "custom"}
                      onChange={() => {
                        setVariationMode("custom");
                        setVariations([createDefaultCustomVariation()]);
                      }}
                    />
                    <span>Custom Attribute</span>
                  </label>
                </div>
              )}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_variation"
                  checked={formData.is_variation}
                  onChange={handleInputChange}
                />
                <span>Enable Variations</span>
              </label>
            </div>
          </div>

          {/* Color-size mode */}
          {formData.is_variation && variationMode === "color_size" && (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="color-variations" type="VARIATION">
                {(provided) => (
                  <div
                    className="space-y-6"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    {variations.map((variation, colorIndex) => (
                      <Draggable
                        key={`color-${colorIndex}`}
                        draggableId={`color-${colorIndex}`}
                        index={colorIndex}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`border rounded-2xl p-4 bg-white ${
                              snapshot.isDragging
                                ? "shadow-lg ring-2 ring-blue-300"
                                : ""
                            }`}
                          >
                            <div className="flex gap-4 mb-4">
                              {/* Drag handle */}
                              <div
                                {...provided.dragHandleProps}
                                className="flex items-center text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing mt-6"
                                title="Drag to reorder"
                              >
                                <GripVertical size={20} />
                              </div>
                              <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700">
                                  Color
                                </label>
                                <select
                                  value={variation.color_id}
                                  onChange={(e) =>
                                    handleVariationChange(
                                      colorIndex,
                                      "color_id",
                                      e.target.value,
                                    )
                                  }
                                  className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm"
                                >
                                  <option value="">Select Color</option>
                                  {colors.map((color) => (
                                    <option key={color.id} value={color.id}>
                                      {color.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <button
                                onClick={() => removeColorVariation(colorIndex)}
                                className="text-red-500 hover:text-red-700 self-end"
                              >
                                <X size={20} />
                              </button>
                            </div>

                            <div className="mt-4">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-sm font-medium text-gray-700">
                                  Media for{" "}
                                  {colors.find(
                                    (c) => c.id === variation.color_id,
                                  )?.name || `Variation ${colorIndex + 1}`}
                                </h3>
                                <button
                                  className="flex items-center gap-1 text-sm text-gray-600"
                                  onClick={() => setIsGuideModalOpen(true)}
                                  type="button"
                                >
                                  <BsQuestionCircle />
                                </button>
                              </div>
                              {renderMediaUploadSection(colorIndex)}
                            </div>

                            {/* Sizes with drag-and-drop */}
                            <Droppable
                              droppableId={`sizes-${colorIndex}`}
                              type="COLOR_SIZE"
                            >
                              {(sProvided) => (
                                <div
                                  className="space-y-4 mt-4"
                                  ref={sProvided.innerRef}
                                  {...sProvided.droppableProps}
                                >
                                  {variation.sizes.map((size, sizeIndex) => {
                                    const usedSizeIds = variation.sizes
                                      .filter((_, i) => i !== sizeIndex)
                                      .map((s) => s.size_id)
                                      .filter(Boolean);
                                    return (
                                      <Draggable
                                        key={`size-${colorIndex}-${sizeIndex}`}
                                        draggableId={`size-${colorIndex}-${sizeIndex}`}
                                        index={sizeIndex}
                                      >
                                        {(sDraggable, sSnapshot) => (
                                          <div
                                            ref={sDraggable.innerRef}
                                            {...sDraggable.draggableProps}
                                            className={`border rounded-lg p-4 bg-white ${
                                              sSnapshot.isDragging
                                                ? "shadow-lg ring-2 ring-blue-200"
                                                : ""
                                            }`}
                                          >
                                            <div className="flex items-start gap-2">
                                              {/* Size drag handle */}
                                              <div
                                                {...sDraggable.dragHandleProps}
                                                className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing mt-7"
                                                title="Drag to reorder size"
                                              >
                                                <GripVertical size={16} />
                                              </div>
                                              <div className="flex-1">
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                                                  <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                      Size{" "}
                                                      <span className="text-red-500">
                                                        *
                                                      </span>
                                                    </label>
                                                    <select
                                                      value={size.size_id}
                                                      onChange={(e) =>
                                                        handleSizeChange(
                                                          colorIndex,
                                                          sizeIndex,
                                                          "size_id",
                                                          e.target.value,
                                                        )
                                                      }
                                                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                                    >
                                                      <option value="">
                                                        Select Size
                                                      </option>
                                                      {sizes.map((s) => (
                                                        <option
                                                          key={s.id}
                                                          value={s.id}
                                                          disabled={usedSizeIds.includes(
                                                            s.id,
                                                          )}
                                                        >
                                                          {s.name}
                                                        </option>
                                                      ))}
                                                    </select>
                                                  </div>
                                                  <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                      Stock{" "}
                                                      <span className="text-red-500">
                                                        *
                                                      </span>
                                                    </label>
                                                    <input
                                                      type="number"
                                                      onKeyDown={(e) =>
                                                        e.key === "e" &&
                                                        e.preventDefault()
                                                      }
                                                      value={size.stock}
                                                      onChange={(e) =>
                                                        handleSizeChange(
                                                          colorIndex,
                                                          sizeIndex,
                                                          "stock",
                                                          e.target.value,
                                                        )
                                                      }
                                                      min={0}
                                                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                                    />
                                                  </div>
                                                  <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                      Original Price{" "}
                                                      <span className="text-red-500">
                                                        *
                                                      </span>
                                                    </label>
                                                    <input
                                                      type="number"
                                                      onKeyDown={(e) =>
                                                        e.key === "e" &&
                                                        e.preventDefault()
                                                      }
                                                      value={
                                                        size.original_price
                                                      }
                                                      onChange={(e) =>
                                                        handleSizeChange(
                                                          colorIndex,
                                                          sizeIndex,
                                                          "original_price",
                                                          e.target.value,
                                                        )
                                                      }
                                                      min={0}
                                                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                                    />
                                                  </div>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                                                  <div className="sm:col-span-3">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                      Selling Price{" "}
                                                      <span className="text-red-500">
                                                        *
                                                      </span>
                                                    </label>
                                                    <input
                                                      type="number"
                                                      onKeyDown={(e) =>
                                                        e.key === "e" &&
                                                        e.preventDefault()
                                                      }
                                                      value={
                                                        size.discounted_price
                                                      }
                                                      onChange={(e) =>
                                                        handleSizeChange(
                                                          colorIndex,
                                                          sizeIndex,
                                                          "discounted_price",
                                                          e.target.value,
                                                        )
                                                      }
                                                      min={0}
                                                      className={`w-full rounded-lg border px-3 py-2 text-sm ${
                                                        priceErrors.variations[
                                                          colorIndex
                                                        ]?.sizes?.[sizeIndex]
                                                          ? "border-red-500"
                                                          : "border-gray-300"
                                                      }`}
                                                    />
                                                    {priceErrors.variations[
                                                      colorIndex
                                                    ]?.sizes?.[sizeIndex] && (
                                                      <p className="mt-1 text-xs text-red-600">
                                                        {
                                                          priceErrors
                                                            .variations[
                                                            colorIndex
                                                          ].sizes[sizeIndex]
                                                        }
                                                      </p>
                                                    )}
                                                  </div>
                                                  <div className="sm:col-span-3">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                      Barcode
                                                    </label>
                                                    <input
                                                      type="text"
                                                      value={size.barcode}
                                                      onChange={(e) =>
                                                        handleSizeChange(
                                                          colorIndex,
                                                          sizeIndex,
                                                          "barcode",
                                                          e.target.value,
                                                        )
                                                      }
                                                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                                    />
                                                  </div>
                                                  <div className="sm:col-span-4">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                      SKU{" "}
                                                      <span className="text-red-500">
                                                        *
                                                      </span>
                                                    </label>
                                                    <div className="flex gap-2">
                                                      <input
                                                        type="text"
                                                        value={size.sku}
                                                        onChange={(e) =>
                                                          handleSizeChange(
                                                            colorIndex,
                                                            sizeIndex,
                                                            "sku",
                                                            e.target.value,
                                                          )
                                                        }
                                                        placeholder="e.g., PROD-001"
                                                        className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
                                                          variationErrors[
                                                            colorIndex
                                                          ]?.sizes?.[sizeIndex]
                                                            ?.sku
                                                            ? "border-red-500"
                                                            : "border-gray-300"
                                                        }`}
                                                      />
                                                      <button
                                                        type="button"
                                                        onClick={() =>
                                                          handleGenerateVariationSKU(
                                                            colorIndex,
                                                            sizeIndex,
                                                          )
                                                        }
                                                        title="Auto-generate SKU"
                                                        className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm"
                                                      >
                                                        <RefreshCw size={16} />
                                                      </button>
                                                    </div>
                                                  </div>
                                                  <div className="sm:col-span-2 flex justify-end">
                                                    {variation.sizes.length >
                                                      1 && (
                                                      <button
                                                        onClick={() =>
                                                          removeSizeFromColor(
                                                            colorIndex,
                                                            sizeIndex,
                                                          )
                                                        }
                                                        title="Remove size"
                                                        className="px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                                                      >
                                                        <X size={18} />
                                                      </button>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </Draggable>
                                    );
                                  })}
                                  {sProvided.placeholder}
                                  <button
                                    onClick={() => addSizeToColor(colorIndex)}
                                    className="flex items-center gap-2 text-primary-100 hover:text-blue-700"
                                  >
                                    <Plus size={20} /> Add Size
                                  </button>
                                </div>
                              )}
                            </Droppable>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    <button
                      onClick={addColorVariation}
                      className="flex items-center gap-2 text-primary-100 hover:text-blue-700"
                    >
                      <Plus size={20} /> Add Color Variation
                    </button>
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}

          {/* Custom attribute mode */}
          {formData.is_variation &&
            variationMode === "custom" &&
            renderCustomVariations()}
        </div>

        {/* ── Specifications ── */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-lg font-semibold mb-4">Product Specifications</h2>
          <div className="space-y-4">
            {specifications?.map((spec, index) => (
              <div key={index} className="flex gap-4 items-start">
                <div className="flex-1">
                  <input
                    type="text"
                    value={spec.feature}
                    onChange={(e) =>
                      handleSpecificationChange(
                        index,
                        "feature",
                        e.target.value,
                      )
                    }
                    placeholder="Feature"
                    className="w-full rounded-2xl border-gray-300 shadow-sm"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={spec.specification}
                    onChange={(e) =>
                      handleSpecificationChange(
                        index,
                        "specification",
                        e.target.value,
                      )
                    }
                    placeholder="Specification"
                    className="w-full rounded-2xl border-gray-300 shadow-sm"
                  />
                </div>
                <button
                  onClick={() => removeSpecification(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X />
                </button>
              </div>
            ))}
            <button
              onClick={addSpecification}
              className={`flex items-center gap-2 text-primary-100 hover:text-blue-700 ${
                specifications.length >= 7
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
              disabled={specifications.length >= 7}
            >
              <Plus size={20} /> Add Specification
            </button>
          </div>
        </div>

        {/* ── Pricing & Inventory ── */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-lg font-semibold mb-4">Pricing & Inventory</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                Original Price (MRP) <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                onKeyDown={(e) => e.key === "e" && e.preventDefault()}
                name="original_price"
                value={formData.original_price}
                onChange={handleInputChange}
                min={0}
                className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                Selling Price (Discounted Price){" "}
                <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                onKeyDown={(e) => e.key === "e" && e.preventDefault()}
                name="discounted_price"
                value={formData.discounted_price}
                onChange={handleInputChange}
                min={0}
                className={`mt-1 block w-full rounded-2xl border-gray-300 shadow-sm ${
                  priceErrors.main ? "border-red-500" : ""
                }`}
              />
              {priceErrors.main && (
                <p className="mt-1 text-sm text-red-600">{priceErrors.main}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                Stock <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                onKeyDown={(e) => e.key === "e" && e.preventDefault()}
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                min={0}
                className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                Low Stock Threshold <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                onKeyDown={(e) => e.key === "e" && e.preventDefault()}
                name="low_stock_threshold"
                value={formData.low_stock_threshold}
                onChange={handleInputChange}
                max={formData.stock}
                min={0}
                className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                SKU <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 flex gap-2 items-center">
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleInputChange}
                  placeholder="e.g., PROD-001"
                  className={`flex-1 rounded-2xl border-gray-300 shadow-sm ${
                    mainProductErrors.main_sku ? "border-red-500" : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={handleGenerateMainSKU}
                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded-2xl hover:bg-blue-200 flex items-center gap-1"
                >
                  <RefreshCw size={16} /> Auto
                </button>
              </div>
              {mainProductErrors.main_sku && (
                <p className="mt-1 text-sm text-red-600">
                  {mainProductErrors.main_sku}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Barcode
              </label>
              <input
                type="text"
                name="barcode"
                value={formData.barcode}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* ── Charges & Shipping ── */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-lg font-semibold mb-4">Charges & Shipping</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Other Charges (Default)
                </label>
                <input
                  type="number"
                  onKeyDown={(e) => e.key === "e" && e.preventDefault()}
                  name="platform_fee"
                  value={formData.platform_fee}
                  min={0}
                  onChange={handleInputChange}
                  disabled
                  className="mt-1 block w-full bg-gray-200 rounded-2xl border-gray-300 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Shipping Charge
                </label>
                <div className="mt-1 flex items-center gap-4">
                  <div className="flex-1 bg-gray-50 border border-gray-300 rounded-2xl px-4 py-2 text-gray-800 font-medium">
                    ₹{calculatedShipping + settingsShipping}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Dead Weight (g)
                </label>
                <input
                  type="number"
                  onKeyDown={(e) => e.key === "e" && e.preventDefault()}
                  name="package_weight"
                  value={formData.package_weight}
                  min={0}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Volumetric Weight (kg)
                </label>
                <div className="mt-1 block w-full rounded-2xl border border-gray-300 bg-gray-50 px-3 py-2 text-gray-700 shadow-sm">
                  {formData.volumetric_weight || 0} kg
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Length (cm) <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  onKeyDown={(e) => e.key === "e" && e.preventDefault()}
                  name="package_length"
                  value={formData.package_length}
                  min={0}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Width (cm) <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  onKeyDown={(e) => e.key === "e" && e.preventDefault()}
                  name="package_width"
                  value={formData.package_width}
                  min={0}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Height (cm) <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  onKeyDown={(e) => e.key === "e" && e.preventDefault()}
                  name="package_height"
                  value={formData.package_height}
                  min={0}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Depth (cm)
                </label>
                <input
                  type="number"
                  onKeyDown={(e) => e.key === "e" && e.preventDefault()}
                  name="package_depth"
                  value={formData.package_depth}
                  min={0}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Media (non-variation) ── */}
        {!formData.is_variation && (
          <div className="bg-white p-6 rounded-2xl shadow">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-semibold">Media</h2>
              <button
                className="flex items-center gap-1 text-sm text-gray-600"
                onClick={() => setIsGuideModalOpen(true)}
                type="button"
              >
                <BsQuestionCircle />
              </button>
            </div>
            {renderMediaUploadSection()}
          </div>
        )}

        {/* ── Additional Settings ── */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-lg font-semibold mb-4">Additional Settings</h2>
          <div className="flex justify-between items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Visibility
              </label>
              <select
                name="visibility"
                value={formData.visibility}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm"
              >
                <option value="Hidden">Hidden</option>
                <option value="Published">Published</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_featured"
                checked={formData.is_featured}
                onChange={handleInputChange}
                className="rounded border-gray-300"
              />
              <label className="text-sm text-gray-700">Featured Product</label>
            </div>
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div className="flex justify-between py-4">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-2xl hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={() => handleSubmit()}
            className="px-6 py-2 bg-[#F47954] text-white rounded-md flex items-center justify-center gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                {isEditMode ? "Updating..." : "Creating..."}
              </>
            ) : isEditMode ? (
              "Update Product"
            ) : (
              "Create Product"
            )}
          </button>
        </div>
      </div>

      {/* ── Right sidebar ── */}
      <div className="w-[420px] space-y-6 mt-15 flex-shrink-0">
        <div className="sticky top-24 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow">
            <h2 className="text-lg font-semibold mb-6">
              Bank Settlement Breakdown
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 font-semibold">MRP</span>
                <span className="font-medium">
                  ₹{parseFloat(formData.original_price || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 font-semibold">Sale Amount</span>
                <span className="font-medium">
                  ₹{parseFloat(formData.discounted_price || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 font-semibold">GST</span>
                <span className="font-medium">
                  - ₹
                  {(
                    (parseFloat(formData.discounted_price || 0) *
                      parseFloat(formData.gst || 0)) /
                    100
                  ).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">TDS (Rs.)</span>
                <span className="font-medium">
                  -₹
                  {(parseFloat(formData.discounted_price || 0) * 0.02).toFixed(
                    2,
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Bank Settlement Value</span>
                <span className="font-medium">
                  ₹
                  {(
                    parseFloat(formData.discounted_price || 0) -
                    parseFloat(formData.discounted_price || 0) * 0.02 -
                    (parseFloat(formData.discounted_price || 0) *
                      parseFloat(formData.gst || 0)) /
                      100
                  ).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping Fee</span>
                <span className="font-medium">
                  ₹
                  {(
                    parseFloat(formData.shipping_charges || 0) +
                    settingsShipping
                  ).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Other Charges (Rs.)</span>
                <span className="font-medium">
                  ₹{parseFloat(formData.platform_fee || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t pt-2">
                <span className="text-gray-600">Listing Price</span>
                <span className="font-medium">
                  ₹
                  {(
                    parseFloat(formData.discounted_price || 0) +
                    parseFloat(formData.shipping_charges || 0) +
                    parseFloat(formData.platform_fee || 0)
                  ).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {formData.is_variation && variationMode === "custom" && (
            <div className="bg-white rounded-2xl shadow mt-8 border-t p-6">
              <h2 className="text-lg font-semibold mb-4">
                Bank Settlement – Variations
              </h2>
              <div className="space-y-4">
                {variations.map((variation, index) => {
                  const attrLabel = variation.attributes?.[0]?.attribute_value
                    ? variation.attributes
                        .map((a) => a.attribute_value)
                        .filter(Boolean)
                        .join(" / ")
                    : `Variation ${index + 1}`;
                  const isExpanded = expandedVariations[index] || false;
                  const original = parseFloat(variation.original_price || 0);
                  const discounted = parseFloat(
                    variation.discounted_price || 0,
                  );
                  const gstRate = parseFloat(formData.gst || 0);
                  const gstAmount = (discounted * gstRate) / 100;
                  const tds = discounted * 0.02;
                  const settlement = discounted - tds - gstAmount;
                  const shipping = parseFloat(formData.shipping_charges || 0);
                  const platform = parseFloat(formData.platform_fee || 0);
                  const listing = discounted + shipping + platform;

                  return (
                    <div
                      key={index}
                      className="border rounded-xl overflow-hidden"
                    >
                      <button
                        onClick={() => toggleVariation(index)}
                        className="w-full px-4 py-3 flex justify-between items-center text-left bg-gray-50 hover:bg-gray-100"
                      >
                        <span className="font-medium text-sm">{attrLabel}</span>
                        <svg
                          className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : "rotate-0"
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                      {isExpanded && (
                        <div className="p-4 bg-white space-y-2">
                          {[
                            ["MRP", `₹${original.toFixed(2)}`],
                            ["Sale Amount", `₹${discounted.toFixed(2)}`],
                            ["GST", `- ₹${gstAmount.toFixed(2)}`],
                            ["TDS", `-₹${tds.toFixed(2)}`],
                            ["Bank Settlement", `₹${settlement.toFixed(2)}`],
                            ["Shipping", `₹${shipping.toFixed(2)}`],
                            ["Other Charges", `₹${platform.toFixed(2)}`],
                          ].map(([label, val]) => (
                            <div
                              key={label}
                              className="flex justify-between text-sm"
                            >
                              <span className="text-gray-600">{label}</span>
                              <span className="font-medium">{val}</span>
                            </div>
                          ))}
                          <div className="flex justify-between text-sm font-bold border-t pt-2">
                            <span className="text-gray-600">Listing Price</span>
                            <span>₹{listing.toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {formData.is_variation && variationMode === "color_size" && (
            <div className="bg-white rounded-2xl shadow mt-8 border-t p-6">
              <h2 className="text-lg font-semibold mb-4">
                Bank Settlement – Variations
              </h2>
              <div className="space-y-4">
                {variations.map((variation, index) => {
                  const variationName =
                    colors.find(
                      (c) => parseInt(c.id) === parseInt(variation.color_id),
                    )?.name || `Color ${index + 1}`;
                  const isExpanded = expandedVariations[index] || false;

                  return (
                    <div
                      key={index}
                      className="border rounded-xl overflow-hidden"
                    >
                      <button
                        onClick={() => toggleVariation(index)}
                        className="w-full px-4 py-3 flex justify-between items-center text-left bg-gray-50 hover:bg-gray-100"
                      >
                        <span className="font-medium">{variationName}</span>
                        <svg
                          className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : "rotate-0"
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                      {isExpanded && (
                        <div className="p-4 bg-white space-y-6">
                          {variation.sizes.map((size, sIdx) => {
                            const sizeName =
                              sizes.find(
                                (s) =>
                                  parseInt(s.id) === parseInt(size.size_id),
                              )?.name || `Size ${sIdx + 1}`;
                            const original = parseFloat(
                              size.original_price || 0,
                            );
                            const discounted = parseFloat(
                              size.discounted_price || 0,
                            );
                            const gstRate = parseFloat(formData.gst || 0);
                            const gstAmount = (discounted * gstRate) / 100;
                            const tds = discounted * 0.02;
                            const settlement = discounted - tds - gstAmount;
                            const shipping = parseFloat(
                              formData.shipping_charges || 0,
                            );
                            const platform = parseFloat(
                              formData.platform_fee || 0,
                            );
                            const listing = discounted + shipping + platform;

                            return (
                              <div
                                key={sIdx}
                                className="space-y-2 border-b pb-4 last:border-b-0 last:pb-0"
                              >
                                <h3 className="text-sm font-semibold text-gray-800">
                                  {sizeName}
                                </h3>
                                {[
                                  ["MRP", `₹${original.toFixed(2)}`],
                                  ["Sale Amount", `₹${discounted.toFixed(2)}`],
                                  ["GST", `- ₹${gstAmount.toFixed(2)}`],
                                  ["TDS", `-₹${tds.toFixed(2)}`],
                                  [
                                    "Bank Settlement",
                                    `₹${settlement.toFixed(2)}`,
                                  ],
                                  ["Shipping", `₹${shipping.toFixed(2)}`],
                                  ["Other Charges", `₹${platform.toFixed(2)}`],
                                ].map(([label, val]) => (
                                  <div
                                    key={label}
                                    className="flex justify-between text-sm"
                                  >
                                    <span className="text-gray-600">
                                      {label}
                                    </span>
                                    <span className="font-medium">{val}</span>
                                  </div>
                                ))}
                                <div className="flex justify-between text-sm font-bold border-t pt-2">
                                  <span className="text-gray-600">
                                    Listing Price
                                  </span>
                                  <span>₹{listing.toFixed(2)}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {renderPreviewModal()}

      {isGuideModalOpen && (
        <ImageGuidelinesModal
          isOpen={isGuideModalOpen}
          onClose={() => setIsGuideModalOpen(false)}
        />
      )}

      {notification.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-auto shadow-2xl">
            <div className="flex flex-col items-center gap-4">
              <div
                className={`p-3 rounded-full ${
                  notification.type === "success"
                    ? "bg-green-100"
                    : "bg-red-100"
                }`}
              >
                {notification.type === "success" ? (
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-6 h-6 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                )}
              </div>
              <p
                className={`text-center text-lg font-semibold ${
                  notification.type === "success"
                    ? "text-green-800"
                    : "text-red-800"
                }`}
              >
                {notification.message}
              </p>
              <button
                onClick={closeNotification}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 w-full"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="fixed top-0 left-0 right-0 h-1 bg-blue-500/30 z-50 overflow-hidden">
            <div className="h-full bg-blue-600 origin-left-right animate-progress-bar" />
          </div>
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="bg-white/90 backdrop-blur-sm px-6 py-4 rounded-lg shadow-xl flex items-center gap-3 text-gray-700 font-medium">
              <svg
                className="animate-spin h-5 w-5 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>
                {isEditMode ? "Updating product..." : "Creating product..."}{" "}
                Please wait
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddEditProduct;
