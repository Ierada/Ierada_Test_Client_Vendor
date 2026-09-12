import React, { useMemo } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { IoIosArrowDown, IoIosArrowForward } from "react-icons/io";
import SubMenuItem from "./SubMenuItem";

const preventFocusScroll = (e) => {
  e.preventDefault();
};

const MenuItem = ({
  item,
  counts,
  openSubMenus,
  toggleSubMenu,
  hoveredSubMenu,
  setHoveredSubMenu,
  handleNavigation,
  expanded = true,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const Icon = item.icon;
  const hasSubItems = item.subItems && item.subItems.length > 0;

  const hasActiveSub = useMemo(() => {
    return item.subItems?.some(
      (sub) =>
        location.pathname === sub.path ||
        location.pathname.startsWith(`${sub.path}/`),
    );
  }, [item.subItems, location.pathname]);

  const active =
    item.sectionPrefixes?.some(
      (prefix) =>
        location.pathname === prefix ||
        location.pathname.startsWith(`${prefix}/`),
    ) ||
    location.pathname === item.path ||
    location.pathname.startsWith(`${item.path}/`) ||
    hasActiveSub;

  const isExpanded =
    expanded &&
    (openSubMenus[item.text] || hoveredSubMenu === item.text || hasActiveSub);

  const badgeCount =
    item.text === "Orders"
      ? counts.orders
      : item.text === "Notifications"
        ? counts.notifications
        : null;

  const getBadge = () => {
    if (!expanded || badgeCount == null || Number(badgeCount) <= 0) return null;
    return (
      <span
        className={`text-white text-[10px] min-w-[16px] h-4 px-1 rounded-full inline-flex items-center justify-center ${
          item.text === "Notifications" ? "bg-[#0096EB]" : "bg-[#FF6012]"
        }`}
      >
        {badgeCount}
      </span>
    );
  };

  const handleParentClick = () => {
    if (hasSubItems && expanded) toggleSubMenu(item.text);
    if (item.path) {
      navigate(item.path);
      handleNavigation();
    }
  };

  if (hasSubItems) {
    return (
      <li
        className={`rounded group ${expanded ? "p-2" : "p-1"} ${
          hasActiveSub ? "bg-[#FF60121C]" : ""
        }`}
        onMouseEnter={
          expanded ? () => setHoveredSubMenu(item.text) : undefined
        }
        onMouseLeave={expanded ? () => setHoveredSubMenu(null) : undefined}
      >
        <button
          type="button"
          title={item.text}
          onMouseDown={preventFocusScroll}
          onClick={handleParentClick}
          className={`text-[#353535] group-hover:text-[#FF6012] text-[15px]
            font-satoshi font-normal inline-flex items-center w-full
            transition-colors duration-200 ${
              expanded ? "justify-between px-2 py-1" : "justify-center px-0 py-1"
            } ${hasActiveSub ? "text-[#FF6012]" : ""}`}
        >
          <div className={`flex items-center ${expanded ? "gap-4" : "gap-0"}`}>
            <span
              className={`relative shrink-0 flex items-center justify-center ${
                expanded
                  ? ""
                  : `w-10 h-10 rounded-xl ${hasActiveSub ? "bg-[#FF60121C]" : "hover:bg-gray-50"}`
              }`}
            >
              <Icon className="w-5 h-5 transition-colors duration-200 group-hover:text-[#FF6012]" />
              {!expanded && badgeCount > 0 ? (
                <span className="absolute -top-1 -right-1 bg-[#FF6012] text-white text-[9px] min-w-[14px] h-3.5 px-0.5 rounded-full inline-flex items-center justify-center">
                  {Number(badgeCount) > 9 ? "9+" : badgeCount}
                </span>
              ) : null}
            </span>
            {expanded ? (
              <span className="transition-colors duration-200 whitespace-nowrap">
                {item.text}
              </span>
            ) : null}
          </div>
          {expanded ? (
            <span
              className={`transform transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
              }`}
            >
              <IoIosArrowDown className="w-4 h-4" />
            </span>
          ) : null}
        </button>
        {isExpanded ? (
          <ul className="ml-8 mt-2 space-y-1 border-l-2 border-[#FF60121C] pl-3">
            {item.subItems.map((sub, idx) => (
              <SubMenuItem
                key={idx}
                subItem={sub}
                counts={counts}
                subActive={
                  location.pathname === sub.path ||
                  location.pathname.startsWith(`${sub.path}/`)
                }
                handleNavigation={handleNavigation}
              />
            ))}
          </ul>
        ) : null}
      </li>
    );
  }

  return (
    <li className={`rounded group ${expanded ? "py-2" : "py-1"}`}>
      <NavLink
        to={item.path}
        title={item.text}
        onMouseDown={preventFocusScroll}
        className={() =>
          expanded
            ? `w-full flex justify-between group-hover:bg-[#FF60121C] group-hover:text-[#FF6012] group-hover:rounded-r-full text-[15px]
            font-satoshi font-normal items-center gap-2 px-4 py-2 rounded-r-full
            ${
              active
                ? "bg-[#FF60121C] text-[#FF6012] shadow-sm"
                : "text-[#353535]"
            }`
            : `w-full flex items-center justify-center py-1 text-[#353535] group-hover:text-[#FF6012]`
        }
        onClick={handleNavigation}
      >
        <>
          <div className={`flex ${expanded ? "gap-4" : "gap-0"}`}>
            <span
              className={`relative shrink-0 flex items-center justify-center ${
                expanded
                  ? ""
                  : `w-10 h-10 rounded-xl ${active ? "bg-[#FF60121C] text-[#FF6012]" : "hover:bg-gray-50"}`
              }`}
            >
              <Icon className="w-5 h-5 transition-colors duration-200 group-hover:text-[#FF6012]" />
              {!expanded && badgeCount > 0 ? (
                <span
                  className={`absolute -top-1 -right-1 text-white text-[9px] min-w-[14px] h-3.5 px-0.5 rounded-full inline-flex items-center justify-center ${
                    item.text === "Notifications" ? "bg-[#0096EB]" : "bg-[#FF6012]"
                  }`}
                >
                  {Number(badgeCount) > 9 ? "9+" : badgeCount}
                </span>
              ) : null}
            </span>
            {expanded ? (
              <>
                <span className="transition-colors duration-200 whitespace-nowrap truncate max-w-[9.5rem]">
                  {item.text}
                </span>
                {getBadge()}
              </>
            ) : null}
          </div>
          {expanded && active ? (
            <span className="bg-white rounded-full p-1 shadow-sm">
              <IoIosArrowForward className="text-[#FF6012] w-4 h-4" />
            </span>
          ) : null}
        </>
      </NavLink>
    </li>
  );
};

export default React.memo(MenuItem);
