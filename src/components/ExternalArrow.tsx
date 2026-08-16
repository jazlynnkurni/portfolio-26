/**
 * ExternalArrow — the signature "this leaves the site" mark.
 *
 * A diagonal arrow pointing up-and-right. It nudges along its own diagonal on
 * hover/focus of the parent link, which is why the motion reads as "off you
 * go" rather than as a generic wiggle.
 *
 * Sized in `em` so it scales with whatever type it sits beside — the nav's
 * 15px and the footer's 11px uppercase mono both get a correctly proportioned
 * arrow with no per-site tuning.
 */
export default function ExternalArrow({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 12 12"
      aria-hidden="true"
      focusable="false"
      className={`ext-arrow ${className}`}
      style={{ width: "0.72em", height: "0.72em" }}
    >
      {/* shaft, then the two barbs — stroked so it inherits the link colour */}
      <path
        d="M2.6 9.4 L9.4 2.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M4.6 2.6 H9.4 V7.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
