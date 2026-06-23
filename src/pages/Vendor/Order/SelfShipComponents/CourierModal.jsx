import React from "react";
import { AlertCircle, X } from "lucide-react";

const CourierModal = ({ show, onClose, courierName, setCourierName, awbNumber, setAwbNumber, onSave, currentOrder }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden border border-gray-100 font-satoshi">
        <div className="flex items-center justify-between p-5 border-b border-gray-150 bg-gray-50">
          <div>
            <h3 className="text-sm font-bold text-gray-950">Add Courier & AWB Details</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Assign custom courier and AWB tracker for Order #{currentOrder?.id}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-150 rounded-lg transition-colors border-0 bg-transparent">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Courier Partner</label>
            <select value={courierName} onChange={(e) => setCourierName(e.target.value)} className="w-full mt-1.5 p-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary">
              <option value="BlueDart">BlueDart Logistics</option>
              <option value="Delhivery">Delhivery</option>
              <option value="DTDC">DTDC Express</option>
              <option value="Ekart">Ekart Logistics</option>
              <option value="Shadowfax">Shadowfax</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">AWB / Tracking Number</label>
            <input type="text" placeholder="e.g. BD9887234120" value={awbNumber} onChange={(e) => setAwbNumber(e.target.value)} className="w-full mt-1.5 p-2.5 border border-gray-200 rounded-xl text-sm placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" />
          </div>
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex gap-2.5">
            <AlertCircle className="w-4.5 h-4.5 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-[10px] text-blue-800 leading-relaxed">
              <strong>Notice:</strong> Once AWB details are entered and marked, the status will automatically advance, notifying the customer with the courier name and tracking code.
            </p>
          </div>
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors">Cancel</button>
          <button onClick={onSave} className="px-4 py-2 text-xs font-bold text-white bg-primary rounded-xl hover:bg-orange-600 transition-colors">Save Tracking Info</button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(CourierModal);
