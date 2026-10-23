export default function ArkMark() {
  return (
    <svg className="ark-symbol" viewBox="0 0 54 46" aria-hidden="true">
      <text
        x="5"
        y="29"
        fill="currentColor"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="23"
        fontWeight="800"
        letterSpacing="-1"
        textLength="43"
        lengthAdjust="spacingAndGlyphs"
      >
        ARK
      </text>
      <g
        className="ark-ribbon"
        fill="none"
        stroke="#dc79bb"
        strokeWidth="2.5"
        strokeLinejoin="miter"
      >
        <path d="m39 40 7-7 7 7" />
      </g>
    </svg>
  );
}
