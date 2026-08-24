import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "id";

type Dict = Record<string, string>;

const en: Dict = {
  // Nav
  purchase: "Purchase",
  showcase: "Showcase",
  changelog: "Changelog",

  contact: "Contact",
  dashboard: "Dashboard",
  redeem: "Redeem",
  // Hero
  tagline: "The #1 Script Hub for Roblox.",
  getStarted: "Get started",
  buyPremium: "Buy Premium",
  saleEndsIn: "sale ends in",
  days: "days",
  hrs: "hrs",
  min: "min",
  sec: "sec",
  // Feature 1
  f1Title: "Built around the games you actually open.",
  f1Body: "One hub, multiple games. Undetectable autofarms, anti-ban, and premium features that actually work. 100% safe on main.",
  supportedGames: "Supported games",
  free: "Free",
  premium: "Premium",
  // Feature 2
  f2Title: "Beautiful UI & Visuals.",
  f2Body: "nznt's hub assures you with the best UI on the market, made entirely by hand, and different from other script hubs who use WindUI or FluentUI. nznt's hub uses its own UI or forks of niche UIs.",
  // Feature 3
  f3Title: "Start using now!",
  f3Body: "Paste the loader in your executor and you're in. No setup, no configuration.",
  copy: "Copy",
  copied: "Copied",
  // Footer
  rights: "All rights reserved.",
  terms: "Terms",
  privacy: "Privacy",
  // Language modal
  chooseLang: "Where are you from?",
  chooseLangSub: "We'll set the page language for you. You can change it later.",
  international: "International",
  internationalDesc: "English",
  indonesia: "Indonesia",
  indonesiaDesc: "Bahasa Indonesia",
  // Purchase
  beforePurchase: "Before you purchase",
  beforePurchaseSub: "Make sure to read the product information.",
  rule1: "3 Hour HWID Reset (Except Penjoki Plan)",
  rule2: "One account, one key",
  rule3: "No reselling / distributing key!",
  pickPayment: "Pick a payment option",
  pickPaymentSub: "Choose the payment method that works best for you.",
  qris: "QRIS",
  qrisDesc: "Scan & pay with any Indonesian bank or e-wallet.",
  paypal: "PayPal",
  paypalDesc: "Send as Friends & Family only.",
  robux: "Robux",
  robuxDesc: "Pay in-game using a Roblox gamepass.",
  pickLicense: "Pick a license",
  pickLicenseSub: "Licenses never renew automatically. No subscriptions.",
  weekly: "7 Days (Weekly)",
  monthly: "30 Days (Monthly)",
  jokiPlan: "Joki Plan (30 Days)",
  enterEmail: "Enter your email",
  enterEmailSub: "Your license key will be sent here, ensure you typed it correctly!",
  uploadProof: "Upload payment proof",
  uploadProofSub: "Attach a screenshot of your successful payment.",
  chooseFile: "Choose file",
  noFile: "No file selected",
  almostReady: "Almost ready",
  almostReadySub: "Agree to the Terms of Service, Privacy Policy and Refund Policy to continue.",
  agreeContinue: "Agree and continue →",
  scanQris: "Scan the QRIS below with your banking app",
  paypalHeader: "Send payments to",
  paypalDisclaimer: "Send it only as Friends & Family. Goods & Services payments will be refunded.",
  buyGamepass: "Buy gamepass",
  // Redeem
  redeemTitle: "Redeem your license",
  redeemSub: "Enter the 20-character key we sent to your email to activate your account.",
  activateLicense: "Activate license",
  verifying: "Verifying…",
  activated: "Activated",
  tryAgain: "Try again",
  // Create account
  createAccount: "Create your account",
  createAccountSub: "Set up a username & password so you can log back in anytime.",
  username: "Username",
  password: "Password",
  createContinue: "Create account & continue",
  // Dashboard
  welcomeBack: "Welcome back",
  welcomeSub: "Your license is active. Here's a quick look at your account.",
  licenseStatus: "License status",
  active: "Active",
  inactive: "Inactive",
  expiresIn: "Expires in",
  latestBuild: "Latest build",
  downloadScript: "Download the Script",
  recentActivity: "Recent activity",
  navOverview: "Overview",
  navDownloads: "Downloads",
  navLicense: "License",
  navMonitoring: "Script Monitoring",
  navBilling: "Billing",
  navSupport: "Support",
  signOut: "Sign out",
  openDiscord: "Open Discord",
  discordDesc: "Join the community for fastest turnaround on setup questions.",
  emailUs: "Email",
  emailDesc: "Reach us at",
  licenseKey: "License key",
  checkStatus: "Check license status",
  checkStatusDesc: "Verify your license is still active on our servers.",
  checkNow: "Check now",
  extendLicense: "Extend license",
  extendDesc: "Stack additional time on your current license. It activates the moment your current plan runs out.",
  extendNow: "Extend now",
  scriptLoader: "Universal loader",
  scriptLoaderDesc: "One script for every supported game. Paste this into your executor.",
  monitoringTitle: "Script Monitoring",
  monitoringSub: "Live stats streamed from your active session.",
  currentMoney: "Current Money",
  sessionEarned: "Session Earned",
  moneyPerHour: "Money / Hour",
  sessionTime: "Session Time",
  totalEarned: "Total Earned",
  totalTime: "Total Time",
  game: "Game",
  // Games meta
  gameDDS: "Drag Drive Simulator",
  gameBF: "Blox Fruits",
  gameCDID: "CDID",
  gameEvade: "Evade",
  gameDE: "Driving Empire",
  gameIV: "Indo Voice",
  // Free loader
  freeLoaderTitle: "Free loader",
  freeLoaderSub: "One line, every free game. Paste it into your executor and the hub boots itself.",
  freeStep1: "Open your executor (Delta, Wave, Solara - anything solid works).",
  freeStep2: "Copy the script above and paste it into the executor.",
  freeStep3: "Hit Execute in your game. The hub UI will appear in a second.",
  worksWith: "Works out of the box with",
  // Wizard flow
  back: "Back",
  next: "Continue",
  // Payment method badges
  instantBadge: "Instant · auto-verify",
  manualBadge: "Manual · admin review",
  // QRIS guest flow
  qrisNoAccount: "No account required — guest checkout supported.",
  qrisPayAfter: "You'll pay after confirming",
  qrisPayAfterSub: "Click Agree & Continue and you'll get a fresh QRIS + order number, then pay on the next screen.",
  emailPrefilled: "We'll send the license key to your account email.",
  errEmailRequired: "Enter your email for the license key.",
  errQrisFailed: "Could not create the QRIS payment — please try again.",
  submitting: "Submitting…",
  // QRIS waiting screen
  waitPayment: "Waiting for payment",
  qrisWaitSub: "Scan the QR below with your banking app. We verify your payment automatically every 3 seconds.",
  payNow: "Pay now",
  qrExpiresIn: "QR expires in",
  orderSn: "Order number",
  planRow: "Plan",
  paidTitle: "Payment received!",
  checkYourEmail: "Check your email for your license key.",
  keyActiveFor: "Key active for",
  redeemNow: "Redeem now",
  paymentExpired: "Payment expired",
  paymentExpiredSub: "The QR expired — create a new payment to continue.",
  // Manual (Robux / PayPal) flow
  manualGateTitle: "Sign in required",
  manualGateSub: "Manual payments are tied to your account so we can deliver your key.",
  registerBeforeProof: "Register or sign in before submitting your proof.",
  onlyForManual: "Proof upload is only needed for manual payments (Robux & PayPal).",
  payWithGamepass: "Pay with a Roblox gamepass",
  gamepassNote: "Buy the gamepass in-game, then upload a screenshot of your purchase.",
  signedInAs: "Signed in as",
  proofMaxHint: "Max 2.5 MB",
  waitForReview: "Proof submitted!",
  waitForReviewSub: "Admin will review shortly — usually minutes to a few hours. Your license key will be emailed once approved.",
  goDashboard: "Go to dashboard",
  // Errors
  errInvalidPlan: "That plan is unavailable — refresh the page and pick again.",
  errInvalidProof: "Proof must be a real PNG, JPEG, or WebP image.",
  errProofTooLarge: "Proof image is too large (2.5 MB max).",
  errAlreadySubmitted: "You already have a payment waiting — wait for review.",
  errCaptchaRequired: "Complete the captcha first.",
  errEmailInvalid: "Enter a valid email address.",
  errProofType: "Proof must be a PNG, JPEG, or WebP image.",
  errProofSize: "Proof image must be 2.5 MB or smaller.",
  errSelectProof: "Select a valid proof image first.",
  errSubmitFailed: "Payment submission failed",
  // Captcha step
  captchaStep: "Security check",
  captchaStepSub: "Keeps our store safe.",
  captchaDevOnly: "Captcha is enabled on production builds.",
  // Auth panel
  authCreateAccount: "Create Account",
  authSignIn: "Sign In",
  authWelcomeBack: "Welcome Back",
  authRegisterSub: "Register first, then get your license key.",
  authLoginSub: "Sign in to access your license, scripts, and monitoring.",
  authEmailLabel: "Email",
  authEmailOrUsername: "Email or username",
  authLicenseKeyLabel: "License key",
  authRobloxUsername: "Roblox username (optional)",
  authConfirmPassword: "Confirm password",
  authTotp: "2FA code (if enabled)",
  authBusy: "Please wait...",
  authDiscord: "Continue with Discord",
  authSwitchLogin: "Already have an account? Sign in",
  authSwitchRegister: "Need an account? Register",
  authRegisterNoKey: "You can register without a license key here — add it later via Redeem.",
  errPasswordMismatch: "Passwords do not match.",
  errLicenseKeyShort: "License key must be at least 8 characters.",
  errCaptchaSubmit: "Complete the captcha, then submit again.",
  authFailed: "Authentication failed",
  authBadLicense: "License key is invalid or inactive.",
  authLicenseClaimed: "License key already claimed by an account.",
  authEmailNotVerified: "Email not verified — check your inbox.",
  authTotpLocked: "Too many attempts — try again later.",
  // Redeem / register
  redeemKeyTooShort: "Enter the complete license key from your email.",
  redeemKeyClaimed: "This key is already claimed by another account. Contact the support Discord for help.",
  redeemKeyInvalid: "Key is invalid or inactive.",
  redeemVerifyFailed: "Verification failed",
  redeemKeyValid: "Key valid! Now create your account with this key.",
  redeemRegisterNow: "Register now",
  redeemBuyNew: "Buy a new license",
  checking: "Checking…",
  redeemClaimFailed: "Could not claim this license",
  // Dashboard
  dashLoaderDesc: "Use the universal loader below. Your key and active sessions stay attached to this account.",
  liveBadge: "Live",
  noActivePlan: "No active plan",
  noSessionYet: "No session yet",
  scriptSession: "Script session",
  noSessionsYet: "No script sessions yet.",
  noLicenseYet: "No license yet",
  dashLicenseSub: "Your license key and current plan.",
  licValidationFailed: "License validation failed",
  monitoringAccess: "Monitoring access",
  monCodeDesc: "Use this code only in a script's Monitoring tab. It links stats to this account and cannot load scripts or access your license.",
  monNoCode: "No monitoring code generated",
  monGenerate: "Generate code",
  monCodeStatus: "Copy this code into the Monitoring tab in your script. It stays the same until you explicitly replace it.",
  monCodeFailed: "Could not create monitoring code",
  scriptInstance: "Script instance",
  statusLabel: "Status",
  elapsed: "Elapsed",
  earnedLabel: "Earned",
  lastSeen: "Last seen",
  billingIntro: "Your orders and invoices.",
  orderHistory: "Order history",
  order: "Order",
  date: "Date",
  item: "Item",
  total: "Total",
  status: "Status",
  supportIntro: "Trouble getting set up? We usually reply within a few hours.",
  discordTitle: "Discord",
  signingOut: "Signing out...",
  loginRequired: "Login required",
  customer: "customer",
  closeMenu: "Close menu",
  // Admin
  adminTitle: "Admin monitoring",
  adminSub: "Payments, script builds, and live Roblox sessions.",
  adminLoginRequired: "Admin login required",
  activeSessions: "Active sessions",
  queuedBuilds: "Queued builds",
  scriptsLabel: "Scripts",
  pendingLabel: "Pending",
  approvalsTitle: "Payment approvals",
  thUser: "User",
  thPlan: "Plan",
  thAmount: "Amount",
  thProof: "Proof",
  thAction: "Action",
  noProof: "No proof",
  approve: "Approve",
  reject: "Reject",
  working: "Working...",
  recentEventsTitle: "Recent script events",
  liveStatsTitle: "Live script stats",
  thScript: "Script",
  thRoblox: "Roblox",
  thMoney: "Money",
  thEarned: "Earned",
  thPerHour: "/ hour",
  thLevel: "Level",
  thTask: "Task",
  thLastSeen: "Last seen",
  approvedNotice: "Payment approved.",
  licenseCreated: "License created",
  rejectedNotice: "Payment rejected.",
  approveFailed: "Payment approval failed",
  rejectFailed: "Payment rejection failed",
};


