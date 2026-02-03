import React, { useState, useEffect } from "react";
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
import { BsQuestionCircle } from "react-icons/bs";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import { getSettings } from "../../../services/api.settings";
import { notifyOnFail } from "../../../utils/notification/toast";
import { useAppContext } from "../../../context/AppContext";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import ImageGuidelinesModal from "../../../components/Vendor/Models/ImageGuidelinesModal";

const VariationItem = ({
  varIndex,
  control,
  variationMode,
  colors,
  attributes,
  sizes,
  watch,
  setValue,
  removeVariation,
  notifyOnFail,
  setIsGuideModalOpen,
  isEditMode,
  renderMediaSlot,
  preventNegative,
}) => {
  const {
    fields: sizeFields,
    append: addSize,
    remove: removeSize,
  } = useFieldArray({
    control,
    name: `variations.${varIndex}.sizes`,
  });

  const {
    fields: mediaFields,
    append: addMediaSlot,
    remove: removeMediaSlot,
  } = useFieldArray({
    control,
    name: `variations.${varIndex}.media`,
  });

  const colorId = watch(`variations.${varIndex}.color_id`);
  const attrId = watch(`variations.${varIndex}.attribute_id`);
  const attrValue = watch(`variations.${varIndex}.attribute_value`);

  const variationName =
    variationMode === "color_size"
      ? colors.find((c) => String(c.id) === String(colorId))?.name ||
        `Variation ${varIndex + 1}`
      : `${
          attributes.find((a) => String(a.id) === String(attrId))?.name ||
          "Attribute"
        }: ${attrValue || "Not set"}`;

  return (
    <div className="border rounded-2xl p-6 bg-gray-50">
      {/* Variation Header: Color or Attribute */}
      {variationMode === "color_size" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Color <span className="text-red-600">*</span>
            </label>
            <Controller
              name={`variations.${varIndex}.color_id`}
              control={control}
              rules={{ required: "Color is required" }}
              render={({ field, fieldState: { error } }) => (
                <>
                  <select
                    {...field}
                    className={`mt-1 block w-full rounded-2xl border ${
                      error ? "border-red-500" : "border-gray-300"
                    } shadow-sm focus:border-black focus:ring-black`}
                  >
                    <option value="">Select Color</option>
                    {colors.map((color) => (
                      <option key={color.id} value={color.id}>
                        {color.name}
                      </option>
                    ))}
                  </select>
                  {error && (
                    <p className="mt-1 text-xs text-red-600">{error.message}</p>
                  )}
                </>
              )}
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Attribute <span className="text-red-600">*</span>
            </label>
            <Controller
              name={`variations.${varIndex}.attribute_id`}
              control={control}
              rules={{ required: "Attribute is required" }}
              render={({ field, fieldState: { error } }) => (
                <>
                  <select
                    {...field}
                    className={`mt-1 block w-full rounded-2xl border ${
                      error ? "border-red-500" : "border-gray-300"
                    } shadow-sm focus:border-black focus:ring-black`}
                  >
                    <option value="">Select Attribute</option>
                    {attributes.map((attr) => (
                      <option key={attr.id} value={attr.id}>
                        {attr.name}
                      </option>
                    ))}
                  </select>
                  {error && (
                    <p className="mt-1 text-xs text-red-600">{error.message}</p>
                  )}
                </>
              )}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Attribute Value <span className="text-red-600">*</span>
            </label>
            <Controller
              name={`variations.${varIndex}.attribute_value`}
              control={control}
              rules={{ required: "Value is required" }}
              render={({ field, fieldState: { error } }) => (
                <>
                  <input
                    {...field}
                    placeholder="e.g. Matte Finish, Pure Leather"
                    className={`mt-1 block w-full rounded-2xl border ${
                      error ? "border-red-500" : "border-gray-300"
                    } shadow-sm focus:border-black focus:ring-black`}
                  />
                  {error && (
                    <p className="mt-1 text-xs text-red-600">{error.message}</p>
                  )}
                </>
              )}
            />
          </div>
        </div>
      )}

      {/* Media Upload Section - Dynamic */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-700">
            Media Files for {variationName}
          </h4>
          <button
            type="button"
            onClick={() => setIsGuideModalOpen(true)}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
          >
            <BsQuestionCircle size={14} />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {mediaFields.map((mediaField, mediaIdx) => (
            <Controller
              key={mediaField.id}
              name={`variations.${varIndex}.media.${mediaIdx}`}
              control={control}
              render={({ field }) =>
                renderMediaSlot(
                  field.value || null,
                  mediaIdx,
                  () => removeMediaSlot(mediaIdx),
                  true,
                  varIndex,
                )
              }
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            if (mediaFields.length < 8) {
              addMediaSlot({});
            } else {
              notifyOnFail("Maximum 8 media files allowed per variation");
            }
          }}
          className="mt-4 flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-2xl hover:bg-gray-200 text-gray-700 text-sm"
        >
          <Plus size={16} /> Add More Media
        </button>
      </div>

      {/* Sizes / Options */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700">
          {variationMode === "color_size" ? "Sizes" : "Options"}{" "}
          <span className="text-red-600">*</span>
        </h4>
        {sizeFields.map((sizeField, sizeIdx) => {
          const originalPrice =
            watch(`variations.${varIndex}.sizes.${sizeIdx}.original_price`) ||
            0;
          const discountedPrice =
            watch(`variations.${varIndex}.sizes.${sizeIdx}.discounted_price`) ||
            0;
          const priceError =
            discountedPrice >= originalPrice &&
            originalPrice > 0 &&
            discountedPrice > 0;

          return (
            <div
              key={sizeField.id}
              className="grid grid-cols-1 sm:grid-cols-6 gap-3 items-end bg-white p-4 rounded-2xl border"
            >
              {variationMode === "color_size" && (
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Size
                  </label>
                  <Controller
                    name={`variations.${varIndex}.sizes.${sizeIdx}.size_id`}
                    control={control}
                    rules={{ required: "Size is required" }}
                    render={({ field, fieldState: { error } }) => (
                      <>
                        <select
                          {...field}
                          value={field.value || ""}
                          className={`mt-1 block w-full rounded-2xl border ${
                            error ? "border-red-500" : "border-gray-300"
                          } shadow-sm focus:border-black focus:ring-black text-xs`}
                        >
                          <option value="">Select Size</option>
                          {sizes.map((sz) => (
                            <option key={sz.id} value={sz.id}>
                              {sz.name}
                            </option>
                          ))}
                        </select>
                        {error && (
                          <p className="mt-1 text-xs text-red-600">
                            {error.message}
                          </p>
                        )}
                      </>
                    )}
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-700">
                  Stock
                </label>
                <Controller
                  name={`variations.${varIndex}.sizes.${sizeIdx}.stock`}
                  control={control}
                  rules={{ required: "Stock is required", min: 0 }}
                  render={({ field }) => (
                    <input
                      type="number"
                      {...field}
                      min={0}
                      onKeyDown={preventNegative}
                      onChange={(e) =>
                        field.onChange(
                          Math.max(0, parseInt(e.target.value) || 0),
                        )
                      }
                      className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm focus:border-black focus:ring-black text-xs"
                    />
                  )}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">
                  Original Price
                </label>
                <Controller
                  name={`variations.${varIndex}.sizes.${sizeIdx}.original_price`}
                  control={control}
                  rules={{ required: "Original price is required", min: 0 }}
                  render={({ field }) => (
                    <input
                      type="number"
                      {...field}
                      min={0}
                      onKeyDown={preventNegative}
                      onChange={(e) =>
                        field.onChange(
                          Math.max(0, parseFloat(e.target.value) || 0),
                        )
                      }
                      className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm focus:border-black focus:ring-black text-xs"
                    />
                  )}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">
                  Selling Price
                </label>
                <Controller
                  name={`variations.${varIndex}.sizes.${sizeIdx}.discounted_price`}
                  control={control}
                  rules={{ required: "Selling price is required", min: 0 }}
                  render={({ field }) => (
                    <>
                      <input
                        type="number"
                        {...field}
                        min={0}
                        onKeyDown={preventNegative}
                        onChange={(e) =>
                          field.onChange(
                            Math.max(0, parseFloat(e.target.value) || 0),
                          )
                        }
                        className={`mt-1 block w-full rounded-2xl border ${
                          priceError ? "border-red-500" : "border-gray-300"
                        } shadow-sm focus:border-black focus:ring-black text-xs`}
                      />
                      {priceError && (
                        <p className="mt-1 text-xs text-red-600">
                          Must be less than original price
                        </p>
                      )}
                    </>
                  )}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">
                  SKU <span className="text-red-500">*</span>
                </label>
                <Controller
                  name={`variations.${varIndex}.sizes.${sizeIdx}.sku`}
                  control={control}
                  rules={{ required: "SKU is required" }}
                  render={({ field, fieldState: { error } }) => (
                    <>
                      <input
                        type="text"
                        {...field}
                        className={`mt-1 block w-full rounded-2xl border ${
                          error ? "border-red-500" : "border-gray-300"
                        } shadow-sm focus:border-black focus:ring-black text-xs`}
                      />
                      {error && (
                        <p className="mt-1 text-xs text-red-600">
                          {error.message}
                        </p>
                      )}
                    </>
                  )}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">
                  Barcode
                </label>
                <Controller
                  name={`variations.${varIndex}.sizes.${sizeIdx}.barcode`}
                  control={control}
                  render={({ field }) => (
                    <input
                      type="text"
                      {...field}
                      className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm focus:border-black focus:ring-black text-xs"
                    />
                  )}
                />
              </div>
              <button
                type="button"
                onClick={() => removeSize(sizeIdx)}
                className="text-red-500 hover:text-red-700 self-end"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
        <button
          type="button"
          onClick={() =>
            addSize({
              size_id: "",
              stock: "",
              original_price: "",
              discounted_price: "",
              sku: "",
              barcode: "",
            })
          }
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm mt-2"
        >
          <Plus size={16} /> Add{" "}
          {variationMode === "color_size" ? "Size" : "Option"}
        </button>
      </div>

      {/* Remove Variation */}
      <button
        type="button"
        onClick={() => removeVariation(varIndex)}
        className="mt-6 text-red-600 hover:text-red-800 text-sm flex items-center gap-1"
      >
        <X size={16} /> Remove This Variation
      </button>
    </div>
  );
};

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
  const [deletedMediaIds, setDeletedMediaIds] = useState([]);
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

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      name: "",
      general_info: "",
      product_details: "",
      warranty_info: "",
      original_price: "",
      discounted_price: "",
      stock: "",
      low_stock_threshold: "",
      sku: "",
      hsn_code: "",
      barcode: "",
      category_id: "",
      sub_category_id: "",
      inner_sub_category_id: "",
      fabric_id: "",
      gst: 0,
      platform_fee: 0,
      shipping_charges: 0,
      package_weight: 0,
      volumetric_weight: 0,
      package_length: 0,
      package_width: 0,
      package_height: 0,
      package_depth: 0,
      visibility: "Hidden",
      is_variation: false,
      is_featured: false,
      meta_title: "",
      meta_description: "",
      slug: "",
      specifications: [{ feature: "", specification: "" }],
      productFiles: [
        {
          id: "",
          url: "",
          type: "",
          preview: "",
        },
        {
          id: "",
          url: "",
          type: "",
          preview: "",
        },
        {
          id: "",
          url: "",
          type: "",
          preview: "",
        },
        {
          id: "",
          url: "",
          type: "",
          preview: "",
        },
      ],
      variations: [],
      expandedVariations: [],
    },
  });

  const {
    fields: specFields,
    append: addSpec,
    remove: removeSpec,
  } = useFieldArray({
    control,
    name: "specifications",
  });

  const {
    fields: variationFields,
    append: addVariation,
    remove: removeVariation,
  } = useFieldArray({
    control,
    name: "variations",
  });

  const {
    fields: productMediaFields,
    append: addProductMedia,
    remove: removeProductMedia,
  } = useFieldArray({
    control,
    name: "productFiles",
  });

  const isVariation = watch("is_variation");

  // Volumetric Weight Calculation
  useEffect(() => {
    const vol =
      (parseFloat(watch("package_length") || 0) *
        parseFloat(watch("package_width") || 0) *
        parseFloat(watch("package_height") || 0)) /
      5000;
    setValue("volumetric_weight", Math.round(vol * 100) / 100);
  }, [
    watch("package_length"),
    watch("package_width"),
    watch("package_height"),
    setValue,
  ]);

  // Clamp low stock threshold
  useEffect(() => {
    const stock = parseInt(watch("stock") || 0);
    const threshold = parseInt(watch("low_stock_threshold") || 0);
    if (threshold > stock) {
      setValue("low_stock_threshold", stock);
    }
  }, [watch("stock"), watch("low_stock_threshold"), setValue]);

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
        setValue("platform_fee", settingsRes.data.platform_fee);
        setValue("shipping_charges", settingsRes.data.shipping_charge || 0);
      }
    };
    fetchData();
  }, [setValue]);

  // Dynamic sizes & fabrics
  useEffect(() => {
    const fetchSizes = async () => {
      const query = {};
      if (watch("category_id")) query.categoryId = watch("category_id");
      if (watch("sub_category_id"))
        query.subCategoryId = watch("sub_category_id");
      if (watch("inner_sub_category_id"))
        query.innerSubCategoryId = watch("inner_sub_category_id");
      const res = await getAllSizes(query);
      if (res.status === 1)
        setSizes(res.data?.map((s) => ({ ...s, id: String(s.id) })) || []);
    };
    fetchSizes();
  }, [
    watch("category_id"),
    watch("sub_category_id"),
    watch("inner_sub_category_id"),
  ]);

  useEffect(() => {
    const fetchFabrics = async () => {
      const query = {};
      if (watch("category_id")) query.categoryId = watch("category_id");
      if (watch("sub_category_id")) query.subCatId = watch("sub_category_id");
      if (watch("inner_sub_category_id"))
        query.innerSubCatId = watch("inner_sub_category_id");
      const res = await getAllFabricsByStatus(query);
      setFabrics(res?.map((d) => ({ id: d.id, name: d.name })) || []);
    };
    fetchFabrics();
  }, [
    watch("category_id"),
    watch("sub_category_id"),
    watch("inner_sub_category_id"),
  ]);

  // Category/Subcategory filtering
  useEffect(() => {
    if (watch("category_id")) {
      const filtered = subCategories.filter(
        (sub) => sub.categoryId === parseInt(watch("category_id")),
      );
      setFilteredSubCategories(filtered);
    } else setFilteredSubCategories([]);
  }, [watch("category_id"), subCategories]);

  useEffect(() => {
    if (watch("sub_category_id")) {
      const filtered = innerSubCategories.filter(
        (inner) => inner.subCategoryId === parseInt(watch("sub_category_id")),
      );
      setFilteredInnerSubCategories(filtered);
    } else setFilteredInnerSubCategories([]);
  }, [watch("sub_category_id"), innerSubCategories]);

  // Force re-filtering and ensure selected values are applied after data load in edit mode
  useEffect(() => {
    if (isEditMode) {
      // Trigger subcategory filter when category_id is set
      if (watch("category_id")) {
        const filtered = subCategories.filter(
          (sub) => sub.categoryId === parseInt(watch("category_id")),
        );
        setFilteredSubCategories(filtered);
      }
    }
  }, [isEditMode, watch("category_id"), subCategories]);

  useEffect(() => {
    if (isEditMode) {
      // Trigger inner subcategory filter when sub_category_id is set
      if (watch("sub_category_id")) {
        const filtered = innerSubCategories.filter(
          (inner) => inner.subCategoryId === parseInt(watch("sub_category_id")),
        );
        setFilteredInnerSubCategories(filtered);
      }
    }
  }, [isEditMode, watch("sub_category_id"), innerSubCategories]);

  // Fetch product data in edit mode
  useEffect(() => {
    if (isEditMode) {
      const fetchProduct = async () => {
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

          const formattedVariations =
            p.variations?.length > 0
              ? p.variations.map((group) => ({
                  color_id: String(group.color_id || ""),
                  attribute_id: String(group.attribute_id || ""),
                  attribute_value: group.attribute_value || "",
                  media:
                    group.media?.map((m) => ({
                      id: m.id,
                      url: m.url,
                      type: m.type,
                      preview: m.url,
                    })) || [],
                  sizes:
                    group.sizes?.map((s) => ({
                      size_id: String(s.size_id || ""),
                      stock: Number(s.stock) || 0,
                      original_price: Number(s.original_price) || 0,
                      discounted_price: Number(s.discounted_price) || 0,
                      sku: s.sku || "",
                      barcode: s.barcode || "",
                    })) || [],
                }))
              : [];

          reset({
            ...p,
            tags: parsedTags,
            specifications:
              parsedSpecs.length > 0
                ? parsedSpecs
                : [{ feature: "", specification: "" }],
            category_id: String(p.category_id || ""),
            sub_category_id: String(p.sub_category_id || ""),
            inner_sub_category_id: String(p.inner_sub_category_id || ""),
            fabric_id: String(p.fabric_id || ""),
            productFiles:
              p.media?.map((m) => ({
                id: m.id,
                url: m.url,
                type: m.type,
                preview: m.url,
              })) || [],
            variations: formattedVariations,
            is_variation: p.variations?.length > 0 || false,
          });

          if (p.variationMode) setVariationMode(p.variationMode);
        } catch (err) {
          console.error("Fetch product error:", err);
        }
      };
      fetchProduct();
    }
  }, [id, isEditMode, reset]);

  useEffect(() => {
    if (isEditMode && watch("category_id")) {
      // Manually trigger sizes fetch if needed (in case timing issue)
      const fetchSizes = async () => {
        const query = {};
        if (watch("category_id")) query.categoryId = watch("category_id");
        if (watch("sub_category_id"))
          query.subCategoryId = watch("sub_category_id");
        if (watch("inner_sub_category_id"))
          query.innerSubCategoryId = watch("inner_sub_category_id");
        const res = await getAllSizes(query);
        if (res.status === 1)
          setSizes(res.data?.map((s) => ({ ...s, id: String(s.id) })) || []);
      };
      fetchSizes();
    }
  }, [
    isEditMode,
    watch("category_id"),
    watch("sub_category_id"),
    watch("inner_sub_category_id"),
  ]);

  const preventNegative = (e) => {
    if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault();
  };

  const onSubmit = async (data) => {
    if (!data.is_variation && !data.sku?.trim()) {
      notifyOnFail("SKU is required for non-variation products");
      return;
    }

    setIsSubmitting(true);
    const formDataToSend = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (
        [
          "specifications",
          "productFiles",
          "variations",
          "expandedVariations",
        ].includes(key)
      )
        return;
      formDataToSend.append(key, value);
    });

    formDataToSend.append(
      "specifications",
      JSON.stringify(data.specifications),
    );

    if (deletedMediaIds.length > 0) {
      formDataToSend.append("delete_media", JSON.stringify(deletedMediaIds));
    }

    const sellingPrice = parseFloat(data.discounted_price) || 0;
    const tds = sellingPrice * 0.02;
    formDataToSend.append("tds_amount", tds);
    formDataToSend.append("bank_settlement_amount", sellingPrice - tds);

    const allNewFiles = [];
    const variationMediaMapping = [];

    if (data.is_variation) {
      data.variations.forEach((variation, idx) => {
        const isColor = variationMode === "color_size";
        const groupingKey = isColor
          ? parseInt(variation.color_id)
          : `${variation.attribute_id}__${
              variation.attribute_value?.trim() || ""
            }`;
        if (!groupingKey) return;

        variation.media?.forEach((media) => {
          if (media?.file instanceof File) {
            const fileIndex = allNewFiles.length;
            allNewFiles.push(media.file);
            variationMediaMapping.push({
              grouping_key: groupingKey,
              file_indices: [fileIndex],
            });
          } else if (media?.id) {
            variationMediaMapping.push({
              grouping_key: groupingKey,
              file_indices: [`existing_${media.id}`],
            });
          }
        });

        variation.sizes.forEach((size) => {
          formDataToSend.append(
            "variations",
            JSON.stringify({
              color_id: isColor ? groupingKey : null,
              size_id: isColor ? parseInt(size.size_id) : null,
              attribute_id: !isColor ? parseInt(variation.attribute_id) : null,
              attribute_value: !isColor ? variation.attribute_value : null,
              stock: size.stock,
              original_price: size.original_price,
              discounted_price: size.discounted_price,
              sku: size.sku,
              barcode: size.barcode || null,
            }),
          );
        });
      });
      formDataToSend.append(
        "variation_media",
        JSON.stringify(variationMediaMapping),
      );
    } else {
      data.productFiles?.forEach((fileObj) => {
        if (fileObj?.file instanceof File) {
          formDataToSend.append("files", fileObj.file);
        }
      });
      const mediaIndices = data.productFiles
        ?.map((f, i) => (f?.file instanceof File ? i : `existing_${f?.id}`))
        .filter(Boolean);
      if (mediaIndices.length)
        formDataToSend.append("media_indices", JSON.stringify(mediaIndices));
    }

    allNewFiles.forEach((file) => formDataToSend.append("files", file));

    formDataToSend.append("vendor_id", vendorId);

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
        setTimeout(() => navigate("/vendor/product"), 2000);
      } else {
        setNotification({
          isOpen: true,
          type: "error",
          message: response.message || "Failed to save product",
        });
      }
    } catch (err) {
      console.error(err);
      setNotification({
        isOpen: true,
        type: "error",
        message: err.message || "Error saving product",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderMediaSlot = (
    fieldValue,
    index,
    removeFn,
    isVariation = false,
    varIndex = null,
  ) => {
    const file = fieldValue;
    const hasFile = file?.preview || file?.url;

    return (
      <div key={index} className="relative">
        {hasFile ? (
          <div className="relative group">
            {file.type === "image" || file.type?.startsWith("image/") ? (
              <img
                src={file.preview || file.url}
                alt="preview"
                className="w-full h-32 object-cover rounded-2xl border"
              />
            ) : (
              <video
                src={file.preview || file.url}
                className="w-full h-32 object-cover rounded-2xl border"
              />
            )}
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setPreviewModal({
                    isOpen: true,
                    url: file.preview || file.url,
                    type: file.type,
                  })
                }
                className="p-2 bg-white rounded-full text-gray-700 hover:text-black"
              >
                <Eye size={18} />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (file.id) setDeletedMediaIds((prev) => [...prev, file.id]);
                  removeFn();
                }}
                className="p-2 bg-white rounded-full text-red-500 hover:text-red-700"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-orange-300 rounded-2xl bg-orange-50 cursor-pointer hover:bg-orange-100">
            <CiImageOn className="text-orange-400 text-4xl mb-2" />
            <span className="text-xs text-gray-600">Upload Image/Video</span>
            <input
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => {
                const uploadedFile = e.target.files[0];
                if (!uploadedFile) return;
                const isImage = uploadedFile.type.startsWith("image/");
                if (isImage) {
                  const img = new Image();
                  img.onload = () => {
                    if (img.naturalWidth < 512 || img.naturalHeight < 682) {
                      notifyOnFail("Image must be at least 512x682px");
                      return;
                    }
                    setValue(
                      isVariation
                        ? `variations.${varIndex}.media.${index}`
                        : `productFiles.${index}`,
                      {
                        file: uploadedFile,
                        type: "image",
                        preview: URL.createObjectURL(uploadedFile),
                      },
                    );
                  };
                  img.src = URL.createObjectURL(uploadedFile);
                } else {
                  setValue(
                    isVariation
                      ? `variations.${varIndex}.media.${index}`
                      : `productFiles.${index}`,
                    {
                      file: uploadedFile,
                      type: "video",
                      preview: URL.createObjectURL(uploadedFile),
                    },
                  );
                }
              }}
            />
          </label>
        )}
      </div>
    );
  };

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

  return (
    <div className="flex gap-6 p-6 min-h-screen">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex-1 space-y-6 overflow-y-auto scrollbar-hide"
      >
        <h1 className="text-3xl font-bold mb-4">
          {isEditMode ? "Edit Product" : "Create a New Product"}
        </h1>

        {/* Product Information */}
        <div className="bg-white p-6 rounded-2xl shadow space-y-6">
          <h2 className="text-lg font-semibold">Product Information</h2>
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
                {...register("name", { required: "Product name is required" })}
                onChange={(e) => {
                  const val = e.target.value.replace(/\b\w/g, (c) =>
                    c.toUpperCase(),
                  );
                  setValue("name", val);
                  setValue("slug", slugify(val, { lower: true, strict: true }));
                  setValue("meta_title", `${val} | IERADA`);
                }}
                className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm focus:border-black focus:ring-black capitalize"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.name.message}
                </p>
              )}
            </div>

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
                  {...register("category_id", {
                    required: "Category is required",
                  })}
                  className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm focus:border-black focus:ring-black"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.category_id && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.category_id.message}
                  </p>
                )}
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
                  {...register("sub_category_id", {
                    required: "Subcategory is required",
                  })}
                  disabled={!watch("category_id")}
                  value={watch("sub_category_id") || ""}
                  className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm focus:border-black focus:ring-black"
                >
                  <option value="">Select Subcategory</option>
                  {filteredSubCategories.map((sc) => (
                    <option key={sc.id} value={sc.id}>
                      {sc.name}
                    </option>
                  ))}
                </select>
                {errors.sub_category_id && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.sub_category_id.message}
                  </p>
                )}
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
                  {...register("inner_sub_category_id", {
                    required: "Inner subcategory is required",
                  })}
                  disabled={!watch("sub_category_id")}
                  value={watch("inner_sub_category_id") || ""}
                  className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm focus:border-black focus:ring-black"
                >
                  <option value="">Select Inner Subcategory</option>
                  {filteredInnerSubCategories.map((isc) => (
                    <option key={isc.id} value={isc.id}>
                      {isc.name}
                    </option>
                  ))}
                </select>
                {errors.inner_sub_category_id && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.inner_sub_category_id.message}
                  </p>
                )}
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
                  {...register("fabric_id")}
                  value={watch("fabric_id") || ""}
                  className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm focus:border-black focus:ring-black"
                >
                  <option value="">Select Fabric</option>
                  {fabrics.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                  HSN Code <span className="text-red-600">*</span>
                  <TooltipHint
                    id="fabric-tooltip"
                    content="Select the primary fabric material for this product"
                  />
                </label>
                <input
                  {...register("hsn_code", {
                    required: "HSN code is required",
                  })}
                  className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm focus:border-black focus:ring-black"
                />
                {errors.hsn_code && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.hsn_code.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                  GST % <span className="text-red-600">*</span>
                  <TooltipHint
                    id="gst-amount-tooltip"
                    content="GST percentage applied to this product."
                  />
                </label>
                <input
                  type="number"
                  {...register("gst", { min: 0 })}
                  onKeyDown={preventNegative}
                  className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm focus:border-black focus:ring-black"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                General Info
              </label>
              <Controller
                name="general_info"
                control={control}
                render={({ field }) => (
                  <CKEditor
                    editor={ClassicEditor}
                    data={field.value}
                    onChange={(_, editor) => field.onChange(editor.getData())}
                  />
                )}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Product Details
              </label>
              <Controller
                name="product_details"
                control={control}
                render={({ field }) => (
                  <CKEditor
                    editor={ClassicEditor}
                    data={field.value}
                    onChange={(_, editor) => field.onChange(editor.getData())}
                  />
                )}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Warranty Info
              </label>
              <Controller
                name="warranty_info"
                control={control}
                render={({ field }) => (
                  <CKEditor
                    editor={ClassicEditor}
                    data={field.value}
                    onChange={(_, editor) => field.onChange(editor.getData())}
                  />
                )}
              />
            </div>
          </div>
        </div>

        {/* Variations Section */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <div className="flex items-center justify-between mb-4">
            {isVariation && (
              <h2 className="text-lg font-semibold">Variations</h2>
            )}
            <div className="flex items-center gap-6">
              {isVariation && (
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={variationMode === "color_size"}
                      onChange={() => setVariationMode("color_size")}
                      className="rounded border-gray-300"
                    />
                    <span>Color + Size</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={variationMode === "custom"}
                      onChange={() => setVariationMode("custom")}
                      className="rounded border-gray-300"
                    />
                    <span>Custom Attribute</span>
                  </label>
                </div>
              )}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("is_variation")}
                  className="rounded border-gray-300"
                />
                <span>Enable Variations</span>
              </label>
            </div>
          </div>

          {isVariation && (
            <div className="space-y-6">
              {variationFields.map((variationField, varIndex) => (
                <VariationItem
                  key={variationField.id}
                  varIndex={varIndex}
                  control={control}
                  variationMode={variationMode}
                  colors={colors}
                  attributes={attributes}
                  sizes={sizes}
                  watch={watch}
                  setValue={setValue}
                  removeVariation={removeVariation}
                  notifyOnFail={notifyOnFail}
                  setIsGuideModalOpen={setIsGuideModalOpen}
                  isEditMode={isEditMode}
                  renderMediaSlot={renderMediaSlot}
                  preventNegative={preventNegative}
                />
              ))}
              <button
                type="button"
                onClick={() =>
                  addVariation({
                    color_id: variationMode === "color_size" ? "" : undefined,
                    attribute_id: variationMode === "custom" ? "" : undefined,
                    attribute_value:
                      variationMode === "custom" ? "" : undefined,
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
                  })
                }
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
              >
                <Plus size={20} /> Add New Variation
              </button>
            </div>
          )}

          {!isVariation && (
            <div className="bg-white p-6 rounded-2xl shadow">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-semibold">Media</h2>
                <button
                  type="button"
                  onClick={() => setIsGuideModalOpen(true)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <BsQuestionCircle size={16} />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-4">
                {productMediaFields.map((field, idx) => (
                  <Controller
                    key={field.id}
                    name={`productFiles.${idx}`}
                    control={control}
                    render={({ field: mediaField }) =>
                      renderMediaSlot(
                        mediaField.value,
                        idx,
                        () => removeProductMedia(idx),
                        false,
                      )
                    }
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (productMediaFields.length < 8) addProductMedia({});
                  else notifyOnFail("Maximum 8 media files allowed");
                }}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-2xl hover:bg-gray-200 text-gray-700 text-sm"
              >
                <Plus size={16} /> Add More Media
              </button>
            </div>
          )}
        </div>

        {/* Specifications */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-1">
            Product Specifications
            <TooltipHint
              id="specifications-tooltip"
              content="List of product specifications."
            />
          </h2>
          {specFields.map((field, index) => (
            <div key={field.id} className="flex gap-4 mb-4">
              <input
                {...register(`specifications.${index}.feature`)}
                placeholder="Feature"
                className="flex-1 rounded-2xl border-gray-300 shadow-sm"
              />
              <input
                {...register(`specifications.${index}.specification`)}
                placeholder="Specification"
                className="flex-1 rounded-2xl border-gray-300 shadow-sm"
              />
              <button
                type="button"
                onClick={() => removeSpec(index)}
                className="text-red-500"
              >
                <X />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addSpec({ feature: "", specification: "" })}
            className="flex items-center gap-2 text-blue-600"
          >
            <Plus size={20} /> Add Specification
          </button>
        </div>

        {/* Pricing & Inventory */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-lg font-semibold mb-4">Pricing & Inventory</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                {...register("original_price", {
                  required: "MRP is required",
                  min: 0,
                })}
                onKeyDown={preventNegative}
                className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm focus:border-black focus:ring-black"
              />
              {errors.original_price && (
                <p className="text-red-600 text-sm">
                  {errors.original_price.message}
                </p>
              )}
            </div>
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
                {...register("discounted_price", {
                  required: "Selling price is required",
                  min: 0,
                  validate: (value) =>
                    parseFloat(value) <
                      parseFloat(watch("original_price") || 0) ||
                    "Must be less than MRP",
                })}
                onKeyDown={preventNegative}
                className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm focus:border-black focus:ring-black"
              />
              {errors.discounted_price && (
                <p className="text-red-600 text-sm">
                  {errors.discounted_price.message}
                </p>
              )}
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
                {...register("stock", {
                  required: "Stock is required",
                  min: 0,
                })}
                onKeyDown={preventNegative}
                className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm focus:border-black focus:ring-black"
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
                {...register("low_stock_threshold", {
                  required: "Threshold is required",
                  min: 0,
                })}
                max={watch("stock") || undefined}
                onKeyDown={preventNegative}
                className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm focus:border-black focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                SKU *
              </label>
              <input
                type="text"
                {...register("sku", { required: "SKU is required" })}
                className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm focus:border-black focus:ring-black"
              />
              {errors.sku && (
                <p className="text-red-600 text-sm">{errors.sku.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Barcode
              </label>
              <input
                {...register("barcode")}
                className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm focus:border-black focus:ring-black"
              />
            </div>
          </div>
        </div>

        {/* Shipping & Package Details */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-lg font-semibold mb-4">Charges & Shipping</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Platform Fee (Default)
              </label>
              <input
                type="number"
                {...register("platform_fee")}
                disabled
                className="mt-1 block w-full rounded-2xl border-gray-300 bg-gray-200 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Shipping Charges (Default)
              </label>
              <input
                type="number"
                {...register("shipping_charges")}
                disabled
                className="mt-1 block w-full rounded-2xl border-gray-300 bg-gray-200 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Dead Weight (g)
              </label>
              <input
                type="number"
                {...register("package_weight", { min: 0 })}
                onKeyDown={preventNegative}
                className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm focus:border-black focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Length (cm)
              </label>
              <input
                type="number"
                {...register("package_length", { min: 0 })}
                onKeyDown={preventNegative}
                className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm focus:border-black focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Width (cm)
              </label>
              <input
                type="number"
                {...register("package_width", { min: 0 })}
                onKeyDown={preventNegative}
                className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm focus:border-black focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Height (cm)
              </label>
              <input
                type="number"
                {...register("package_height", { min: 0 })}
                onKeyDown={preventNegative}
                className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm focus:border-black focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Depth (cm)
              </label>
              <input
                type="number"
                {...register("package_depth", { min: 0 })}
                onKeyDown={preventNegative}
                className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm focus:border-black focus:ring-black"
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700">
                Volumetric Weight (g)
              </label>
              <div className="mt-1 block w-full rounded-2xl border border-gray-300 bg-gray-100 px-3 py-2 text-gray-700">
                {watch("volumetric_weight") || 0} g
              </div>
            </div>
          </div>
        </div>

        {/* Additional Settings */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-lg font-semibold mb-4">Additional Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                Visibility
                <TooltipHint
                  id="visibility-tooltip"
                  content="This controls whether or not your product will be visible to customers."
                />
              </label>
              <select
                {...register("visibility")}
                className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm focus:border-black focus:ring-black"
              >
                <option value="Hidden">Hidden</option>
                <option value="Published">Published</option>
              </select>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register("is_featured")}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700 flex items-center gap-1">
                  Featured Product
                  <TooltipHint
                    id="is-featured-tooltip"
                    content="This product will be highlighted on the homepage."
                  />
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end py-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 bg-[#F47954] text-white rounded-xl font-medium hover:bg-orange-600 disabled:opacity-50"
          >
            {isSubmitting
              ? "Saving..."
              : isEditMode
              ? "Update Product"
              : "Create Product"}
          </button>
        </div>
      </form>

      {/* Right Sidebar - Bank Settlement */}
      <div className="w-[420px] space-y-6 mt-8 flex-shrink-0">
        <div className="sticky top-24 space-y-6">
          {/* Main Product Breakdown */}
          {!isVariation && (
            <div className="bg-white p-6 rounded-2xl shadow">
              <h2 className="text-lg font-semibold mb-6">
                Bank Settlement Breakdown
              </h2>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 font-semibold">
                    MRP (Original Price)
                  </span>
                  <span className="font-medium">
                    ₹{parseFloat(watch("original_price") || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 font-semibold">
                    Sale Amount (Selling Price)
                  </span>
                  <span className="font-medium">
                    ₹{parseFloat(watch("discounted_price") || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 font-semibold">
                    GST ({watch("gst") || 0}%)
                  </span>
                  <span className="font-medium text-red-600">
                    - ₹
                    {(
                      (parseFloat(watch("discounted_price") || 0) *
                        parseFloat(watch("gst") || 0)) /
                      100
                    ).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">TDS (2%)</span>
                  <span className="font-medium text-red-600">
                    -₹
                    {(
                      parseFloat(watch("discounted_price") || 0) * 0.02
                    ).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-3 mt-2">
                  <span className="text-gray-700 font-semibold">
                    Bank Settlement Value
                  </span>
                  <span className="font-bold text-green-700">
                    ₹
                    {(
                      parseFloat(watch("discounted_price") || 0) -
                      parseFloat(watch("discounted_price") || 0) * 0.02 -
                      (parseFloat(watch("discounted_price") || 0) *
                        parseFloat(watch("gst") || 0)) /
                        100
                    ).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Shipping Fee (to Customer)
                  </span>
                  <span className="font-medium">
                    ₹{parseFloat(watch("shipping_charges") || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Platform Fee</span>
                  <span className="font-medium">
                    ₹{parseFloat(watch("platform_fee") || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between font-bold border-t pt-3 text-base">
                  <span className="text-gray-800">
                    Listing Price (Customer Pays)
                  </span>
                  <span className="text-indigo-700">
                    ₹
                    {(
                      parseFloat(watch("discounted_price") || 0) +
                      parseFloat(watch("shipping_charges") || 0) +
                      parseFloat(watch("platform_fee") || 0)
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Variations Breakdown */}
          {isVariation && (
            <div className="bg-white rounded-2xl shadow border-t p-6">
              <h2 className="text-lg font-semibold mb-5">
                Bank Settlement Breakdown - Variations
              </h2>
              <div className="space-y-5">
                {variationFields.map((variation, varIndex) => {
                  const isColorMode = variationMode === "color_size";
                  const variationName = isColorMode
                    ? colors.find(
                        (c) =>
                          String(c.id) ===
                          watch(`variations.${varIndex}.color_id`),
                      )?.name || `Color Variation ${varIndex + 1}`
                    : `${
                        attributes.find(
                          (a) =>
                            String(a.id) ===
                            watch(`variations.${varIndex}.attribute_id`),
                        )?.name || "Attribute"
                      } : ${
                        watch(`variations.${varIndex}.attribute_value`) ||
                        "Not set"
                      }`;
                  const variationSizes =
                    watch(`variations.${varIndex}.sizes`) || [];

                  return (
                    <div
                      key={variation.id}
                      className="border rounded-xl overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          const current = watch("expandedVariations") || [];
                          const newExpanded = current.includes(varIndex)
                            ? current.filter((i) => i !== varIndex)
                            : [...current, varIndex];
                          setValue("expandedVariations", newExpanded);
                        }}
                        className="w-full px-5 py-4 flex justify-between items-center text-left bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <span className="font-medium text-gray-800">
                          {variationName}
                        </span>
                        <svg
                          className={`w-5 h-5 text-gray-600 transition-transform ${
                            watch("expandedVariations")?.includes(varIndex)
                              ? "rotate-180"
                              : ""
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

                      {watch("expandedVariations")?.includes(varIndex) && (
                        <div className="p-5 bg-white space-y-6 divide-y divide-gray-100">
                          {variationSizes.map((size, sizeIdx) => {
                            const sizeName = isColorMode
                              ? sizes.find(
                                  (s) => String(s.id) === String(size.size_id),
                                )?.name || `Size ${sizeIdx + 1}`
                              : `Option ${sizeIdx + 1}`;
                            const original = parseFloat(
                              size.original_price || 0,
                            );
                            const discounted = parseFloat(
                              size.discounted_price || 0,
                            );
                            const gstRate = parseFloat(watch("gst") || 0);
                            const gstAmount = (discounted * gstRate) / 100;
                            const tds = discounted * 0.02;
                            const settlement = discounted - tds - gstAmount;
                            const shipping = parseFloat(
                              watch("shipping_charges") || 0,
                            );
                            const platform = parseFloat(
                              watch("platform_fee") || 0,
                            );
                            const listingPrice =
                              discounted + shipping + platform;

                            return (
                              <div key={sizeIdx} className="pt-4 first:pt-0">
                                <h5 className="text-sm font-semibold text-gray-800 mb-3">
                                  {sizeName}
                                </h5>
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">MRP</span>
                                    <span>₹{original.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">
                                      Sale Amount
                                    </span>
                                    <span>₹{discounted.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">
                                      GST ({gstRate}%)
                                    </span>
                                    <span className="text-red-600">
                                      -₹{gstAmount.toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">
                                      TDS (2%)
                                    </span>
                                    <span className="text-red-600">
                                      -₹{tds.toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between font-medium pt-2 border-t col-span-2">
                                    <span className="text-gray-700">
                                      Bank Settlement
                                    </span>
                                    <span className="text-green-700">
                                      ₹{settlement.toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">
                                      Shipping Fee
                                    </span>
                                    <span>₹{shipping.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">
                                      Platform Fee
                                    </span>
                                    <span>₹{platform.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between font-bold text-base col-span-2 border-t pt-3">
                                    <span className="text-gray-800">
                                      Listing Price
                                    </span>
                                    <span className="text-indigo-700">
                                      ₹{listingPrice.toFixed(2)}
                                    </span>
                                  </div>
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

      {/* Preview Modal */}
      {previewModal.isOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-2xl max-w-4xl max-h-[90vh] overflow-auto relative">
            <button
              onClick={() =>
                setPreviewModal({ isOpen: false, url: "", type: "" })
              }
              className="absolute top-2 right-2 text-gray-600 hover:text-black"
            >
              <X size={24} />
            </button>
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
      )}

      {/* Guidelines Modal */}
      {isGuideModalOpen && (
        <ImageGuidelinesModal
          isOpen={isGuideModalOpen}
          onClose={() => setIsGuideModalOpen(false)}
        />
      )}

      {/* Notification */}
      {notification.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-8 max-w-md text-center">
            <p
              className={`text-lg font-semibold ${
                notification.type === "success"
                  ? "text-green-700"
                  : "text-red-700"
              }`}
            >
              {notification.message}
            </p>
            <button
              onClick={() =>
                setNotification({ isOpen: false, type: "", message: "" })
              }
              className="mt-6 px-8 py-3 bg-gray-200 rounded-xl hover:bg-gray-300"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Submitting Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="fixed top-0 left-0 right-0 h-1 bg-blue-500/30 overflow-hidden">
            <div className="h-full bg-blue-600 origin-left-right animate-progress-bar" />
          </div>
          <div className="bg-white/90 backdrop-blur-sm px-6 py-4 rounded-lg shadow-xl flex items-center gap-3 text-gray-700 font-medium">
            <svg
              className="animate-spin h-5 w-5 text-blue-600"
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
      )}
    </div>
  );
};

export default AddEditProduct;
