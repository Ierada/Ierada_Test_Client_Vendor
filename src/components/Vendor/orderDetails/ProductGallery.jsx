import React, { useState, useEffect } from "react";
import {
  RotateCcw,
  ShieldCheck,
  Truck,
  ZoomIn,
  X,
} from "lucide-react";

const ProductGallery = ({ images, image, name }) => {
  const [activeImg, setActiveImg] = useState("");
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  useEffect(() => {
    setActiveImg(images?.[0] || image || "");
  }, [images, image]);

  const thumbs = images && images.length > 0 ? images : [image].filter(Boolean);

  return (
    <>
      <div className="flex w-full flex-col gap-4">
        <div className="flex gap-3">
          {/* Thumbnails */}
          <div className="flex shrink-0 flex-col gap-2">
            {thumbs.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImg(img)}
                className={`h-14 w-14 overflow-hidden rounded-[8px] border bg-white p-1 transition-colors hover:border-[#FF6012] ${
                  activeImg === img
                    ? "border-[#FF6012]"
                    : "border-[#E4E8EF]"
                }`}
              >
                <img
                  src={img}
                  alt=""
                  className="h-full w-full object-contain"
                />
              </button>
            ))}
          </div>

          {/* Main Image */}
          <div className="relative flex h-[288px] flex-1 flex-col items-center justify-center rounded-2xl bg-[#ECEFF3] p-5">
            <button
              onClick={() => setIsZoomOpen(true)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#667085] shadow-sm transition hover:text-[#FF6012]"
            >
              <ZoomIn className="h-4 w-4" />
            </button>

            {activeImg ? (
              <img
                src={activeImg}
                alt={name}
                className="max-h-[190px] max-w-full object-contain"
              />
            ) : (
              <div className="text-xs text-gray-300">No Image</div>
            )}

            <div className="mt-4 text-center text-xs font-medium text-[#8A94A6]">
              {name} - Front View
            </div>

            <span className="absolute bottom-4 left-4 rounded-md bg-white px-2 py-1 text-[11px] font-bold text-[#FF6012] shadow-sm">
              {name || ""}
            </span>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-2.5 text-[12px] text-[#667085]">
          <div className="flex items-center gap-2 rounded-lg border border-[#E4E8EF] bg-white p-3">
            <Truck className="h-4 w-4 shrink-0 text-[#FF6012]" />
            <div>
              <div className="font-bold text-[#344054]">Free Delivery</div>
              <div>Arrives in 2-4 days</div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-[#E4E8EF] bg-white p-3">
            <RotateCcw className="h-4 w-4 shrink-0 text-[#FF6012]" />
            <div>
              <div className="font-bold text-[#344054]">7-Day Returns</div>
              <div>Hassle-free policy</div>
            </div>
          </div>

          <div className="col-span-2 flex items-center gap-2 rounded-lg border border-[#E4E8EF] bg-white p-3">
            <ShieldCheck className="h-4 w-4 shrink-0 text-[#FF6012]" />
            <div>
              <div className="font-bold text-[#344054]">
                1 Year Brand Warranty
              </div>
              <div>Official service centers across India</div>
            </div>
          </div>
        </div>
      </div>

      {/* Zoom Modal */}
      {isZoomOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setIsZoomOpen(false)}
        >
          <div
            className="relative flex max-h-[95vh] max-w-[95vw] items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsZoomOpen(false)}
              className="absolute right-0 top-0 z-10 rounded-full bg-white p-2 shadow-md"
            >
              <X className="h-5 w-5" />
            </button>

            <img
              src={activeImg}
              alt={name}
              className="max-h-[90vh] max-w-[90vw] object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default React.memo(ProductGallery);