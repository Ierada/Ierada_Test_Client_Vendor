import React from "react";

const inputCls =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30";

function Field({ label, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}

/**
 * India compliance for non-food catalog (IERADA does not sell food — no FSSAI).
 * Legal Metrology + BIS / wireless fields when applicable.
 */
export default function ComplianceFields({ state, patch }) {
  const c = state.compliance || {};
  const set = (partial) => patch({ compliance: { ...c, ...partial } });

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-gray-900">India compliance</h3>
        <p className="text-xs text-gray-500">
          Legal Metrology packer/manufacturer details and BIS / WPC when your category needs them.
          Food / FSSAI is not used on this marketplace.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Sale unit">
          <input
            className={inputCls}
            value={c.sale_unit || ""}
            onChange={(e) => set({ sale_unit: e.target.value })}
            placeholder="1 piece / 1 pair"
          />
        </Field>
        <Field label="Net quantity">
          <input
            className={inputCls}
            value={c.net_quantity || ""}
            onChange={(e) => set({ net_quantity: e.target.value })}
          />
        </Field>
        <Field label="Net qty unit">
          <input
            className={inputCls}
            value={c.net_quantity_unit || ""}
            onChange={(e) => set({ net_quantity_unit: e.target.value })}
            placeholder="g / ml / pcs"
          />
        </Field>
        <Field label="Manufacturer name">
          <input
            className={inputCls}
            value={c.manufacturer_name || ""}
            onChange={(e) => set({ manufacturer_name: e.target.value })}
          />
        </Field>
        <Field label="Manufacturer address">
          <input
            className={inputCls}
            value={c.manufacturer_address || ""}
            onChange={(e) => set({ manufacturer_address: e.target.value })}
          />
        </Field>
        <Field label="Packer name">
          <input
            className={inputCls}
            value={c.packer_name || ""}
            onChange={(e) => set({ packer_name: e.target.value })}
          />
        </Field>
        <Field label="Importer name">
          <input
            className={inputCls}
            value={c.importer_name || ""}
            onChange={(e) => set({ importer_name: e.target.value })}
          />
        </Field>
        <Field label="BIS / ISI number">
          <input
            className={inputCls}
            value={c.bis_isi_number || ""}
            onChange={(e) => set({ bis_isi_number: e.target.value })}
          />
        </Field>
        <Field label="WPC number">
          <input
            className={inputCls}
            value={c.wpc_number || ""}
            onChange={(e) => set({ wpc_number: e.target.value })}
          />
        </Field>
        <Field label="Dangerous goods / battery">
          <select
            className={inputCls}
            value={c.dangerous_goods ? "yes" : "no"}
            onChange={(e) => set({ dangerous_goods: e.target.value === "yes" })}
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </Field>
      </div>
    </div>
  );
}
