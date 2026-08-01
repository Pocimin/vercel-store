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
    <div className="rounded-lg border border-white/10 bg-[#0a0a0a]">
      {label && (
        <div className="border-b border-white/5 px-4 py-2 text-xs font-medium text-muted-foreground">
          {label}
        </div>
      )}
      <div className="relative p-4">
        <button
          onClick={copy}
          className="absolute right-3 top-3 inline-flex items-center gap-1 text-xs text-muted-foreground transition hover:text-foreground"
          aria-label="Copy script"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
        </button>
        <pre className="whitespace-pre-wrap break-all pr-14 font-mono text-[13px] leading-relaxed text-foreground/80">
          <code>{script}</code>
        </pre>
      </div>
    </div>
  );
}
