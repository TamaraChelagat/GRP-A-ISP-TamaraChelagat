import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, Shield, Brain, Zap, AlertTriangle, HelpCircle } from "lucide-react";

export default function KnowledgeBase() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container px-4 py-8">
        <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Knowledge Base</h1>
        <p className="text-muted-foreground">Find answers and learn about fraud detection</p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search for answers..." 
              className="pl-10 h-12 text-lg"
            />
          </div>
        </CardContent>
      </Card>

      {/* Popular Topics */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Popular Topics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <TopicCard 
            icon={<Shield className="h-6 w-6" />}
            title="Getting Started"
            description="Learn the basics of fraud detection"
            articles={12}
          />
          <TopicCard 
            icon={<Brain className="h-6 w-6" />}
            title="AI & Machine Learning"
            description="Understand our detection algorithms"
            articles={8}
          />
          <TopicCard 
            icon={<Zap className="h-6 w-6" />}
            title="Best Practices"
            description="Tips for optimal fraud prevention"
            articles={15}
          />
          <TopicCard 
            icon={<AlertTriangle className="h-6 w-6" />}
            title="Risk Management"
            description="Handle alerts and flags effectively"
            articles={10}
          />
          <TopicCard 
            icon={<BookOpen className="h-6 w-6" />}
            title="API Documentation"
            description="Integration guides and examples"
            articles={20}
          />
          <TopicCard 
            icon={<HelpCircle className="h-6 w-6" />}
            title="Troubleshooting"
            description="Common issues and solutions"
            articles={18}
          />
        </div>
      </div>

      {/* FAQs */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
          <CardDescription>Quick answers to common questions</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>How does the fraud detection algorithm work?</AccordionTrigger>
              <AccordionContent>
                Our fraud detection system uses advanced machine learning algorithms, specifically XGBoost classifiers,
                trained on millions of transactions. It analyzes 47 different features including transaction amount,
                time, location, merchant category, and user behavior patterns to predict the likelihood of fraud in real-time.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>What is a SHAP value?</AccordionTrigger>
              <AccordionContent>
                SHAP (SHapley Additive exPlanations) values are a method to explain individual predictions of machine learning models.
                They show how much each feature contributed to the final fraud score for a specific transaction, making our AI
                decisions transparent and interpretable.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger>How accurate is the fraud detection?</AccordionTrigger>
              <AccordionContent>
                Our system maintains an accuracy rate of 99.2% with a very low false positive rate. This means legitimate
                transactions are rarely flagged incorrectly, while fraudulent ones are caught with high reliability. The model
                is continuously retrained with new data to maintain and improve this accuracy.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger>What should I do when a transaction is flagged?</AccordionTrigger>
              <AccordionContent>
                When a transaction is flagged, review the SHAP values and feature importance in the Explainability Center
                to understand why it was flagged. Contact the customer to verify the transaction if needed. You can mark
                it as legitimate or confirm it as fraud in the transaction details panel.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger>How often is the model updated?</AccordionTrigger>
              <AccordionContent>
                The fraud detection model is retrained weekly with new transaction data to adapt to evolving fraud patterns.
                Critical updates may be deployed more frequently if new fraud techniques are detected. You'll receive
                notifications about major model updates.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger>Can I integrate this with my existing payment system?</AccordionTrigger>
              <AccordionContent>
                Yes! FraudDetectPro provides a comprehensive REST API for easy integration with any payment system.
                Check our API Documentation section for detailed integration guides, code examples, and SDKs for
                popular programming languages.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7">
              <AccordionTrigger>What happens to flagged transactions?</AccordionTrigger>
              <AccordionContent>
                Flagged transactions are held for review and don't process automatically. They appear in your review queue
                where you can investigate them using our detailed analysis tools. You can then approve, reject, or request
                additional verification before allowing the transaction to proceed.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8">
              <AccordionTrigger>How do I reduce false positives?</AccordionTrigger>
              <AccordionContent>
                You can adjust the risk threshold in your settings to balance between fraud detection and false positives.
                Additionally, our system learns from your feedback - when you mark false positives, the model adapts to
                your specific business patterns over time, reducing future false alerts.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Contact Support */}
      <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
        <CardHeader>
          <CardTitle>Still need help?</CardTitle>
          <CardDescription>Our support team is here to assist you</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-2">Email Support</p>
            <p className="font-medium">support@frauddetectpro.com</p>
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-2">Live Chat</p>
            <p className="font-medium">Available 24/7</p>
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-2">Response Time</p>
            <p className="font-medium">Under 2 hours</p>
          </div>
        </CardContent>
      </Card>
        </div>
      </main>
    </div>
  );
}

const TopicCard = ({ 
  icon, 
  title, 
  description, 
  articles 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  articles: number;
}) => (
  <Card className="hover:shadow-glow transition-all duration-300 cursor-pointer group">
    <CardHeader>
      <div className="mb-2 text-primary group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <CardTitle className="text-lg">{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>
      <Badge variant="secondary">{articles} articles</Badge>
    </CardContent>
  </Card>
);
