import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Shield, TrendingUp, Zap, Eye } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface to-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm fixed top-0 left-0 right-0 z-50 bg-background/80">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">FraudDetectPro</span>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => navigate("/signin")}>
              Sign In
            </Button>
            <Button onClick={() => navigate("/signup")}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 pt-32 pb-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block mb-4 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
            <span className="text-sm font-semibold text-primary">AI-Powered Fraud Detection</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Protect Your Transactions with{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Explainable AI
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Real-time credit card fraud detection powered by machine learning. 
            See exactly why each transaction is flagged with transparent AI explanations.
          </p>
          
          {/* Stats */}
          <div className="flex justify-center mt-16 max-w-xl mx-auto">
            <div>
              <div className="text-3xl font-bold text-accent mb-1">&lt;100ms</div>
              <div className="text-sm text-muted-foreground">Response Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="p-6 rounded-lg bg-surface border border-border/50 hover:border-primary/50 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Real-Time Detection</h3>
            <p className="text-muted-foreground">
              Analyze transactions instantly with sub-100ms response times for immediate fraud prevention.
            </p>
          </div>

          <div className="p-6 rounded-lg bg-surface border border-border/50 hover:border-primary/50 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
              <Eye className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Explainable AI</h3>
            <p className="text-muted-foreground">
              Understand exactly why transactions are flagged with SHAP-based feature importance analysis.
            </p>
          </div>

          <div className="p-6 rounded-lg bg-surface border border-border/50 hover:border-primary/50 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-success" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Continuous Learning</h3>
            <p className="text-muted-foreground">
              Models improve over time with automated retraining on the latest transaction patterns.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
