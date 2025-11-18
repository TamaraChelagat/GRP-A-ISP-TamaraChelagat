import { Header } from "@/components/layout/Header";
import { TransactionTable, Transaction } from "@/components/dashboard/TransactionTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Search, Download, Filter } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { apiService, TransactionResponse } from "@/services/api";

export default function TransactionHistory() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const transactionsPerPage = 15;

  // Convert backend transaction to frontend Transaction format
  const convertTransaction = (backendTx: TransactionResponse): Transaction => {
    const date = new Date(backendTx.timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    let timeAgo = "";
    if (diffMins < 1) timeAgo = "Just now";
    else if (diffMins < 60) timeAgo = `${diffMins}m ago`;
    else if (diffMins < 1440) timeAgo = `${Math.floor(diffMins / 60)}h ago`;
    else timeAgo = `${Math.floor(diffMins / 1440)}d ago`;

    return {
      id: backendTx.id,
      amount: backendTx.amount,
      time: timeAgo,
      riskScore: backendTx.risk_score,
      status: backendTx.status as "clear" | "flagged" | "review",
    };
  };

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const transactionsData = await apiService.getTransactions();
        const convertedTransactions = transactionsData.map(convertTransaction);
        setTransactions(convertedTransactions);
        setError(null);
      } catch (e: unknown) {
        console.error("Failed to fetch transactions:", e);
        if (e instanceof Error) {
          setError(e.message || "Failed to fetch transactions");
        } else {
          setError("Failed to fetch transactions");
        }
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
    // Refresh every 5 seconds for real-time updates
    const intervalId = setInterval(fetchTransactions, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const handleViewDetails = (id: string) => {
    navigate(`/transactions/${id}`, { state: { from: "/transactions" } });
  };

  const handleFlag = (id: string) => {
    toast.warning(`Transaction ${id.slice(0, 12)}... flagged for review`);
  };

  const handleExport = () => {
    toast.success("Transaction history exported successfully");
  };

  // Filter transactions based on search and status
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (tx) =>
          tx.id.toLowerCase().includes(query) ||
          tx.amount.toString().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((tx) => tx.status === statusFilter);
    }

    return filtered;
  }, [transactions, searchQuery, statusFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);
  const startIndex = (currentPage - 1) * transactionsPerPage;
  const endIndex = startIndex + transactionsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container px-4 py-8">
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Transaction History</h1>
          <p className="text-muted-foreground">Complete history of all transactions</p>
        </div>
        <Button onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
          </div>

          {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by transaction ID or amount..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="clear">Clear</SelectItem>
              <SelectItem value="review">Under Review</SelectItem>
              <SelectItem value="flagged">Flagged</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="today">
            <SelectTrigger>
              <SelectValue placeholder="Time Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Advanced Filters:</span>
          <Button variant="ghost" size="sm">Amount Range</Button>
          <Button variant="ghost" size="sm">Risk Score</Button>
          <Button variant="ghost" size="sm">Location</Button>
        </div>
      </Card>

      {/* Transaction Table */}
      {loading ? (
        <Card className="p-8">
          <div className="text-center text-muted-foreground">Loading transactions...</div>
        </Card>
      ) : error ? (
        <Card className="p-8">
          <div className="text-center text-destructive">Error: {error}</div>
        </Card>
      ) : (
        <>
          <TransactionTable
            transactions={paginatedTransactions}
            onViewDetails={handleViewDetails}
            onFlag={handleFlag}
          />

          {/* Pagination */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {filteredTransactions.length > 0 ? (
                <>
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredTransactions.length)} of{" "}
                  {filteredTransactions.length} transactions
                  {filteredTransactions.length !== transactions.length &&
                    ` (filtered from ${transactions.length} total)`}
                </>
              ) : (
                "No transactions found"
              )}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-xs">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage >= totalPages || filteredTransactions.length === 0}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </>
      )}
        </div>
      </main>
    </div>
  );
}
