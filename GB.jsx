import { useState, useEffect, useMemo } from "react";

const PATH_1 = [
  { min: 0, ce: 0, label: "00" },
  { min: 11, ce: 14, label: "11(14)" },
  { min: 41, ce: 44, label: "41(44)" },
  { min: 3, ce: 7, label: "3(7)" },
  { min: 17, ce: 23, label: "17(23)" },
  { min: 71, ce: 77, label: "71(77)" },
];

const PATH_2 = [
  { min: 3, ce: 7, label: "3(7)" },
  { min: 59, ce: 65, label: "59(65)" },
  { min: 17, ce: 23, label: "17(23)" },
  { min: 11, ce: 14, label: "11(14)" },
  { min: 47, ce: 50, label: "47(50)", alt: { min: 53, ce: 56, label: "53(56)" } },
  { min: 29, ce: 35, label: "29(35)" },
];

const ALL_GOLDBACH = [0, 3, 7, 11, 14, 17, 23, 29, 35, 41, 44, 47, 50, 53, 56, 59, 65, 71, 77];

function findInPath(path, minute) {
  return path.findIndex(
    (p) => p.min === minute || p.ce === minute || (p.alt && (p.alt.min === minute || p.alt.ce === minute))
  );
}

function getTargets(path, idx) {
  if (idx === -1) return null;
  const r = { right: null, left: null };
  if (idx + 1 < path.length) {
    r.right = {
      candles: path[idx + 1],
      newMin: idx + 2 < path.length ? path[idx + 2] : null,
    };
  }
  if (idx - 1 >= 0) {
    r.left = {
      candles: path[idx - 1],
      newMin: idx - 2 >= 0 ? path[idx - 2] : null,
    };
  }
  return r;
}

function nearestGoldbach(minute) {
  let best = null, bestDist = Infinity;
  for (const g of ALL_GOLDBACH) {
    const d = Math.abs(minute - g);
    if (d < bestDist) { bestDist = d; best = g; }
  }
  return { goldbach: best, distance: bestDist };
}

function fmt(m) {
  if (m == null) return "—";
  return `:${String(m).padStart(2, "0")}`;
}

function zurichNow() {
  const d = new Date();
  const z = new Date(d.toLocaleString("en-US", { timeZone: "Europe/Zurich" }));
  return {
    h: z.getHours(), m: z.getMinutes(),
    str: `${String(z.getHours()).padStart(2, "0")}:${String(z.getMinutes()).padStart(2, "0")}`,
  };
}

function isGoldbach(n) {
  return ALL_GOLDBACH.includes(n);
}

const mono = "'JetBrains Mono', 'Fira Code', monospace";

const Badge = ({ pair, type = "default" }) => {
  const s = {
    candle: { bg: "rgba(0,200,140,0.12)", bd: "rgba(0,200,140,0.35)", c: "#00c88a" },
    newmin: { bg: "rgba(90,160,255,0.12)", bd: "rgba(90,160,255,0.35)", c: "#5aa0ff" },
    alt: { bg: "rgba(255,180,50,0.12)", bd: "rgba(255,180,50,0.35)", c: "#ffb432" },
    default: { bg: "rgba(255,255,255,0.05)", bd: "rgba(255,255,255,0.1)", c: "rgba(255,255,255,0.6)" },
  }[type] || { bg: "rgba(255,255,255,0.05)", bd: "rgba(255,255,255,0.1)", c: "rgba(255,255,255,0.6)" };
  return (
    <span style={{
      display: "inline-flex", padding: "4px 10px", borderRadius: "5px",
      background: s.bg, border: `1px solid ${s.bd}`, color: s.c,
      fontSize: "13px", fontFamily: mono, fontWeight: 600, whiteSpace: "nowrap",
    }}>
      {pair.label || `${pair.min}(${pair.ce})`}
    </span>
  );
};

