import { Header } from "@/components/Header"
import { Hero } from "@/components/Hero"
import { Features } from "@/components/Features"
import { Plans } from "@/components/Plans"
import { Footer } from "@/components/Footer"

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <Features />
      <Plans />
      <Footer />
    </div>
  );
};

export default Index;