const id: Dict = {
  purchase: "Beli",
  showcase: "Showcase",
  changelog: "Perubahan",

  contact: "Kontak",
  dashboard: "Dasbor",
  redeem: "Tukar",
  tagline: "Script Hub #1 untuk Roblox.",
  getStarted: "Mulai sekarang",
  buyPremium: "Beli Premium",
  saleEndsIn: "diskon berakhir dalam",
  days: "hari",
  hrs: "jam",
  min: "menit",
  sec: "detik",
  f1Title: "Dibuat khusus untuk game yang kamu mainkan.",
  f1Body: "Satu hub, banyak game. Autofarm tidak terdeteksi, anti-ban, dan fitur premium yang benar-benar bekerja. 100% aman di akun utama.",
  supportedGames: "Game yang didukung",
  free: "Gratis",
  premium: "Premium",
  f2Title: "UI & Visual yang Menawan.",
  f2Body: "nznt's hub memberikanmu UI terbaik di pasaran, dibuat sepenuhnya dengan tangan, dan berbeda dari script hub lain yang menggunakan WindUI atau FluentUI. nznt's hub menggunakan UI-nya sendiri atau fork dari UI niche.",
  f3Title: "Mulai gunakan sekarang!",
  f3Body: "Tempel loader-nya di eksekutor kamu dan langsung jalan. Tanpa setup, tanpa konfigurasi.",
  copy: "Salin",
  copied: "Tersalin",
  rights: "Hak cipta dilindungi.",
  terms: "Syarat",
  privacy: "Privasi",
  chooseLang: "Kamu dari mana?",
  chooseLangSub: "Kami akan mengatur bahasa halaman untukmu. Bisa diganti kapan saja.",
  international: "Internasional",
  internationalDesc: "English",
  indonesia: "Indonesia",
  indonesiaDesc: "Bahasa Indonesia",
  beforePurchase: "Sebelum kamu membeli",
  beforePurchaseSub: "Pastikan kamu membaca informasi produk berikut.",
  rule1: "Reset HWID 3 Jam (Kecuali Paket Penjoki)",
  rule2: "Satu akun, satu key",
  rule3: "Dilarang menjual ulang / membagikan key!",
  pickPayment: "Pilih metode pembayaran",
  pickPaymentSub: "Pilih metode pembayaran yang paling cocok untukmu.",
  qris: "QRIS",
  qrisDesc: "Scan & bayar dengan bank atau e-wallet Indonesia.",
  paypal: "PayPal",
  paypalDesc: "Hanya kirim sebagai Friends & Family.",
  robux: "Robux",
  robuxDesc: "Bayar dalam game melalui Roblox gamepass.",
  pickLicense: "Pilih lisensi",
  pickLicenseSub: "Lisensi tidak pernah diperpanjang otomatis. Tidak ada langganan.",
  weekly: "7 Hari (Mingguan)",
  monthly: "30 Hari (Bulanan)",
  jokiPlan: "Paket Penjoki (30 Hari)",
  enterEmail: "Masukkan email kamu",
  enterEmailSub: "Key lisensi akan dikirim ke sini, pastikan penulisannya benar!",
  uploadProof: "Unggah bukti pembayaran",
  uploadProofSub: "Lampirkan screenshot pembayaran yang berhasil.",
  chooseFile: "Pilih file",
  noFile: "Belum ada file dipilih",
  almostReady: "Hampir siap",
  almostReadySub: "Setujui Syarat Layanan, Kebijakan Privasi, dan Kebijakan Refund untuk melanjutkan.",
  agreeContinue: "Setuju dan lanjutkan →",
  scanQris: "Scan QRIS di bawah dengan aplikasi bank kamu",
  paypalHeader: "Kirim pembayaran ke",
  paypalDisclaimer: "Kirim hanya sebagai Friends & Family. Pembayaran Goods & Services akan direfund.",
  buyGamepass: "Beli gamepass",
  redeemTitle: "Tukarkan lisensi kamu",
  redeemSub: "Masukkan key 20 karakter yang kami kirim ke emailmu untuk mengaktifkan akun.",
  activateLicense: "Aktifkan lisensi",
  verifying: "Memverifikasi…",
  activated: "Teraktivasi",
  tryAgain: "Coba lagi",
  createAccount: "Buat akun kamu",
  createAccountSub: "Buat username & password agar bisa login kembali kapan saja.",
  username: "Nama pengguna",
  password: "Kata sandi",
  createContinue: "Buat akun & lanjutkan",
  welcomeBack: "Selamat datang kembali",
  welcomeSub: "Lisensi kamu aktif. Berikut ringkasan singkat akun kamu.",
  licenseStatus: "Status lisensi",
  active: "Aktif",
  inactive: "Tidak Aktif",
  expiresIn: "Kadaluarsa dalam",
  latestBuild: "Rilis terbaru",
  downloadScript: "Download Script",
  recentActivity: "Aktivitas terbaru",
  navOverview: "Ringkasan",
  navDownloads: "Download",
  navLicense: "Lisensi",
  navMonitoring: "Monitoring Script",
  navBilling: "Tagihan",
  navSupport: "Bantuan",
  signOut: "Keluar",
  openDiscord: "Buka Discord",
  discordDesc: "Gabung komunitas untuk respon paling cepat.",
  emailUs: "Email",
  emailDesc: "Hubungi kami di",
  licenseKey: "Key lisensi",
  checkStatus: "Cek status lisensi",
  checkStatusDesc: "Periksa apakah lisensimu masih aktif di server kami.",
  checkNow: "Cek sekarang",
  extendLicense: "Perpanjang lisensi",
  extendDesc: "Tambahkan waktu ke lisensi kamu saat ini. Aktif otomatis setelah paket berjalan habis.",
  extendNow: "Perpanjang sekarang",
  scriptLoader: "Loader universal",
  scriptLoaderDesc: "Satu script untuk semua game yang didukung. Tempel di eksekutor kamu.",
  monitoringTitle: "Monitoring Script",
  monitoringSub: "Statistik langsung dari sesi aktif kamu.",
  currentMoney: "Uang Saat Ini",
  sessionEarned: "Uang Sesi Ini",
  moneyPerHour: "Uang / Jam",
  sessionTime: "Durasi Sesi",
  totalEarned: "Total Diperoleh",
  totalTime: "Total Waktu",
  game: "Game",
  gameDDS: "Drag Drive Simulator",
  gameBF: "Blox Fruits",
  gameCDID: "CDID",
  gameEvade: "Evade",
  gameDE: "Driving Empire",
  gameIV: "Indo Voice",
  freeLoaderTitle: "Loader gratis",
  freeLoaderSub: "Satu baris, semua game gratis. Tempel di eksekutor dan hub jalan sendiri.",
  freeStep1: "Buka eksekutor kamu (Delta, Wave, Solara - apa saja yang stabil).",
  freeStep2: "Salin script di atas dan tempel ke eksekutor.",
  freeStep3: "Tekan Execute di dalam game. UI hub akan muncul sebentar lagi.",
  worksWith: "Langsung jalan di",
  // Wizard flow
  back: "Kembali",
  next: "Lanjut",
  // Payment method badges
  instantBadge: "Instan · verifikasi otomatis",
  manualBadge: "Manual · ditinjau admin",
  // QRIS guest flow
  qrisNoAccount: "Tanpa perlu akun — checkout tamu didukung.",
  qrisPayAfter: "Kamu bayar setelah konfirmasi",
  qrisPayAfterSub: "Klik Setuju & Lanjut, kamu dapat QRIS + nomor pesanan, lalu bayar di layar berikutnya.",
  emailPrefilled: "Key lisensi akan dikirim ke email akun kamu.",
  errEmailRequired: "Masukkan email kamu untuk key lisensi.",
  errQrisFailed: "Gagal membuat pembayaran QRIS — coba lagi.",
  submitting: "Mengirim…",
  // QRIS waiting screen
  waitPayment: "Menunggu pembayaran",
  qrisWaitSub: "Scan QR di bawah dengan aplikasi bank kamu. Pembayaran diverifikasi otomatis setiap 3 detik.",
  payNow: "Bayar sekarang",
  qrExpiresIn: "QR kedaluwarsa dalam",
  orderSn: "Nomor pesanan",
  planRow: "Paket",
  paidTitle: "Pembayaran diterima!",
  checkYourEmail: "Cek email kamu untuk key lisensi kamu.",
  keyActiveFor: "Key aktif untuk",
  redeemNow: "Tukar key sekarang",
  paymentExpired: "Pembayaran kedaluwarsa",
  paymentExpiredSub: "QR telah kedaluwarsa — buat pembayaran baru untuk melanjutkan.",
  // Manual (Robux / PayPal) flow
  manualGateTitle: "Perlu masuk",
  manualGateSub: "Pembayaran manual terhubung ke akun kamu agar key bisa dikirim.",
  registerBeforeProof: "Daftar atau masuk sebelum mengirim bukti.",
  onlyForManual: "Unggah bukti hanya untuk pembayaran manual (Robux & PayPal).",
  payWithGamepass: "Bayar dengan gamepass Roblox",
  gamepassNote: "Beli gamepass di dalam game, lalu unggah screenshot pembeliannya.",
  signedInAs: "Masuk sebagai",
  proofMaxHint: "Maks 2.5 MB",
  waitForReview: "Bukti terkirim!",
  waitForReviewSub: "Admin akan meninjau segera — biasanya beberapa menit sampai beberapa jam. Key lisensi dikirim email setelah disetujui.",
  goDashboard: "Ke dasbor",
  // Errors
  errInvalidPlan: "Paket tidak tersedia — muat ulang halaman dan pilih lagi.",
  errInvalidProof: "Bukti harus gambar PNG, JPEG, atau WebP yang valid.",
  errProofTooLarge: "Gambar bukti terlalu besar (maks 2.5 MB).",
  errAlreadySubmitted: "Kamu sudah punya pembayaran menunggu — tunggu review.",
  errCaptchaRequired: "Selesaikan captcha dulu.",
  errEmailInvalid: "Masukkan alamat email yang valid.",
  errProofType: "Bukti harus gambar PNG, JPEG, atau WebP.",
  errProofSize: "Ukuran gambar bukti maksimal 2.5 MB.",
  errSelectProof: "Pilih gambar bukti yang valid dulu.",
  errSubmitFailed: "Gagal mengirim pembayaran",
  // Captcha step
  captchaStep: "Cek keamanan",
  captchaStepSub: "Menjaga toko tetap aman.",
  captchaDevOnly: "Captcha hanya aktif di build produksi.",
  // Auth panel
  authCreateAccount: "Buat Akun",
  authSignIn: "Masuk",
  authWelcomeBack: "Selamat Datang Kembali",
  authRegisterSub: "Daftar dulu, lalu dapatkan key lisensi kamu.",
  authLoginSub: "Masuk untuk mengakses lisensi, script, dan monitoring kamu.",
  authEmailLabel: "Email",
  authEmailOrUsername: "Email atau username",
  authLicenseKeyLabel: "Key lisensi",
  authRobloxUsername: "Username Roblox (opsional)",
  authConfirmPassword: "Konfirmasi kata sandi",
  authTotp: "Kode 2FA (jika aktif)",
  authBusy: "Mohon tunggu...",
  authDiscord: "Lanjut dengan Discord",
  authSwitchLogin: "Sudah punya akun? Masuk",
  authSwitchRegister: "Butuh akun? Daftar",
  authRegisterNoKey: "Kamu bisa daftar tanpa key di sini — tambahkan nanti lewat Tukar.",
  errPasswordMismatch: "Kata sandi tidak sama.",
  errLicenseKeyShort: "Key lisensi minimal 8 karakter.",
  errCaptchaSubmit: "Selesaikan captcha, lalu kirim lagi.",
  authFailed: "Gagal autentikasi",
  authBadLicense: "Key lisensi salah atau tidak aktif.",
  authLicenseClaimed: "Key lisensi sudah dipakai akun lain.",
  authEmailNotVerified: "Email belum terverifikasi — cek inbox kamu.",
  authTotpLocked: "Terlalu banyak percobaan — coba lagi nanti.",
  // Redeem / register
  redeemKeyTooShort: "Masukkan key lengkap dari email kamu.",
  redeemKeyClaimed: "Key ini sudah dipakai akun lain. Hubungi support Discord untuk bantuan.",
  redeemKeyInvalid: "Key tidak valid atau tidak aktif.",
  redeemVerifyFailed: "Verifikasi gagal",
  redeemKeyValid: "Key valid! Sekarang daftar dengan key ini.",
  redeemRegisterNow: "Daftar sekarang",
  redeemBuyNew: "Beli key baru",
  checking: "Memeriksa…",
  redeemClaimFailed: "Gagal mengklaim lisensi ini",
  // Dashboard
  dashLoaderDesc: "Gunakan loader universal di bawah. Key dan sesi aktif kamu tetap terhubung ke akun ini.",
  liveBadge: "Live",
  noActivePlan: "Tidak ada paket aktif",
  noSessionYet: "Belum ada sesi",
  scriptSession: "Sesi script",
  noSessionsYet: "Belum ada sesi script.",
  noLicenseYet: "Belum ada lisensi",
  dashLicenseSub: "Key lisensi dan paket saat ini.",
  licValidationFailed: "Validasi lisensi gagal",
  monitoringAccess: "Akses monitoring",
  monCodeDesc: "Gunakan kode ini hanya di tab Monitoring script. Kode ini menghubungkan statistik ke akun ini dan tidak bisa memuat script atau mengakses lisensi kamu.",
  monNoCode: "Kode monitoring belum dibuat",
  monGenerate: "Buat kode",
  monCodeStatus: "Salin kode ini ke tab Monitoring di script kamu. Kode tetap sama sampai kamu menggantinya.",
  monCodeFailed: "Gagal membuat kode monitoring",
  scriptInstance: "Instansi script",
  statusLabel: "Status",
  elapsed: "Durasi",
  earnedLabel: "Diperoleh",
  lastSeen: "Terakhir terlihat",
  billingIntro: "Pesanan dan invoice kamu.",
  orderHistory: "Riwayat pesanan",
  order: "Pesanan",
  date: "Tanggal",
  item: "Item",
  total: "Total",
  status: "Status",
  supportIntro: "Kesulitan setup? Kami biasanya balas dalam beberapa jam.",
  discordTitle: "Discord",
  signingOut: "Keluar…",
  loginRequired: "Login diperlukan",
  customer: "pelanggan",
  closeMenu: "Tutup menu",
  // Admin
  adminTitle: "Monitoring admin",
  adminSub: "Pembayaran, build script, dan sesi Roblox langsung.",
  adminLoginRequired: "Login admin diperlukan",
  activeSessions: "Sesi aktif",
  queuedBuilds: "Build antre",
  scriptsLabel: "Script",
  pendingLabel: "Menunggu",
  approvalsTitle: "Persetujuan pembayaran",
  thUser: "Pengguna",
  thPlan: "Paket",
  thAmount: "Jumlah",
  thProof: "Bukti",
  thAction: "Aksi",
  noProof: "Tanpa bukti",
  approve: "Setujui",
  reject: "Tolak",
  working: "Memproses…",
  recentEventsTitle: "Event script terbaru",
  liveStatsTitle: "Statistik script langsung",
  thScript: "Script",
  thRoblox: "Roblox",
  thMoney: "Uang",
  thEarned: "Diperoleh",
  thPerHour: "/ jam",
  thLevel: "Level",
  thTask: "Tugas",
  thLastSeen: "Terakhir terlihat",
  approvedNotice: "Pembayaran disetujui.",
  licenseCreated: "Lisensi dibuat",
  rejectedNotice: "Pembayaran ditolak.",
  approveFailed: "Gagal menyetujui pembayaran",
  rejectFailed: "Gagal menolak pembayaran",
};


