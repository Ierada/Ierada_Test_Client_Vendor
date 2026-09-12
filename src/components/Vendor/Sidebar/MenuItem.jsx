import React, { useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";

const MenuItem = ({ item, counts, handleNavigation, expanded = true }) => {
  const location = useLocation();
  const Icon = item.icon;

  const active = useMemo(() => {
    if (item.sectionPrefixes?.length) {
      return item.sectionPrefixes.some(
        (prefix) =>
          location.pathname === prefix ||
          location.pathname.startsWith(`${prefix}/`),
      );
    }
    return (
      location.pathname === item.path ||
      location.pathname.startsWith(`${item.path}/`)
    );
  }, [item.path, item.sectionPrefixes, location.pathname]);

  const badge =
    item.text === "Orders" ? (
      <span className="ml-auto bg-[#FF6012] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full leading-none">
        {counts.orders}
      </span>
    ) : item.text === "Notifications" ? (
      <span className="ml-auto bg-[#0096EB] text-white text-[11px] font-bold px-2 py-0.5 rounded-full leading-none">
        {counts.notifications}
      </span>
    ) : null;

  return (
    <li className="group relative font-satoshi">
      <NavLink
        to={item.path}
        title={item.text}
        className={() =>
          `flex items-center rounded-lg transition-all duration-150 ${
            expanded ? "gap-3 px-3 py-2.5" : "justify-center px-0 py-2"
          } ${
            active
              ? "bg-[#EEF2F6] text-[#0164CE] font-semibold"
              : "text-[#475467] hover:bg-gray-50 hover:text-gray-950"
          }`
        }
        onClick={handleNavigation}
      >
        <span
          className={`relative shrink-0 flex items-center justify-center ${
            expanded
              ? ""
              : `w-10 h-10 rounded-xl ${active ? "bg-[#0164CE14]" : "hover:bg-gray-50"}`
          }`}
        >
          <Icon
            className={`w-5 h-5 transition-colors ${
              active
                ? "text-[#0164CE]"
                : "text-[#475467] group-hover:text-gray-950"
            }`}
          />
          {!expanded && item.text === "Orders" && counts.orders > 0 ? (
            <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 px-0.5 rounded-full bg-[#FF6012] text-white text-[9px] inline-flex items-center justify-center">
              {counts.orders > 9 ? "9+" : counts.orders}
            </span>
          ) : null}
        </span>
        {expanded ? (
          <>
            <span className="text-[14px] font-medium whitespace-nowrap truncate max-w-[9rem]">
              {item.text}
            </span>
            {badge}
          </>
        ) : null}
      </NavLink>
    </li>
  );
};

export default React.memo(MenuItem);
