import React from "react";
import { Search } from "lucide-react";

const SearchBar = ({ expanded = true }) => {
  if (!expanded) {
    return (
      <div className="px-3 py-2 flex justify-center">
        <span className="w-10 h-10 rounded-lg bg-[#F5F7FA] flex items-center justify-center text-gray-400">
          <Search className="w-4 h-4" />
        </span>
      </div>
    );
  }

  return (
    <div className="px-5 py-3 font-satoshi">
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="w-4 h-4 text-gray-400" />
        </span>
        <input
          type="text"
          placeholder="Search orders..."
          className="w-full pl-9 pr-10 py-2 bg-[#F5F7FA] text-gray-900 placeholder-gray-400 text-[13px] font-medium rounded-lg border-0 outline-none"
        />
        <span className="absolute inset-y-0 right-0 flex items-center pr-2">
          <span className="text-[9px] text-gray-500 font-bold bg-white px-1.5 py-0.5 rounded shadow-sm leading-none border border-gray-100">
            ⌘K
          </span>
        </span>
      </div>
    </div>
  );
};

export default React.memo(SearchBar);
