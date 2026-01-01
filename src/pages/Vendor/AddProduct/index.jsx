import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CiImageOn, CiVideoOn } from "react-icons/ci";
import { X, Plus, Eye } from "lucide-react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import {
  addProduct,
  updateProduct,
  getProductById,
} from "../../../services/api.product";
import { getAllColors } from "../../../services/api.color";
import { getAllSizes } from "../../../services/api.size";
import {
  getCategories,
  getSubCategories,
  getInnerSubCategories,
} from "../../../services/api.category";
import { getAllFabricsByStatus } from "../../../services/api.fabric";
import { getAllAttributes } from "../../../services/api.attribute";
import slugify from "slugify";
import advertisement from "/assets/banners/advertisement_banner.png";
import config from "../../../config/config";
import ImageGuidelinesModal from "../../../components/Vendor/Models/ImageGuidelinesModal";
import { BsQuestionCircle } from "react-icons/bs";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import { getSettings } from "../../../services/api.settings";
import { notifyOnFail } from "../../../utils/notification/toast";
import { useAppContext } from "../../../context/AppContext";

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
    []
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
  });

  const [specifications, setSpecifications] = useState([
    { feature: "", specification: "" },
  ]);

  const [variations, setVariations] = useState([
    {
      color_id: "",
      attribute_id: "",
      attribute_value: "",
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
    },
  ]);
  const [priceErrors, setPriceErrors] = useState({ main: "", variations: [] });
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    url: "",
    type: "",
  });

  // ====== DATA FETCHING ======
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
        })) || []
      );
      setSubCategories(
        subRes.data?.map((c) => ({
          id: c.id,
          name: c.title,
          categoryId: c.cat_id,
          hsn_code: c.hsn_code,
          gst: c.gst,
        })) || []
      );
      setInnerSubCategories(
        innerRes.data?.map((c) => ({
          id: c.id,
          name: c.title,
          subCategoryId: c.sub_cat_id,
          hsn_code: c.hsn_code,
          gst: c.gst,
        })) || []
      );
      setColors(colorRes.status === 1 ? colorRes.data : []);
      setAttributes(attrRes.status === 1 ? attrRes.data : []);
      if (settingsRes.status === 1) {
        setFormData((prev) => ({
          ...prev,
          platform_fee: settingsRes.data.platform_fee,
        }));
      }
    };
    fetchData();
  }, []);

  // dynamic size fetching
  useEffect(() => {
    const fetchSizes = async () => {
      try {
        const query = {};
        // if (formData.inner_sub_category_id) {
        //   query.innerSubCategoryId = formData.inner_sub_category_id;
        // }
        if (formData.category_id) {
          query.categoryId = formData.category_id;
        }
        if (formData.sub_category_id) {
          query.subCategoryId = formData.sub_category_id;
        }
        if (formData.inner_sub_category_id) {
          query.innerSubCategoryId = formData.inner_sub_category_id;
        }

        const res = await getAllSizes(query);
        if (res.status === 1) {
          setSizes(res.data);
        }
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

  // dynamic fabric fetching when category is selected
  useEffect(() => {
    const getAllFabrics = async () => {
      const query = {};
      if (formData.category_id) {
        query.categoryId = formData.category_id;
      }
      if (formData.sub_category_id) {
        query.subCatId = formData.sub_category_id;
      }
      if (formData.inner_sub_category_id) {
        query.innerSubCatId = formData.inner_sub_category_id;
      }

      const res = await getAllFabricsByStatus(query);
      const formattedFabrics = res?.map((data) => ({
        id: data.id,
        name: data.name,
      }));
      setFabrics(formattedFabrics || []);
    };

    getAllFabrics();
  }, [
    formData.category_id,
    formData.sub_category_id,
    formData.inner_sub_category_id,
  ]);

  useEffect(() => {
    if (isEditMode) {
      fetchProductData();
    }
  }, [id]);

  // Update category details when category is selected
  useEffect(() => {
    if (formData.category_id) {
      const category = categories.find(
        (c) => c.id === parseInt(formData.category_id)
      );
      setSelectedCategoryDetails(category);

      // Set type from category
      if (category?.type) {
        setFormData((prev) => ({
          ...prev,
          type: category.type,
        }));
      }
    }
  }, [formData.category_id, categories]);

  // Update subcategory details when subcategory is selected
  useEffect(() => {
    if (formData.sub_category_id) {
      const subCategory = subCategories.find(
        (sc) => sc.id === parseInt(formData.sub_category_id)
      );
      setSelectedSubCategoryDetails(subCategory);
    }
  }, [formData.sub_category_id, subCategories]);

  // Update inner subcategory details when inner subcategory is selected
  useEffect(() => {
    if (formData.inner_sub_category_id) {
      const innerSubCategory = innerSubCategories.find(
        (isc) => isc.id === parseInt(formData.inner_sub_category_id)
      );
      setSelectedInnerSubCategoryDetails(innerSubCategory);
    }
  }, [formData.inner_sub_category_id, innerSubCategories]);

  useEffect(() => {
    if (formData.category_id && subCategories.length > 0) {
      const filtered = subCategories.filter(
        (subCat) => subCat.categoryId === parseInt(formData.category_id)
      );
      setFilteredSubCategories(filtered);
    } else {
      setFilteredSubCategories([]);
    }
  }, [formData.category_id, subCategories]);

  useEffect(() => {
    if (formData.sub_category_id && innerSubCategories.length > 0) {
      const filtered = innerSubCategories.filter(
        (innerSubCat) =>
          innerSubCat.subCategoryId === parseInt(formData.sub_category_id)
      );
      setFilteredInnerSubCategories(filtered);
    } else {
      setFilteredInnerSubCategories([]);
    }
  }, [formData.sub_category_id, innerSubCategories]);

  // Validate stock threshold doesn't exceed stock
  useEffect(() => {
    if (parseInt(formData.low_stock_threshold) > parseInt(formData.stock)) {
      setFormData((prev) => ({
        ...prev,
        low_stock_threshold: formData.stock,
      }));
    }
  }, [formData.stock, formData.low_stock_threshold]);

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
          : [{ feature: "", specification: "" }]
      );

      const updatedFormData = {
        ...p,
        tags: parsedTags,
        specifications: parsedSpecs,
        category_id: p.category_id || "",
      };

      setTimeout(() => {
        setFormData(updatedFormData);
        if (p.variationMode) {
          setVariationMode(p.variationMode);
        }

        // transform variations
        if (p.variations && p.variations.length > 0) {
          let formattedVariations = [];

          if (p.variationMode === "color_size") {
            formattedVariations = p.variations.map((group) => ({
              color_id: group.color_id?.toString(),
              media: group.media || [],
              sizes: group.sizes.map((size) => ({
                size_id: size.size_id?.toString(),
                stock: size.stock?.toString() || "",
                original_price: size.original_price?.toString() || "",
                discounted_price: size.discounted_price?.toString() || "",
                sku: size.sku || "",
                barcode: size.barcode || "",
              })),
            }));
          } else if (p.variationMode === "custom") {
            formattedVariations = p.variations.map((group) => ({
              attribute_id: group.attribute_id?.toString() || "",
              attribute_value: group.attribute_value || "",
              media: group.media || [],
              sizes: group.sizes.map((opt) => ({
                stock: opt.stock?.toString() || "",
                original_price: opt.original_price?.toString() || "",
                discounted_price: opt.discounted_price?.toString() || "",
                sku: opt.sku || "",
                barcode: opt.barcode || "",
              })),
            }));
          }

          setVariations(formattedVariations);
        }

        setDeletedMediaIds([]); // Reset deletes for new session

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

  // ====== HELPER FUNCTIONS ======
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

  // ====== HANDLERS ======
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "name") {
      const newSlug = generateSlug(value);
      const newMetaTitle = `${value} | IERADA`;
      const capitalizedValue = value.replace(/\b\w/g, (char) =>
        char.toUpperCase()
      );
      setFormData((prev) => ({
        ...prev,
        [name]: capitalizedValue,
        slug: newSlug,
        meta_title: newMetaTitle,
      }));
      setPriceErrors((prev) => ({ ...prev, main: "" }));
    } else if (name === "category_id") {
      setFormData((prev) => ({
        ...prev,
        category_id: value,
        sub_category_id: "",
        inner_sub_category_id: "",
      }));
      setPriceErrors((prev) => ({ ...prev, main: "" }));
    } else if (name === "sub_category_id") {
      setFormData((prev) => ({
        ...prev,
        sub_category_id: value,
        inner_sub_category_id: "",
      }));
      setPriceErrors((prev) => ({ ...prev, main: "" }));
    } else if (name === "low_stock_threshold") {
      // Ensure threshold doesn't exceed stock
      const threshold = Math.min(
        parseInt(value),
        parseInt(formData.stock) || 0
      );
      setFormData((prev) => ({
        ...prev,
        [name]: isNaN(threshold) ? "" : threshold,
      }));
      setPriceErrors((prev) => ({ ...prev, main: "" }));
    } else if (name === "original_price" || name === "discounted_price") {
      const newValue = parseFloat(value) || 0;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));

      // Validate prices
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
      return updated;
    });
  };

  const addVariation = () => {
    setVariations((prev) => [
      ...prev,
      {
        color_id: variationMode === "color_size" ? "" : "",
        attribute_id: variationMode === "custom" ? "" : "",
        attribute_value: variationMode === "custom" ? "" : "",
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
      },
    ]);
  };

  const removeVariation = (idx) => {
    setVariations((prev) => prev.filter((_, i) => i !== idx));
  };

  const addSizeToVariation = (varIdx) => {
    setVariations((prev) => {
      const updated = [...prev];
      updated[varIdx].sizes.push({
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

  const removeSizeFromVariation = (varIdx, sizeIdx) => {
    setVariations((prev) => {
      const updated = [...prev];
      updated[varIdx].sizes = updated[varIdx].sizes.filter(
        (_, i) => i !== sizeIdx
      );
      return updated;
    });
  };

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

    if (formData.is_variation && variationIndex !== null) {
      setVariations((prev) => {
        const updated = [...prev];
        const existingNames = new Set(
          updated[variationIndex].media.map((m) => m.file?.name || m.url)
        );
        const unique = validFiles.filter(
          (f) => !existingNames.has(f.file.name)
        );
        updated[variationIndex].media.push(...unique);
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
    if (formData.is_variation && variationIndex !== null) {
      setVariations((prev) => {
        const updated = [...prev];
        const mediaItem = updated[variationIndex].media[index];
        if (mediaItem.id) setDeletedMediaIds((d) => [...d, mediaItem.id]);
        if (mediaItem.preview) URL.revokeObjectURL(mediaItem.preview);
        updated[variationIndex].media.splice(index, 1);
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

  const handleSpecificationChange = (index, field, value) => {
    const newSpecifications = [...specifications];
    newSpecifications[index][field] = value;
    setSpecifications(newSpecifications);
  };

  const addSpecification = () => {
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

  const addColorVariation = () => {
    setVariations([
      ...variations,
      {
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
      },
    ]);
  };

  const addSizeToColor = (colorIndex) => {
    const newVariations = [...variations];
    newVariations[colorIndex].sizes.push({
      size_id: "",
      stock: "",
      original_price: "",
      discounted_price: "",
      sku: "",
      barcode: "",
    });
    setVariations(newVariations);
  };

  const removeColorVariation = (colorIndex) => {
    setVariations(variations.filter((_, index) => index !== colorIndex));
  };

  const removeSizeFromColor = (colorIndex, sizeIndex) => {
    const newVariations = [...variations];
    newVariations[colorIndex].sizes = newVariations[colorIndex].sizes.filter(
      (_, index) => index !== sizeIndex
    );
    setVariations(newVariations);
  };

  const handleSubmit = async () => {
    if (
      priceErrors.main ||
      priceErrors.variations?.some((v) => v?.sizes?.some((s) => s))
    ) {
      notifyOnFail("Fix price errors first");
      return;
    }
    if (!formData.is_variation && !formData.sku.trim()) {
      notifyOnFail("SKU is required");
      return;
    }
    if (!formData.hsn_code.trim()) {
      notifyOnFail("HSN is required");
      return;
    }

    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, val]) => {
      if (["productFiles", "variations", "specifications"].includes(key))
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
          : val
      );
    });
    formDataToSend.append("specifications", JSON.stringify(specifications));
    if (deletedMediaIds.length > 0) {
      formDataToSend.append("delete_media", JSON.stringify(deletedMediaIds));
    }

    const allNewFiles = [];
    const variationMediaMapping = [];

    if (formData.is_variation) {
      const variationsForSubmit = [];
      variations.forEach((variation, variationIndex) => {
        const isColorMode = variationMode === "color_size";
        let groupingKey;

        if (isColorMode) {
          groupingKey = parseInt(variation.color_id);
          if (!groupingKey) return;
        } else {
          // Custom mode: group by attribute_id + attribute_value
          if (!variation.attribute_id || !variation.attribute_value?.trim())
            return;
          groupingKey = `${
            variation.attribute_id
          }__${variation.attribute_value.trim()}`;
        }

        const { newFiles: variationNewFiles, indices } = generateMediaIndices(
          variation.media || []
        );

        const fileStartIndex = allNewFiles.length;
        allNewFiles.push(...variationNewFiles);

        const globalIndices = indices.map((idx) =>
          typeof idx === "number" ? fileStartIndex + idx : idx
        );

        if (globalIndices.length > 0) {
          variationMediaMapping.push({
            grouping_key: groupingKey,
            file_indices: globalIndices,
          });
        }

        variation.sizes.forEach((size) => {
          variationsForSubmit.push({
            color_id: isColorMode ? groupingKey : null,
            size_id: isColorMode ? parseInt(size.size_id) || null : null,
            attribute_id: !isColorMode
              ? parseInt(variation.attribute_id)
              : null,
            attribute_value: !isColorMode ? variation.attribute_value : null,
            stock: size.stock,
            original_price: size.original_price,
            discounted_price: size.discounted_price,
            sku: size.sku,
            barcode: size.barcode || null,
          });
        });
      });

      formDataToSend.append("variations", JSON.stringify(variationsForSubmit));
      formDataToSend.append(
        "variation_media",
        JSON.stringify(variationMediaMapping)
      );
    } else {
      // Non-variation: main product files
      const { newFiles, indices } = generateMediaIndices(formData.productFiles);
      allNewFiles.push(...newFiles);
      if (indices.length > 0) {
        formDataToSend.append("media_indices", JSON.stringify(indices));
      }
    }

    allNewFiles.forEach((file) => {
      formDataToSend.append("files", file);
    });

    try {
      const response = isEditMode
        ? await updateProduct(id, formDataToSend)
        : await addProduct(formDataToSend);
      if (response.status === 1) {
        navigate(`${config.VITE_BASE_VENDOR_URL}/product`);
      }
    } catch (error) {
      console.error("Error submitting product:", error);
      notifyOnFail("Error submitting product");
    }
  };

  // ====== RENDER HELPERS ======
  const renderMediaPreview = (file, index, variationIndex = null) => {
    const handlePreview = () => {
      setPreviewModal({
        isOpen: true,
        url: file.preview || file.url,
        type: file.type,
      });
    };

    return (
      <div key={index} className="relative group">
        {file.type === "image" ? (
          <img
            src={file.preview || file.url}
            alt="preview"
            className="w-20 h-20 object-cover rounded-lg border"
          />
        ) : (
          <video
            src={file.preview || file.url}
            className="w-20 h-20 object-cover rounded-lg border"
          />
        )}
        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
          <button
            onClick={handlePreview}
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
  };

  const renderMediaSection = (varIdx = null) => (
    <div className="space-y-4">
      <div className="flex gap-4">
        <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-md cursor-pointer hover:bg-gray-200">
          <CiImageOn size={20} /> Add Images{" "}
          <span className="text-red-500">*</span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFileChange(e, varIdx)}
          />
        </label>
        <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-md cursor-pointer hover:bg-gray-200">
          <CiVideoOn size={20} /> Add Videos
          <input
            type="file"
            accept="video/*"
            multiple
            className="hidden"
            onChange={(e) => handleFileChange(e, varIdx)}
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-4">
        {(varIdx !== null
          ? variations[varIdx].media
          : formData.productFiles
        ).map((f, i) => renderMediaPreview(f, i, varIdx))}
      </div>
    </div>
  );

  const renderMediaUploadSection = (variationIndex = null) => (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-md cursor-pointer hover:bg-gray-200">
          <CiImageOn size={20} />
          <span>Add Images</span> <span className=" text-red-500">*</span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFileChange(e, variationIndex)}
          />
        </label>
        <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-md cursor-pointer hover:bg-gray-200">
          <CiVideoOn size={20} />
          <span>Add Videos</span>
          <input
            type="file"
            accept="video/*"
            name="video"
            multiple
            className="hidden"
            onChange={(e) => handleFileChange(e, variationIndex)}
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-4">
        {variationIndex !== null
          ? variations[variationIndex]?.media?.map((file, index) =>
              renderMediaPreview(file, index, variationIndex)
            )
          : formData.productFiles.map((file, index) =>
              renderMediaPreview(file, index)
            )}
      </div>
    </div>
  );

  const renderPreviewModal = () =>
    previewModal.isOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-4 rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
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

  // Tooltip component for hints
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

  const create_add = [
    { id: 1, title: "Create Add", subtitle: "Advertisement Banner of vendors" },
    { id: 2, title: "Create Add", subtitle: "Advertisement Banner of vendors" },
  ];

  return (
    <div className="flex flex-col sm:flex-row h-screen">
      <div className="container px-4 py-2 space-y-6 max-w-[75%] max-h-[100%] flex-1 overflow-y-scroll scrollbar-hide">
        <h1 className="text-3xl font-bold mb-8">
          {isEditMode ? "Edit Product" : "Create a New Product"}
        </h1>

        {/* Basic Information */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
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
                className="mt-1 capitalize block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
              />
            </div>

            {/* Hidden type field - populated from category */}
            <input type="hidden" name="type" value={formData.type} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                  Category <span className="text-red-600">*</span>
                  <TooltipHint
                    id="category-tooltip"
                    content="Main product category. This will determine the product type automatically."
                  />
                </label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
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
                  <TooltipHint
                    id="subcategory-tooltip"
                    content="More specific product classification under the main category"
                  />
                </label>
                <select
                  name="sub_category_id"
                  value={formData.sub_category_id}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
                  disabled={!formData.category_id}
                >
                  <option value="" disabled>
                    Select Subcategory
                  </option>
                  {filteredSubCategories.map((subCategory) => (
                    <option key={subCategory.id} value={subCategory.id}>
                      {subCategory.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                  Inner Subcategory <span className="text-red-600">*</span>
                  <TooltipHint
                    id="inner-subcategory-tooltip"
                    content="Most specific product classification level"
                  />
                </label>
                <select
                  name="inner_sub_category_id"
                  value={formData.inner_sub_category_id}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
                  disabled={!formData.sub_category_id}
                >
                  <option value="" disabled>
                    Select Inner Subcategory
                  </option>
                  {filteredInnerSubCategories.map((innerSubCategory) => (
                    <option
                      key={innerSubCategory.id}
                      value={innerSubCategory.id}
                    >
                      {innerSubCategory.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                  Fabric
                  <TooltipHint
                    id="fabric-tooltip"
                    content="Select the primary fabric material for this product"
                  />
                </label>
                <select
                  name="fabric_id"
                  value={formData.fabric_id}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
                  // readOnly
                />
                {/* <p className="text-xs text-gray-500 mt-1">
                  {selectedInnerSubCategoryDetails?.hsn_code
                    ? "From Inner Subcategory"
                    : selectedSubCategoryDetails?.hsn_code
                    ? "From Subcategory"
                    : selectedCategoryDetails?.hsn_code
                    ? "From Category"
                    : "No HSN code set in category hierarchy"}
                </p> */}
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
                  <input
                    type="number"
                    name="gst"
                    value={formData.gst}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
                    // readOnly
                  />
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
                onChange={(event, editor) => {
                  setFormData((prev) => ({
                    ...prev,
                    general_info: editor.getData(),
                  }));
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Product Details
              </label>
              <CKEditor
                editor={ClassicEditor}
                data={formData.product_details}
                onChange={(event, editor) => {
                  setFormData((prev) => ({
                    ...prev,
                    product_details: editor.getData(),
                  }));
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
                onChange={(event, editor) => {
                  setFormData((prev) => ({
                    ...prev,
                    warranty_info: editor.getData(),
                  }));
                }}
              />
            </div>
          </div>
        </div>

        {/* Specifications */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-1">
            Product Specifications
            <TooltipHint
              id="specifications-tooltip"
              content="List of product specifications."
            />
          </h2>
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
                        e.target.value
                      )
                    }
                    placeholder="Feature"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
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
                        e.target.value
                      )
                    }
                    placeholder="Specification"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
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
              className="flex items-center gap-2 text-blue-500 hover:text-blue-700"
            >
              <Plus size={20} /> Add Specification
            </button>
          </div>
        </div>

        {/* Pricing and Inventory */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Pricing & Inventory</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* <div>
              <label className="block text-sm font-medium text-gray-700">
                Cost Price (Base Price/Manufacturing Price){" "}
                <span className=" text-red-500">*</span>
              </label>
              <input
                type="number"
                name="base_price"
                value={formData.base_price}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
              />
            </div> */}

            {/* Original Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                Original Price (MRP) <span className="text-red-600">*</span>
                <TooltipHint
                  id="original-price-tooltip"
                  content="Maximum Retail Price (MRP) of the product"
                />
              </label>
              <input
                type="number"
                name="original_price"
                value={formData.original_price}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
              />
            </div>

            {/* Selling Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                Selling Price (Discounted Price){" "}
                <span className="text-red-600">*</span>
                <TooltipHint
                  id="selling-price-tooltip"
                  content="Actual selling price after discounts"
                />
              </label>
              <input
                type="number"
                name="discounted_price"
                value={formData.discounted_price}
                onChange={handleInputChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black ${
                  priceErrors.main ? "border-red-500" : ""
                }`}
              />
              {priceErrors.main && (
                <p className="mt-1 text-sm text-red-600">{priceErrors.main}</p>
              )}
              {/* <div className="bg-blue-200 p-2 mt-2 rounded-md">
                <label className="block text-sm font-medium text-gray-700 ">
                  Profit Margin: ₹
                  {(formData.original_price || 0) -
                    (formData.discounted_price || 0)}
                </label>
              </div> */}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                Stock <span className="text-red-600">*</span>
                <TooltipHint
                  id="stock-tooltip"
                  content="Total available quantity of this product"
                />
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                Low Stock Threshold <span className="text-red-600">*</span>
                <TooltipHint
                  id="threshold-tooltip"
                  content="When stock reaches this level, you'll be notified. Cannot exceed total stock."
                />
              </label>
              <input
                type="number"
                name="low_stock_threshold"
                value={formData.low_stock_threshold}
                onChange={handleInputChange}
                max={formData.stock}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                SKU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
                required
              />
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
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
              />
            </div>
          </div>
        </div>

        {/* Render media section only if variations are disabled */}
        {!formData.is_variation && (
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-semibold">Media</h2>
              <button
                className="flex items-center gap-1 text-sm text-gray-600"
                onClick={() => setIsGuideModalOpen(true)}
              >
                <BsQuestionCircle />
              </button>
            </div>
            {renderMediaUploadSection()}
          </div>
        )}

        {/* Variations */}
        <div className="bg-white p-6 rounded-lg shadow">
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
                      onChange={() => setVariationMode("color_size")}
                    />
                    <span>Color + Size</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="mode"
                      checked={variationMode === "custom"}
                      onChange={() => setVariationMode("custom")}
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

          {formData.is_variation && variationMode === "color_size" && (
            <div className="space-y-6">
              {variations?.map((variation, colorIndex) => (
                <div key={colorIndex} className="border rounded-lg p-4">
                  <div className="flex gap-4 mb-4">
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
                            e.target.value
                          )
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
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
                        Media Files for{" "}
                        {colors.find((c) => c.id === variation.color_id)
                          ?.name || `Variation ${colorIndex + 1}`}
                      </h3>
                      <button
                        className="flex items-center gap-1 text-sm text-gray-600"
                        onClick={() => setIsGuideModalOpen(true)}
                      >
                        <BsQuestionCircle />
                      </button>
                    </div>
                    {renderMediaUploadSection(colorIndex)}
                  </div>

                  <div className="space-y-4">
                    {variation.sizes.map((size, sizeIndex) => (
                      <div
                        key={sizeIndex}
                        className="grid grid-cols-6 gap-2 items-end"
                      >
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Size
                          </label>
                          <select
                            value={size.size_id}
                            onChange={(e) =>
                              handleSizeChange(
                                colorIndex,
                                sizeIndex,
                                "size_id",
                                e.target.value
                              )
                            }
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
                          >
                            <option value="">Select Size</option>
                            {sizes.map((size) => (
                              <option key={size.id} value={size.id}>
                                {size.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Stock
                          </label>
                          <input
                            type="number"
                            value={size.stock}
                            onChange={(e) =>
                              handleSizeChange(
                                colorIndex,
                                sizeIndex,
                                "stock",
                                e.target.value
                              )
                            }
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Original Price
                          </label>
                          <input
                            type="number"
                            value={size.original_price}
                            onChange={(e) =>
                              handleSizeChange(
                                colorIndex,
                                sizeIndex,
                                "original_price",
                                e.target.value
                              )
                            }
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Selling Price
                          </label>
                          <input
                            type="number"
                            value={size.discounted_price}
                            onChange={(e) =>
                              handleSizeChange(
                                colorIndex,
                                sizeIndex,
                                "discounted_price",
                                e.target.value
                              )
                            }
                            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black ${
                              priceErrors.variations[colorIndex]?.sizes[
                                sizeIndex
                              ]
                                ? "border-red-500"
                                : ""
                            }`}
                          />
                          {priceErrors.variations[colorIndex]?.sizes[
                            sizeIndex
                          ] && (
                            <p className="mt-1 text-sm text-red-600">
                              {
                                priceErrors.variations[colorIndex].sizes[
                                  sizeIndex
                                ]
                              }
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
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
                                e.target.value
                              )
                            }
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
                          />
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700">
                              SKU <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={size.sku}
                              onChange={(e) =>
                                handleSizeChange(
                                  colorIndex,
                                  sizeIndex,
                                  "sku",
                                  e.target.value
                                )
                              }
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
                              required
                            />
                          </div>
                          <button
                            onClick={() =>
                              removeSizeFromColor(colorIndex, sizeIndex)
                            }
                            className="text-red-500 hover:text-red-700 self-end"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => addSizeToColor(colorIndex)}
                      className="flex items-center gap-2 text-blue-500 hover:text-blue-700"
                    >
                      <Plus size={20} /> Add Size
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={addColorVariation}
                className="flex items-center gap-2 text-blue-500 hover:text-blue-700"
              >
                <Plus size={20} /> Add Color Variation
              </button>
            </div>
          )}

          {formData.is_variation && variationMode === "custom" && (
            <div className="space-y-6">
              {variations.map((variation, index) => (
                <div key={index} className="border rounded-lg p-6 bg-gray-50">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Attribute <span className="text-red-600">*</span>
                      </label>
                      <select
                        value={variation.attribute_id || ""}
                        onChange={(e) =>
                          handleVariationChange(
                            index,
                            "attribute_id",
                            e.target.value
                          )
                        }
                        className="mt-1 block w-full rounded-md border-gray-300"
                      >
                        <option value="">Select Attribute</option>
                        {attributes.map((attr) => (
                          <option key={attr.id} value={attr.id}>
                            {attr.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Attribute Value <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Pure Leather, Matte Finish"
                        value={variation.attribute_value || ""}
                        onChange={(e) =>
                          handleVariationChange(
                            index,
                            "attribute_value",
                            e.target.value
                          )
                        }
                        className="mt-1 block w-full rounded-md border-gray-300"
                      />
                    </div>
                  </div>

                  {/* Media Upload for this variation group */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Media for: {variation.attribute_value || "this variation"}
                    </h4>
                    {renderMediaUploadSection(index)}
                  </div>

                  {/* Options (Sizes) Table */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Options</h4>
                    {variation.sizes.map((size, sIdx) => (
                      <div
                        key={sIdx}
                        className="grid grid-cols-5 gap-3 items-end bg-white p-3 rounded border"
                      >
                        <input
                          placeholder="Stock *"
                          type="number"
                          value={size.stock}
                          onChange={(e) =>
                            handleSizeChange(
                              index,
                              sIdx,
                              "stock",
                              e.target.value
                            )
                          }
                          className="rounded-md border-gray-300"
                        />
                        <input
                          placeholder="Original Price *"
                          type="number"
                          value={size.original_price}
                          onChange={(e) =>
                            handleSizeChange(
                              index,
                              sIdx,
                              "original_price",
                              e.target.value
                            )
                          }
                          className="rounded-md border-gray-300"
                        />
                        <input
                          placeholder="Selling Price *"
                          type="number"
                          value={size.discounted_price}
                          onChange={(e) =>
                            handleSizeChange(
                              index,
                              sIdx,
                              "discounted_price",
                              e.target.value
                            )
                          }
                          className="rounded-md border-gray-300"
                        />
                        <input
                          placeholder="SKU *"
                          type="text"
                          value={size.sku}
                          onChange={(e) =>
                            handleSizeChange(index, sIdx, "sku", e.target.value)
                          }
                          className="rounded-md border-gray-300"
                        />
                        <input
                          placeholder="Barcode"
                          type="text"
                          value={size.barcode}
                          onChange={(e) =>
                            handleSizeChange(
                              index,
                              sIdx,
                              "barcode",
                              e.target.value
                            )
                          }
                          className="rounded-md border-gray-300"
                        />
                        {/* <button
                                    onClick={() => removeSizeFromColor(index, sIdx)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <X size={20} />
                                  </button> */}
                      </div>
                    ))}
                    {/* <button
                                onClick={() => addSizeToColor(index)}
                                className="text-sm text-blue-600 hover:text-blue-700"
                              >
                                + Add Option
                              </button> */}
                  </div>

                  {variations.length > 1 && (
                    <button
                      onClick={() => removeColorVariation(index)}
                      className="text-sm text-red-600 mt-4"
                    >
                      Remove This Variation Group
                    </button>
                  )}
                </div>
              ))}

              <button
                onClick={addColorVariation}
                className="flex items-center gap-2 text-blue-600 font-medium"
              >
                <Plus size={20} /> Add New Variation (e.g. Material, Finish,
                etc.)
              </button>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Charges & Shipping</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Other Charges (Default from Admin)
                </label>
                <input
                  type="number"
                  name="platform_fee"
                  value={formData.platform_fee}
                  onChange={handleInputChange}
                  disabled
                  className="mt-1 block w-full bg-gray-200 rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Dead Weight (g)
                </label>
                <input
                  type="number"
                  name="package_weight"
                  value={formData.package_weight}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Volumetric Weight (g)
                </label>
                <input
                  type="number"
                  name="volumetric_weight"
                  value={formData.volumetric_weight}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Length (cm)
                </label>
                <input
                  type="number"
                  name="package_length"
                  value={formData.package_length}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Width (cm)
                </label>
                <input
                  type="number"
                  name="package_width"
                  value={formData.package_width}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Height (cm)
                </label>
                <input
                  type="number"
                  name="package_height"
                  value={formData.package_height}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Depth (cm)
                </label>
                <input
                  type="number"
                  name="package_depth"
                  value={formData.package_depth}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Additional Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                Visibility
                <TooltipHint
                  id="visibility-tooltip"
                  text="This controls whether or not your product will be visible to customers."
                />
              </label>
              <select
                name="visibility"
                value={formData.visibility}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
              >
                <option value="Hidden">Hidden</option>
                <option value="Published">Published</option>
              </select>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_featured"
                  checked={formData.is_featured}
                  onChange={handleInputChange}
                  className="rounded border-gray-300"
                />
                <label className="text-sm text-gray-700 flex items-center gap-1">
                  Featured Product
                  <TooltipHint
                    id="is-featured-tooltip"
                    text="This product will be highlighted on the homepage."
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between py-4">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={() => handleSubmit(true)}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            {isEditMode ? "Update Product" : "Create Product"}
          </button>
        </div>
      </div>

      {/* Advertisement Section */}
      <div className="flex flex-col items-end h-full w-[250px] space-y-6 ml-5">
        {create_add.map((item) => (
          <div
            key={item.id}
            style={{ backgroundImage: `url(${advertisement})` }}
            className="px-8 py-18 bg-cover h-full w-full bg-center rounded-lg text-white"
          >
            <p className="text-3xl font-bold">{item.title}</p>
            <p className="font-medium">{item.subtitle}</p>
          </div>
        ))}
      </div>

      {/* Preview modal */}
      {renderPreviewModal()}

      {isGuideModalOpen && (
        <ImageGuidelinesModal
          isOpen={isGuideModalOpen}
          onClose={() => setIsGuideModalOpen(false)}
        />
      )}
    </div>
  );
};

export default AddEditProduct;
