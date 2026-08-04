import React from "react";

const InvoiceCard = React.forwardRef(({ orderData }, ref) => {
  const { id, product, orderInfo, customer, vendor, seller, fulfillment } = orderData;

  // Static Ierada company data
  const ieradaData = {
    companyName: "IERADA FASHION PRIVATE LIMITED",
    gstin: "09AAICI2321M1ZF",
    pan: "AAICI2321M",
    cin: "47912UP2025PTC224644",
    contact: "7065944288",
    addressLines: [
      "Subhash Nagar Phase-II",
      "Lucknow/Lesa, Sarojini Nagar",
      "Lucknow-226008, Uttar Pradesh"
    ],
    address: {
      line1: "Subhash Nagar Phase-II",
      line2: "Lucknow/Lesa, Sarojini Nagar, Lucknow-226008, Uttar Pradesh"
    }
  };

  // ---------- Shared helpers ----------
  const formatAddress = (address, fallback) => {
    if (!address) return fallback;
    if (typeof address === "string") return address;
    if (typeof address === "object") {
      const parts = [address.line1, address.line2].filter(Boolean);
      return parts.length > 0 ? parts.join(", ") : fallback;
    }
    return fallback;
  };

  const vendorAddress = formatAddress(vendor?.address, "");

  // ---------- Invoice 1: "Fulfilled By" style ----------
  const gross = Number(product?.grossAmount || 0);
  const taxable = Number(product?.taxableValue || 0);
  const gst1 = Number(product?.gst || 0);
  const qty1 = product?.quantity || 0;
  const total1 = Number(orderInfo?.price?.replace?.(/[^\d.]/g, "")) || gross;

  const vendorAddrLines = vendor?.addressLines || ieradaData.addressLines;

  const shippedFromAddr = formatAddress(vendor?.pickupAddress || vendor?.address || ieradaData.address, "");

  // ---------- Invoice 2: "Sold By" style ----------
  // Use same values as Invoice 1
  const gross2 = gross;
  const discount2 = Number(product?.discount ?? 0);
  const taxable2 = taxable;
  const igst2 = gst1;
  const cess2 = 0;
  const qty2 = qty1;
  const codCharge = Number(product?.codAmount || 0);
  const codTotal = Number(product?.codTotal || 0);
  const total2 = total1 + codTotal;

  const sellerAddrLines = vendor?.pickupAddressLines || vendor?.addressLines || ieradaData.addressLines;

  return (
    <div ref={ref} className="w-full flex flex-col items-center gap-6 bg-white">
      {/* ===================== INVOICE 1: Fulfilled By ===================== */}
      <div
        className="bg-white text-black text-[11px] w-full max-w-[780px] mx-auto border border-black"
        style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
      >
        <div className="text-center font-bold text-sm py-2 border-b border-black">
          Tax invoice
        </div>

        {/* Fulfilled By */}
        <div className="border-b border-black">
          <div className="px-3 pt-1.5 font-bold">Fulfilled By</div>
          <div className="px-3 text-orange-600 font-bold text-[13px] py-0.5">
            {vendor?.companyName || vendor?.shopName || ieradaData.companyName}
          </div>
          <div className="px-3 pb-1.5">
            {vendorAddrLines.map((l, i) => (
              <p key={i}>{l}</p>
            ))}
            <p>GSTIN : {vendor?.gstin || ieradaData.gstin}</p>
            <p>PAN : {vendor?.pan || ieradaData.pan}</p>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="border-b border-black">
          <div className="px-3 pt-1.5 font-bold">Invoice Details</div>
          <div className="px-3 pb-1.5">
            <p>
              <b>Tax Invoice Number :</b> {orderInfo?.invoiceNo || `INV-${id}`}
            </p>
            <p>
              <b>Invoice Date :</b> {orderInfo?.invoiceDate || orderInfo?.orderedDate || new Date().toLocaleDateString("en-IN")}
            </p>
            <p>
              <b>Order Number :</b> {orderInfo?.orderNumber || id}
            </p>
            <p>
              <b>Nature Of Supply :</b> {orderInfo?.natureOfSupply}
            </p>
          </div>
        </div>

        {/* Billed / Shipped / Shipped From */}
        <div className="grid grid-cols-3 border-b border-black">
          <div className="p-3 border-r border-black">
            <p className="font-bold">Billed To</p>
            <p>{customer?.name}</p>
            <p>{customer?.address?.line1}</p>
            <p>{customer?.address?.line2}</p>
            {customer?.address?.state && (
              <p className="font-bold mt-1">State : {customer.address.state}</p>
            )}
            {customer?.address?.stateCode && (
              <p className="font-bold">State Code : {customer.address.stateCode}</p>
            )}
            {(orderInfo?.placeOfSupply || customer?.placeOfSupply) && (
              <>
                <p className="font-bold mt-1">Place of Supply :</p>
                <p>{orderInfo?.placeOfSupply || customer?.placeOfSupply}</p>
              </>
            )}
          </div>
          <div className="p-3 border-r border-black">
            <p className="font-bold">Shipped To</p>
            <p>{customer?.name}</p>
            <p>{customer?.address?.line1}</p>
            <p>{customer?.address?.line2}</p>
          </div>
          <div className="p-3">
            <p className="font-bold">Shipped From</p>
            <p>{shippedFromAddr}</p>
          </div>
        </div>

        {/* Table */}
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-black font-bold">
              <th className="p-2 border-r border-black">Particulars</th>
              <th className="p-2 border-r border-black">GST</th>
              <th className="p-2 border-r border-black">Qty</th>
              <th className="p-2 border-r border-black">Gross Amount</th>
              <th className="p-2 border-r border-black">Taxable Value</th>
              <th className="p-2 border-r border-black">GST</th>
              <th className="p-2">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-black">
              <td className="p-2 border-r border-black">{product?.name}</td>
              <td className="p-2 border-r border-black">{product?.gstPercent}</td>
              <td className="p-2 border-r border-black">{qty1}</td>
              <td className="p-2 border-r border-black">{gross.toFixed(2)}</td>
              <td className="p-2 border-r border-black">{taxable.toFixed(2)}</td>
              <td className="p-2 border-r border-black">{gst1.toFixed(2)}</td>
              <td className="p-2">{total1.toFixed(2)}</td>
            </tr>
            <tr className="border-b border-black font-bold">
              <td className="p-2 border-r border-black">Total</td>
              <td className="p-2 border-r border-black"></td>
              <td className="p-2 border-r border-black">{qty1}</td>
              <td className="p-2 border-r border-black">{gross.toFixed(2)}&nbsp;&nbsp;0</td>
              <td className="p-2 border-r border-black">{taxable.toFixed(2)}&nbsp;&nbsp;0</td>
              <td className="p-2 border-r border-black">{gst1.toFixed(2)}&nbsp;&nbsp;0</td>
              <td className="p-2">{total1.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <div className="px-3 py-1.5 border-b border-black">
          Is the supply subject to reverse charge: {orderInfo?.reverseCharge || "No"}
        </div>

        <div className="h-16 border-b border-black" />

        <div className="px-3 py-1.5 border-b border-black">
          <p>
            <b>CIN :</b> {vendor?.cin || ieradaData.cin}
          </p>
          <p>
            <b>Contact No.</b> : {vendor?.contact || vendor?.phone || ieradaData.contact}
          </p>
        </div>

        <div className="text-right px-3 py-1 font-bold">E.& O.E.;</div>
      </div>

      {/* ===================== INVOICE 2: Sold By ===================== */}
      <div
        className="bg-white text-black text-[11px] w-full max-w-[780px] mx-auto border border-black"
        style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
      >
        <div className="text-center border-b border-black py-1">
          <p className="text-orange-600 font-bold text-[13px]">
          {vendor?.companyName || vendor?.shopName || ieradaData.companyName}
          </p>
          <p className="font-bold text-[11px]">(Tax Invoice)</p>
        </div>

        <div className="grid grid-cols-2 border-b border-black">
          <div className="p-2 border-r border-black">
            <b>Order Number :</b> {orderInfo?.orderNumber || id}
            <br />
            <b>Order Date :</b> {orderInfo?.orderedDate || new Date().toLocaleDateString("en-IN")}
          </div>
          <div className="p-2">
            <b>Invoice No:</b> {orderInfo?.invoiceNo2 || `INV2-${id}`}
            <br />
            <b>Invoice Date:</b> {orderInfo?.invoiceDate2 || orderInfo?.orderedDate || new Date().toLocaleDateString("en-IN")}
          </div>
        </div>

        <div className="p-2 border-b border-black">
          <p className="font-bold">Sold By</p>
          <p>{vendor?.name || vendor?.shopName || ieradaData.companyName}</p>
           <p>{shippedFromAddr}</p>
          <p>GST: {vendor?.gstin || ieradaData.gstin}</p>
        </div>

        <div className="grid grid-cols-2 border-b border-black">
          <div className="p-2 border-r border-black">
            <p className="font-bold">Shipping Address</p>
            <p>{customer?.name},</p>
            <p>{customer?.address?.line1},</p>
            <p>{customer?.address?.line2},</p>
            <p>{customer?.address?.line3}</p>
          </div>
          <div className="p-2">
            <p className="font-bold">Billing Address</p>
            <p>{customer?.name},</p>
            <p>{customer?.address?.line1},</p>
            <p>{customer?.address?.line2},</p>
            <p>{customer?.address?.line3}</p>
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-black font-bold">
              <th className="p-2 border-r border-black">Product (Color, Size)</th>
              <th className="p-2 border-r border-black">HSN</th>
              <th className="p-2 border-r border-black">Qty</th>
              <th className="p-2 border-r border-black">Gross Amount</th>
              <th className="p-2 border-r border-black">Discount</th>
              <th className="p-2 border-r border-black">Taxable Value</th>
              <th className="p-2 border-r border-black">IGST</th>
              <th className="p-2 border-r border-black">CESS</th>
              <th className="p-2 border-r border-black">COD</th>
              <th className="p-2">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-black">
              <td className="p-2 border-r border-black">
                {product?.name2 || product?.name}
              </td>
              <td className="p-2 border-r border-black">HSN: {product?.hsn}</td>
              <td className="p-2 border-r border-black">{qty2}</td>
              <td className="p-2 border-r border-black">{gross2}</td>
              <td className="p-2 border-r border-black">{discount2}</td>
              <td className="p-2 border-r border-black">{taxable2}</td>
              <td className="p-2 border-r border-black">{igst2}</td>
              <td className="p-2 border-r border-black">{cess2}</td>
              <td className="p-2 border-r border-black">{codTotal}</td>
              <td className="p-2">{total2}</td>
            </tr>
          </tbody>
        </table>

        <div className="flex justify-between border-b border-black">
          <div className="p-2">
            <b>Total Qty</b>&nbsp;&nbsp;&nbsp;{qty2}
          </div>
          <div className="p-2 font-bold">Total : INR {total2.toFixed(2)}</div>
        </div>

        <div className="p-2 font-bold">
          This is a computer generated invoice, No signature required
        </div>
      </div>
    </div>
  );
});

export default React.memo(InvoiceCard);