const DirCard = ({ dir, data }) => {
  if (!data) return null;
  const isRight = dir === "right";
  const col = isRight ? "#00c88a" : "#e06050";

  return (
    <div style={{
      background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
      borderLeft: `3px solid ${col}`, borderRadius: "8px", padding: "18px 22px", marginBottom: "10px",
    }}>
      <div style={{ color: col, fontSize: "11px", fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "1.5px", fontFamily: mono, marginBottom: "16px" }}>
        {isRight ? "RIGHT  >" : "<  LEFT"}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <div>
          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "10px", textTransform: "uppercase",
            letterSpacing: "1px", marginBottom: "8px" }}>Candle Count</div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            <Badge pair={data.candles} type="candle" />
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px" }}>candles</span>
          </div>
          {data.candles.alt && (
            <div style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "11px" }}>or</span>
              <Badge pair={data.candles.alt} type="alt" />
            </div>
          )}
        </div>
        <div>
          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "10px", textTransform: "uppercase",
            letterSpacing: "1px", marginBottom: "8px" }}>New Minute (Algo Stops)</div>
          {data.newMin ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <Badge pair={data.newMin} type="newmin" />
              {data.newMin.alt && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "11px" }}>or</span>
                  <Badge pair={data.newMin.alt} type="alt" />
                </div>
              )}
            </div>
          ) : (
            <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "12px", fontStyle: "italic" }}>
              End of chain
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const Chain = ({ path, label, color, activeIdx }) => (
  <div style={{ marginBottom: "10px" }}>
    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "10px", textTransform: "uppercase",
      letterSpacing: "1.2px", marginBottom: "6px", fontWeight: 600 }}>
      <span style={{ color, marginRight: "6px", fontSize: "8px" }}>{"●"}</span>{label}
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
      {path.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{
            padding: "4px 9px", borderRadius: "4px",
            background: i === activeIdx ? "rgba(0,255,170,0.15)" : "rgba(255,255,255,0.03)",
            border: `1px solid ${i === activeIdx ? "rgba(0,255,170,0.5)" : "rgba(255,255,255,0.07)"}`,
            color: i === activeIdx ? "#00ffaa" : "rgba(255,255,255,0.45)",
            fontSize: "11px", fontFamily: mono, fontWeight: i === activeIdx ? 700 : 400,
            transition: "all 0.2s",
          }}>
            {p.label}{p.alt ? `/${p.alt.label}` : ""}
          </span>
          {i < path.length - 1 && <span style={{ color: "rgba(255,255,255,0.12)", fontSize: "12px" }}>—</span>}
        </div>
      ))}
    </div>
  </div>
);

