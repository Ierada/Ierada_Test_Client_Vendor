import React from "react";
import { courierLabel } from "../../../utils/courierLabels";

const CourierCell = ({ name, trackingId, returnAwb, onShowTracking }) => {
  const handleTrackingClick = (e, id) => {
    e.stopPropagation();
    if (id && onShowTracking) {
      onShowTracking(id);
    }
  };

  return (
    <div>
      <div className="font-semibold text-gray-950 text-sm">
        {name ? courierLabel(name) : "Self Ship"}
      </div>
      {trackingId ? (
        <button
          onClick={(e) => handleTrackingClick(e, trackingId)}
          className="text-xs text-[#0164CE] mt-0.5 hover:underline cursor-pointer text-left"
          title="View tracking details"
        >
          {trackingId}
        </button>
      ) : (
        <div className="text-xs text-gray-500 mt-0.5">N/A</div>
      )}
      {returnAwb && (
        <button
          onClick={(e) => handleTrackingClick(e, returnAwb)}
          className="block text-[10px] text-purple-600 mt-0.5 hover:underline cursor-pointer text-left font-mono"
          title="Return pickup AWB"
        >
          RET {returnAwb}
        </button>
      )}
    </div>
  );
};

export default CourierCell;
