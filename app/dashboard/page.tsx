"use client";

import { useState } from "react";
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

interface UserData {
  key: string;
  plan: string;
  expiresAt: string;
  hwid: string;
  robloxUsername: string;
}

export default function DashboardPage() {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [isValidKey, setIsValidKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [error, setError] = useState("");
  const [userData, setUserData] = useState<UserData | null>(null);

  const premiumScript = `loadstring(game:HttpGet("https://raw.githubusercontent.com/nznt/dds-hub/main/premium.lua"))()`;

  const handleCopyKey = () => {
    if (userData?.key) {
      navigator.clipboard.writeText(userData.key);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(premiumScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleValidateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsValidating(true);

    try {
      const response = await fetch("/api/validate-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key: keyInput }),
      });

      const data = await response.json();

      if (!response.ok || !data.valid) {
        setError(data.error || "Invalid key");
        setIsValidating(false);
        return;
      }

      setUserData(data.userData);
      setIsValidKey(true);
    } catch {
      setError("Failed to validate key. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleResetHWID = async () => {
    if (!userData?.key) return;
    
    setIsResetting(true);
    setError("");

    try {
      const response = await fetch("/api/reset-hwid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key: userData.key }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to reset HWID");
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

  const isLifetime = userData?.plan?.toLowerCase() === "lifetime";

  return (
    <main className="min-h-screen bg-background pt-20">
      <div className="container mx-auto px-4 py-12">
        {/* If not validated, show key input */}
        {!isValidKey ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-md mx-auto"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <Card className="border-border bg-card">
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
                  <Key className="w-8 h-8 text-yellow-500" />
                </div>
                <CardTitle>Enter Your Key</CardTitle>
                <CardDescription>
                  Enter your premium key to access the dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleValidateKey} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="key">Premium Key</Label>
                    <Input
                      id="key"
                      placeholder="Enter your key here..."
                      value={keyInput}
                      onChange={(e) => setKeyInput(e.target.value)}
                      className="bg-muted border-border font-mono"
                    />
                  </div>
                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}
                  <Button
                    type="submit"
                    disabled={isValidating || !keyInput.trim()}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-yellow-950 font-bold"
                  >
                    {isValidating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Validating...
                      </>
                    ) : (
                      "Validate Key"
                    )}
                  </Button>
                </form>
                <div className="mt-6 pt-6 border-t border-border text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Don&apos;t have a key?
                  </p>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/premium">Get Premium</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          /* Dashboard Content */
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
                Welcome, <span className="text-yellow-400">Premium</span> User
              </h1>
              <p className="text-muted-foreground">
                Manage your subscription and access your premium script
              </p>
            </motion.div>

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
                      <p className="font-semibold">{userData?.plan || "Unknown"}</p>
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
                      <p className="font-semibold">{userData?.expiresAt || "Unknown"}</p>
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
                    <code className="flex-1 px-4 py-3 bg-muted rounded-lg font-mono text-yellow-400 overflow-x-auto">
                      {userData?.key || "N/A"}
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
          </div>
        )}
      </div>
    </main>
  );
}
