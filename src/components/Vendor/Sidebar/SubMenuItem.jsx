import React from "react";
import { NavLink } from "react-router-dom";
import { IoIosArrowForward } from "react-icons/io";

const preventFocusScroll = (e) => {
  e.preventDefault();
};

const SubMenuItem = ({ subItem, counts, subActive, handleNavigation }) => {
  const SubIcon = subItem.icon;
  const getBadgeCount = () => {
    if (subItem.text === "Self Ship") return counts.selfShip;
    if (subItem.text === "Returns & RTO") return counts.returns;
    return subItem.badge;
  };
  const badgeVal = getBadgeCount();

  return (
    <li className="rounded p-1">
      <NavLink
        to={subItem.path}
        onMouseDown={preventFocusScroll}
        className={`group-hover:text-[#FF6012] text-[14px]
          font-satoshi font-normal inline-flex items-center gap-2 px-3 py-1 w-full rounded-full
          ${
            subActive
              ? "bg-[#FF60121C] text-[#FF6012] shadow-sm"
              : "text-[#353535]"
          }`}
        onClick={handleNavigation}
      >
        <div className="flex items-center gap-2">
          <SubIcon className="w-4 h-4" />
          <span>{subItem.text}</span>
          {badgeVal > 0 ? (
            <span
              className={`ml-1 text-white text-[10px] min-w-[16px] h-4 px-1 rounded-full inline-flex items-center justify-center ${
                subItem.badgeColor || "bg-[#FF6012]"
              }`}
            >
              {badgeVal}
            </span>
          ) : null}
        </div>
        {subActive ? (
          <IoIosArrowForward className="text-[#FF6012] w-3 h-3" />
        ) : null}
      </NavLink>
    </li>
  );
};

export default React.memo(SubMenuItem);
