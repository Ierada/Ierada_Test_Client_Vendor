/**
 * Product Validation Utilities
 * Validates product data according to backend ProductController rules
 */

/**
 * Generate unique SKU
 */
export const generateAutoSKU = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `SKU-${timestamp}-${random}`;
};

/**
 * Validate SKU format
 */
export const validateSKUFormat = (sku) => {
  if (!sku || !sku.trim()) {
    return { valid: false, error: "SKU is required" };
  }
  if (sku.length > 50) {
    return { valid: false, error: "SKU must be 50 characters or less" };
  }
  if (!/^[a-zA-Z0-9\-_]+$/.test(sku)) {
    return {
      valid: false,
      error:
        "SKU can only contain alphanumeric characters, hyphens, and underscores",
    };
  }
  return { valid: true };
};

/**
 * Check for duplicate SKU in a list of variations (custom mode uses flat rows)
 */
export const checkDuplicateSKUInVariations = (variations, variationMode) => {
  const skus = [];
  const duplicates = [];

  if (variationMode === "color_size") {
    variations.forEach((variation, varIdx) => {
      variation.sizes?.forEach((size, sizeIdx) => {
        const sku = size.sku?.trim();
        if (sku) {
          if (skus.includes(sku)) {
            duplicates.push({
              sku,
              variationIndex: varIdx,
              sizeIndex: sizeIdx,
            });
          } else {
            skus.push(sku);
          }
        }
      });
    });
  } else {
    // custom mode: each variation row has a single sku
    variations.forEach((variation, varIdx) => {
      const sku = variation.sku?.trim();
      if (sku) {
        if (skus.includes(sku)) {
          duplicates.push({ sku, variationIndex: varIdx });
        } else {
          skus.push(sku);
        }
      }
    });
  }

  return duplicates.length > 0
    ? { hasDuplicate: true, duplicates }
    : { hasDuplicate: false, duplicates: [] };
};

/**
 * Validate price logic
 */
export const validatePriceLogic = (originalPrice, discountedPrice) => {
  const original = parseFloat(originalPrice) || 0;
  const discounted = parseFloat(discountedPrice) || 0;
  if (original === 0 || discounted === 0) return { valid: true };
  if (discounted >= original) {
    return {
      valid: false,
      error: "Selling price must be lower than original price",
    };
  }
  return { valid: true };
};

/**
 * Validate main product required fields
 */
export const validateMainProductFields = (formData) => {
  const errors = {};

  if (!formData.name?.trim()) errors.name = "Product name is required";
  if (!formData.category_id) errors.category_id = "Category is required";
  if (!formData.sub_category_id)
    errors.sub_category_id = "Subcategory is required";
  if (!formData.inner_sub_category_id)
    errors.inner_sub_category_id = "Inner subcategory is required";
  if (!formData.hsn_code?.trim()) errors.hsn_code = "HSN code is required";
  if (formData.gst === null || formData.gst === "")
    errors.gst = "GST percentage is required";

  if (!formData.is_variation) {
    if (!formData.sku?.trim()) {
      errors.main_sku = "SKU is required for non-variation products";
    } else {
      const skuValidation = validateSKUFormat(formData.sku);
      if (!skuValidation.valid) errors.main_sku = skuValidation.error;
    }
    const priceValidation = validatePriceLogic(
      formData.original_price,
      formData.discounted_price,
    );
    if (!priceValidation.valid) errors.price = priceValidation.error;
  }

  if (!formData.stock || formData.stock < 0)
    errors.stock = "Stock must be a non-negative number";
  if (
    formData.low_stock_threshold &&
    parseInt(formData.low_stock_threshold) > parseInt(formData.stock)
  )
    errors.low_stock_threshold =
      "Low stock threshold cannot exceed total stock";

  if (!formData.package_weight || formData.package_weight <= 0)
    errors.package_weight = "Package weight is required and must be > 0";
  if (!formData.package_length || formData.package_length <= 0)
    errors.package_length = "Package length is required and must be > 0";
  if (!formData.package_width || formData.package_width <= 0)
    errors.package_width = "Package width is required and must be > 0";
  if (!formData.package_height || formData.package_height <= 0)
    errors.package_height = "Package height is required and must be > 0";

  return { valid: Object.keys(errors).length === 0, errors };
};

/**
 * Validate variations
 *
 * color_size mode: unchanged – groups of {color_id, sizes[]}
 *
 * custom mode (NEW): flat array of variation rows, each with:
 *   {
 *     attributes: [{ attribute_id, attribute_value }, …],  // max 4, all unique attribute_ids
 *     stock, original_price, discounted_price, sku, barcode,
 *     media: []
 *   }
 */
