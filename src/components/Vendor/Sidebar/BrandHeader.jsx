import React from "react";
import { BsHandbag } from "react-icons/bs";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BrandHeader = ({ setSidebarOpen }) => {
  const navigate = useNavigate();

  return (
    <div className="relative flex items-center justify-between p-5 pb-3 font-satoshi">
      <button
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-3 transition-all duration-300 text-left"
      >
        <div className="bg-[#FF6012] p-1.5 rounded-lg flex items-center justify-center shrink-0">
          <BsHandbag className="text-white w-[18px] h-[18px]" />
        </div>
        <div>
          <h2 className="font-bold text-gray-900 text-[14px] leading-tight tracking-wide">
            IERADA
          </h2>
          <p className="text-[10px] text-gray-500 font-medium leading-none mt-0.5">
            Seller Central
          </p>
        </div>
      </button>
      <button
        onClick={() => setSidebarOpen(false)}
        className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
    </div>
  );
};

export default React.memo(BrandHeader);
