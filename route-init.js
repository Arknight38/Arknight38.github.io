const routed = new URLSearchParams(location.search).get("portfolio-route");
let legacy;
try {
  legacy = sessionStorage.getItem("portfolio-redirect");
  sessionStorage.removeItem("portfolio-redirect");
} catch {
  // Deep links use the URL so blocked storage does not prevent navigation.
}
const destination = routed || legacy;
if (destination?.startsWith("/") && !destination.startsWith("//")) {
  history.replaceState(null, "", destination);
}
if (location.hash.startsWith("#/")) {
  history.replaceState(null, "", location.hash.slice(1));
}
if (/^\/Arknight38\.github\.io\/?$/i.test(location.pathname)) {
  history.replaceState(null, "", "/" + location.search + location.hash);
}
