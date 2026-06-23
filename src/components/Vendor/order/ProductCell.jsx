import React from "react";

const ProductCell = ({ product }) => {
  const productIdentifier = product?.slug || product?.productSlug || product?.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || product?.productId || product?.id || product?._id || product?.custom_id;

  const handleClick = (e) => {
    e.stopPropagation();
    if (productIdentifier) {
      window.open(`https://internal-testing.ierada.com/product/${productIdentifier}`, "_blank");
    }
  };

  return (
    <div className="flex items-center gap-3 group">
      <div>
        <div 
          onClick={handleClick}
          className="font-semibold text-[#0164CE] hover:underline transition-colors text-sm max-w-[280px] truncate cursor-pointer"
        >
          {product?.name || "Premium Product"}
        </div>
        <div className="text-xs text-gray-500 mt-0.5">{product?.sku || product?.custom_id || "N/A"}</div>
      </div>
    </div>
  );
};

export default ProductCell;
