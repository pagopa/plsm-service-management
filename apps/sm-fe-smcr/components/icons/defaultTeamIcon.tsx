export default function DefaultTeamIcon({
  className = "w-12 h-12 text-muted-foreground",
}) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0V17a3 3 0 00-3-3H10a3 3 0 00-3 3v3m10 0v0M6.5 10a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0zm11 0a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
      />
    </svg>
  );
}
