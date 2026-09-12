import React from "react";
import { BsHandbag } from "react-icons/bs";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BrandHeader = ({ setSidebarOpen, expanded = true }) => {
  const navigate = useNavigate();

  return (
    <div
      className={`relative flex-shrink-0 flex items-center gap-2 ${
        expanded ? "justify-between p-5 my-2" : "justify-center p-2 my-1"
      }`}
    >
      <button
        type="button"
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-3 transition-transform duration-200 hover:scale-105 text-left"
        title="IERADA Seller Panel"
      >
        <div className="bg-[#FF6012] p-1.5 rounded-lg flex items-center justify-center shrink-0">
          <BsHandbag className="text-white w-[18px] h-[18px]" />
        </div>
        {expanded ? (
          <div>
            <h2 className="font-bold text-gray-900 text-[14px] leading-tight tracking-wide">
              IERADA
            </h2>
            <p className="text-[10px] text-gray-500 font-medium leading-none mt-0.5">
              Seller Panel
            </p>
          </div>
        ) : null}
      </button>
      {expanded ? (
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="absolute top-2 right-2 rounded-md lg:hidden text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1 transition-all duration-200"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      ) : null}
    </div>
  );
};

export default React.memo(BrandHeader);
