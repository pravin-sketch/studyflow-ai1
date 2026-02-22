import { ArrowRight, Upload, Brain, MessageCircle, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HowItWorks = () => {
  const steps = [
    {
      icon: Upload,
      title: "Upload Study Material",
      description: "Share your textbooks, notes, or course materials with StudyFlow AI",
      color: "text-blue-500"
    },
    {
      icon: Brain,
      title: "AI Compiles Questions", 
      description: "Our AI analyzes content and generates personalized questions",
      color: "text-purple-500"
    },
    {
      icon: MessageCircle,
      title: "Say 'Go Ahead'",
      description: "Start your learning session with a simple command",
      color: "text-green-500"
    },
    {
      icon: Target,
      title: "Structured Learning Flow",
      description: "Independent concepts first, then grouped dependent topics",
      color: "text-orange-500"
    }
  ];

  return (
    <div className="min-h-screen pt-20 bg-background">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-background to-background-secondary">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              How StudyFlow AI Works
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Experience personalized learning powered by advanced AI technology
            </p>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-border to-transparent z-0">
                    <ArrowRight className="absolute -right-2 -top-2 w-4 h-4 text-border" />
                  </div>
                )}
                
                {/* Step Card */}
                <div className="glass-card p-6 text-center relative z-10 hover:shadow-lg transition-all duration-300 scale-hover">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-${step.color} to-${step.color}/20 flex items-center justify-center`}>
                    <step.icon className={`w-8 h-8 ${step.color}`} />
                  </div>
                  <div className="w-8 h-8 mx-auto mb-3 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Flow */}
      <section className="py-20 bg-card-gradient">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8">The Learning Flow</h2>
            <div className="space-y-8">
              <div className="glass-card p-8">
                <h3 className="text-xl font-semibold mb-4 text-accent">Independent Questions First</h3>
                <p className="text-muted-foreground">
                  StudyFlow AI identifies standalone concepts and teaches them first, 
                  building a solid foundation of knowledge before moving to complex topics.
                </p>
              </div>
              <div className="glass-card p-8">
                <h3 className="text-xl font-semibold mb-4 text-primary">Grouped Dependent Concepts</h3>
                <p className="text-muted-foreground">
                  Once fundamentals are mastered, our AI groups related concepts together,
                  showing connections and dependencies for deeper understanding.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Experience AI-Powered Learning?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of students who are accelerating their learning with StudyFlow AI
          </p>
          <Button variant="hero" size="lg" asChild>
            <Link to="/contact">Start Your Journey</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default HowItWorks;