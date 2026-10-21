import { Link, useParams } from "react-router-dom";
import LabNavigation from "./LabNavigation.jsx";
import LabWriteup from "./LabWriteup.jsx";
import spectra from "./writeups/spectra.md?raw";
import huffman from "./writeups/huffman.md?raw";
import neural from "./writeups/neural.md?raw";
const ARTICLES = {
  spectra: {
    title: "Inside SPECTRA",
    summary:
      "From poles and zeros to a measured waveform: the mathematics, implementation, and experiments behind the workstation.",
    content: spectra,
  },
  huffman: {
    title: "From bytes to an archive",
    summary:
      "Follow the codebook, bit packing, and file-format decisions that make Code Loom work.",
    content: huffman,
  },
  neural: {
    title: "Inside the learning loop",
    summary:
      "Follow the computation behind the boundary: dense layers, gradients, optimizer state, and reproducible experiments.",
    content: neural,
  },
};
export default function LabNotesPage() {
  const { lab } = useParams(),
    article = ARTICLES[lab];
  if (!article)
    return (
      <section className="page-header">
        <h1>Writeup not found.</h1>
        <Link to="/lab">Explore the lab</Link>
      </section>
    );
  return (
    <div className="lab-notes-page">
      <Link className="lab-notes-back" to="/lab">
        ← Lab notebook
      </Link>
      <LabNavigation lab={lab} />
      <LabWriteup id={lab} {...article} />
    </div>
  );
}
