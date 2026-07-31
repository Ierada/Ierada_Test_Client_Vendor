import React from "react";

const CourierCell = ({ name, trackingId, onShowTracking }) => {
  const handleTrackingClick = (e) => {
    e.stopPropagation();
    if (trackingId && onShowTracking) {
      onShowTracking(trackingId);
    }
  };

  return (
    <div>
      <div className="font-semibold text-gray-950 text-sm">{name || "Self Ship"}</div>
      {trackingId ? (
        <button
          onClick={handleTrackingClick}
          className="text-xs text-[#0164CE] mt-0.5 hover:underline cursor-pointer text-left"
          title="View tracking details"
        >
          {trackingId}
        </button>
      ) : (
        <div className="text-xs text-gray-500 mt-0.5">N/A</div>
      )}
    </div>
  );
};

export default CourierCell;
