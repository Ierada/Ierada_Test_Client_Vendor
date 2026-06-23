import React from "react";

const ShippingLabelCard = React.forwardRef(({ orderData }, ref) => {
  const { id, product, customer } = orderData;
  return (
    <div ref={ref} className="bg-white p-5 border border-dashed border-gray-300 text-gray-800 text-[10px] w-full max-w-[380px] mx-auto font-sans leading-relaxed">
      <div className="flex flex-col items-center border-b pb-4 mb-4">
        {/* Mock Barcode */}
        <div className="flex items-center justify-center gap-[1px] h-10 w-full mb-1">
          {Array.from({ length: 42 }).map((_, i) => (
            <div key={i} className="bg-black h-full" style={{ width: i % 3 === 0 ? "3px" : i % 5 === 0 ? "1px" : "2px" }} />
          ))}
        </div>
        <span className="font-mono font-bold text-gray-900 tracking-wider">ORDER #{id}</span>
      </div>
      <div className="border-b pb-3 mb-3 text-[9px]">
        <h3 className="font-bold text-gray-400 mb-0.5 tracking-wider uppercase">SHIP TO</h3>
        <p className="font-bold text-gray-900 text-[10.5px]">{customer.name}</p>
        <p>{customer.address?.line1}</p>
        <p>{customer.address?.line2}</p>
        <p>Phone: {customer.phone}</p>
      </div>
      <div className="border-b pb-3 mb-3 text-[9px]">
        <h3 className="font-bold text-gray-400 mb-0.5 tracking-wider uppercase">SHIP FROM</h3>
        <p className="font-bold text-gray-900 text-[10.5px]">SellerHub Warehouse</p>
        <p>Plot 12, Andheri East</p>
        <p>Mumbai — 400069</p>
      </div>
      <div className="flex justify-between items-center text-[9px] font-semibold">
        <div>
          <p className="text-gray-400 font-bold uppercase text-[7.5px] leading-tight">Product</p>
          <p className="text-gray-900 font-bold max-w-[180px] truncate">{product.name}</p>
        </div>
        <div className="text-right">
          <p className="text-gray-400 font-bold uppercase text-[7.5px] leading-tight">Weight</p>
          <p className="text-gray-900 font-bold">0.45 kg</p>
        </div>
        <div className="text-right">
          <p className="text-gray-400 font-bold uppercase text-[7.5px] leading-tight">Payment</p>
          <p className="text-[#00B560] font-bold">Prepaid</p>
        </div>
      </div>
    </div>
  );
});

export default React.memo(ShippingLabelCard);
