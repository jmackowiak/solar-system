export type IconName =
  | "play"
  | "pause"
  | "reset"
  | "settings"
  | "close"
  | "arrow"
  | "back"
  | "home"
  | "motion"
  | "orbit"
  | "expand"
  | "info"
  | "plus"
  | "minus";
const paths: Record<IconName, string> = {
  play: "m9 5 11 7-11 7V5Z",
  pause: "M8 5v14M16 5v14",
  reset: "M3 10a9 9 0 1 1 2 8M3 4v6h6",
  settings: "M4 7h16M4 17h16M8 4v6M16 14v6",
  close: "m6 6 12 12M6 18 18 6",
  arrow: "M4 12h16m-6-6 6 6-6 6",
  back: "M20 12H4m6-6-6 6 6 6",
  home: "M3 9V3h6m6 0h6v6M3 15v6h6m6 0h6v-6",
  motion: "M5 8h8M3 12h12M5 16h8m4-11 4 7-4 7",
  orbit:
    "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM3 18C-2 10 18-2 21 6s-17 20-18 12Z",
  expand: "m8 10 4 4 4-4",
  info: "M12 11v6m0-10v.1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  plus: "M5 12h14M12 5v14",
  minus: "M5 12h14",
};
export default function Icon({
  name,
  size = 18,
}: {
  name: IconName;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
