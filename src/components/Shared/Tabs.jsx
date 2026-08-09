import React from "react";

export function Tabs({ value, onValueChange, children, className }) {
  return (
    <div className={className}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            currentValue: value,
            onValueChange,
          });
        }
        return child;
      })}
    </div>
  );
}

export function TabsList({ currentValue, onValueChange, children, className }) {
  return (
    <div className={className}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            currentValue,
            onValueChange,
          });
        }
        return child;
      })}
    </div>
  );
}

export function TabsTrigger({ value: triggerValue, onValueChange, currentValue, children, className }) {
  const isActive = currentValue === triggerValue;
  // Active/inactive colors must win over caller utilities (e.g. bg-transparent,
  // text-[#8181A5]). Tailwind resolves conflicts by stylesheet order, not class
  // string order — so use !important modifiers for the state styles.
  // Inline style as a final override so the selected tab is always brand orange.
  return (
    <button
      type="button"
      onClick={() => onValueChange?.(triggerValue)}
      className={`${className ?? ""} ${
        isActive
          ? "!bg-[#ff5500] !text-white"
          : "!bg-transparent !text-[#8181A5]"
      }`}
      style={
        isActive
          ? { backgroundColor: "#ff5500", color: "#ffffff" }
          : { backgroundColor: "transparent", color: "#8181A5" }
      }
      data-active={isActive ? "true" : "false"}
      aria-selected={isActive}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value: contentValue, currentValue, children, className }) {
  if (currentValue !== contentValue) return null;
  return <div className={className}>{children}</div>;
}
