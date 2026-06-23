import React from "react";

const CourierCell = ({ name, trackingId }) => {
  return (
    <div>
      <div className="font-semibold text-gray-950 text-sm">{name || "Self Ship"}</div>
      <div className="text-xs text-gray-500 mt-0.5">{trackingId || "N/A"}</div>
    </div>
  );
};

export default CourierCell;
