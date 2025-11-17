import { Eye, Flag, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RiskScore } from "./RiskScore";
import { toast } from "sonner";

export interface Transaction {
  id: string;
  amount: number;
  time: string;
  riskScore: number;
  status: "clear" | "flagged" | "review";
}

interface TransactionTableProps {
  transactions: Transaction[];
  onViewDetails?: (id: string) => void;
  onFlag?: (id: string) => void;
}

export function TransactionTable({ transactions, onViewDetails, onFlag }: TransactionTableProps) {
  const copyTransactionId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("Transaction ID copied");
  };

  const getStatusBadge = (status: Transaction["status"]) => {
    const variants = {
      clear: "clear" as const,
      flagged: "flagged" as const,
      review: "review" as const,
    };
    
    const labels = {
      clear: "Clear",
      flagged: "Flagged",
      review: "Under Review",
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Transaction ID
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Risk Score
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction, index) => (
              <tr
                key={transaction.id}
                className="border-b border-border hover:bg-muted/30 transition-colors animate-slide-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-foreground">
                      {transaction.id.slice(0, 12)}...
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => copyTransactionId(transaction.id)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </td>
                <td className="px-4 py-4 text-right font-semibold text-foreground">
                  ${transaction.amount.toLocaleString()}
                </td>
                <td className="px-4 py-4 text-sm text-muted-foreground">{transaction.time}</td>
                <td className="px-4 py-4">
                  <RiskScore score={transaction.riskScore} />
                </td>
                <td className="px-4 py-4">{getStatusBadge(transaction.status)}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => onViewDetails?.(transaction.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => onFlag?.(transaction.id)}
                    >
                      <Flag className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
