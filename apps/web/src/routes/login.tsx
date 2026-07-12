import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AuthPanel } from "@/components/AuthPanel";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in - nznt's hub" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  return (
    <main className="min-h-screen bg-[#0a0a0a] px-6 py-20">
      <AuthPanel initialMode="login" onDone={() => void navigate({ to: "/dashboard" })} />
    </main>
  );
}
