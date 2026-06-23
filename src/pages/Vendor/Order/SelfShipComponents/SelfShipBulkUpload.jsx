import React from "react";
import { Upload, FileText, Download } from "lucide-react";

const SelfShipBulkUpload = () => {
  return (
    <div className="bg-white rounded-2xl border border-gray-150 shadow-sm p-6 max-w-3xl mx-auto font-satoshi">
      <h2 className="text-base font-bold text-gray-950">Bulk Upload AWB Tracking Numbers</h2>
      <p className="text-xs text-gray-400 mt-1">Upload an Excel or CSV file to assign couriers and tracking codes in batch.</p>

      <div className="mt-6 border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:border-primary/50 transition-colors cursor-pointer bg-gray-50/50">
        <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-sm mb-4">
          <Upload className="w-6 h-6 text-primary" />
        </div>
        <p className="text-sm font-bold text-gray-900">Drag and drop file here, or <span className="text-primary hover:underline">browse</span></p>
        <p className="text-xs text-gray-400 mt-1.5">Supported formats: .xlsx, .csv (Max 10MB)</p>
      </div>

      <div className="mt-6 border-t border-gray-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#EFF8FF] text-[#175CD3] rounded-xl border border-[#B2DDFF]">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-900">Self Ship AWB Sample Template</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Includes example order IDs and courier partner codes</p>
          </div>
        </div>
        <button className="px-4 py-2 border border-gray-200 rounded-xl bg-white text-gray-700 hover:bg-gray-50 text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5 shrink-0">
          <Download className="w-4 h-4 text-gray-500" />
          Download Template
        </button>
      </div>
    </div>
  );
};

export default React.memo(SelfShipBulkUpload);
