import { NavLink } from "react-router-dom";
import "./lab-navigation.css";
const LABELS = {
  spectra: "SPECTRA",
  huffman: "Code Loom",
  neural: "Neural Lab",
  kepler: "KEPLER",
  silicon: "SILICON",
  resonance: "RESONANCE",
};
export default function LabNavigation({ lab }) {
  return (
    <nav className="lab-view-navigation" aria-label={`${LABELS[lab]} pages`}>
      <NavLink to={`/lab/${lab}`} end>
        Experiment
      </NavLink>
      <NavLink to={`/lab/${lab}/writeup`}>Writeup</NavLink>
    </nav>
  );
}
