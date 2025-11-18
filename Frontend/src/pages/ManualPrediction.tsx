import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { apiService } from "@/services/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function ManualPrediction() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    prediction: string;
    probability: number;
    threshold_used: number;
  } | null>(null);
  
  // Form state - 30 features: Time, V1-V28, Amount
  const [time, setTime] = useState("");
  const [amount, setAmount] = useState("");
  const [vFeatures, setVFeatures] = useState<number[]>(Array(28).fill(0));

  const handleVFeatureChange = (index: number, value: string) => {
    const newVFeatures = [...vFeatures];
    newVFeatures[index] = parseFloat(value) || 0;
    setVFeatures(newVFeatures);
  };

  const handlePredict = async () => {
    // Validate inputs
    if (!time || !amount) {
      toast.error("Please fill in Time and Amount fields");
      return;
    }

    // Build features array: [Time, V1, V2, ..., V28, Amount]
    const features = [
      parseFloat(time),
      ...vFeatures,
      parseFloat(amount)
    ];

    if (features.length !== 30) {
      toast.error("Invalid feature count");
      return;
    }

    // Check for NaN values
    if (features.some(isNaN)) {
      toast.error("Please enter valid numeric values for all fields");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await apiService.predictTransaction(features);
      setResult({
        prediction: response.prediction,
        probability: response.probability,
        threshold_used: response.threshold_used,
      });
      toast.success("Prediction completed!");
    } catch (error: any) {
      console.error("Prediction error:", error);
      toast.error(error.response?.data?.detail || error.message || "Failed to make prediction");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setTime("");
    setAmount("");
    setVFeatures(Array(28).fill(0));
    setResult(null);
  };

  const isFraudulent = result?.prediction === "Fraudulent";
  // Probability is already in percentage (0-100) from API
  const riskPercentage = result ? result.probability.toFixed(2) : "0";
  const riskLevel = result ? (result.probability >= 70 ? "High" : result.probability >= 50 ? "Medium" : "Low") : "N/A";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container px-4 py-8 max-w-6xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Manual Transaction Prediction</h1>
            <p className="text-muted-foreground">
              Enter transaction features to predict fraud risk
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Form */}
            <Card>
              <CardHeader>
                <CardTitle>Transaction Features</CardTitle>
                <CardDescription>
                  Enter the transaction data (30 features total)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Time and Amount */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="number"
                      step="any"
                      placeholder="0.0"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                </div>

                {/* V Features (V1-V28) */}
                <div className="space-y-2">
                  <Label>V Features (V1 - V28)</Label>
                  <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto p-2 border rounded-md">
                    {vFeatures.map((value, index) => (
                      <div key={index} className="space-y-1">
                        <Label htmlFor={`v${index + 1}`} className="text-xs">
                          V{index + 1}
                        </Label>
                        <Input
                          id={`v${index + 1}`}
                          type="number"
                          step="any"
                          placeholder="0.0"
                          value={value}
                          onChange={(e) => handleVFeatureChange(index, e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={handlePredict}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Predicting...
                      </>
                    ) : (
                      "Predict Fraud Risk"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    disabled={loading}
                  >
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Result Card */}
            <Card>
              <CardHeader>
                <CardTitle>Prediction Result</CardTitle>
                <CardDescription>
                  Fraud detection analysis results
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!result ? (
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <AlertTriangle className="h-12 w-12 mb-4 opacity-50" />
                    <p>Enter transaction features and click "Predict Fraud Risk"</p>
                  </div>
                ) : (
                  <>
                    {/* Prediction Status */}
                    <Alert variant={isFraudulent ? "destructive" : "default"}>
                      <div className="flex items-start gap-3">
                        {isFraudulent ? (
                          <AlertTriangle className="h-5 w-5 mt-0.5" />
                        ) : (
                          <CheckCircle className="h-5 w-5 mt-0.5 text-green-600" />
                        )}
                        <div className="flex-1">
                          <AlertDescription>
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">
                                Prediction: {result.prediction}
                              </span>
                              <Badge
                                variant={isFraudulent ? "destructive" : "default"}
                                className={!isFraudulent ? "bg-green-600" : ""}
                              >
                                {riskLevel} Risk
                              </Badge>
                            </div>
                          </AlertDescription>
                        </div>
                      </div>
                    </Alert>

                    {/* Risk Score */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Fraud Probability</Label>
                        <span className="text-2xl font-bold">
                          {riskPercentage}%
                        </span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            isFraudulent ? "bg-destructive" : "bg-green-600"
                          }`}
                          style={{ width: `${riskPercentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 p-4 bg-muted rounded-lg">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Threshold Used:</span>
                        <span className="font-medium">
                          {result.threshold_used.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Risk Level:</span>
                        <span className="font-medium">{riskLevel}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => navigate("/transactions")}
                      >
                        View Transaction History
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleReset}
                      >
                        New Prediction
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

