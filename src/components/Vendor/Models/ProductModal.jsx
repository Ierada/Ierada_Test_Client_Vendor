import React from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ProductModal = ({ isOpen, onClose, product }) => {
  if (!isOpen || !product) return null;

  const formatPrice = (price) => `₹${price?.toLocaleString() || 0}`;
  const categoryLabel =
    product.category ||
    product.Category?.title ||
    "N/A";
  const discountPrice =
    product.discount_price ?? product.discounted_price;
  const productImages =
    product.media?.length > 0
      ? product.media
      : product.image
        ? [{ url: product.image }]
        : [];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex justify-between items-start gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {product.name}
                </h2>
                {product.custom_id && (
                  <p className="mt-1 font-mono text-sm text-gray-500">
                    Product ID: {product.custom_id}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0"
                aria-label="Close"
                title="Close"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Basic Information */}
            <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">
                Basic Information
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product ID
                  </label>
                  <p className="text-gray-900 font-mono text-sm">
                    {product.custom_id || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <p className="text-gray-900">{categoryLabel}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <p className="text-gray-900">{product.type || "N/A"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Original Price
                  </label>
                  <p className="text-gray-900">
                    {formatPrice(product.original_price)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discounted Price
                  </label>
                  <p className="text-gray-900">
                    {formatPrice(discountPrice)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock
                  </label>
                  <p className="text-gray-900">{product.stock || "N/A"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      product.status
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {product.visibility} -{" "}
                    {product.status ? "Active" : "Inactive"}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SKU / Barcode
                  </label>
                  <p className="text-gray-900">
                    {product.sku} / {product.barcode}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    HSN Code
                  </label>
                  <p className="text-gray-900">{product.hsn_code}</p>
                </div>
              </div>

              {/* Shipping Information */}
              <div className="mt-6">
                <h4 className="text-md font-semibold mb-3 text-gray-900">
                  Shipping Details
                </h4>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Package Dimensions
                    </label>
                    <p className="text-gray-900">
                      {product.package_width} x Width, {product.package_height}{" "}
                      x Height, {product.package_length} x Length,{" "}
                      {product.package_depth} x Depth
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dead Weight
                    </label>
                    <p className="text-gray-900">{product.package_weight} g</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Volumetric Weight
                    </label>
                    <p className="text-gray-900">
                      {product.volumetric_weight} g
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GST Details
                    </label>
                    <p className="text-gray-900">{product.gst}%</p>
                  </div>
                </div>
              </div>

              {(product.general_info ||
                product.product_details ||
                product.warranty_info) && (
                <div className="mt-6">
                  <h4 className="text-md font-semibold mb-3 text-gray-900">
                    Product Information
                  </h4>
                  {product.general_info && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        General Information
                      </label>
                      <div
                        className="text-gray-900 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: product.general_info,
                        }}
                      />
                    </div>
                  )}
                  {product.product_details && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product Details
                      </label>
                      <div
                        className="text-gray-900 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: product.product_details,
                        }}
                      />
                    </div>
                  )}
                  {product.warranty_info && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Warranty Information
                      </label>
                      <div
                        className="text-gray-900 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: product.warranty_info,
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Variations Section */}
            {product.is_variation && product.variations?.length > 0 && (
              <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">
                  Product Variations
                </h3>
                <div className="space-y-6">
                  {product.variations.map((colorVariation) => (
                    <div key={colorVariation.unique_id} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full border shadow-sm"
                          style={{ backgroundColor: colorVariation.color_code }}
                        />
                        <h4 className="font-medium text-gray-900">
                          {colorVariation.color_name}
                        </h4>
                      </div>
                      <div className="grid gap-3">
                        {colorVariation.sizes.map((size) => (
                          <div
                            key={size.id}
                            className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                          >
                            <span className="font-medium w-20">
                              {size.size}
                            </span>
                            <span className="text-gray-600">
                              SKU: {size.sku}
                            </span>
                            <span className="text-gray-600">
                              Stock: {size.stock}
                            </span>
                            <span className="text-gray-600">
                              Original: {formatPrice(size.original_price)}
                            </span>
                            <span className="text-gray-600">
                              Discounted: {formatPrice(size.discounted_price)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Images Section */}
            {productImages.length > 0 && (
              <div className="bg-white rounded-lg border shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">
                  Product Images
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {productImages.map((image, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="aspect-square rounded-lg overflow-hidden"
                    >
                      <img
                        src={image.url || image}
                        alt={`${product.name} - Image ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProductModal;
