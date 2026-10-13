import { Link, useLocation } from "react-router-dom";

const preventFocusScroll = (e) => {
  e.preventDefault();
};

export function SectionPills({ hubPath, hubLabel = "Overview", items = [] }) {
  const location = useLocation();
  const path = location.pathname;

  const pillClass = (active) =>
    `px-2.5 py-1 rounded-lg text-[13px] leading-none font-medium border whitespace-nowrap transition-colors ${
      active
        ? "bg-[#FF6012] text-white border-[#FF6012]"
        : "bg-white text-gray-700 border-gray-200 hover:bg-[#FFF3EF]"
    }`;

  const itemActive = (itemPath) => {
    if (path === itemPath) return true;
    if (!path.startsWith(`${itemPath}/`)) return false;
    return !items.some(
      (other) =>
        other.path !== itemPath &&
        (path === other.path || path.startsWith(`${other.path}/`)),
    );
  };

  return (
    <nav className="sticky top-[66px] z-30 flex shrink-0 flex-nowrap items-center gap-1.5 overflow-x-auto bg-[#F5F6F8] px-4 pb-3 pt-3">
      <Link
        to={hubPath}
        onMouseDown={preventFocusScroll}
        className={pillClass(path === hubPath)}
      >
        {hubLabel}
      </Link>
      {items.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          onMouseDown={preventFocusScroll}
          className={pillClass(itemActive(item.path))}
        >
          {item.text}
        </Link>
      ))}
    </nav>
  );
}

export function SectionHub({ title, subtitle, items = [] }) {
  if (!items.length) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-sm text-gray-500">
        You do not have access to any options in this section.
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-satoshi text-2xl font-semibold text-gray-800">{title}</h1>
      {subtitle ? (
        <p className="text-sm text-gray-500 mt-1 mb-5">{subtitle}</p>
      ) : null}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="group rounded-xl border border-gray-200 bg-white p-5 hover:border-[#FF6012] hover:shadow-sm transition-all"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFF3EF] text-[#FF6012] transition-colors group-hover:bg-[#FF6012] group-hover:text-white">
                {Icon ? <Icon className="w-5 h-5" /> : null}
              </div>
              <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
                {item.text}
                {item.badge > 0 ? (
                  <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#FF6012] px-1.5 text-[11px] font-medium text-white">
                    {item.badge}
                  </span>
                ) : null}
              </h2>
              {item.description ? (
                <p className="text-sm text-gray-500 mt-1">{item.description}</p>
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
