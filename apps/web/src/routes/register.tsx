import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Nav, Footer } from "./index";
import { useI18n } from "@/lib/i18n";
import { AuthPanel } from "@/components/AuthPanel";
import { type User } from "@/lib/api";

const REDEEM_PREFILL_KEY = "nznt_prefill_key";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Register - nznt's hub" },
      { name: "description", content: "Create your account and claim your nznt's hub license key." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [prefillKey, setPrefillKey] = useState("");
  const done = useRef(false);

  useEffect(() => {
    let key = "";
    try {
      const query = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
      key = query.get("key") ?? "";
      if (!key) key = localStorage.getItem(REDEEM_PREFILL_KEY) ?? "";
      localStorage.removeItem(REDEEM_PREFILL_KEY);
    } catch {}
    setPrefillKey(key);
  }, []);

  function doneRegister(user: User) {
    if (done.current) return;
    done.current = true;
    void navigate({ to: "/dashboard" });
    void user;
  }

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="mx-auto max-w-xl px-6 py-16">
        <p className="mb-6 text-center text-sm text-muted-foreground">
          {t("createAccount")} · {t("createAccountSub")}
        </p>
        <AuthPanel initialMode="register" initialLicenseKey={prefillKey || undefined} onDone={doneRegister} />
      </main>
      <Footer />
    </div>
  );
}