// ─── Hour Arithmetic Component ───
const HourArithmetic = () => {
  const [hourInput, setHourInput] = useState("");
  const [minInput, setMinInput] = useState("");
  const [results, setResults] = useState(null);

  const calculate = () => {
    const h = parseInt(hourInput, 10);
    const m = parseInt(minInput, 10);
    if (isNaN(h) || isNaN(m)) return;

    const sum = h + m;
    const diff = Math.abs(h - m);

    // Check if results land on or near Goldbach numbers
    const sumNearest = nearestGoldbach(sum % 100);
    const diffNearest = nearestGoldbach(diff % 100);

    // Also compute with the raw minute (not the Zurich-snapped one)
    setResults({
      hour: h,
      minute: m,
      sum: { raw: sum, mod60: sum % 60, mod100: sum % 100, gb: sumNearest },
      diff: { raw: diff, mod60: diff % 60, mod100: diff % 100, gb: diffNearest },
    });
  };

  const ResultRow = ({ label, icon, color, data }) => {
    const gbHit = data.gb.distance === 0;
    const gbClose = data.gb.distance <= 2 && data.gb.distance > 0;
    return (
      <div style={{
        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
        borderLeft: `3px solid ${color}`, borderRadius: "8px", padding: "16px 20px", marginBottom: "8px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
          <span style={{ fontSize: "14px" }}>{icon}</span>
          <span style={{ color, fontSize: "11px", fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "1.5px", fontFamily: mono }}>{label}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          <div>
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "9px", textTransform: "uppercase",
              letterSpacing: "1px", marginBottom: "6px" }}>Raw</div>
            <span style={{ color: "#fff", fontSize: "20px", fontFamily: mono, fontWeight: 700 }}>
              {data.raw}
            </span>
          </div>
          <div>
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "9px", textTransform: "uppercase",
              letterSpacing: "1px", marginBottom: "6px" }}>Mod 60</div>
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "20px", fontFamily: mono, fontWeight: 600 }}>
              {data.mod60}
            </span>
          </div>
          <div>
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "9px", textTransform: "uppercase",
              letterSpacing: "1px", marginBottom: "6px" }}>Nearest GB</div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{
                padding: "3px 8px", borderRadius: "4px",
                background: gbHit ? "rgba(0,255,170,0.15)" : gbClose ? "rgba(255,180,50,0.12)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${gbHit ? "rgba(0,255,170,0.4)" : gbClose ? "rgba(255,180,50,0.3)" : "rgba(255,255,255,0.1)"}`,
                color: gbHit ? "#00ffaa" : gbClose ? "#ffb432" : "rgba(255,255,255,0.5)",
                fontSize: "15px", fontFamily: mono, fontWeight: 700,
              }}>
                {fmt(data.gb.goldbach)}
              </span>
              {data.gb.distance > 0 && (
                <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "10px", fontFamily: mono }}>
                  {data.gb.distance}m off
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      padding: "18px 20px", background: "rgba(255,255,255,0.02)",
      borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)",
    }}>
      <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "10px", textTransform: "uppercase",
        letterSpacing: "1.2px", marginBottom: "14px", fontWeight: 600 }}>
        Hour / Min Arithmetic
      </div>

      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "14px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "9px", textTransform: "uppercase",
            letterSpacing: "1px", marginBottom: "4px" }}>Hour</div>
          <input type="number" placeholder="14" value={hourInput}
            onChange={(e) => setHourInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && calculate()}
            style={{
              width: "100%", padding: "10px 12px", background: "rgba(0,0,0,0.3)",
              border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px",
              color: "#fff", fontSize: "16px", fontFamily: mono, textAlign: "center",
              letterSpacing: "1px", outline: "none",
            }} />
        </div>
        <span style={{ color: "rgba(255,255,255,0.15)", fontSize: "20px", marginTop: "16px" }}>:</span>
        <div style={{ flex: 1 }}>
          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "9px", textTransform: "uppercase",
            letterSpacing: "1px", marginBottom: "4px" }}>Min</div>
          <input type="number" placeholder="41" value={minInput}
            onChange={(e) => setMinInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && calculate()}
            style={{
              width: "100%", padding: "10px 12px", background: "rgba(0,0,0,0.3)",
              border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px",
              color: "#fff", fontSize: "16px", fontFamily: mono, textAlign: "center",
              letterSpacing: "1px", outline: "none",
            }} />
        </div>
        <button onClick={calculate}
          style={{
            padding: "10px 18px", borderRadius: "6px", marginTop: "16px",
            background: "rgba(180,140,255,0.12)", border: "1px solid rgba(180,140,255,0.3)",
            color: "#b48cff", cursor: "pointer", fontSize: "13px",
            fontWeight: 600, fontFamily: mono,
          }}>
          CALC
        </button>
      </div>

      {results && (
        <div>
          <div style={{
            padding: "8px 12px", marginBottom: "12px",
            background: "rgba(255,255,255,0.03)", borderRadius: "5px",
            border: "1px solid rgba(255,255,255,0.05)",
            fontSize: "13px", color: "rgba(255,255,255,0.5)", fontFamily: mono,
            display: "flex", alignItems: "center", gap: "12px",
          }}>
            <span style={{ color: "#fff", fontWeight: 600 }}>{results.hour}</span>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>:</span>
            <span style={{ color: "#fff", fontWeight: 600 }}>{results.minute}</span>
            <span style={{ color: "rgba(255,255,255,0.15)" }}>|</span>
            <span style={{ color: "#00c88a" }}>+{results.sum.raw}</span>
            <span style={{ color: "rgba(255,255,255,0.15)" }}>|</span>
            <span style={{ color: "#e06050" }}>-{results.diff.raw}</span>
          </div>

          <ResultRow label={`Hour + Min = ${results.sum.raw}`} icon="+" color="#00c88a" data={results.sum} />
          <ResultRow label={`Hour - Min = ${results.diff.raw}`} icon="-" color="#e06050" data={results.diff} />

          {/* Quick confluence check */}
          {(results.sum.gb.distance === 0 || results.diff.gb.distance === 0) && (
            <div style={{
              marginTop: "8px", padding: "10px 14px",
              background: "rgba(0,255,170,0.06)", borderRadius: "6px",
              border: "1px solid rgba(0,255,170,0.15)",
              fontSize: "12px", color: "#00c88a", fontFamily: mono,
            }}>
              {"★"} CONFLUENCE — {results.sum.gb.distance === 0 && (
                <span>Sum lands on Goldbach {fmt(results.sum.gb.goldbach)}</span>
              )}
              {results.sum.gb.distance === 0 && results.diff.gb.distance === 0 && " + "}
              {results.diff.gb.distance === 0 && (
                <span>Diff lands on Goldbach {fmt(results.diff.gb.goldbach)}</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main App ───
export default function App() {
  const [sel, setSel] = useState(null);
  const [timeIn, setTimeIn] = useState("");
  const [zTime, setZTime] = useState(zurichNow());
  const [pred, setPred] = useState(null);
  const [activeTab, setActiveTab] = useState("targeting");

  useEffect(() => {
    const iv = setInterval(() => setZTime(zurichNow()), 5000);
    return () => clearInterval(iv);
  }, []);

  const res = useMemo(() => {
    if (sel === null) return null;
    const i1 = findInPath(PATH_1, sel), i2 = findInPath(PATH_2, sel);
    return {
      p1: i1 !== -1 ? { idx: i1, t: getTargets(PATH_1, i1) } : null,
      p2: i2 !== -1 ? { idx: i2, t: getTargets(PATH_2, i2) } : null,
    };
  }, [sel]);

  const doPredict = () => {
    if (!timeIn.trim()) return;
    const parts = timeIn.replace(/[^\d:]/g, "").split(":");
    let mins = parts.length === 2 ? parseInt(parts[1], 10) : parseInt(parts[0], 10);
    if (isNaN(mins) || mins < 0 || mins > 79) return;
    const n = nearestGoldbach(mins);
    setSel(n.goldbach);
    setPred({ inputMin: mins, gb: n.goldbach, dist: n.distance });
  };

  const btns = [
    { min: 0, l: ":00" }, { min: 3, l: ":03" }, { min: 7, l: ":07" },
    { min: 11, l: ":11" }, { min: 14, l: ":14" }, { min: 17, l: ":17" },
    { min: 23, l: ":23" }, { min: 29, l: ":29" }, { min: 35, l: ":35" },
    { min: 41, l: ":41" }, { min: 44, l: ":44" }, { min: 47, l: ":47" },
    { min: 50, l: ":50" }, { min: 53, l: ":53" }, { min: 56, l: ":56" },
    { min: 59, l: ":59" }, { min: 65, l: ":65" }, { min: 71, l: ":71" },
    { min: 77, l: ":77" },
  ];

  const hasRes = res && (res.p1 || res.p2);
  const tabs = [
    { id: "targeting", label: "TARGETING" },
    { id: "arithmetic", label: "H +/- M" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#080c12", color: "#d8e0e8",
      fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input:focus { outline: none; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "20px 28px",
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        background: "linear-gradient(180deg, rgba(0,255,170,0.02) 0%, transparent 100%)" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "2px" }}>
            <div style={{ width: "7px", height: "7px", borderRadius: "50%",
              background: "#00ffaa", boxShadow: "0 0 10px rgba(0,255,170,0.4)" }} />
            <h1 style={{ fontSize: "16px", fontWeight: 700, color: "#fff",
              letterSpacing: "0.5px", fontFamily: mono }}>GOLDBACH TARGETING</h1>
          </div>
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "11px", marginLeft: "17px" }}>
            MNQ Time-Based Reversal Calculator</p>
        </div>
        <div style={{ textAlign: "right", fontFamily: mono }}>
          <div style={{ color: "rgba(255,255,255,0.25)", fontSize: "9px",
            textTransform: "uppercase", letterSpacing: "1px" }}>Zurich</div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "18px", fontWeight: 600 }}>{zTime.str}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.05)",
        padding: "0 28px" }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{
              padding: "12px 20px", background: "none", border: "none",
              borderBottom: `2px solid ${activeTab === t.id ? "#00ffaa" : "transparent"}`,
              color: activeTab === t.id ? "#00ffaa" : "rgba(255,255,255,0.35)",
              fontSize: "11px", fontWeight: 700, letterSpacing: "1.5px",
              fontFamily: mono, cursor: "pointer", transition: "all 0.15s",
            }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "20px 28px", maxWidth: "760px" }}>

        {activeTab === "targeting" && (
          <>
            {/* Chains */}
            <div style={{ marginBottom: "20px", padding: "14px 18px",
              background: "rgba(255,255,255,0.015)", borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.04)" }}>
              <Chain path={PATH_1} label="Path 1" color="#00c88a" activeIdx={res?.p1?.idx ?? -1} />
              <Chain path={PATH_2} label="Path 2" color="#5aa0ff" activeIdx={res?.p2?.idx ?? -1} />
            </div>

            {/* Time Input */}
            <div style={{ marginBottom: "20px", padding: "16px 20px",
              background: "rgba(255,255,255,0.02)", borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "10px",
                textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: "10px", fontWeight: 600 }}>
                Input Zurich Time</div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input type="text" placeholder="e.g. 14:41 or just 41"
                  value={timeIn} onChange={(e) => setTimeIn(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && doPredict()}
                  style={{
                    flex: 1, padding: "10px 14px", background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px",
                    color: "#fff", fontSize: "15px", fontFamily: mono, letterSpacing: "1px",
                  }} />
                <button onClick={doPredict}
                  style={{
                    padding: "10px 20px", borderRadius: "6px",
                    background: "rgba(0,255,170,0.12)", border: "1px solid rgba(0,255,170,0.3)",
                    color: "#00ffaa", cursor: "pointer", fontSize: "13px",
                    fontWeight: 600, fontFamily: mono,
                  }}>PREDICT</button>
              </div>
              {pred && (
                <div style={{ marginTop: "10px", padding: "8px 12px",
                  background: "rgba(0,255,170,0.05)", borderRadius: "5px",
                  border: "1px solid rgba(0,255,170,0.1)",
                  fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
                  Minute <span style={{ color: "#fff", fontFamily: mono }}>
                    :{String(pred.inputMin).padStart(2, "0")}</span>
                  {pred.dist === 0
                    ? <span style={{ color: "#00c88a" }}> — exact Goldbach minute</span>
                    : <span> — snapped to <span style={{ color: "#00ffaa", fontFamily: mono,
                        fontWeight: 600 }}>{fmt(pred.gb)}</span> ({pred.dist}m away)</span>}
                </div>
              )}
            </div>

            {/* Quick Select */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "10px",
                textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: "10px", fontWeight: 600 }}>
                Or Select Reversal Minute</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                {btns.map((b) => {
                  const act = sel === b.min;
                  const i1 = findInPath(PATH_1, b.min) !== -1;
                  const i2 = findInPath(PATH_2, b.min) !== -1;
                  return (
                    <button key={b.min}
                      onClick={() => { setSel(act ? null : b.min); setPred(null); }}
                      style={{
                        padding: "7px 11px", borderRadius: "5px",
                        border: `1px solid ${act ? "rgba(0,255,170,0.5)" : "rgba(255,255,255,0.07)"}`,
                        background: act ? "rgba(0,255,170,0.12)" : "rgba(255,255,255,0.02)",
                        color: act ? "#00ffaa" : "rgba(255,255,255,0.5)",
                        cursor: "pointer", fontSize: "12px", fontFamily: mono,
                        fontWeight: act ? 700 : 400, position: "relative",
                      }}>
                      {b.l}
                      <span style={{ position: "absolute", bottom: "2px", right: "3px",
                        display: "flex", gap: "2px" }}>
                        {i1 && <span style={{ width: "3px", height: "3px", borderRadius: "50%", background: "#00c88a" }} />}
                        {i2 && <span style={{ width: "3px", height: "3px", borderRadius: "50%", background: "#5aa0ff" }} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Results */}
            {sel !== null && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px",
                  paddingBottom: "12px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ width: "3px", height: "22px", background: "#00ffaa", borderRadius: "2px" }} />
                  <span style={{ fontSize: "15px", fontWeight: 600, color: "#fff" }}>
                    Reversal at <span style={{ color: "#00ffaa", fontFamily: mono, fontSize: "17px" }}>
                      {fmt(sel)}</span></span>
                </div>

                {res?.p1 && (
                  <div style={{ marginBottom: "24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px",
                      marginBottom: "10px" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%",
                        background: "#00c88a", display: "inline-block" }} />
                      <span style={{ color: "#00c88a", fontSize: "10px", fontWeight: 700,
                        textTransform: "uppercase", letterSpacing: "1.5px", fontFamily: mono }}>
                        Path 1</span>
                    </div>
                    <DirCard dir="right" data={res.p1.t.right} />
                    <DirCard dir="left" data={res.p1.t.left} />
                  </div>
                )}

                {res?.p2 && (
                  <div style={{ marginBottom: "24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px",
                      marginBottom: "10px" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%",
                        background: "#5aa0ff", display: "inline-block" }} />
                      <span style={{ color: "#5aa0ff", fontSize: "10px", fontWeight: 700,
                        textTransform: "uppercase", letterSpacing: "1.5px", fontFamily: mono }}>
                        Path 2</span>
                    </div>
                    <DirCard dir="right" data={res.p2.t.right} />
                    <DirCard dir="left" data={res.p2.t.left} />
                  </div>
                )}

                {!hasRes && (
                  <div style={{ padding: "32px", textAlign: "center",
                    color: "rgba(255,255,255,0.25)", fontSize: "13px",
                    background: "rgba(255,255,255,0.02)", borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.04)" }}>
                    {fmt(sel)} not found in either chain. Try its Goldbach pair.</div>
                )}
              </div>
            )}

            {sel === null && (
              <div style={{ padding: "44px 28px", textAlign: "center",
                color: "rgba(255,255,255,0.18)", fontSize: "13px" }}>
                Enter a Zurich time or select a reversal minute</div>
            )}

            {/* Legend */}
            <div style={{ marginTop: "28px", padding: "16px 20px",
              background: "rgba(255,255,255,0.015)", borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.03)" }}>
              <div style={{ color: "rgba(255,255,255,0.25)", fontSize: "10px",
                textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: "10px", fontWeight: 600 }}>
                How to Read</div>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px", lineHeight: "1.8" }}>
                <p style={{ marginBottom: "6px" }}>
                  <span style={{ color: "#00c88a", fontWeight: 600 }}>RIGHT {">"}</span>{" — "}
                  Next pair in chain = candle count. Pair after that = minute where algo stops.</p>
                <p style={{ marginBottom: "6px" }}>
                  <span style={{ color: "#e06050", fontWeight: 600 }}>{"<"} LEFT</span>{" — "}
                  Previous pair in chain = candle count. Pair before that = minute where algo stops.</p>
                <p><span style={{ color: "#fff", fontWeight: 500 }}>Example:</span>{" "}
                  :41 reversal — Right: 3-7 candles, algo stops at :17/:23.
                  Left: 11-14 candles, stops at :00.</p>
              </div>
            </div>
          </>
        )}

        {activeTab === "arithmetic" && <HourArithmetic />}
      </div>
    </div>
  );
}
