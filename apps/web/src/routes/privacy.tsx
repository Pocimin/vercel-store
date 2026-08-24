import { createFileRoute } from "@tanstack/react-router";
import { Nav, Footer } from "./index";
import { useI18n } from "@/lib/i18n";
import { useInView } from "@/lib/useInView";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy - nznt's hub" },
      { name: "description", content: "Privacy Policy for nznt's hub." },
    ],
  }),
  component: PrivacyPage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { ref, inView } = useInView<HTMLElement>();
  return (
    <section ref={ref} className={`anim-fade-up ${inView ? "anim-visible" : ""}`}>
      <h2 className="text-xl font-extrabold tracking-tight text-foreground">{title}</h2>
      <div className="mt-2 space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function PrivacyPage() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
          Kebijakan Privasi · Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Berlaku efektif · Effective date: 24 Agustus 2026 · August 24, 2026
        </p>

        <div className="mt-10 space-y-10">
          <Section title="1. Pengendali Data & Kontak · Data Controller & Contact">
            <p>
              Pengendali data dari nznt's hub adalah pemilik bernama nznt. Pertanyaan privasi/data bisa
              diajukan ke support Discord https://discord.gg/nznt atau email support@nznt.store.
            </p>
            <p>
              The data controller behind nznt's hub is the owner, nznt. Privacy/data questions can be sent to
              the support Discord https://discord.gg/nznt or email support@nznt.store.
            </p>
          </Section>

          <Section title="2. Data yang Kami Kumpulkan · Data We Collect">
            <ul className="ml-5 list-disc space-y-1.5">
              <li><span className="text-foreground">Akun:</span> email, username, password ter-hash, nama tampilan, username Roblox opsional.</li>
              <li><span className="text-foreground">Akun (Discord):</span> ketika login via Discord, kami menerima data OAuth Discord kamu (ID Discord, display name, avatar). Kami tidak pernah menerima/menyimpan password Discord.</li>
              <li><span className="text-foreground">Pembayaran:</span> ID pesanan/pembayaran, metode, jumlah, dan bukti transaksi.</li>
              <li><span className="text-foreground">Perangkat (HWID):</span> identitas hardware yang dipakai menjalankan script (dipakai untuk lisensi dan anti-bagian key). IP address dan log server (ajax, status, aktivitas sesi) disimpan untuk keamanan dan debugging.</li>
            </ul>
            <p>
              Account: email, hashed password, display name, optional Roblox username. Discord sign-in: your
              Discord OAuth data (Discord user ID, display name, avatar). We never receive or store your
              Discord password. Payments: order/payment IDs, method, amount, and transaction proof. Device
              (HWID): hardware identifier used when running the script (used for licensing and anti-sharing).
              Your IP address and server logs (requests, statuses, session activity) are stored for security
              and debugging.
            </p>
          </Section>

          <Section title="3. Tujuan Pemrosesan · Processing Purposes">
            <p>
              Kami memproses data untuk: (1) membuat dan mengelola akun & lisensi, (2) memverifikasi pembayaran,
              (3) mengirim email transaksional (key lisensi, status pembayaran, reset password), (4) menjaga
              keamanan (deteksi key-sharing, bot, abuse), (5) menjalankan fitur monitoring sesi, dan (6)
              memenuhi kewajiban hukum.
            </p>
            <p>
              We process data to: (1) create and manage accounts & licenses, (2) verify payments, (3) send
              transactional emails (license keys, payment status, password resets), (4) maintain security
              (detecting key-sharing, bots, abuse), (5) run the session monitoring feature, and (6) comply with
              legal obligations.
            </p>
          </Section>

          <Section title="4. Dasar Hukum & Hak Kamu (GDPR/UE & UU PDP Indonesia) · Legal Basis & Your Rights">
            <p>
              Untuk pengguna di EEA/UK, kami memproses data berdasarkan kebutuhan kontrak (bagian 3: 1-3, 5),
              kepentingan sah (keamanan, bagian 3: 4), dan kewajiban hukum (bagian 3: 6). Untuk pengguna di
              Indonesia, pemrosesan mengikuti UU PDP No. 27/2022 — kamu berhak atas informasi, akses,
              koreksi, dan pengajuan keberatan/penghapusan data.
            </p>
            <p>
              For users in the EEA/UK we process data on the basis of contract (purposes 1-3, 5), legitimate
              interest (security, purpose 4), and legal obligations (purpose 6). For users in Indonesia,
              processing follows Indonesian Law No. 27/2022 (UU PDP) — you have the right to information,
              access, rectification, objection, and erasure. To exercise any right, contact support; we may
              verify your identity first.
            </p>
          </Section>

          <Section title="5. Penyimpanan Data · Data Retention">
            <p>
              Akun & lisensi disimpan selama akun tetap ada. Data pembayaran disimpan selama minimal yang
              diwajibkan hukum (khususnya perpajakan Indonesia) lalu dihapus atau dianonimkan. Log server dan
              sesi disimpan maksimal 90 hari kecuali diperlukan untuk investigasi keamanan atau penipuan. Bukti
              pembayaran manual dihapus setelah review selesai kecuali ada sengketa.
            </p>
            <p>
              Accounts & license data are kept for as long as the account exists. Payment records are kept for
              the minimum legally required period (notably Indonesian tax law) and then deleted or anonymized.
              Server & session logs are retained up to 90 days unless needed for a security or fraud
              investigation. Manual payment proofs are deleted once review is complete unless there is a
              dispute.
            </p>
          </Section>

          <Section title="6. Pihak Ketiga · Third Parties">
            <ul className="ml-5 list-disc space-y-1.5">
              <li><span className="text-foreground">Cloudflare Turnstile</span> — perlindungan anti-bot pada login/register/purchase (memproses data captcha).</li>
              <li><span className="text-foreground">Discord OAuth</span> — login dengan Discord.</li>
              <li><span className="text-foreground">Vonalia</span> — hosting & distribusi script loader.</li>
              <li><span className="text-foreground">AutoGoPay</span> — pemroses pembayaran QRIS (verifikasi otomatis).</li>
              <li><span className="text-foreground">Resend</span> — pengiriman email transaksional (key lisensi, status pembayaran).</li>
            </ul>
            <p>
              Cloudflare Turnstile (bot protection on login/register/purchase, processes captcha data), Discord
              OAuth (sign in with Discord), Vonalia (script hosting & loader distribution), AutoGoPay (QRIS
              payment processing / automatic verification), Resend (transactional email — license keys, payment
              status). Each provider processes data under its own privacy policy when applicable.
            </p>
          </Section>

          <Section title="7. Keamanan · Security">
            <p>
              Password di-hash dengan bcrypt, data dikirim lewat HTTPS, dan akses admin dibatasi. Tidak ada
              sistem yang 100% aman — kami mohon kamu juga pakai password unik dan 2FA bila tersedia.
            </p>
            <p>
              Passwords are hashed with bcrypt, traffic is served over HTTPS, and admin access is restricted.
              No system is 100% secure — please use a unique password and 2FA where available.
            </p>
          </Section>

          <Section title="8. Kebijakan Kuki & Privasi Anak · Cookies & Children">
            <p>
              Kami hanya memakai storage lokal untuk pengaturan bahasa dan bahan bantu alur pembelian; tidak
              ada kuki pelacakan pihak ketiga. Layanan ditujukan untuk pengguna berusia 13+ (16+ di EEA).
            </p>
            <p>
              We only use local storage for language preferences and purchase-flow helpers; there is no
              third-party tracking cookies. The service is intended for users aged 13+ (16+ in the EEA).
            </p>
          </Section>

          <Section title="9. Perubahan Kebijakan · Changes to This Policy">
            <p>
              Kebijakan ini bisa kami perbarui sewaktu-waktu; tanggal efektif selalu tercantum di atas.
              Perubahan besar akan diumumkan lewat email atau Discord support.
            </p>
            <p>
              This policy may be updated at any time; the effective date is always shown above. Material
              changes will be announced via email or the support Discord.
            </p>
          </Section>
        </div>

        <p className="mt-12 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} nznt's hub. {t("rights")}
        </p>
      </main>
      <Footer />
    </div>
  );
}
