/** Original geometric ARK lettering and ribbon; shared by the masthead and stamp. */
export default function ArkMark() {
  return (
    <svg className="ark-symbol" viewBox="0 0 40 43" aria-hidden="true">
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="3.3"
        strokeLinecap="butt"
        strokeLinejoin="miter"
      >
        <path d="M3 25V10l3-3h5l3 3v15M3 17h11" />
        <path d="M19 25V7h5l3 3v5l-3 3h-5m5 0 4 7" />
        <path d="M33 7v18m6-18-6 10 6 8" />
      </g>
      <g className="ark-ribbon" fill="var(--logo-ribbon, #ff4dbc)">
        <path d="M18 31 8 27l1 9 9-2ZM23 31l10-4-1 9-9-2ZM18 34l-5 8 5-2 3 2 1-8ZM23 34l5 8 1-4 5 1-8-7Z" />
        <path d="m19 30-1 1v4l1 1h4l1-1v-4l-1-1Z" />
      </g>
    </svg>
  );
}
