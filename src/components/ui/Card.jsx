export default function Card({
  children,
  className = "",
  padding = "p-6",
  ...props
}) {
  return (
    <div
      className={`bg-card rounded-2xl border border-border shadow-sm ${padding} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
