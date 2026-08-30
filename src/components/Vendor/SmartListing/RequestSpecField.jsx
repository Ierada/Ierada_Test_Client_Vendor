import React, { useState } from "react";
import { notifyOnFail, notifyOnSuccess } from "../../../utils/notification/toast";
import { getApiErrorMessage } from "../../../utils/apiError";
import apiClient from "../../../axios.config";

const inputCls =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30";

export default function RequestSpecField({ categoryId, subCategoryId, innerSubCategoryId }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [fieldType, setFieldType] = useState("text");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!label.trim()) {
      notifyOnFail("Field label required");
      return;
    }
    setBusy(true);
    try {
      const res = await apiClient.post("/category-specs/requests", {
        category_id: categoryId || null,
        sub_category_id: subCategoryId || null,
        inner_sub_category_id: innerSubCategoryId || null,
        label: label.trim(),
        field_type: fieldType,
        notes: notes.trim() || null,
      });
      if (res.data?.status === 1) {
        notifyOnSuccess("Field request sent to Admin");
        setLabel("");
        setNotes("");
        setOpen(false);
      } else {
        notifyOnFail(res.data?.message || "Request failed");
      }
    } catch (e) {
      notifyOnFail(getApiErrorMessage(e, "Could not send request"));
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        className="text-xs text-blue-600 underline"
        onClick={() => setOpen(true)}
      >
        Request a new spec field
      </button>
    );
  }

  return (
    <div className="border rounded-xl p-3 space-y-2 bg-slate-50">
      <p className="text-sm font-medium">Request new specification field</p>
      <input
        className={inputCls}
        placeholder="Field label"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
      />
      <select
        className={inputCls}
        value={fieldType}
        onChange={(e) => setFieldType(e.target.value)}
      >
        <option value="text">Text</option>
        <option value="number">Number</option>
        <option value="dropdown">Dropdown</option>
        <option value="boolean">Yes/No</option>
      </select>
      <textarea
        className={inputCls}
        rows={2}
        placeholder="Notes for Admin"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={submit}
          className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs"
        >
          Submit request
        </button>
        <button type="button" className="text-xs text-gray-600" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </div>
  );
}
