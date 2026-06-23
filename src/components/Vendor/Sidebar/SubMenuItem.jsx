import React from "react";
import { NavLink } from "react-router-dom";

const SubMenuItem = ({ subItem, counts, subActive, handleNavigation }) => {
  const SubIcon = subItem.icon;
  const getBadgeCount = () => {
    if (subItem.text === "Self Ship") return counts.selfShip;
    if (subItem.text === "Returns & RTO") return counts.returns;
    return subItem.badge;
  };
  const badgeVal = getBadgeCount();

  return (
    <li>
      <NavLink
        to={subItem.path}
        className={`flex items-center gap-2.5 px-3 py-2 rounded-md transition-all duration-200 relative overflow-hidden
          ${subActive
            ? "bg-[#EEF2F6] text-[#0164CE] font-semibold"
            : "text-[#475467] hover:bg-gray-50 hover:text-gray-950"
          }`}
        onClick={handleNavigation}
      >
        <SubIcon
          className={`w-4 h-4 transition-colors duration-200 ${subActive
            ? "text-[#0164CE]"
            : "text-[#475467] group-hover:text-gray-950"
          }`}
        />
        <span className="text-[13px] font-satoshi font-medium">
          {subItem.text}
        </span>
        {badgeVal ? (
          <span className={`ml-auto text-white text-[10px] font-bold px-2 py-0.5 rounded-full leading-none ${subItem.badgeColor || "bg-[#FF6012]"}`}>
            {badgeVal}
          </span>
        ) : null}
      </NavLink>
    </li>
  );
};

export default React.memo(SubMenuItem);
