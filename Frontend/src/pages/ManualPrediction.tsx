import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { useState } from "react";
import { apiService } from "@/services/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function ManualPrediction() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [formData, setFormData] = useState({
    time: "0.0",
    amount: "100.0",
    vFeatures: Array(28).fill("0.0")
  });

  const handleInputChange = (index: number, value: string) => {
    const newVFeatures = [...formData.vFeatures];
    newVFeatures[index] = value;
    setFormData({ ...formData, vFeatures: newVFeatures });
  };

  const generateSampleFeatures = (isFraud: boolean) => {
    if (isFraud) {
      // Fraud sample - higher amounts, more extreme V features
      setFormData({
        time: "50000.0",
        amount: "2500.0",
        vFeatures: Array(28).fill("0").map(() => (Math.random() * 6 - 3).toFixed(6))
      });
    } else {
      // Legitimate sample
      setFormData({
        time: "94813.86",
        amount: "88.35",
        vFeatures: Array(28).fill("0").map(() => (Math.random() * 2 - 1).toFixed(6))
      });
    }
  };

  const handlePredict = async () => {
    try {
      setLoading(true);
      setResult(null);

      // Build features array: [Time, V1-V28, Amount]
      const features = [
        parseFloat(formData.time) || 0,
        ...formData.vFeatures.map(v => parseFloat(v) || 0),
        parseFloat(formData.amount) || 0
      ];

      if (features.length !== 30) {
        toast.error("Invalid feature count. Expected 30 features.");
        return;
      }

      const prediction = await apiService.predictTransaction(features);
      setResult(prediction);
      toast.success("Prediction completed!");
    } catch (error: any) {
      console.error("Prediction error:", error);
      toast.error(error.message || "Failed to make prediction");
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevel = (probability: number) => {
    if (probability >= 0.7) return { level: "High", color: "destructive" };
    if (probability >= 0.5) return { level: "Medium", color: "warning" };
    return { level: "Low", color: "success" };
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Manual Fraud Prediction</h1>
            <p className="text-muted-foreground">Test fraud detection with custom transaction data</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Transaction Details</CardTitle>
                  <CardDescription>
                    Enter 30 features: Time, V1-V28 (PCA features), and Amount
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Time and Amount */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="time">Time (seconds)</Label>
                      <Input
                        id="time"
                        type="number"
                        step="0.01"
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        placeholder="0.0"
                      />
                      <p className="text-xs text-muted-foreground">Time elapsed since first transaction</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount ($)</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="100.0"
                      />
                      <p className="text-xs text-muted-foreground">Transaction amount</p>
                    </div>
                  </div>

                  {/* Quick Test Buttons */}
                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      onClick={() => generateSampleFeatures(false)}
                      className="flex-1"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Use Legitimate Sample
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => generateSampleFeatures(true)}
                      className="flex-1"
                    >
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      Use Fraud Sample
                    </Button>
                  </div>

                  {/* V Features */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>PCA Features (V1-V28)</Label>
                      <p className="text-xs text-muted-foreground">Dimensionality-reduced features</p>
                    </div>
                    <div className="grid grid-cols-4 md:grid-cols-7 gap-2 max-h-96 overflow-y-auto p-2 border rounded-lg">
                      {formData.vFeatures.map((value, index) => (
                        <div key={index} className="space-y-1">
                          <Label htmlFor={`v${index + 1}`} className="text-xs">
                            V{index + 1}
                          </Label>
                          <Input
                            id={`v${index + 1}`}
                            type="number"
                            step="0.000001"
                            value={value}
                            onChange={(e) => handleInputChange(index, e.target.value)}
                            className="h-8 text-xs"
                            placeholder="0.0"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handlePredict}
                    disabled={loading}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Predict Fraud Risk
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Results Panel */}
            <div className="space-y-6">
              {result && (
                <Card>
                  <CardHeader>
                    <CardTitle>Prediction Result</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center space-y-2">
                      {result.prediction === "Fraudulent" ? (
                        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-2" />
                          <h3 className="text-2xl font-bold text-destructive">FRAUDULENT</h3>
                          <p className="text-sm text-muted-foreground">High risk detected</p>
                        </div>
                      ) : (
                        <div className="p-4 rounded-lg bg-success/10 border border-success/30">
                          <CheckCircle className="h-12 w-12 text-success mx-auto mb-2" />
                          <h3 className="text-2xl font-bold text-success">LEGITIMATE</h3>
                          <p className="text-sm text-muted-foreground">Low risk</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Probability</span>
                        <span className="text-lg font-bold">
                          {(result.probability * 100).toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Risk Level</span>
                        <Badge 
                          variant={
                            getRiskLevel(result.probability).color === "destructive" ? "destructive" : 
                            getRiskLevel(result.probability).color === "warning" ? "warning" : 
                            "success"
                          }
                        >
                          {getRiskLevel(result.probability).level}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Threshold Used</span>
                        <span className="text-sm font-medium">
                          {(result.threshold_used * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Hybrid Features</span>
                        <span className="text-sm font-medium">{result.hybrid_feature_count}</span>
                      </div>
                    </div>

                    {/* Probability Gauge */}
                    <div className="pt-4 border-t">
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>0%</span>
                          <span>50%</span>
                          <span>100%</span>
                        </div>
                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              result.probability >= 0.7
                                ? "bg-destructive"
                                : result.probability >= 0.5
                                ? "bg-warning"
                                : "bg-success"
                            }`}
                            style={{ width: `${result.probability * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {!result && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center text-muted-foreground py-8">
                      <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Enter transaction details and click "Predict Fraud Risk" to see results</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

