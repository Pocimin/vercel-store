"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy, Terminal } from "lucide-react";
import Link from "next/link";

const SCRIPT = `loadstring(game:HttpGet("https://beta.vonalia.com/Obfuscate/nzntfree"))()`;

export const FreeScript = () => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="free-script" className="py-20 px-6">
      <div className="container mx-auto max-w-4xl">
        <div className="p-12 rounded-3xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-white/10 text-center">
          <Terminal className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-4">Try Our Free Script</h2>
          <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
            Test out the basic features before upgrading to premium. Free version includes basic autofarm functionality.
          </p>
          <div className="p-4 rounded-xl bg-black/40 border border-white/10 mb-6">
            <code className="text-sm text-purple-400 font-mono block">
              {SCRIPT}
            </code>
          </div>
          <Button
            onClick={copy}
            className="mb-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? "Copied!" : "Copy Script"}
          </Button>
          <p className="text-sm text-gray-500">
            Copy and paste into your executor to try it out
          </p>
        </div>
      </div>
    </section>
  );
};
