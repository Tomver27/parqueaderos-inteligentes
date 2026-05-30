type Props = {
  text: string;
  width?: string;
};

export default function Tooltip({ text, width = "w-52" }: Props) {
  return (
    <div className="relative group inline-flex items-center ml-1">
      <span
        tabIndex={0}
        role="button"
        aria-label="Más información"
        className="cursor-help inline-flex items-center justify-center rounded-full leading-none focus:outline-none focus:ring-1 focus:ring-slate-500"
        style={{
          width: 14,
          height: 14,
          background: "rgba(100,116,139,0.2)",
          color: "#64748b",
          fontWeight: 700,
          fontSize: 9,
        }}
      >
        ?
      </span>
      <div
        className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 ${width} rounded-xl px-3 py-2 text-xs pointer-events-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-20`}
        style={{
          background: "#1e293b",
          color: "#94a3b8",
          border: "1px solid rgba(255,255,255,0.1)",
          lineHeight: 1.5,
        }}
      >
        {text}
      </div>
    </div>
  );
}
