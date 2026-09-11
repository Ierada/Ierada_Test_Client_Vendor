import { Link, useLocation } from "react-router-dom";

export function SectionPills({ hubPath, hubLabel = "Overview", items = [] }) {
  const location = useLocation();
  const path = location.pathname;

  const pillClass = (active) =>
    `px-4 py-1.5 rounded-full text-[13px] font-medium border transition-colors ${
      active
        ? "bg-[#F56C43] text-white border-[#F56C43]"
        : "bg-white text-slate-700 border-[#E5E7EB] hover:bg-slate-50"
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
    <nav className="sticky top-10 z-30 flex shrink-0 flex-wrap gap-2 bg-[#F5F6F8] px-4 pb-3 pt-3">
      <Link to={hubPath} className={pillClass(path === hubPath)}>
        {hubLabel}
      </Link>
      {items.map((item) => (
        <Link
          key={item.path}
          to={item.path}
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
      <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
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
              className="group rounded-xl border border-gray-200 bg-white p-5 hover:border-[#F47954] hover:shadow-sm transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-orange-50 text-[#F47954] flex items-center justify-center mb-3 group-hover:bg-[#F47954] group-hover:text-white transition-colors">
                {Icon ? <Icon className="w-5 h-5" /> : null}
              </div>
              <h2 className="text-base font-semibold text-gray-900">
                {item.text}
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
