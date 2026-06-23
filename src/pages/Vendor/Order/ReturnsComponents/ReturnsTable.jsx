import React from "react";
import ReturnsTableRow from "./ReturnsTableRow";
import { TABLE_HEADERS } from "./constants";

const ReturnsTable = ({ activeTab, data, onAction }) => {
  const headers = TABLE_HEADERS[activeTab] || [];

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-150 shadow-sm overflow-x-auto font-satoshi">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
            {headers.map((h, i) => <th key={i} className="p-4">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 text-gray-900 font-medium">
          {data.map((row, idx) => (
            <ReturnsTableRow key={idx} activeTab={activeTab} row={row} onAction={onAction} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default React.memo(ReturnsTable);
