import React from "react";
import { Smartphone } from "lucide-react";

const ProductSummaryCard = ({ product, orderInfo }) => {
  const [imgError, setImgError] = React.useState(false);

  const renderSmallTable = (val) => {
    if (!val) return null;
    let parsed = val;
    if (typeof val === 'string') {
      if (val === '[object Object]') return null;
      try { parsed = JSON.parse(val); } catch (e) { parsed = val; }
    }

    let items = [];
    if (Array.isArray(parsed)) {
      items = parsed;
    } else if (typeof parsed === 'object' && parsed !== null) {
      if ('title' in parsed && 'details' in parsed) {
        items = [parsed];
      } else if ('feature' in parsed && 'specification' in parsed) {
        items = [parsed];
      } else {
        items = Object.entries(parsed).map(([k, v]) => ({ key: k, value: v }));
      }
    } else {
      return <span className="ml-1">{String(parsed)}</span>;
    }

    if (items.length === 0) return null;

    return (
      <div className="mt-1.5 w-full border border-[#E5E7EF] rounded-[6px] overflow-hidden">
        <table className="w-full text-left text-[10.5px]">
          <tbody>
            {items.map((item, idx) => {
              if (typeof item !== 'object' || item === null) {
                return (
                  <tr key={idx} className="border-b border-[#E5E7EF] last:border-0 bg-white">
                    <td className="px-2.5 py-1.5 text-[#6B7280]">{String(item)}</td>
                  </tr>
                );
              }
              
              const keys = Object.keys(item);
              if (keys.length === 0) return null;
              
              if (keys.length >= 2) {
                return (
                  <tr key={idx} className="border-b border-[#E5E7EF] last:border-0 bg-white">
                    <td className="px-2.5 py-1.5 font-medium text-[#0D0F14] border-r border-[#E5E7EF] w-1/3 bg-[#F8F9FC] align-top">
                      {String(item[keys[0]])}
                    </td>
                    <td className="px-2.5 py-1.5 text-[#6B7280] align-top">
                      {String(item[keys[1]])}
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={idx} className="border-b border-[#E5E7EF] last:border-0 bg-white">
                  <td className="px-2.5 py-1.5 font-medium text-[#0D0F14] border-r border-[#E5E7EF] w-1/3 bg-[#F8F9FC] align-top">
                    {keys[0]}
                  </td>
                  <td className="px-2.5 py-1.5 text-[#6B7280] align-top">
                    {String(item[keys[0]])}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="flex flex-row items-start p-4 bg-white border border-[#E5E7EF] rounded-[11px] w-full max-w-[870px] box-border">
      <div className="flex flex-row w-full gap-3.5">
        {/* Product Image/Icon */}
        <div className="flex flex-row justify-center items-center w-14 h-14 bg-[#F1F2F7] rounded-[11px] shrink-0 overflow-hidden">
         
            <img 
              src={product?.image || ""} 
              alt={product.name} 
              className="w-full
               h-full object-cover" 
              onError={() => setImgError(true)}
              referrerPolicy="no-referrer"
            />
          
        </div>

        {/* Product Details */}
        <div className="flex flex-col flex-1 gap-1">
          <h2 className="font-semibold text-[#0D0F14] text-[14px] leading-[20px]">
            {product.name}
          </h2>
          <div className="flex flex-row items-center gap-2.5 mt-1">
            <div className="bg-[#F1F2F7] rounded-[3.5px] px-2 py-0.5">
              <span className="font-mono text-[#6B7280] text-[10px] leading-[15px]">
                {product.sku}
              </span>
            </div>
            {product.color && (
              <div className="flex items-center gap-1">
                {product.colorCode && (
                  <span 
                    className="w-2.5 h-2.5 rounded-full border border-gray-200" 
                    style={{ backgroundColor: product.colorCode }}
                  />
                )}
                <span className="text-[#6B7280] font-normal text-[10.5px] leading-[16px]">{product.color}</span>
              </div>
            )}
            {product.size && (
              <span className="text-[#6B7280] font-normal text-[10.5px] leading-[16px]">Size: {product.size}</span>
            )}
            <span className="text-[#6B7280] font-normal text-[10.5px] leading-[16px]">
              Qty: {product.quantity}
            </span>
            <span className="text-[#6B7280] font-normal text-[10.5px] leading-[16px]">
              Ordered: {orderInfo.orderedDate}
            </span>
          </div>

          {(product.whatsInBox || product.specifications) && (
            <div className="mt-2 text-[10.5px] text-[#6B7280] flex flex-col gap-1 border-t border-[#E5E7EF] pt-2">
              {product.whatsInBox && (
                <div className="flex flex-col mb-1.5">
                  <span className="font-medium text-[#0D0F14]">what's the Box:</span>
                  {renderSmallTable(product.whatsInBox)}
                </div>
              )}
              {product.specifications && (
                <div className="flex flex-col mt-1">
                  <span className="font-medium text-[#0D0F14]">Specification
                    :</span>
                  {renderSmallTable(product.specifications)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Price & Payment Type */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <div className="font-bold text-[#0D0F14] text-[19.6px] leading-[29px] text-right">
            {orderInfo.price}
          </div>
          <div className="bg-[#F1F2F7] rounded-[3.5px] px-2 py-0.5 mt-1">
            <span className="text-[#0D0F14] font-normal text-[10px] leading-[15px]">
              {orderInfo.paymentType}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ProductSummaryCard);
