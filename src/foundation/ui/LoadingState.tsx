export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 200,
        gap: 12,
        color: "var(--m-text-secondary)",
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          border: "2px solid var(--m-border-strong)",
          borderTopColor: "var(--m-accent)",
          borderRadius: "50%",
          animation: "m-spin 0.7s linear infinite",
        }}
      />
      <span style={{ fontSize: "var(--m-text-sm)" }}>{label}</span>
      <style>{`@keyframes m-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
