import React, { useEffect, useState } from "react";
import { getCategorySpecTemplates } from "../../../services/api.categorySpec";

export default function SpecTemplateHints({ categoryId, subCategoryId, innerSubCategoryId, specs, onApply }) {
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!categoryId) {
        setTemplates([]);
        return;
      }
      try {
        const res = await getCategorySpecTemplates({
          category_id: categoryId,
          sub_category_id: subCategoryId || undefined,
          inner_sub_category_id: innerSubCategoryId || undefined,
        });
        if (!cancelled) setTemplates(res?.data || []);
      } catch {
        if (!cancelled) setTemplates([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [categoryId, subCategoryId, innerSubCategoryId]);

  if (!templates.length) return null;

  const existing = new Set((specs || []).map((s) => String(s.feature || "").toLowerCase()));
  const missing = templates.filter((t) => !existing.has(String(t.label || "").toLowerCase()));

  if (!missing.length) return null;

  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 space-y-2">
      <p className="text-xs text-blue-900 font-medium">Suggested fields for this category</p>
      <div className="flex flex-wrap gap-2">
        {missing.map((t) => (
          <button
            key={t.id}
            type="button"
            className="text-xs px-2 py-1 rounded-lg bg-white border"
            onClick={() =>
              onApply([
                ...(specs || []),
                { feature: t.label, specification: "" },
              ])
            }
          >
            + {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
