import React from "react";

export function SellerFormContainer({ children, containerHeight = "lg:h-[900px]", className, ...props }) {
  return (
    <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center p-0 lg:p-4 font-lato">
      <div
        className={`w-full max-w-[1440px] h-auto ${containerHeight} flex flex-col lg:flex-row bg-[#F5F6F8] lg:rounded-2xl lg:shadow-xl overflow-hidden relative ${className || ""}`}
        {...props}
      >
        {children}
      </div>
    </div>
  );
}

export function SellerLeftPanel({ children, className, ...props }) {
  return (
    <div
      className={`w-full lg:w-[802px] h-full bg-white relative flex flex-col justify-start rounded-r-none lg:rounded-r-[16px] ${className || ""}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function SellerRightPanel({ heroImageSrc, heroImageAlt, rightSectionBgColor = "bg-white", showVectorDeco = false, className, ...props }) {
  const isDarkBg = rightSectionBgColor === "bg-[#1C1D21]";
  return (
    <div
      className={`relative hidden lg:block w-[638px] h-full ${rightSectionBgColor} overflow-hidden ${className || ""}`}
      style={{ margin: 0, padding: 0 }}
      {...props}
    >
      
      {isDarkBg && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#1C1D21] to-[#2D2E35] z-0" />
      )}

      <div className="absolute inset-0 flex items-center justify-center p-0 m-0 z-10">
        <img
          src={heroImageSrc}
          alt={heroImageAlt}
          className={isDarkBg ? "object-contain w-full h-full" : "object-cover w-full h-full"}
          style={{ maxHeight: '100%', maxWidth: '100%', margin: 0, padding: 0 }}
          onError={(e) => {
            console.error("Image failed to load:", heroImageSrc);
          }}
        />
      </div>

      {showVectorDeco && (
        <div className=" w-[669px] h-fit left-0 top-[170px] opacity-[0.15] rotate-[-60deg] border border-[#F5F6F8] rounded-full pointer-events-none" />
      )}
    </div>
  );
}
