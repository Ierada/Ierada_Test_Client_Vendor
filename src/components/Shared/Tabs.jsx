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
  return (
    <button
      type="button"
      onClick={() => onValueChange(triggerValue)}
      className={className}
      data-active={isActive}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value: contentValue, currentValue, children, className }) {
  if (currentValue !== contentValue) return null;
  return <div className={className}>{children}</div>;
}
