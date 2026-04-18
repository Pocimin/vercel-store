"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, Loader2, AlertCircle, RefreshCw } from "lucide-react";

interface Payment {
  id: string;
  userId: string;
  plan: string;
  paymentMethod: string;
  status: string;
  createdAt: string;
  discordMessageId?: string;
  paymentProofUrl?: string;
  user: {
    username: string;
    email: string;
  };
}

interface User {
  id: string;
  username: string;
  email: string;
  licenseKey: string | null;
  licenseType: string | null;
  licenseExpiresAt: string | null;
  createdAt: string;
}

function AdminPaymentsPage() {
  const searchParams = useSearchParams();
  const action = searchParams.get("action");
  const paymentId = searchParams.get("id");
  
  const [payments, setPayments] = useState<Payment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [result, setResult] = useState<{ type: string; message: string } | null>(null);

  const fetchPayments = async () => {
    try {
      const response = await fetch("/api/admin/payments");
      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments);
      } else {
        setError("Failed to load payments");
      }
    } catch (e) {
      setError("Failed to load payments");
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (e) {
      console.error("Failed to load users", e);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchUsers();
  }, []);

  // Handle URL action (approve/decline from webhook buttons)
  useEffect(() => {
    if (action && paymentId) {
      handleAction(action as "approve" | "decline", paymentId);
    }
  }, [action, paymentId]);

  const handleAction = async (action: "approve" | "decline", id: string) => {
    setProcessingId(id);
    setResult(null);

    try {
      const response = await fetch(`/api/admin/${action}-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: id }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          type: "success",
          message: action === "approve" ? "Payment approved!" : "Payment declined!",
        });
        // Refresh payments list
        fetchPayments();
      } else {
        setResult({
          type: "error",
          message: data.error || `Failed to ${action} payment`,
        });
      }
    } catch (e) {
      setResult({
        type: "error",
        message: `Failed to ${action} payment`,
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const pendingPayments = payments.filter((p) => p.status === "pending");

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Admin Panel</h1>
              <p className="text-muted-foreground">
                Manage payment requests
              </p>
            </div>
            <Button
              variant="outline"
              onClick={fetchPayments}
              disabled={loading}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {result && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 p-4 rounded-lg ${
                result.type === "success"
                  ? "bg-green-500/10 border border-green-500/30 text-green-500"
                  : "bg-red-500/10 border border-red-500/30 text-red-500"
              }`}
            >
              {result.message}
            </motion.div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              {error}
            </div>
          )}

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                Pending Payments ({pendingPayments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingPayments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pending payments
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="p-4 rounded-lg border border-border/50 bg-card/50"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold capitalize">
                              {payment.plan}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                              {payment.paymentMethod.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {payment.user?.email || "Unknown user"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ID: {payment.id}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-500 hover:bg-green-500/10"
                          onClick={() => handleAction("approve", payment.id)}
                          disabled={processingId === payment.id}
                        >
                          {processingId === payment.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-500 hover:bg-red-500/10"
                          onClick={() => handleAction("decline", payment.id)}
                          disabled={processingId === payment.id}
                        >
                          {processingId === payment.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                          Decline
                        </Button>
                      </div>
                    </div>
                    {payment.paymentProofUrl && (
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground mb-2">Payment Proof:</p>
                        <img
                          src={payment.paymentProofUrl}
                          alt="Payment proof"
                          className="max-w-full h-auto max-h-64 rounded-lg border border-border/50"
                        />
                      </div>
                    )}
                  </div>
                ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Users Section */}
          {users.length > 0 && (
            <Card className="border-border/50 mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-accent">
                  <span className="w-2 h-2 rounded-full bg-accent" />
                  Active Users with Licenses ({users.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="p-3 rounded-lg border border-border/30 text-sm"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold">{user.username}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${
                          user.licenseType === "lifetime"
                            ? "bg-purple-500/10 text-purple-500"
                            : user.licenseType === "monthly"
                            ? "bg-blue-500/10 text-blue-500"
                            : "bg-green-500/10 text-green-500"
                        }`}>
                          {user.licenseType || "unknown"}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-xs">{user.email}</p>
                      {user.licenseKey && (
                        <p className="text-muted-foreground text-xs mt-1 font-mono">
                          Key: {user.licenseKey.substring(0, 20)}...
                        </p>
                      )}
                      {user.licenseExpiresAt && (
                        <p className="text-muted-foreground text-xs mt-1">
                          Expires: {new Date(user.licenseExpiresAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {payments.length > pendingPayments.length && (
            <Card className="border-border/50 mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Processed Payments ({payments.length - pendingPayments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {payments
                    .filter((p) => p.status !== "pending")
                    .slice(0, 5)
                    .map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border/30 text-sm text-muted-foreground"
                      >
                        <span className="capitalize">{payment.plan}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs ${
                            payment.status === "approved"
                              ? "bg-green-500/10 text-green-500"
                              : "bg-red-500/10 text-red-500"
                          }`}
                        >
                          {payment.status}
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}

// Wrap in Suspense to prevent prerender issues with useSearchParams
export default function AdminPaymentsPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    }>
      <AdminPaymentsPage />
    </Suspense>
  );
}
