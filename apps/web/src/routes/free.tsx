import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/free")({
  beforeLoad: () => {
    throw redirect({ to: "/", hash: "free" });
  },
  component: () => null,
});
