import { Header } from "@/components/layout/Header";
import { TransactionTable, Transaction } from "@/components/dashboard/TransactionTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Search, Download, Filter } from "lucide-react";
import { toast } from "sonner";

// Extended mock data
const mockTransactions: Transaction[] = [
  { id: "tx_1a2b3c4d5e6f7g8h", amount: 1250, time: "2m ago", riskScore: 85, status: "flagged" },
  { id: "tx_2b3c4d5e6f7g8h9i", amount: 450, time: "5m ago", riskScore: 32, status: "clear" },
  { id: "tx_3c4d5e6f7g8h9i0j", amount: 2890, time: "8m ago", riskScore: 68, status: "review" },
  { id: "tx_4d5e6f7g8h9i0j1k", amount: 175, time: "12m ago", riskScore: 15, status: "clear" },
  { id: "tx_5e6f7g8h9i0j1k2l", amount: 3420, time: "15m ago", riskScore: 92, status: "flagged" },
  { id: "tx_6f7g8h9i0j1k2l3m", amount: 680, time: "18m ago", riskScore: 48, status: "clear" },
  { id: "tx_7g8h9i0j1k2l3m4n", amount: 1560, time: "22m ago", riskScore: 73, status: "review" },
  { id: "tx_8h9i0j1k2l3m4n5o", amount: 290, time: "25m ago", riskScore: 28, status: "clear" },
  { id: "tx_9i0j1k2l3m4n5o6p", amount: 5200, time: "30m ago", riskScore: 95, status: "flagged" },
  { id: "tx_0j1k2l3m4n5o6p7q", amount: 125, time: "35m ago", riskScore: 18, status: "clear" },
];

export default function TransactionHistory() {
  const handleViewDetails = (id: string) => {
    toast.info(`Viewing details for transaction ${id.slice(0, 12)}...`);
  };

  const handleFlag = (id: string) => {
    toast.warning(`Transaction ${id.slice(0, 12)}... flagged for review`);
  };

  const handleExport = () => {
    toast.success("Transaction history exported successfully");
  };

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
            />
          </div>
          
          <Select defaultValue="all">
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
      <TransactionTable
        transactions={mockTransactions}
        onViewDetails={handleViewDetails}
        onFlag={handleFlag}
      />

      {/* Pagination */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Showing 1-10 of 284,807 transactions
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="outline" size="sm">1</Button>
          <Button variant="outline" size="sm">2</Button>
          <Button variant="outline" size="sm">3</Button>
          <span className="flex items-center px-2">...</span>
          <Button variant="outline" size="sm">28481</Button>
          <Button variant="outline" size="sm">
            Next
          </Button>
        </div>
        </div>
        </div>
      </main>
    </div>
  );
}
