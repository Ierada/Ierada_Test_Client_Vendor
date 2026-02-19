/**
 * Product Validation Utilities
 * Validates product data according to backend ProductController rules
 */

/**
 * Generate unique SKU
 * Format: ProductID + Timestamp + Random
 */
export const generateAutoSKU = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `SKU-${timestamp}-${random}`;
};

/**
 * Validate SKU format
 * Backend accepts any non-empty string, but we enforce a pattern for clarity
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
 * Check for duplicate SKU in a list of variations
 */
export const checkDuplicateSKUInVariations = (
  variations,
  excludeIndex = null,
) => {
  const skus = [];
  const duplicates = [];

  variations.forEach((variation, varIdx) => {
    if (excludeIndex !== null && varIdx === excludeIndex) return;

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

  return duplicates.length > 0
    ? { hasDuplicate: true, duplicates }
    : { hasDuplicate: false, duplicates: [] };
};

/**
 * Validate price logic
 * Backend rule: discounted_price must be less than original_price
 */
export const validatePriceLogic = (originalPrice, discountedPrice) => {
  const original = parseFloat(originalPrice) || 0;
  const discounted = parseFloat(discountedPrice) || 0;

  if (original === 0 || discounted === 0) {
    return { valid: true }; // Allow empty prices
  }

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

  if (!formData.name?.trim()) {
    errors.name = "Product name is required";
  }

  if (!formData.category_id) {
    errors.category_id = "Category is required";
  }

  if (!formData.sub_category_id) {
    errors.sub_category_id = "Subcategory is required";
  }

  if (!formData.inner_sub_category_id) {
    errors.inner_sub_category_id = "Inner subcategory is required";
  }

  if (!formData.hsn_code?.trim()) {
    errors.hsn_code = "HSN code is required";
  }

  if (formData.gst === null || formData.gst === "") {
    errors.gst = "GST percentage is required";
  }

  if (!formData.is_variation) {
    if (!formData.sku?.trim()) {
      errors.main_sku = "SKU is required for non-variation products";
    } else {
      const skuValidation = validateSKUFormat(formData.sku);
      if (!skuValidation.valid) {
        errors.main_sku = skuValidation.error;
      }
    }
  }

  // Price validation
  if (!formData.is_variation) {
    const priceValidation = validatePriceLogic(
      formData.original_price,
      formData.discounted_price,
    );
    if (!priceValidation.valid) {
      errors.price = priceValidation.error;
    }
  }

  if (!formData.stock || formData.stock < 0) {
    errors.stock = "Stock must be a non-negative number";
  }

  if (
    formData.low_stock_threshold &&
    parseInt(formData.low_stock_threshold) > parseInt(formData.stock)
  ) {
    errors.low_stock_threshold =
      "Low stock threshold cannot exceed total stock";
  }

  // Packaging dimensions
  if (!formData.package_weight || formData.package_weight <= 0) {
    errors.package_weight = "Package weight is required and must be > 0";
  }

  if (!formData.package_length || formData.package_length <= 0) {
    errors.package_length = "Package length is required and must be > 0";
  }

  if (!formData.package_width || formData.package_width <= 0) {
    errors.package_width = "Package width is required and must be > 0";
  }

  if (!formData.package_height || formData.package_height <= 0) {
    errors.package_height = "Package height is required and must be > 0";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate variations with all their nested data
 */
export const validateVariationsData = (variations, variationMode) => {
  const errors = {};

  if (!Array.isArray(variations) || variations.length === 0) {
    return {
      valid: false,
      errors: ["At least one variation is required"],
    };
  }

  variations.forEach((variation, varIdx) => {
    const varErrors = {};

    // Validate attribute selection
    if (variationMode === "color_size") {
      if (!variation.color_id || variation.color_id === "") {
        varErrors.color_id = "Color is required";
      }
    } else if (variationMode === "custom") {
      if (!variation.attribute_id || variation.attribute_id === "") {
        varErrors.attribute_id = "Attribute is required";
      }
    }

    // Validate sizes/options
    const sizeValidationErrors = {};
    if (!Array.isArray(variation.sizes) || variation.sizes.length === 0) {
      sizeValidationErrors.general = "At least one size/option is required";
    } else {
      const sizeErrors = [];

      variation.sizes.forEach((size, sizeIdx) => {
        const sizeErr = {};

        // Attribute value for custom mode - each option must have a value
        if (variationMode === "custom") {
          if (!size.attribute_value || !size.attribute_value.trim()) {
            sizeErr.attribute_value =
              "Attribute value is required for each option";
          }
        }

        // Size selection for color_size mode
        if (variationMode === "color_size" && !size.size_id) {
          sizeErr.size_id = "Size is required";
        }

        // Stock
        if (!size.stock || size.stock < 0) {
          sizeErr.stock = "Stock must be specified and non-negative";
        }

        // Original price
        if (!size.original_price || size.original_price <= 0) {
          sizeErr.original_price = "Original price is required and must be > 0";
        }

        // Discounted price
        if (!size.discounted_price || size.discounted_price <= 0) {
          sizeErr.discounted_price =
            "Discounted price is required and must be > 0";
        }

        // Price logic
        if (size.original_price && size.discounted_price) {
          const priceValidation = validatePriceLogic(
            size.original_price,
            size.discounted_price,
          );
          if (!priceValidation.valid) {
            sizeErr.price = priceValidation.error;
          }
        }

        // SKU validation
        if (!size.sku?.trim()) {
          sizeErr.sku = "SKU is required";
        } else {
          const skuValidation = validateSKUFormat(size.sku);
          if (!skuValidation.valid) {
            sizeErr.sku = skuValidation.error;
          }
        }

        if (Object.keys(sizeErr).length > 0) {
          sizeErrors[sizeIdx] = sizeErr;
        }
      });

      const hasSizeErrors = sizeErrors.some(
        (err) => err && Object.keys(err).length > 0,
      );
      if (hasSizeErrors) {
        sizeValidationErrors.details = sizeErrors;
      }
    }

    if (Object.keys(sizeValidationErrors).length > 0) {
      varErrors.sizes = sizeValidationErrors;
    }

    if (Object.keys(varErrors).length > 0) {
      errors[varIdx] = varErrors;
    }
  });

  // Check if there are any errors
  const hasErrors = Object.keys(errors).length > 0;

  return {
    valid: !hasErrors,
    errors,
  };
};

/**
 * Get error message for a specific field in variations
 */
export const getVariationFieldError = (
  errors,
  varIdx,
  field,
  sizeIdx = null,
) => {
  if (!errors?.[varIdx]) return null;

  const varErrors = errors[varIdx];

  if (sizeIdx === null) {
    // Variation level errors
    if (field === "sizes") {
      return varErrors.sizes?.general || null;
    }
    return varErrors[field] || null;
  } else {
    // Size level errors
    const details = varErrors.sizes?.details;
    if (Array.isArray(details)) {
      return details[sizeIdx]?.[field] || null;
    }
    return null;
  }
};

/**
 * Check if any variation field has error
 */
export const hasVariationError = (errors, varIdx, sizeIdx = null) => {
  if (!errors?.[varIdx]) return false;

  const varErrors = errors[varIdx];

  if (sizeIdx === null) {
    return Object.keys(varErrors).length > 0;
  } else {
    const details = varErrors.sizes?.details;
    const sizeErr = Array.isArray(details) ? details[sizeIdx] : null;
    return sizeErr && Object.keys(sizeErr).length > 0;
  }
};

/**
 * Validate media uploads
 */
export const validateMediaRequirements = (media, isVariation) => {
  if (!Array.isArray(media)) {
    return {
      valid: false,
      error: "Media list must be an array",
    };
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

/**
 * Validate specifications
 */
export const validateSpecifications = (specifications) => {
  if (!Array.isArray(specifications)) {
    return { valid: true }; // Optional field
  }

  const validSpecs = specifications.filter(
    (spec) => spec?.feature?.trim() || spec?.specification?.trim(),
  );

  if (validSpecs.length > 7) {
    return {
      valid: false,
      error: "Maximum 7 specifications are allowed",
    };
  }

  return { valid: true };
};

/**
 * Validate What's in the Box
 */
export const validateWhatsInTheBox = (items) => {
  if (!Array.isArray(items)) {
    return { valid: true }; // Optional field
  }

  // Filter out completely empty rows
  const filledItems = items.filter(
    (item) => item?.title?.trim() || item?.details?.trim(),
  );

  if (filledItems.length > 4) {
    return {
      valid: false,
      error: "Maximum 4 items allowed in What's in the Box",
    };
  }

  // Check for incomplete entries
  const incompleteItems = filledItems.filter(
    (item) => !item?.title?.trim() && item?.details?.trim(),
  );

  if (incompleteItems.length > 0) {
    return {
      valid: false,
      error: "All items must have a title if details are provided",
    };
  }

  return { valid: true };
};

/**
 * Get discount percentage
 */
export const getDiscountPercentage = (originalPrice, discountedPrice) => {
  const original = parseFloat(originalPrice) || 0;
  const discounted = parseFloat(discountedPrice) || 0;

  if (original === 0) return 0;

  return Math.round(((original - discounted) / original) * 100);
};

/**
 * Format SKU for display
 */
export const formatSKU = (sku) => {
  if (!sku) return "";
  return sku.trim().toUpperCase();
};
