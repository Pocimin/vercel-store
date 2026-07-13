import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function ScriptBox({
  script,
  label,
}: {
  script: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(script);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="card overflow-hidden rounded-xl">
      <div className="flex items-center gap-2 border-b border-white/5 bg-black/30 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.63_0.24_27)]/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.8_0.16_80)]/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/60" />
        {label && (
          <span className="ml-2 font-mono text-xs font-medium text-muted-foreground">{label}</span>
        )}
      </div>
      <div className="relative p-4">
        <button
          onClick={copy}
          className={`absolute right-3 top-3 inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition ${
            copied
              ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-400"
              : "border-white/10 bg-white/[0.03] text-muted-foreground hover:border-white/20 hover:text-foreground"
          }`}
          aria-label="Copy script"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
        </button>
        <pre className="whitespace-pre-wrap break-all pr-16 font-mono text-[13px] leading-relaxed text-foreground/80">
          <code>{script}</code>
        </pre>
      </div>
    </div>
  );
}
