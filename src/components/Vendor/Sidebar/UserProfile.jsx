import React from "react";
import { LogOut } from "lucide-react";

const UserProfile = ({ user, onLogout }) => {
  return (
    <div className="px-4 pb-5 pt-2 font-satoshi">
      <div className="flex items-center gap-2.5 p-2.5 bg-[#F5F7FA] rounded-xl border border-gray-100">
        <div className="w-9 h-9 rounded-full bg-[#FF6012] flex items-center justify-center text-white text-xs font-bold shrink-0">
          {user?.name?.charAt(0) || "T"}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-[13px] font-bold text-gray-900 leading-none truncate">
            {user?.name || "Wolf Media"}
          </h4>
          <p className="text-[11px] text-gray-500 mt-0.5 truncate">
            seller_id: {user?.seller_id || "TM48523"}
          </p>
        </div>
        <button
          onClick={onLogout}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
          title="Logout"
        >
          <LogOut className="w-[18px] h-[18px]" />
        </button>
      </div>
    </div>
  );
};

export default React.memo(UserProfile);
