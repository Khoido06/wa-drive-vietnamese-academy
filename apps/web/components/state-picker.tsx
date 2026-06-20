"use client";

import { useEffect, useState } from "react";
import { apiFetch, ensureUser } from "../lib/api";
import { getSelectedState, setSelectedState, STATE_LABELS } from "../lib/state";
import { fetchBillingStatus, syncUserState } from "../lib/billing";

interface StateOption {
  code: string;
  chunks: number;
}

export function StatePicker() {
  const [states, setStates] = useState<StateOption[]>([{ code: "WA", chunks: 0 }]);
  const [selected, setSelected] = useState("WA");
  const [premium, setPremium] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setSelected(getSelectedState());
    apiFetch<{ states: StateOption[] }>("/rag/states")
      .then((res) => {
        if (res.states.length > 0) setStates(res.states);
      })
      .catch(() => {});

    ensureUser()
      .then(() => fetchBillingStatus())
      .then((status) => {
        if (status) {
          setPremium(status.premium);
          if (status.selectedState) setSelected(status.selectedState);
        }
      })
      .catch(() => {});
  }, []);

  const onChange = async (code: string) => {
    setMessage("");
    if (code !== "WA" && !premium) {
      setMessage("Bang khác cần gói Pro — WA vẫn miễn phí");
      return;
    }
    try {
      await ensureUser();
      await syncUserState(code);
      setSelectedState(code);
      setSelected(code);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Không đổi được bang");
    }
  };

  return (
    <div className="state-picker">
      <label htmlFor="state-select" className="state-picker__label">
        🗺️ Bang luyện thi
      </label>
      <select
        id="state-select"
        className="state-picker__select"
        value={selected}
        onChange={(e) => onChange(e.target.value)}
      >
        {states.map((s) => (
          <option key={s.code} value={s.code} disabled={s.code !== "WA" && !premium && s.chunks > 0}>
            {STATE_LABELS[s.code] ?? s.code} ({s.chunks} mục)
            {s.code !== "WA" && !premium ? " — Pro" : ""}
          </option>
        ))}
      </select>
      {message && <p className="state-picker__hint">{message}</p>}
    </div>
  );
}
