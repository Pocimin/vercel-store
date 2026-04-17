"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Crown,
  Check,
  Upload,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const plans = [
  {
    id: "weekly",
    name: "Weekly",
    price: "Rp 10,000",
    priceUsd: "~$1",
    duration: "7 days",
    popular: false,
    robuxLink: "https://www.roblox.com/game-pass/859526812/Pink-soft",
  },
  {
    id: "monthly",
    name: "Monthly",
    price: "Rp 30,000",
    priceUsd: "~$3",
    duration: "30 days",
    popular: false,
    robuxLink: "https://www.roblox.com/game-pass/782821333/Megan",
  },
  {
    id: "lifetime",
    name: "Lifetime",
    price: "Rp 50,000",
    priceUsd: "~$4",
    duration: "Forever",
    popular: true,
    robuxLink: "https://www.roblox.com/game-pass/981419031/aku-butuh-duittt",
  },
];

const premiumFeatures = [
  "User-Friendly Interface",
  "Undetectable Autofarm (First to bypass anticheat)",
  "Fully Optimized (No lag)",
  "Fast Autofarm (20-30M/hour)",
  "Webhook Autofarm Integration",
  "Banwave Detection",
  "Auto Rejoin",
  "Updates faster than Free",
  "Works on all vehicles",
  "Beta and Stable option",
  "100% Safe on main account",
];

const whitelistFeatures = [
  "Unlimited HWID Changes",
  "No HWID Reset Cooldown",
  "Instant & Easy Execution",
  "Easy to use AIO panel",
];

type PaymentMethod = "qris" | "paypal" | "robux" | null;