export const validateVariationsData = (variations, variationMode) => {
  const errors = {};

  if (!Array.isArray(variations) || variations.length === 0) {
    return { valid: false, errors: ["At least one variation is required"] };
  }

  if (variationMode === "color_size") {
    variations.forEach((variation, varIdx) => {
      const varErrors = {};
      if (!variation.color_id || variation.color_id === "")
        varErrors.color_id = "Color is required";

      const sizeErrors = [];
      if (!Array.isArray(variation.sizes) || variation.sizes.length === 0) {
        varErrors.sizes = { general: "At least one size is required" };
      } else {
        variation.sizes.forEach((size, sizeIdx) => {
          const sizeErr = {};
          if (!size.size_id) sizeErr.size_id = "Size is required";
          if (size.stock === "" || size.stock === undefined || size.stock < 0)
            sizeErr.stock = "Stock must be specified and non-negative";
          if (!size.original_price || size.original_price <= 0)
            sizeErr.original_price =
              "Original price is required and must be > 0";
          if (!size.discounted_price || size.discounted_price <= 0)
            sizeErr.discounted_price =
              "Selling price is required and must be > 0";
          if (size.original_price && size.discounted_price) {
            const priceValidation = validatePriceLogic(
              size.original_price,
              size.discounted_price,
            );
            if (!priceValidation.valid) sizeErr.price = priceValidation.error;
          }
          if (!size.sku?.trim()) {
            sizeErr.sku = "SKU is required";
          } else {
            const skuV = validateSKUFormat(size.sku);
            if (!skuV.valid) sizeErr.sku = skuV.error;
          }
          if (Object.keys(sizeErr).length > 0) sizeErrors[sizeIdx] = sizeErr;
        });
        if (sizeErrors.some((e) => e && Object.keys(e).length > 0)) {
          varErrors.sizes = { details: sizeErrors };
        }
      }

      if (Object.keys(varErrors).length > 0) errors[varIdx] = varErrors;
    });
  } else {
    // ── custom mode ──────────────────────────────────────────────────────────
    variations.forEach((variation, varIdx) => {
      const varErrors = {};

      // Validate attributes array
      if (
        !Array.isArray(variation.attributes) ||
        variation.attributes.length === 0
      ) {
        varErrors.attributes =
          "At least one attribute is required per variation";
      } else {
        if (variation.attributes.length > 4) {
          varErrors.attributes = "Maximum 4 attributes allowed per variation";
        }
        // Each attribute must have attribute_id and attribute_value
        const attrErrors = [];
        const seenAttrIds = new Set();
        variation.attributes.forEach((attr, attrIdx) => {
          const attrErr = {};
          if (!attr.attribute_id) {
            attrErr.attribute_id = "Attribute type is required";
          } else if (seenAttrIds.has(String(attr.attribute_id))) {
            attrErr.attribute_id =
              "Duplicate attribute type – each attribute must be unique";
          } else {
            seenAttrIds.add(String(attr.attribute_id));
          }
          if (!attr.attribute_value?.trim()) {
            attrErr.attribute_value = "Attribute value is required";
          }
          if (Object.keys(attrErr).length > 0) attrErrors[attrIdx] = attrErr;
        });
        if (attrErrors.some((e) => e && Object.keys(e).length > 0)) {
          varErrors.attrErrors = attrErrors;
        }
      }

      // Pricing & inventory
      if (
        variation.stock === "" ||
        variation.stock === undefined ||
        variation.stock < 0
      )
        varErrors.stock = "Stock must be specified and non-negative";
      if (!variation.original_price || variation.original_price <= 0)
        varErrors.original_price = "Original price is required and must be > 0";
      if (!variation.discounted_price || variation.discounted_price <= 0)
        varErrors.discounted_price =
          "Selling price is required and must be > 0";
      if (variation.original_price && variation.discounted_price) {
        const priceV = validatePriceLogic(
          variation.original_price,
          variation.discounted_price,
        );
        if (!priceV.valid) varErrors.price = priceV.error;
      }
      if (!variation.sku?.trim()) {
        varErrors.sku = "SKU is required";
      } else {
        const skuV = validateSKUFormat(variation.sku);
        if (!skuV.valid) varErrors.sku = skuV.error;
      }

      if (Object.keys(varErrors).length > 0) errors[varIdx] = varErrors;
    });
  }

  return { valid: Object.keys(errors).length === 0, errors };
};

/**
 * Validate media uploads
 */
export const validateMediaRequirements = (media, isVariation) => {
  if (!Array.isArray(media)) {
    return { valid: false, error: "Media list must be an array" };
  }
  if (media.length === 0) {
    return {
      valid: false,
      error: isVariation
        ? "At least one image or video is required for variation"
        : "At least one image or video is required for product",
    };
  }
  return { valid: true };
};

export const validateSpecifications = (specifications) => {
  if (!Array.isArray(specifications)) return { valid: true };
  const validSpecs = specifications.filter(
    (spec) => spec?.feature?.trim() || spec?.specification?.trim(),
  );
  if (validSpecs.length > 7)
    return { valid: false, error: "Maximum 7 specifications are allowed" };
  return { valid: true };
};

export const validateWhatsInTheBox = (items) => {
  if (!Array.isArray(items)) return { valid: true };
  const filledItems = items.filter(
    (item) => item?.title?.trim() || item?.details?.trim(),
  );
  if (filledItems.length > 4)
    return {
      valid: false,
      error: "Maximum 4 items allowed in What's in the Box",
    };
  const incompleteItems = filledItems.filter(
    (item) => !item?.title?.trim() && item?.details?.trim(),
  );
  if (incompleteItems.length > 0)
    return {
      valid: false,
      error: "All items must have a title if details are provided",
    };
  return { valid: true };
};

export const getDiscountPercentage = (originalPrice, discountedPrice) => {
  const original = parseFloat(originalPrice) || 0;
  const discounted = parseFloat(discountedPrice) || 0;
  if (original === 0) return 0;
  return Math.round(((original - discounted) / original) * 100);
};

export const formatSKU = (sku) => {
  if (!sku) return "";
  return sku.trim().toUpperCase();
};
