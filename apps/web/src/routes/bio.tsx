import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/bio")({
  head: () => ({ meta: [{ title: "Omar - Discord Bio" }] }),
  component: BioPage,
});

function BioPage() {
  useEffect(() => {
    window.location.replace("/bio/index.html");
  }, []);

  return <main className="grid min-h-screen place-items-center bg-[#111] text-sm text-white">Opening profile...</main>;
}
