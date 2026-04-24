import FloatingActionButton from "@/components/ui/FloatingActionButton";

export default function BackToHomeFab() {
  return (
    <FloatingActionButton href="/home" label="Back to dashboard">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="square"
        strokeLinejoin="miter"
        aria-hidden
      >
        <path d="M3 11 L12 3 L21 11" />
        <path d="M5 9 V21 H10 V14 H14 V21 H19 V9" />
      </svg>
    </FloatingActionButton>
  );
}
