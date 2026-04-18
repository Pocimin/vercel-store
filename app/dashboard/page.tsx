"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Clock,
  Copy,
  Crown,
  Infinity,
  Key,
  RefreshCw,
  Shield,
  Terminal,
  AlertCircle,
  Loader2,
  LogIn,
  Package,
  CreditCard,
  Clock3,
  Gift,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface UserLicense {
  key: string;
  plan: string;
  expiresAt: string | null;
}

interface Payment {
  id: string;
  plan: string;
  status: string;
  createdAt: string;
}

interface DashboardData {
  hasLicense: boolean;
  license?: UserLicense;
  pendingPayment?: Payment;
}

// Redeem Key Component
function RedeemKeyCard({ onRedeem }: { onRedeem: () => void }) {
  const [key, setKey] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState("");
  const [redeemSuccess, setRedeemSuccess] = useState(false);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;

    setIsRedeeming(true);
    setRedeemError("");

    try {
      const response = await fetch("/api/redeem-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: key.trim() }),
      });

      const result = await response.json();

      if (!response.ok) {
        setRedeemError(result.error || "Failed to redeem key");
        setIsRedeeming(false);
        return;
      }

      setRedeemSuccess(true);
      setTimeout(() => {
        onRedeem();
      }, 1500);
    } catch {
      setRedeemError("Failed to redeem key. Please try again.");
      setIsRedeeming(false);
    }
  };

  if (redeemSuccess) {
    return (
      <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
        <Check className="w-6 h-6 text-green-500 mx-auto mb-2" />
        <p className="text-green-400 font-medium">Key redeemed successfully!</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleRedeem} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="redeem-key" className="flex items-center gap-2">
          <Gift className="w-4 h-4" />
          Redeem Existing Key
        </Label>
        <Input
          id="redeem-key"
          placeholder="Enter your Vonalia key"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="bg-muted"
        />
        <p className="text-xs text-muted-foreground">
          Already have a key? Link it to your account
        </p>
      </div>
      {redeemError && (
        <div className="p-2 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
          {redeemError}
        </div>
      )}
      <Button
        type="submit"
        disabled={isRedeeming || !key.trim()}
        variant="outline"
        className="w-full"
      >
        {isRedeeming ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Redeeming...
          </>
        ) : (
          <>
            <Gift className="w-4 h-4 mr-2" />
            Redeem Key
          </>
        )}
      </Button>
    </form>
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";

  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const premiumScript = `loadstring(game:HttpGet("https://beta.vonalia.com/Obfuscate/nzntpremium"))()`;

  // Fetch dashboard data
  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/dashboard");
      if (response.ok) {
        const dashboardData = await response.json();
        setData(dashboardData);
      }
    } catch (e) {
      console.error("Failed to fetch dashboard data:", e);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleCopyKey = () => {
    if (data?.license?.key) {
      navigator.clipboard.writeText(data.license.key);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(premiumScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleResetHWID = async () => {
    if (!data?.license?.key) return;

    setIsResetting(true);
    setError("");

    try {
      const response = await fetch("/api/reset-hwid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key: data.license.key }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to reset HWID");
        setIsResetting(false);
        return;
      }

      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 3000);
    } catch {
      setError("Failed to reset HWID. Please try again.");
    } finally {
      setIsResetting(false);
    }
  };

  // Show loading state
  if (isLoading || isLoadingData) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-accent" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </main>
    );
  }

  // Show login required
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-background pt-20">
        <div className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto text-center"
          >
            <Card className="border-border bg-card">
              <CardHeader>
                <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
                  <LogIn className="w-8 h-8 text-accent" />
                </div>
                <CardTitle>Login Required</CardTitle>
                <CardDescription>
                  Please sign in to view your dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button asChild className="w-full bg-accent hover:bg-accent/90">
                  <Link href="/login?callbackUrl=/dashboard">Sign In</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/register">Create Account</Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    );
  }

  const isLifetime = data?.license?.plan?.toLowerCase() === "lifetime";

  return (
    <main className="min-h-screen bg-background pt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Back Link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          {/* Welcome */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-3xl font-bold mb-2">
              Welcome, <span className="text-accent">{session?.user?.username}</span>
            </h1>
            <p className="text-muted-foreground">
              Manage your account and premium access
            </p>
          </motion.div>

          {/* No License - Show options */}
          {!data?.hasLicense && !data?.pendingPayment && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="border-border bg-card">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
                    <Package className="w-8 h-8 text-yellow-500" />
                  </div>
                  <CardTitle>No Active License</CardTitle>
                  <CardDescription>
                    You don&apos;t have an active premium license yet
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button asChild className="w-full bg-yellow-500 hover:bg-yellow-600 text-yellow-950">
                    <Link href="/premium">Purchase Premium</Link>
                  </Button>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or</span>
                    </div>
                  </div>
                  <RedeemKeyCard onRedeem={() => window.location.reload()} />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Pending Payment */}
          {data?.pendingPayment && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="border-yellow-500/30 bg-yellow-500/5">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <Clock3 className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div>
                      <CardTitle>Payment Pending</CardTitle>
                      <CardDescription>
                        Your payment is awaiting admin approval
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Plan</span>
                      <Badge variant="secondary">{data.pendingPayment.plan}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant="outline" className="text-yellow-500 border-yellow-500">
                        ⏳ Pending
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Submitted</span>
                      <span>{new Date(data.pendingPayment.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    An admin will review your payment soon. You&apos;ll receive your key once approved.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Has License - Show Dashboard */}
          {data?.hasLicense && data?.license && (
            <>
              {/* Status Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="grid md:grid-cols-3 gap-4"
              >
                <Card className="border-border bg-card">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                        <Crown className="w-5 h-5 text-yellow-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Plan</p>
                        <p className="font-semibold capitalize">{data.license.plan}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border bg-card">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Expires</p>
                        <p className="font-semibold">
                          {data.license.expiresAt
                            ? new Date(data.license.expiresAt).toLocaleDateString()
                            : "Never (Lifetime)"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border bg-card">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">HWID Resets</p>
                        <div className="flex items-center gap-1">
                          <Infinity className="w-4 h-4 text-green-500" />
                          <span className="font-semibold text-green-500">
                            Unlimited
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Your Key */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="border-yellow-500/30 bg-gradient-to-r from-yellow-500/5 to-transparent">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="w-5 h-5 text-yellow-500" />
                      Your Premium Key
                    </CardTitle>
                    <CardDescription>
                      Keep this key safe. You&apos;ll need it to access your
                      premium features.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-4 py-3 bg-muted rounded-lg font-mono text-yellow-400 overflow-x-auto text-sm">
                        {data.license.key}
                      </code>
                      <Button
                        onClick={handleCopyKey}
                        variant="outline"
                        size="icon"
                      >
                        {copiedKey ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Premium Script */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card className="border-accent/30 bg-gradient-to-r from-accent/5 to-transparent">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Terminal className="w-5 h-5 text-accent" />
                      Premium Script
                    </CardTitle>
                    <CardDescription>
                      Copy and paste this into your executor. Enter your key when
                      prompted.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-accent/30 to-cyan-500/30 rounded-lg blur opacity-30 group-hover:opacity-50 transition-opacity" />
                      <div className="relative bg-muted rounded-lg p-4">
                        <code className="text-accent break-all font-mono text-sm">
                          {premiumScript}
                        </code>
                      </div>
                    </div>
                    <Button
                      onClick={handleCopyScript}
                      className="w-full mt-4 bg-accent hover:bg-accent/90 text-accent-foreground"
                    >
                      {copiedScript ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Script
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* HWID Reset */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <RefreshCw className="w-5 h-5" />
                      Reset HWID
                    </CardTitle>
                    <CardDescription>
                      Reset your hardware ID if you&apos;ve changed devices.
                      {isLifetime && " Unlimited resets, no cooldown!"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg mb-4">
                      <Infinity className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <p className="text-sm text-green-400">
                        Premium users have unlimited HWID resets with no cooldown!
                      </p>
                    </div>
                    {error && (
                      <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {error}
                      </div>
                    )}
                    <Button
                      onClick={handleResetHWID}
                      disabled={isResetting}
                      variant="outline"
                      className="w-full"
                    >
                      {isResetting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Resetting...
                        </>
                      ) : resetSuccess ? (
                        <>
                          <Check className="w-4 h-4 mr-2 text-green-500" />
                          HWID Reset Successfully!
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Reset HWID
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