const dicts: Record<Lang, Dict> = { en, id };

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: keyof typeof en) => string;
  needsChoice: boolean;
  dismissChoice: () => void;
};

const I18nCtx = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [needsChoice, setNeedsChoice] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("nznt-lang") as Lang | null;
      if (stored === "en" || stored === "id") {
        setLangState(stored);
      } else {
        setNeedsChoice(true);
      }
    } catch {}
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem("nznt-lang", l); } catch {}
    setNeedsChoice(false);
  };

  const t = (k: keyof typeof en) => dicts[lang][k] ?? en[k] ?? String(k);
  const dismissChoice = () => setNeedsChoice(false);

  return (
    <I18nCtx.Provider value={{ lang, setLang, t, needsChoice, dismissChoice }}>
      {children}
    </I18nCtx.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

const AUTH_ERROR_KEYS: Record<string, string> = {
  CAPTCHA_REQUIRED: "errCaptchaSubmit",
  BAD_LICENSE: "authBadLicense",
  LICENSE_CLAIMED: "authLicenseClaimed",
  EMAIL_NOT_VERIFIED: "authEmailNotVerified",
  TOTP_LOCKED: "authTotpLocked",
};

export function authErrorKey(code: string): string {
  return AUTH_ERROR_KEYS[code] ?? "";
}

export function LanguageModal() {
  const { needsChoice, setLang } = useI18n();
  if (!needsChoice) return null;
  return (
    <div className="anim-backdrop-in fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="anim-pop anim-visible w-full max-w-md rounded-2xl border border-white/10 bg-[#141414] p-8 shadow-2xl">
        <h2 className="text-center text-2xl font-extrabold tracking-tight text-foreground">
          Where are you from? / Kamu dari mana?
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          We'll set the page language for you.
        </p>
        <div className="mt-6 grid gap-3">
          <button
            onClick={() => setLang("en")}
            className="group flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-5 py-4 text-left transition hover:border-white/30 hover:bg-white/[0.05]"
          >
            <div>
              <div className="text-base font-bold text-foreground">🌍 International</div>
              <div className="text-xs text-muted-foreground">English</div>
            </div>
            <span className="text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground">→</span>
          </button>
          <button
            onClick={() => setLang("id")}
            className="group flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-5 py-4 text-left transition hover:border-white/30 hover:bg-white/[0.05]"
          >
            <div>
              <div className="text-base font-bold text-foreground">🇮🇩 Indonesia</div>
              <div className="text-xs text-muted-foreground">Bahasa Indonesia</div>
            </div>
            <span className="text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
