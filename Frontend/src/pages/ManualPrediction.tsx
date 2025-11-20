import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle, Loader2, Upload, FileText, Download } from "lucide-react";
import { useState } from "react";
import { apiService, PredictionResponse } from "@/services/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface BatchPredictionResult {
  transactionId: number;
  prediction: string;
  probability: number;
  status: 'success' | 'error';
  errorMessage?: string;
}

export default function ManualPrediction() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    prediction: string;
    probability: number;
    threshold_used: number;
  } | null>(null);
  
  // CSV Upload state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<number[][]>([]);
  const [csvParsing, setCsvParsing] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchResults, setBatchResults] = useState<BatchPredictionResult[]>([]);
  const [showBatchResults, setShowBatchResults] = useState(false);
  
  // Form state - 30 features: Time, V1-V28, Amount
  const [time, setTime] = useState("");
  const [amount, setAmount] = useState("");
  const [vFeatures, setVFeatures] = useState<number[]>(Array(28).fill(0));

  const handleVFeatureChange = (index: number, value: string) => {
    const newVFeatures = [...vFeatures];
    newVFeatures[index] = parseFloat(value) || 0;
    setVFeatures(newVFeatures);
  };

  // CSV File Handling
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (fileExtension !== 'csv') {
      toast.error("Invalid file format! Please upload a CSV file (.csv extension only).");
      setCsvFile(null);
      setCsvData([]);
      return;
    }

    setCsvFile(file);
    setCsvData([]);
    setBatchResults([]);
    setShowBatchResults(false);
    setCsvParsing(true);

    // Read and parse CSV
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text || text.trim().length === 0) {
          toast.error("CSV file is empty.");
          setCsvFile(null);
          setCsvData([]);
          return;
        }

        // Handle different line endings (Windows \r\n, Unix \n, Mac \r)
        const lines = text.split(/\r?\n|\r/).filter(line => line.trim().length > 0);
        
        if (lines.length === 0) {
          toast.error("No data found in CSV file.");
          setCsvFile(null);
          setCsvData([]);
          return;
        }

        console.log(`CSV file has ${lines.length} lines`);
        
        // Parse CSV (improved parser)
        const parsedData: number[][] = [];
        let headerSkipped = false;
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          // Try to detect delimiter (comma, semicolon, or tab)
          let delimiter = ',';
          if (line.includes(';') && line.split(';').length > line.split(',').length) {
            delimiter = ';';
          } else if (line.includes('\t') && line.split('\t').length > line.split(',').length) {
            delimiter = '\t';
          }
          
          // Parse CSV line (handle quoted values)
          const values: string[] = [];
          let currentValue = '';
          let inQuotes = false;
          
          for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === delimiter && !inQuotes) {
              values.push(currentValue.trim());
              currentValue = '';
            } else {
              currentValue += char;
            }
          }
          values.push(currentValue.trim()); // Add last value
          
          // Convert to numbers
          const numericValues = values.map(v => {
            const cleaned = v.replace(/^"|"$/g, '').trim();
            const num = parseFloat(cleaned);
            return isNaN(num) ? 0 : num;
          });
          
          // Check if first row is a header (contains non-numeric values or has wrong column count)
          if (i === 0 && !headerSkipped) {
            const hasNonNumeric = values.some(v => {
              const cleaned = v.replace(/^"|"$/g, '').trim();
              return isNaN(parseFloat(cleaned)) && cleaned.length > 0;
            });
            
            if (hasNonNumeric || numericValues.length !== 30) {
              console.log(`Skipping header row (row 1): ${numericValues.length} columns, hasNonNumeric: ${hasNonNumeric}`);
              headerSkipped = true;
              continue;
            }
          }
          
          // Accept 30 columns (features only) or 31 columns (features + class label)
          if (numericValues.length === 30) {
            parsedData.push(numericValues);
          } else if (numericValues.length === 31) {
            // If 31 columns, drop the last one (Class label) and use first 30
            parsedData.push(numericValues.slice(0, 30));
            console.log(`Row ${i + 1}: Dropped Class column (31 columns -> 30 features)`);
          } else {
            console.warn(`Row ${i + 1} has ${numericValues.length} columns, expected 30 or 31. Values: ${values.slice(0, 5).join(', ')}...`);
            toast.warning(`Row ${i + 1} has ${numericValues.length} columns, expected 30 or 31. Skipping.`);
          }
        }
        
        console.log(`Parsed ${parsedData.length} valid transactions from ${lines.length} total lines`);
        
        if (parsedData.length === 0) {
          toast.error(
            `No valid transaction data found in CSV. ` +
            `Expected 30 numeric columns per row. ` +
            `Found ${lines.length} line(s). ` +
            `Please check your CSV format.`
          );
          setCsvFile(null);
          setCsvData([]);
          setCsvParsing(false);
          return;
        }
        
        setCsvData(parsedData);
        setCsvParsing(false);
        toast.success(`Successfully loaded ${parsedData.length} transaction(s) from CSV.`);
      } catch (error) {
        console.error("CSV parsing error:", error);
        toast.error(`Error reading CSV file: ${error instanceof Error ? error.message : 'Unknown error'}. Please check the format.`);
        setCsvFile(null);
        setCsvData([]);
        setCsvParsing(false);
      }
    };
    
    reader.onerror = () => {
      toast.error("Error reading file.");
      setCsvFile(null);
      setCsvData([]);
      setCsvParsing(false);
    };
    
    reader.onerror = () => {
      toast.error("Error reading file.");
      setCsvFile(null);
    };
    
    reader.readAsText(file);
  };

  // Batch Prediction
  const handleBatchPredict = async () => {
    if (csvData.length === 0) {
      toast.error("No CSV data to process.");
      return;
    }

    setBatchLoading(true);
    setBatchProgress(0);
    setBatchResults([]);
    setShowBatchResults(true);

    const results: BatchPredictionResult[] = [];
    let fraudCount = 0;
    let legitimateCount = 0;
    let errorCount = 0;

    for (let i = 0; i < csvData.length; i++) {
      const features = csvData[i];
      
      try {
        const response = await apiService.predictTransaction(features);
        results.push({
          transactionId: i + 1,
          prediction: response.prediction,
          probability: response.probability,
          status: 'success'
        });
        
        if (response.prediction === 'Fraudulent') {
          fraudCount++;
        } else {
          legitimateCount++;
        }
      } catch (error: unknown) {
        errorCount++;
        const errorMessage = error instanceof Error
          ? error.message
          : (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail
          || 'Unknown error';
        results.push({
          transactionId: i + 1,
          prediction: 'Error',
          probability: 0,
          status: 'error',
          errorMessage
        });
      }

      // Update progress
      const progress = ((i + 1) / csvData.length) * 100;
      setBatchProgress(progress);
    }

    setBatchResults(results);
    setBatchLoading(false);
    
    toast.success(
      `Batch prediction complete! Processed: ${csvData.length} transactions. ` +
      `Fraudulent: ${fraudCount}, Legitimate: ${legitimateCount}, Errors: ${errorCount}`
    );
  };

  // Download results as CSV
  const downloadResults = () => {
    if (batchResults.length === 0) return;

    const headers = ['Transaction_ID', 'Prediction', 'Probability', 'Status'];
    const rows = batchResults.map(r => [
      r.transactionId.toString(),
      r.prediction,
      r.status === 'success' ? `${r.probability.toFixed(2)}%` : 'N/A',
      r.status === 'error' ? r.errorMessage || 'Error' : 'Success'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fraud_predictions_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Results downloaded successfully!");
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
      } catch (error: unknown) {
        console.error("Prediction error:", error);
        const errorMessage = error instanceof Error 
          ? error.message 
          : (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail 
          || "Failed to make prediction";
        toast.error(errorMessage);
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

          {/* CSV Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload CSV File for Batch Prediction
              </CardTitle>
              <CardDescription>
                Upload a CSV file containing transactions. Each row should have 30 features: Time, V1-V28, Amount.
                Only CSV files are accepted.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                </div>
                {csvFile && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>{csvFile.name}</span>
                    {csvParsing ? (
                      <span className="text-xs flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Parsing...
                      </span>
                    ) : (
                      <span className="text-xs">({csvData.length} transactions)</span>
                    )}
                  </div>
                )}
              </div>

              {csvData.length > 0 && (
                <>
                  <Alert>
                    <AlertDescription>
                      ✅ CSV file loaded successfully! Found {csvData.length} transactions ready for prediction.
                    </AlertDescription>
                  </Alert>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleBatchPredict}
                      disabled={batchLoading}
                      className="flex-1"
                    >
                      {batchLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Predict All Transactions
                        </>
                      )}
                    </Button>
                    {batchResults.length > 0 && (
                      <Button
                        variant="outline"
                        onClick={downloadResults}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download Results
                      </Button>
                    )}
                  </div>

                  {batchLoading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Processing transactions...</span>
                        <span>{Math.round(batchProgress)}%</span>
                      </div>
                      <Progress value={batchProgress} />
                    </div>
                  )}

                  {showBatchResults && batchResults.length > 0 && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-4 gap-4">
                        <div className="p-4 bg-muted rounded-lg text-center">
                          <div className="text-2xl font-bold">{batchResults.length}</div>
                          <div className="text-sm text-muted-foreground">Total</div>
                        </div>
                        <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg text-center">
                          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                            {batchResults.filter(r => r.prediction === 'Fraudulent').length}
                          </div>
                          <div className="text-sm text-muted-foreground">Fraudulent</div>
                        </div>
                        <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg text-center">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {batchResults.filter(r => r.prediction === 'Legitimate').length}
                          </div>
                          <div className="text-sm text-muted-foreground">Legitimate</div>
                        </div>
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg text-center">
                          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                            {batchResults.filter(r => r.status === 'error').length}
                          </div>
                          <div className="text-sm text-muted-foreground">Errors</div>
                        </div>
                      </div>

                      <div className="border rounded-lg overflow-hidden">
                        <div className="max-h-96 overflow-y-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Prediction</TableHead>
                                <TableHead>Probability</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {batchResults.map((result) => (
                                <TableRow key={result.transactionId}>
                                  <TableCell>{result.transactionId}</TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={result.prediction === 'Fraudulent' ? 'destructive' : 'default'}
                                      className={result.prediction === 'Legitimate' ? 'bg-green-600' : ''}
                                    >
                                      {result.prediction}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    {result.status === 'success' ? `${result.probability.toFixed(2)}%` : 'N/A'}
                                  </TableCell>
                                  <TableCell>
                                    {result.status === 'error' ? (
                                      <span className="text-red-600 text-xs">
                                        {result.errorMessage?.substring(0, 50)}...
                                      </span>
                                    ) : (
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

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

