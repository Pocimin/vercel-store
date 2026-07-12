import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AuthPanel } from "@/components/AuthPanel";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Register - nznt's hub" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  return (
    <main className="min-h-screen bg-[#0a0a0a] px-6 py-20">
      <AuthPanel initialMode="register" onDone={() => void navigate({ to: "/dashboard" })} />
    </main>
  );
}