export default function PremiumPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [username, setUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPlanData = plans.find((p) => p.id === selectedPlan);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProofFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !paymentMethod || !username) return;

    // For robux, proof is optional since they buy gamepass
    if (paymentMethod !== "robux" && !proofFile) {
      setError("Please upload payment proof");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("robloxUsername", username);
      formData.append("plan", selectedPlan);
      formData.append("paymentMethod", paymentMethod);
      if (proofFile) {
        formData.append("proof", proofFile);
      }

      const response = await fetch("/api/submit-payment", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to submit payment");
      }

      setSubmitted(true);
    } catch {
      setError("Failed to submit payment. Please try again or contact support.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-background py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="max-w-md mx-auto text-center"
          >
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Payment Submitted!</h1>
            <p className="text-muted-foreground mb-8">
              Your payment proof has been received. Please wait for verification
              (usually within 1-24 hours). You will receive your key via Discord
              DM.
            </p>
            <div className="flex flex-col gap-3">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button asChild className="w-full bg-accent hover:bg-accent/90">
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button asChild variant="outline" className="w-full">
                  <Link href="/">Back to Home</Link>
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 mb-4 mx-auto block">
            <Crown className="w-4 h-4 text-yellow-500" />
            <span className="text-sm text-yellow-500">Premium</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Upgrade to <span className="text-yellow-400">Premium</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Unlock all features and dominate Drag Drive Simulator
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Left: Plans & Payment */}
          <div className="space-y-8">
            {/* Plan Selection */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h2 className="text-xl font-semibold mb-4">1. Choose Your Plan</h2>
              <div className="grid gap-3">
                {plans.map((plan) => (
                  <motion.button
                    key={plan.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => {
                      setSelectedPlan(plan.id);
                      setPaymentMethod(null);
                    }}
                    className={`relative flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${
                      selectedPlan === plan.id
                        ? "border-yellow-500 bg-yellow-500/10"
                        : "border-border hover:border-yellow-500/50 bg-card"
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-2.5 left-4 px-2 py-0.5 bg-yellow-500 text-yellow-950 text-xs font-bold rounded">
                        BEST VALUE
                      </span>
                    )}
                    <div>
                      <p className="font-semibold">{plan.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {plan.duration}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-yellow-400">{plan.price}</p>
                      <p className="text-xs text-muted-foreground">
                        {plan.priceUsd}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Payment Method */}
            {selectedPlan && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <h2 className="text-xl font-semibold mb-4">
                  2. Payment Method
                </h2>
                <div className="grid grid-cols-3 gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setPaymentMethod("qris")}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === "qris"
                        ? "border-accent bg-accent/10"
                        : "border-border hover:border-accent/50 bg-card"
                    }`}
                  >
                    <p className="font-semibold text-sm">QRIS</p>
                    <p className="text-xs text-muted-foreground">Indonesia</p>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setPaymentMethod("paypal")}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === "paypal"
                        ? "border-accent bg-accent/10"
                        : "border-border hover:border-accent/50 bg-card"
                    }`}
                  >
                    <p className="font-semibold text-sm">PayPal</p>
                    <p className="text-xs text-muted-foreground">Global</p>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setPaymentMethod("robux")}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === "robux"
                        ? "border-accent bg-accent/10"
                        : "border-border hover:border-accent/50 bg-card"
                    }`}
                  >
                    <p className="font-semibold text-sm">Robux</p>
                    <p className="text-xs text-muted-foreground">Gamepass</p>
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Payment Instructions */}
            {paymentMethod && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <h2 className="text-xl font-semibold mb-4">3. Make Payment</h2>
                <Card className="border-border bg-card">
                  <CardContent className="p-6">
                    {paymentMethod === "qris" && (
                      <div className="text-center">
                        <img
                          src="/qris.png"
                          alt="QRIS Payment Code - nznt's hub"
                          className="w-64 h-auto mx-auto rounded-lg mb-4"
                        />
                        <p className="text-sm text-muted-foreground">
                          Scan with any e-wallet or mobile banking app
                        </p>
                      </div>
                    )}
                    {paymentMethod === "paypal" && (
                      <div className="text-center">
                        <p className="mb-4">Send payment to:</p>
                        <code className="px-4 py-2 bg-muted rounded-lg text-accent font-mono block mb-4">
                          reinard.omarr@gmail.com
                        </code>
                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg mb-4">
                          <div className="flex items-center gap-2 text-yellow-500 text-sm font-medium">
                            <AlertCircle className="w-4 h-4" />
                            Important: Send as Friends & Family only!
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Include your Roblox username in the note
                        </p>
                      </div>
                    )}
                    {paymentMethod === "robux" && selectedPlanData && (
                      <div className="text-center">
                        <p className="mb-4">Purchase the gamepass:</p>
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            asChild
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <a
                              href={selectedPlanData.robuxLink}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Open Gamepass ({selectedPlanData.name})
                            </a>
                          </Button>
                        </motion.div>
                        <p className="text-sm text-muted-foreground mt-4">
                          After purchase, upload a screenshot of your
                          transaction
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Upload Proof */}
            {paymentMethod && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <form onSubmit={handleSubmit}>
                  <h2 className="text-xl font-semibold mb-4">
                    4. Upload Payment Proof
                  </h2>
                  <Card className="border-border bg-card">
                    <CardContent className="p-6 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Roblox Username</Label>
                        <Input
                          id="username"
                          placeholder="Enter your Roblox username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="bg-muted border-border"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="proof">Payment Screenshot</Label>
                        <div className="relative">
                          <input
                            id="proof"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                          <label
                            htmlFor="proof"
                            className="flex items-center justify-center gap-2 w-full p-8 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-accent/50 transition-colors"
                          >
                            {proofFile ? (
                              <div className="text-center">
                                <Check className="w-8 h-8 text-green-500 mx-auto mb-2" />
                                <p className="text-sm text-foreground">
                                  {proofFile.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Click to change
                                </p>
                              </div>
                            ) : (
                              <div className="text-center">
                                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">
                                  Click to upload screenshot
                                </p>
                              </div>
                            )}
                          </label>
                        </div>
                      </div>
                      {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
                          {error}
                        </div>
                      )}
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <Button
                          type="submit"
                          disabled={!username || isSubmitting}
                          className="w-full bg-yellow-500 hover:bg-yellow-600 text-yellow-950 font-bold"
                        >
                          {isSubmitting
                            ? "Submitting..."
                            : "Submit Payment Proof"}
                        </Button>
                      </motion.div>
                    </CardContent>
                  </Card>
                </form>
              </motion.div>
            )}
          </div>

          {/* Right: Features */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="border-yellow-500/30 bg-gradient-to-b from-yellow-500/5 to-transparent sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  Premium Features
                </CardTitle>
                <CardDescription>
                  Everything included with your premium subscription
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-yellow-400 mb-3">
                    Script Features
                  </h4>
                  <ul className="space-y-2">
                    {premiumFeatures.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-yellow-500" />
                        </div>
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-accent mb-3">
                    Whitelist Features
                  </h4>
                  <ul className="space-y-2">
                    {whitelistFeatures.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-accent" />
                        </div>
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
