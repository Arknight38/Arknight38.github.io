import LabNavigation from "../shared/LabNavigation.jsx";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Pause,
  Play,
  RotateCcw,
  Maximize,
  Minimize,
} from "lucide-react";
import { SpectraEngine, DEFAULTS, PRESETS, FFT_SIZE } from "./dsp/engine.js";
import { SAMPLE_RATE, SOURCES } from "./dsp/signals.js";
import { RENDERERS } from "./rendering/plots.js";
import SpectraCanvas from "./SpectraCanvas.jsx";
import ZPlane from "./components/ZPlane.jsx";
import "./spectra.css";

function Parameter({
  id,
  label,
  value,
  min,
  max,
  step,
  onChange,
  unit = "",
  digits = 0,
  disabled = false,
}) {
  const update = (event) => {
    if (event.target.value === "") return;
    const next = Number(event.target.value);
    if (Number.isFinite(next)) onChange(Math.min(max, Math.max(min, next)));
  };
  return (
    <div className="spectra-parameter">
      <div>
        <label htmlFor={`${id}-range`}>{label}</label>
        <span>
          <input
            aria-label={`${label} value`}
            type="number"
            min={min}
            max={max}
            step={step}
            value={Number(value.toFixed(digits))}
            onChange={update}
            disabled={disabled}
          />
          {unit}
        </span>
      </div>
      <input
        id={`${id}-range`}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={update}
        disabled={disabled}
      />
    </div>
  );
}
const VIEWS = [
  ["signal", "Signal", "Waveform and FFT"],
  ["filter", "Filter", "Response and poles / zeros"],
  ["spectrogram", "Spectrogram", "Frequency over time"],
];
export default function Spectra() {
  const [settings, setSettings] = useState({ ...DEFAULTS }),
    [running, setRunning] = useState(
      () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    ),
    [preset, setPreset] = useState("original");
  const [expanded, setExpanded] = useState(false),
    [reduced, setReduced] = useState(
      () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  const [scopeMode, setScopeMode] = useState("stable");
  const [view, setView] = useState("signal");
  const [telemetry, setTelemetry] = useState({ rms: 0, limited: false });
  const engine = useRef(null),
    surfaces = useRef({}),
    section = useRef(null),
    transport = useRef(true),
    visible = useRef(true),
    root = useRef(null),
    focusButton = useRef(null),
    tabs = useRef({});
  if (engine.current == null) engine.current = new SpectraEngine();
  const registerSurface = useCallback((kind, surface) => {
    surfaces.current[kind] = surface;
    return () => {
      delete surfaces.current[kind];
    };
  }, []);
  const change = (patch) => {
    setPreset("custom");
    setSettings((previous) => ({ ...previous, ...patch }));
  };
  const loadPreset = (key) => {
    const next = { ...PRESETS[key].settings };
    engine.current.reset(next);
    setSettings(next);
    setPreset(key);
  };
  const reset = () => {
    loadPreset("original");
    setScopeMode("stable");
    setRunning(!reduced);
  };
  useEffect(() => {
    engine.current.scopeMode = scopeMode;
  }, [scopeMode]);
  useEffect(() => {
    engine.current.configure(settings);
  }, [settings]);
  useEffect(() => {
    if (!expanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const close = (event) => {
      if (event.key === "Escape") {
        setExpanded(false);
        focusButton.current?.focus();
      }
      if (event.key === "Tab") {
        const items = [
          ...root.current.querySelectorAll(
            'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex="0"]',
          ),
        ].filter((el) => el.getClientRects().length > 0);
        const first = items[0],
          last = items.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", close);
    };
  }, [expanded]);
  const go = (next) => {
    setView(next);
    tabs.current[next]?.focus();
  };
  const tabKey = (event, key) => {
    const index = VIEWS.findIndex((item) => item[0] === key);
    let next;
    if (event.key === "ArrowRight") next = (index + 1) % VIEWS.length;
    if (event.key === "ArrowLeft")
      next = (index + VIEWS.length - 1) % VIEWS.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = VIEWS.length - 1;
    if (next !== undefined) {
      event.preventDefault();
      go(VIEWS[next][0]);
    }
  };
  useEffect(() => {
    transport.current = running;
  }, [running]);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const changed = (event) => {
      setReduced(event.matches);
      if (event.matches) setRunning(false);
    };
    media.addEventListener("change", changed);
    return () => media.removeEventListener("change", changed);
  }, []);
  useEffect(() => {
    let animation,
      last = 0,
      lastTelemetry = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        visible.current = entries[0].isIntersecting;
      },
      { threshold: 0 },
    );
    observer.observe(section.current);
    const frame = (time) => {
      animation = requestAnimationFrame(frame);
      if (document.hidden || !visible.current) {
        last = 0;
        return;
      }
      if (last && time - last < 1000 / 30) return;
      const dt = last ? Math.min((time - last) / 1000, 0.1) : 0;
      last = time;
      if (transport.current && dt) engine.current.advance(dt);
      for (const [kind, surface] of Object.entries(surfaces.current))
        if (surface.width > 0) RENDERERS[kind](surface, engine.current);
      if (time - lastTelemetry > 250) {
        setTelemetry({
          rms: engine.current.rms,
          limited: engine.current.filter.limited,
        });
        lastTelemetry = time;
      }
    };
    animation = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(animation);
      observer.disconnect();
    };
  }, []);
  return (
    <div
      className={
        expanded
          ? "spectra-workstation spectra-expanded"
          : "spectra-workstation"
      }
      id="spectra-experiment"
      ref={root}
      role={expanded ? "dialog" : undefined}
      aria-modal={expanded ? true : undefined}
      aria-label={expanded ? "SPECTRA workspace" : undefined}
    >
      <header className="spectra-heading">
        <div>
          <Link to="/lab" className="spectra-back">
            <ArrowLeft size={15} />
            Lab notebook
          </Link>
          <div className="eyebrow">
            EXPERIMENT 003 / DIGITAL SIGNAL PROCESSING
          </div>
          <h1>
            Spectra<span>2.0</span>
          </h1>
          <p>Signals, filters, and the systems between them.</p>
        </div>
        <div className="spectra-transport">
          <span
            className={running ? "transport-state is-live" : "transport-state"}
          >
            {running ? "● RUNNING" : "Ⅱ HELD"}
          </span>
          <button onClick={() => setRunning(!running)}>
            {running ? <Pause size={17} /> : <Play size={17} />}{" "}
            {running ? "Pause" : "Run"}
          </button>
          <button onClick={reset}>
            <RotateCcw size={17} />
            Reset
          </button>
          <button
            ref={focusButton}
            onClick={() => setExpanded(!expanded)}
            aria-pressed={expanded}
          >
            {expanded ? <Minimize size={17} /> : <Maximize size={17} />}{" "}
            {expanded ? "Exit focus" : "Focus workspace"}
          </button>
        </div>
      </header>
      <LabNavigation lab="spectra" />
      <div className="spectra-toolbar">
        <label className="spectra-field">
          Example configuration
          <select
            value={preset}
            onChange={(e) => {
              if (e.target.value !== "custom") loadPreset(e.target.value);
            }}
          >
            {preset === "custom" && <option value="custom">Custom</option>}
            {Object.entries(PRESETS).map(([key, p]) => (
              <option value={key} key={key}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <span className="spectra-toolbar-hint">
          Views share the same signal, filter settings, and history.
        </span>
      </div>
      <div className="spectra-spec" aria-label="Signal summary">
        <span>{SAMPLE_RATE} Hz sample rate</span>
        <span>{FFT_SIZE}-point FFT · Hann window · 4 Hz bins</span>
        <button
          className="spectra-bypass"
          aria-label="Enable biquad filter"
          aria-pressed={settings.filterOn}
          onClick={() => change({ filterOn: !settings.filterOn })}
        >
          {settings.filterOn ? "Filter active" : "Filter bypassed"}
        </button>
        <span>
          {settings.filterOn ? "Output" : "Input"} RMS{" "}
          {telemetry.rms.toFixed(3)}
        </span>
      </div>
      <div
        className="spectra-tabs"
        role="tablist"
        aria-label="SPECTRA workspace"
      >
        {VIEWS.map(([key, label, hint], index) => (
          <button
            key={key}
            ref={(element) => {
              tabs.current[key] = element;
            }}
            role="tab"
            id={`spectra-tab-${key}`}
            aria-controls={`spectra-panel-${key}`}
            aria-selected={view === key}
            tabIndex={view === key ? 0 : -1}
            onClick={() => go(key)}
            onKeyDown={(event) => tabKey(event, key)}
          >
            <span>0{index + 1}</span>
            <div>
              {label}
              <small>{hint}</small>
            </div>
          </button>
        ))}
      </div>
      {reduced && (
        <p className="spectra-motion-note">
          Reduced motion: the signal starts held. Choose Run when you want to
          watch it evolve.
        </p>
      )}
      <div
        className={`spectra-layout spectra-view-${view}`}
        role="tabpanel"
        id={`spectra-panel-${view}`}
        aria-labelledby={`spectra-tab-${view}`}
        tabIndex={0}
      >
        <div className="spectra-plots" ref={section}>
          {view === "signal" && (
            <>
              <SpectraCanvas
                kind="scope"
                number="01"
                title="Oscilloscope"
                className="scope-panel"
                registerSurface={registerSurface}
                caption={
                  <>
                    <span className="input-key">Input</span> /{" "}
                    <span className="output-key">Filtered output</span> · 250 ms
                    window ·{" "}
                    {["noise", "chirp"].includes(settings.source)
                      ? "held captures / 2 Hz"
                      : scopeMode === "stable"
                        ? "phase-stabilized"
                        : "slow phase drift"}{" "}
                    · automatic vertical scale
                  </>
                }
              />
              <SpectraCanvas
                kind="spectrum"
                number="02"
                title="FFT spectrum"
                registerSurface={registerSurface}
                caption={`${settings.filterOn ? "Output" : "Input"} · dB relative to unit peak amplitude · orange peak hold`}
              />
            </>
          )}
          {view === "filter" && (
            <>
              <SpectraCanvas
                kind="response"
                number="03"
                title="Filter response"
                registerSurface={registerSurface}
                caption={`Designed gain in dB · ${settings.filterOn ? "filter active" : "bypassed; curve shows filter design"}`}
              />
              <ZPlane settings={settings} onChange={change} />
            </>
          )}
          {view === "spectrogram" && (
            <SpectraCanvas
              kind="spectrogram"
              number="05"
              title="Spectrogram"
              registerSurface={registerSurface}
              caption="Frequency → / time ↓ · newest at bottom · up to 10 seconds · −90 to 0 dB color scale"
            />
          )}
        </div>
        <aside
          className="spectra-controls"
          aria-label={
            view === "filter" ? "Filter parameters" : "Signal parameters"
          }
        >
          <h2>
            {view === "filter" ? "Filter parameters" : "Signal parameters"}
          </h2>
          {view !== "filter" && (
            <>
              <label className="spectra-field">
                Signal source
                <select
                  value={settings.source}
                  onChange={(e) => change({ source: e.target.value })}
                >
                  {SOURCES.map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <Parameter
                id="f1"
                label="Frequency 1"
                value={settings.f1}
                min={4}
                max={480}
                step={1}
                unit="Hz"
                onChange={(f1) => change({ f1 })}
                disabled={["noise", "chirp"].includes(settings.source)}
              />
              <Parameter
                id="f2"
                label="Frequency 2"
                value={settings.f2}
                min={4}
                max={480}
                step={1}
                unit="Hz"
                onChange={(f2) => change({ f2 })}
                disabled={settings.source !== "dual"}
              />
              {settings.source === "chirp" && (
                <p className="control-hint">
                  20–420 Hz linear sweep, repeating every 3 seconds.
                </p>
              )}
            </>
          )}
          {view === "signal" && (
            <>
              <label className="spectra-field">
                Oscilloscope motion
                <select
                  value={scopeMode}
                  onChange={(e) => setScopeMode(e.target.value)}
                >
                  <option value="stable">Stable / phase locked</option>
                  <option value="slow">Slow drift / 2% cycle per second</option>
                </select>
              </label>
              <details className="spectra-display-note">
                <summary>Display timing</summary>
                <p className="control-hint">
                  Display motion only. Noise and chirp use held captures
                  refreshed twice per second; processing stays live.
                </p>
              </details>
            </>
          )}
          {view === "filter" && (
            <>
              <div className="filter-control-heading">
                <h3>Biquad filter</h3>
                <button
                  className="filter-toggle"
                  aria-pressed={settings.filterOn}
                  onClick={() => change({ filterOn: !settings.filterOn })}
                >
                  {settings.filterOn ? "Active" : "Bypassed"}
                </button>
              </div>
              <Parameter
                id="pr"
                label="Pole radius"
                value={settings.poleR}
                min={0.05}
                max={0.98}
                step={0.001}
                digits={3}
                onChange={(poleR) => change({ poleR })}
              />
              <Parameter
                id="pa"
                label="Pole angle"
                value={(settings.poleA * 180) / Math.PI}
                min={0}
                max={180}
                step={0.1}
                digits={1}
                unit="°"
                onChange={(angle) => change({ poleA: (angle * Math.PI) / 180 })}
              />
              <Parameter
                id="zr"
                label="Zero radius"
                value={settings.zeroR}
                min={0.05}
                max={1.15}
                step={0.001}
                digits={3}
                onChange={(zeroR) => change({ zeroR })}
              />
              <Parameter
                id="za"
                label="Zero angle"
                value={(settings.zeroA * 180) / Math.PI}
                min={0}
                max={180}
                step={0.1}
                digits={1}
                unit="°"
                onChange={(angle) => change({ zeroA: (angle * Math.PI) / 180 })}
              />
            </>
          )}
          {view === "filter" && (
            <dl className="spectra-telemetry">
              <div>
                <dt>Pole frequency</dt>
                <dd>
                  {((settings.poleA * SAMPLE_RATE) / (Math.PI * 2)).toFixed(1)}{" "}
                  Hz
                </dd>
              </div>
              <div>
                <dt>{settings.filterOn ? "Output" : "Input"} RMS</dt>
                <dd>{telemetry.rms.toFixed(3)}</dd>
              </div>
              <div>
                <dt>Pole stability</dt>
                <dd>Inside unit circle</dd>
              </div>
            </dl>
          )}
          {view === "spectrogram" && (
            <p className="control-hint">
              The view retains up to 10 seconds of live frequency history.
              Frequency runs left to right; newer samples appear at the bottom.
              Switching views does not clear the history.
            </p>
          )}
          {telemetry.limited && (
            <p className="spectra-limiter" role="status">
              Output guard reached ±20. Large gain is being limited; reduce pole
              radius or move the zeros.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
