import React from "react";

const ProductCell = ({ product }) => {
  const baseWebsiteUrl = import.meta.env.VITE_BASE_WEBSITE_URL || 'https://ierada.com';
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  const productIdentifier = product?.slug || product?.productSlug || product?.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || product?.productId || product?.id || product?._id || product?.custom_id;

  const handleClick = (e) => {
    e.stopPropagation();
    if (productIdentifier) {
      window.open(`${baseWebsiteUrl}/product/${productIdentifier}`, "_blank");
    }
  };

  const productImage = product?.image || product?.images?.[0] || product?.ProductImages?.[0]?.file;

  return (
    <div className="flex items-center gap-3 group">
      {productImage && (
        <a
          href={`${baseWebsiteUrl}/product/${productIdentifier}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex-shrink-0"
        >
          <img
            src={`api/assets/productFiles/${productImage}`}
            alt={product?.name || "Product"}
            className="w-10 h-10 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
          />
        </a>
      )}
      <div>
        <div 
          onClick={handleClick}
          className="font-semibold text-[#0164CE] hover:underline transition-colors text-sm max-w-[280px] truncate cursor-pointer"
        >
          {product?.name || "Premium Product"}
        </div>
        <div className="text-xs text-gray-500 mt-0.5">Qty: {product?.quantity || product?.qty || 1}</div>
      </div>
    </div>
  );
};

export default ProductCell;
