import React from "react";
import ProductGallery from "./ProductGallery";
import ProductSpecs from "./ProductSpecs";
import WhatsInBox from "./WhatsInBox";
import CustomerSection from "./CustomerSection";

const OrderDetailsStep = ({ orderData }) => {
  const { product, orderInfo, customer } = orderData;
  return (
    <div className="grid w-full max-w-[1320px] grid-cols-1 gap-6 px-6 py-6 mx-auto font-inter lg:grid-cols-[420px_minmax(0,1fr)]">
      <div className="min-w-0">
        <ProductGallery images={product.images} image={product.image} name={product.name} />
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        <div className="rounded-2xl border border-[#E4E8EF] bg-white p-5">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-[#FF6012] tracking-wider uppercase">{product.name}</span>
              <h2 className="mt-1 text-xl font-bold leading-tight text-[#101828]">{product.name}</h2>
              <div className="mt-2 inline-flex w-fit rounded bg-[#EEF1F5] px-2 py-1 text-[10px] font-medium text-[#667085]">
                {product.sku || ""}
              </div>
            </div>

            <div className="text-left md:text-right">
              <div className="text-2xl font-bold leading-none text-[#101828]">{orderInfo.price}</div>
              <div className="mt-2 flex items-center gap-2 md:justify-end">
                <span className="text-xs text-[#98A2B3] line-through">{orderInfo.orderTotal}</span>
                <span className="rounded bg-[#F04438] px-2 py-1 text-[10px] font-bold leading-none text-white">17% Off</span>
              </div>
              <div className="mt-1 text-[11px] text-[#98A2B3]">Incl. all taxes</div>
            </div>
          </div>

          <div className="mt-4 border-t border-[#EEF1F5] pt-4">
            <div className="flex flex-wrap gap-2 text-[11px]">
              <span className="rounded-full border border-[#FFE3C7] bg-[#FFF8F0] px-3 py-1 text-[#344054]"><b className="font-medium text-[#FF6012]">Colour:</b> {product.color || "yellow "}</span>
              <span className="rounded-full border border-[#FFE3C7] bg-[#FFF8F0] px-3 py-1 text-[#344054]"><b className="font-medium text-[#FF6012]">Size:</b> {product?.size || "x                                     l"}</span>
              <span className="rounded-full border border-[#FFE3C7] bg-[#FFF8F0] px-3 py-1 text-[#344054]"><b className="font-medium text-[#FF6012]">Payment:</b> {orderInfo.paymentType}</span>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2 border-t border-[#EEF1F5] pt-4 text-[12px] text-[#667085] sm:flex-row sm:items-center sm:justify-between">
            <span>Order <b className="font-semibold text-[#344054]">#{orderData.id}</b> - Qty: <b className="font-semibold text-[#344054]">{product.quantity}</b></span>
            <span>Ordered: <b className="font-semibold text-[#344054]">{orderInfo.orderedDate} - {orderInfo.orderedTime}</b></span>
          </div>
        </div>

        <ProductSpecs specifications={product.specifications} />
        <WhatsInBox whatsInBox={product.whatsInBox} />
        <CustomerSection customer={customer} />
      </div>
    </div>
  );
};

export default React.memo(OrderDetailsStep);
