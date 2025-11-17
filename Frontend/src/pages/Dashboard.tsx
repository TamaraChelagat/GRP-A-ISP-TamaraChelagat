import { Header } from "@/components/layout/Header";
import { StatCard } from "@/components/dashboard/StatCard";
import { TransactionTable, Transaction } from "@/components/dashboard/TransactionTable";
import { Activity, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiService } from "@/services/api";
import { API_CONFIG } from "@/config/api";

export default function Dashboard() {
  const navigate = useNavigate();
  type BackendTransaction = {
    transaction_id: string;
    amount: number;
    timestamp: string;
    risk_score: number;
    status: string;
  };
  type Stats = {
    total_predictions: number;
    fraud_detected: number;
    fraud_ratio: number;
    model_accuracy: number;
  };
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let initialLoad = true;
    const fetchData = async () => {
      if (initialLoad) setLoading(true);
      try {
        // Fetch stats using the API service (handles auth automatically)
        const statsData = await apiService.getStats();
        setStats(statsData);
        
        // Fetch transactions from API
        try {
          const transactionsData = await apiService.getTransactions();
          // Convert backend format to frontend format
          const formattedTransactions: Transaction[] = transactionsData.map((t: BackendTransaction) => ({
            id: t.transaction_id,
            amount: t.amount,
            time: new Date(t.timestamp).toLocaleString(),
            riskScore: t.risk_score,
            status: t.status.toLowerCase() as "flagged" | "review" | "clear"
          }));
          setTransactions(formattedTransactions);
        } catch (transError) {
          console.warn("Failed to fetch transactions:", transError);
          setTransactions([]);
        }
        
        setError(null);
      } catch (e: unknown) {
        console.error("Failed to fetch dashboard data:", e);
        if (e instanceof Error) {
          setError(e.message || "Failed to fetch data");
        } else {
          setError("Failed to fetch data");
        }
        // Set empty defaults on error
        setStats({
          total_predictions: 0,
          fraud_detected: 0,
          fraud_ratio: 0,
          model_accuracy: 0
        });
        setTransactions([]);
      } finally {
        setLoading(false);
        initialLoad = false;
      }
    };
    fetchData();
    const intervalId = setInterval(fetchData, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const handleViewDetails = (id: string) => {
    toast.info(`Viewing details for transaction ${id.slice(0, 12)}...`);
  };

  const handleFlag = (id: string) => {
    toast.warning(`Transaction ${id.slice(0, 12)}... flagged for review`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
            <div>
              <h2 className="text-xl font-semibold text-destructive">Error Loading Dashboard</h2>
              <p className="text-muted-foreground mt-2">{error}</p>
              <Button 
                onClick={() => window.location.reload()} 
                className="mt-4"
                variant="outline"
              >
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container px-4 py-8">
        {/* Hero Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Transactions"
            value={stats ? stats.total_predictions.toLocaleString() : "-"}
            trend={{ value: "", isPositive: true }}
            icon={<Activity className="h-6 w-6" />}
          />
          <StatCard
            title="Fraud Cases Detected"
            value={stats ? stats.fraud_detected.toLocaleString() : "-"}
            trend={{ value: "", isPositive: true }}
            icon={<AlertTriangle className="h-6 w-6" />}
          />
          <StatCard
            title="Fraud Ratio"
            value={stats ? `${stats.fraud_ratio.toFixed(3)}%` : "-"}
            trend={{ value: "", isPositive: true }}
            icon={<TrendingUp className="h-6 w-6" />}
          />
          <StatCard
            title="Model Accuracy"
            value={stats ? `${stats.model_accuracy.toFixed(1)}%` : "-"}
            trend={{ value: "", isPositive: true }}
            icon={<CheckCircle className="h-6 w-6" />}
          />
        </div>
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Transaction Feed */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Real-Time Transactions</h2>
                <p className="text-sm text-muted-foreground">Live feed of all payment activities</p>
              </div>
              <Button variant="outline">Export</Button>
            </div>
            <TransactionTable
              transactions={transactions}
              onViewDetails={handleViewDetails}
              onFlag={handleFlag}
            />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <p>Showing {transactions.length} of {stats ? stats.total_predictions.toLocaleString() : "-"} transactions</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="outline" size="sm">
                  Next
                </Button>
              </div>
            </div>
          </div>
          {/* Quick Insights */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Insights</h3>
              {/* High Risk Alert - Dynamic */}
              {(() => {
                const highRiskCount = transactions.filter(t => t.riskScore >= 85).length;
                if (highRiskCount > 0) {
                  return (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 mb-4">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm mb-1">High-Risk Alert</h4>
                          <p className="text-xs text-muted-foreground mb-3">
                            {highRiskCount} transaction{highRiskCount !== 1 ? 's' : ''} flagged with risk scores above 85%
                          </p>
                          <Button size="sm" variant="destructive" className="h-8">
                            Review Now
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
              {/* Trend Chart Placeholder */}
              <div className="rounded-lg border border-border bg-card p-6">
                <h4 className="font-semibold mb-4">Fraud Trend (30 Days)</h4>
                <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                  Chart visualization area
                </div>
              </div>
            </div>
            {/* Top High-Risk Transactions */}
            <div>
              <h4 className="font-semibold mb-4">Top High-Risk Today</h4>
              <div className="space-y-3">
                {transactions.filter((t) => t.riskScore > 70).length > 0 ? (
                  transactions
                    .filter((t) => t.riskScore > 70)
                    .slice(0, 3)
                    .map((t) => (
                      <div
                        key={t.id}
                        className="rounded-lg border-l-4 border-destructive bg-card p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-xs text-muted-foreground">
                            {t.id.slice(0, 12)}...
                          </span>
                          <span className="text-sm font-bold text-destructive">{t.riskScore.toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">${t.amount.toLocaleString()}</span>
                          <span className="text-xs text-muted-foreground">{t.time}</span>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="rounded-lg border border-border bg-card p-4 text-center text-sm text-muted-foreground">
                    No high-risk transactions found
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Quick Actions */}
        <div className="fixed bottom-8 right-8 flex flex-col gap-3">
          <Button 
            size="lg" 
            variant="hero" 
            className="shadow-glow-lg"
            onClick={() => navigate("/manual-prediction")}
          >
            + New Manual Prediction
          </Button>
        </div>
      </main>
    </div>
  );
}