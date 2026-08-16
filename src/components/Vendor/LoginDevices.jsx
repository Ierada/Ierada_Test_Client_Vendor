import { useEffect, useState } from "react";
import {
  getLoginDevices,
  revokeLoginDevice,
  revokeOtherLoginDevices,
} from "../../services/api.auth";

export default function LoginDevices() {
  const [rows, setRows] = useState([]);
  const load = () =>
    getLoginDevices().then((r) => r.status === 1 && setRows(r.data || []));
  useEffect(() => {
    load();
  }, []);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 mt-6">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Login devices</h2>
          <p className="text-sm text-gray-500">
            {rows.length} active device{rows.length === 1 ? "" : "s"}
          </p>
        </div>
        <button
          type="button"
          className="border rounded px-3 py-1.5 text-sm"
          onClick={async () => {
            const r = await revokeOtherLoginDevices();
            if (r.status === 1) load();
          }}
        >
          Sign out other devices
        </button>
      </div>
      <div className="divide-y">
        {rows.length === 0 ? (
          <p className="text-sm text-gray-500 py-2">No devices recorded yet.</p>
        ) : (
          rows.map((r) => (
            <div key={r.id} className="py-3 flex items-start justify-between gap-3 text-sm">
              <div>
                <div className="font-medium">
                  {r.browser || "Browser"} {r.os ? `· ${r.os}` : ""}
                  {r.current ? (
                    <span className="ml-2 text-[11px] text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                      This device
                    </span>
                  ) : null}
                </div>
                <div className="text-xs text-gray-500">
                  {r.city || r.location || "Unknown city"}
                </div>
                <div className="text-[11px] text-gray-400">
                  Last seen {r.last_seen_at ? new Date(r.last_seen_at).toLocaleString() : "—"}
                </div>
              </div>
              {!r.current ? (
                <button
                  type="button"
                  className="text-sm text-red-600 border border-red-200 rounded px-2 py-1"
                  onClick={async () => {
                    const res = await revokeLoginDevice(r.id);
                    if (res.status === 1) load();
                  }}
                >
                  Logout
                </button>
              ) : (
                <span className="text-xs text-gray-400">Current</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
