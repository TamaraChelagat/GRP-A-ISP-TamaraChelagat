import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Info, TrendingUp, TrendingDown } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function ExplainabilityCenter() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container px-4 py-8">
        <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Explainability Center</h1>
        <p className="text-muted-foreground">Understand how our AI makes fraud detection decisions</p>
      </div>

      {/* SHAP Value Explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            SHAP Values
          </CardTitle>
          <CardDescription>
            Shapley Additive Explanations - Understanding Feature Importance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            SHAP values help explain the output of our machine learning model by showing how much 
            each feature contributed to the fraud prediction for a specific transaction.
          </p>
          
          <div className="space-y-3">
            <FeatureImportance 
              feature="Transaction Amount"
              impact={0.85}
              direction="increase"
              description="Higher amounts increase fraud risk"
            />
            <FeatureImportance 
              feature="Transaction Time"
              impact={0.62}
              direction="increase"
              description="Late night transactions are riskier"
            />
            <FeatureImportance 
              feature="Location Match"
              impact={0.45}
              direction="decrease"
              description="Matching location reduces risk"
            />
            <FeatureImportance 
              feature="Merchant Category"
              impact={0.38}
              direction="increase"
              description="High-risk merchant category"
            />
            <FeatureImportance 
              feature="Card Present"
              impact={0.28}
              direction="decrease"
              description="Physical card presence lowers risk"
            />
          </div>
        </CardContent>
      </Card>

      {/* Model Explanation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Model Architecture</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoItem label="Algorithm" value="XGBoost Classifier" />
            <InfoItem label="Training Data" value="10M+ transactions" />
            <InfoItem label="Features" value="47 dimensions" />
            <InfoItem label="Accuracy" value="99.2%" />
            <InfoItem label="F1 Score" value="0.94" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feature Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <CategoryItem category="Transaction Details" features={12} />
            <CategoryItem category="User Behavior" features={15} />
            <CategoryItem category="Location Data" features={8} />
            <CategoryItem category="Device Info" features={7} />
            <CategoryItem category="Merchant Data" features={5} />
          </CardContent>
        </Card>
      </div>

      {/* Interpretation Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            How to Interpret Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Badge className="bg-destructive mt-1">High Risk</Badge>
              <div>
                <p className="font-medium">Score: 70-100</p>
                <p className="text-sm text-muted-foreground">
                  Transaction exhibits multiple fraud indicators. Immediate review recommended.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge className="bg-warning mt-1">Medium Risk</Badge>
              <div>
                <p className="font-medium">Score: 40-69</p>
                <p className="text-sm text-muted-foreground">
                  Transaction shows some suspicious patterns. Monitor closely.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge className="bg-success mt-1">Low Risk</Badge>
              <div>
                <p className="font-medium">Score: 0-39</p>
                <p className="text-sm text-muted-foreground">
                  Transaction appears legitimate. Standard processing applies.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
        </div>
      </main>
    </div>
  );
}

const FeatureImportance = ({ 
  feature, 
  impact, 
  direction, 
  description 
}: { 
  feature: string; 
  impact: number; 
  direction: "increase" | "decrease";
  description: string;
}) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {direction === "increase" ? (
          <TrendingUp className="h-4 w-4 text-destructive" />
        ) : (
          <TrendingDown className="h-4 w-4 text-success" />
        )}
        <span className="font-medium">{feature}</span>
      </div>
      <span className="text-sm text-muted-foreground">{(impact * 100).toFixed(0)}%</span>
    </div>
    <Progress value={impact * 100} className="h-2" />
    <p className="text-xs text-muted-foreground">{description}</p>
  </div>
);

const InfoItem = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center py-2 border-b border-border last:border-0">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

const CategoryItem = ({ category, features }: { category: string; features: number }) => (
  <div className="flex justify-between items-center py-2">
    <span className="text-sm">{category}</span>
    <Badge variant="outline">{features} features</Badge>
  </div>
);
