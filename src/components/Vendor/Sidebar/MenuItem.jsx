import React, { useMemo } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
import SubMenuItem from "./SubMenuItem";

const MenuItem = ({ item, counts, openSubMenus, toggleSubMenu, hoveredSubMenu, setHoveredSubMenu, handleNavigation }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const Icon = item.icon;
  const hasSubItems = item.subItems && item.subItems.length > 0;

  const hasActiveSub = useMemo(() => {
    return item.subItems?.some(sub => location.pathname === sub.path);
  }, [item.subItems, location.pathname]);

  const active = location.pathname.includes(item.path) || hasActiveSub;
  const isExpanded = openSubMenus[item.text] || hoveredSubMenu === item.text || hasActiveSub;

  const getBadge = () => {
    if (item.text === "Orders") return <span className="ml-auto bg-[#FF6012] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full leading-none">{counts.orders}</span>;
    if (item.text === "Notifications") return <span className="ml-auto bg-[#0096EB] text-white text-[11px] font-bold px-2 py-0.5 rounded-full leading-none">{counts.notifications}</span>;
    return null;
  };

  const handleParentClick = () => {
    if (hasSubItems) toggleSubMenu(item.text);
    if (item.path) {
      navigate(item.path);
      handleNavigation();
    }
  };

  return (
    <li
      className="group relative font-satoshi"
      onMouseEnter={hasSubItems ? () => setHoveredSubMenu(item.text) : undefined}
      onMouseLeave={hasSubItems ? () => setHoveredSubMenu(null) : undefined}
    >
      {hasSubItems ? (
        <div className="flex flex-col">
          <button
            onClick={handleParentClick}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 w-full text-left ${active ? "bg-[#EEF2F6] text-[#0164CE] font-semibold" : "text-[#475467] hover:bg-gray-50 hover:text-gray-950"}`}
          >
            <div className="flex items-center gap-3 flex-1">
              <Icon className={`w-5 h-5 transition-colors ${active ? "text-[#0164CE]" : "text-[#475467] group-hover:text-gray-950"}`} />
              <span className="text-[14px] font-medium">{item.text}</span>
            </div>
            {getBadge()}
            {isExpanded ? <ChevronUp className="w-4 h-4 ml-1 text-gray-400" /> : <ChevronDown className="w-4 h-4 ml-1 text-gray-400" />}
          </button>
          <div className={`transition-all duration-300 overflow-hidden ${isExpanded ? "max-h-60 opacity-100 mt-1 mb-2" : "max-h-0 opacity-0"}`}>
            <ul className="space-y-1">
              {item.subItems.map((sub, idx) => (
                <SubMenuItem key={idx} subItem={sub} counts={counts} subActive={location.pathname === sub.path} handleNavigation={handleNavigation} />
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <NavLink to={item.path} className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${isActive ? "bg-[#EEF2F6] text-[#0164CE] font-semibold" : "text-[#475467] hover:bg-gray-50 hover:text-gray-950"}`} onClick={handleNavigation}>
          <div className="flex items-center gap-3 flex-1">
            <Icon className={`w-5 h-5 transition-colors ${active ? "text-[#0164CE]" : "text-[#475467] group-hover:text-gray-950"}`} />
            <span className="text-[14px] font-medium">{item.text}</span>
          </div>
          {getBadge()}
        </NavLink>
      )}
    </li>
  );
};

export default React.memo(MenuItem);
