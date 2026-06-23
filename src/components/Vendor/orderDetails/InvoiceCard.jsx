import React from "react";

const InvoiceCard = React.forwardRef(({ orderData }, ref) => {
  const { id, product, orderInfo, customer } = orderData;
  const total = Number(orderInfo.price.replace(/[^\d]/g, "")) || 28999;
  const base = Math.round(total / 1.18);
  const gst = total - base;
  return (
    <div ref={ref} className="bg-white p-5 border border-gray-200 text-gray-800 text-[10px] w-full max-w-[620px] mx-auto font-sans leading-relaxed" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-3">
          <img src="/assets/logo/logo_white.svg" alt="IERADA Logo" className="h-8 w-auto object-contain" />
          <div>
            <h1 className="font-bold text-gray-900 text-xs">IERADA FASHION PRIVATE LIMITED</h1>
            <p className="text-gray-500 text-[8px]">0 Subash Nagar Phase II, Sarojini Nagar, Lucknow- 226008, Uttar Pradesh</p>
          </div>
        </div>
      </div>
      <div className="border border-gray-800 mb-3 font-bold text-xs tracking-wider" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "28px" }}>INVOICE</div>
      <div className="grid grid-cols-2 gap-4 mb-3 text-[9px] pb-2 border-b">
        <div>
          {["Company Name: Ierada Fashion Pvt Ltd", "Website: www.ierada.com", "Address: Lucknow, UP, India", `GSTIN: 27AABCU9603R1ZX`].map((x, i) => <p key={i}>{x}</p>)}
        </div>
        <div className="text-right">
          {[`Invoice No: INV-2024-0${id}`, `Order ID: #${id}`, `Invoice Date: ${orderInfo.orderedDate}`, `Payment Method: ${orderInfo.paymentType}`].map((x, i) => <p key={i}>{x}</p>)}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-3 text-[9px] pb-2 border-b">
        <div>
          <h3 className="font-bold text-gray-900 mb-0.5">BILLED TO</h3>
          <p>{customer.name}</p><p>{customer.address?.line1}</p><p>{customer.address?.line2}</p><p>Phone: {customer.phone}</p><p>Email: {customer.email}</p>
        </div>
        <div>
          <h3 className="font-bold text-gray-900 mb-0.5">SHIPPED TO</h3>
          <p>{customer.name}</p><p>{customer.address?.line1}</p><p>{customer.address?.line2}</p><p>Phone: {customer.phone}</p>
        </div>
      </div>
      <table className="w-full text-left mb-3 border-collapse text-[9px]">
        <thead>
          <tr className="border-b font-bold">
            <th>S No.</th><th>Product Name</th><th>Qty</th><th>Price</th><th>GST Tax</th><th>GST Amt</th><th className="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-100">
            <td>1</td><td>{product.name}</td><td>{product.quantity}</td><td>₹{base.toLocaleString()}</td><td>18%</td><td>₹{gst.toLocaleString()}</td><td className="text-right font-bold">₹{total.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
      <div className="flex justify-between items-center pt-2 border-t text-[8px] mt-4">
        <span className="text-gray-400">This is a computer-generated invoice. No signature required.</span>
        <div className="border border-gray-800 px-4 font-bold text-xs" style={{ display: "flex", alignItems: "center", justifyContent: "center", minWidth: "160px", height: "28px" }}>Total Amount: ₹{total.toLocaleString()}</div>
      </div>
    </div>
  );
});

export default React.memo(InvoiceCard);
