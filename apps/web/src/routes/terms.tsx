import { createFileRoute } from "@tanstack/react-router";
import { Nav, Footer } from "./index";
import { useI18n } from "@/lib/i18n";
import { useInView } from "@/lib/useInView";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service - nznt's hub" },
      { name: "description", content: "Terms of Service for nznt's hub." },
    ],
  }),
  component: TermsPage,
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

function TermsPage() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
          Syarat Layanan · Terms of Service
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Berlaku efektif · Effective date: 24 Agustus 2026 · August 24, 2026
        </p>

        <div className="mt-10 space-y-10">
          <Section title="1. Tentang Kami · About Us">
            <p>
              nznt's hub ("kita", "kami", "layanan") menjual dan menyediakan Roblox script hub, paket lisensi key,
              serta layanan penjoki dari pemilik bernama nznt. Pertanyaan bisa diajukan lewat Discord support:
              https://discord.gg/nznt atau email support@nznt.store.
            </p>
            <p>
              nznt's hub ("we", "us", "the service") sells and provides a Roblox script hub, license keys, and
              joki services owned by nznt. Contact us on the support Discord: https://discord.gg/nznt or email
              support@nznt.store.
            </p>
          </Section>

          <Section title="2. Deskripsi Layanan · Service Description">
            <p>
              Layanan kami adalah script (Lua) untuk Roblox yang dijalankan via executor pihak ketiga (Delta,
              Wave, Solara, dll.), plus paket lisensi berbayar (weekly Rp 10.000 / monthly Rp 30.000 / joki Rp
              100.000), paket penjoki, dan fitur monitoring sesi. Lisensi berbentuk license key yang kamu tukar
              (redeem) pada akun kamu.
            </p>
            <p>
              Our service is a Lua script for Roblox run through third-party executors (Delta, Wave, Solara,
              etc.), paid license packages (weekly Rp 10,000 / monthly Rp 30,000 / joki Rp 100,000), joki
              services, and session monitoring. Licenses take the form of a key you redeem on your account.
            </p>
          </Section>

          <Section title="3. Pembayaran · Payments">
            <p>
              Pembayaran via QRIS (ShopeePay dan e-wallet/bank Indonesia) diverifikasi otomatis lewat
              penyedia pembayaran kami (AutoGoPay) — key dibuat otomatis begitu pembayaran masuk. Metode manual
              (transfer bank, DANA, OVO, dll.) melewati peninjauan admin dan bisa memakan waktu. Dengan membeli,
              kamu setuju membayar saat konfirmasi pada halaman pembelian.
            </p>
            <p>
              QRIS payments (ShopeePay and other Indonesian e-wallets/banks) are verified automatically through
              our payment provider (AutoGoPay) — your key is created automatically once the payment clears.
              Manual methods (bank transfer, DANA, OVO, etc.) go through admin review and can take time. By
              purchasing, you agree to pay after confirming on the purchase page.
            </p>
          </Section>

          <Section title="4. Penukaran Lisensi · License Redemption">
            <p>
              1 key untuk 1 akun. Key wajib ditukar (redeem) lewat halaman Redeem dengan akun yang sama yang
              dipakai membeli — kecuali dinyatakan lain pada email pengiriman. Key yang sudah dipakai tidak bisa
              dipindah ke akun lain. Key terkirim ke email, jadi pastikan email kamu benar dan aktif.
            </p>
            <p>
              One key per account. Keys must be redeemed on the same account used to purchase, unless stated
              otherwise in your delivery email. Claimed keys cannot be transferred to another account. Keys are
              delivered by email, so make sure your email is correct and active.
            </p>
          </Section>

          <Section title="5. Refund · Refunds">
            <p>
              Semua pembelian skrip, lisensi, dan penjoki bersifat final dan tidak bisa direfund setelah key
              dibuat atau jasa penjoki dimulai, kecuali: (a) kami tidak bisa memberikan layanan seperti yang
              dijanjikan tanpa ganti, dan (b) pembayaran dobekel tidak valid yang terbukti bukan atas kesalahan
              kamu. Refund yang disetujui akan dikembalikan ke metode awal pembayaran bila memungkinkan.
            </p>
            <p>
              All script, license, and joki purchases are final and non-refundable once a key is issued or a
              joki service has started, except: (a) we fail to deliver the promised service, or (b) a payment
              is proven to be duplicated through no fault of yours. Approved refunds go back to the original
              payment method where possible.
            </p>
          </Section>

          <Section title="6. Perilaku Akun · Account Conduct">
            <p>
              Dilarang: berbagi/menjual ulang key, abuse HWID-reset berlebihan, bypass atau reverse engineering
              sistem lisensi, RAT/eksploitasi loadstring bodong yang mengatasnamakan kami, spam, dan perilaku
              toxic di support. Pelanggaran bisa berakibat key dicabut tanpa refund dan akun diblokir.
            </p>
            <p>
              You may not: share or resell keys, abuse HWID resets, bypass or reverse engineer the license
              system, distribute fake loaders/RATs in our name, spam, or behave abusively in support. Violations
              can result in a revoked key without refund and a blocked account.
            </p>
          </Section>

          <Section title="7. Penghentian & Batasan Tanggung Jawab · Termination & Liability">
            <p>
              Kami bisa menghentikan atau mengubah layanan kapan saja tanpa pemberitahuan, misalnya jika Roblox
              memblokir penggunaan script. Layanan disediakan "sebagaimana adanya". Kami tidak bertanggung jawab
              atas skors/ban/trade-lock akun Roblox kamu, kehilangan item dalam game, atau kerusakan tidak
              langsung. Batas tanggung jawab kami maksimal senilai pembayaran yang kamu lakukan.
            </p>
            <p>
              We may suspend, change, or discontinue the service at any time, for example if Roblox blocks
              scripting. The service is provided "as is". We are not liable for Roblox suspensions/bans/trade
              locks, lost in-game items, or indirect damages. Our liability is limited to the amount you paid.
            </p>
          </Section>

          <Section title="8. Perubahan Kebijakan · Changes to These Terms">
            <p>
              Kami bisa mengubah Syarat ini sewaktu-waktu; versi terbaru selalu di halaman ini dengan tanggal
              efektif terbaru. Perubahan besar untuk akun yang sudah aktif akan diumumkan lewat email atau
              Discord. Dengan terus memakai layanan, kamu menerima syarat terbaru.
            </p>
            <p>
              We may update these Terms at any time; the latest version is always on this page with a new
              effective date. Material changes for active accounts will be announced by email or Discord. By
              continuing to use the service you accept the latest Terms.
            </p>
          </Section>

          <Section title="9. Kontak · Contact">
            <p>
              Discord support (respon tercepat): https://discord.gg/nznt — Email: support@nznt.store. Nama
              pemilik: nznt. Informasi lebih lengkap ada di Kebijakan Privasi.
            </p>
            <p>
              Support Discord (fastest reply): https://discord.gg/nznt — Email: support@nznt.store. Owner name:
              nznt. See our Privacy Policy for more details.
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
