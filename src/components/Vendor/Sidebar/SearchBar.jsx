import React from "react";

const SearchBar = () => {
  return (
    <div className="px-5 py-3 font-satoshi">
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
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
