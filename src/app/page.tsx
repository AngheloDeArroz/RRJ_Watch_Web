
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Thermometer, Droplets, Cpu, Cloud, Menu, X } from "lucide-react";
import { ThemeToggleButton } from "@/components/ui/ThemeToggleButton";


export default function LandingPage() {
  const router = useRouter();
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const features = [
    {
      icon: <Clock className="w-10 h-10 text-primary mb-4" />,
      title: "Automated Feeding",
      description: "Set precise feeding schedules to ensure your fish are fed on time, every time. Our system handles the rest, giving you peace of mind.",
    },
    {
      icon: <Thermometer className="w-10 h-10 text-primary mb-4" />,
      title: "Real-Time Monitoring",
      description: "An array of IoT sensors constantly monitors crucial water parameters like temperature, pH, and turbidity through a live, intuitive dashboard.",
    },
    {
      icon: <Droplets className="w-10 h-10 text-primary mb-4" />,
      title: "Intelligent pH Balancing",
      description: "The system automatically detects and corrects pH imbalances by dispensing a balancing solution, maintaining the perfect water chemistry.",
    },
  ];
  
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-blue-100 dark:to-blue-900/20">
      <header className="py-4 sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between relative">
          <div className="flex items-center gap-3">
             <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex items-center gap-3 no-underline">
                 <Image
                  src="/images/logo.png"
                  alt="RRJ Watch Logo"
                  width={40}
                  height={40}
                  className="rounded-full"
                  data-ai-hint="company logo"
                />
                <h1 className="text-xl sm:text-2xl font-bold text-primary font-headline whitespace-nowrap">
                  RRJ Watch
                </h1>
              </a>
          </div>
          <nav className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="flex items-center space-x-6">
                <a href="#features" onClick={(e) => handleNavClick(e, 'features')} className="text-foreground hover:text-primary transition-colors text-sm sm:text-base">Features</a>
                <a href="#how-it-works" onClick={(e) => handleNavClick(e, 'how-it-works')} className="text-foreground hover:text-primary transition-colors text-sm sm:text-base">How It Works</a>
                <a href="#tech-stack" onClick={(e) => handleNavClick(e, 'tech-stack')} className="text-foreground hover:text-primary transition-colors text-sm sm:text-base">Technology</a>
                <a href="#contact" onClick={(e) => handleNavClick(e, 'contact')} className="text-foreground hover:text-primary transition-colors text-sm sm:text-base">Contact</a>
            </div>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggleButton />
            <div className="md:hidden flex items-center">
              <Button onClick={() => setIsMenuOpen(!isMenuOpen)} variant="ghost" size="icon">
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                <span className="sr-only">Toggle menu</span>
              </Button>
            </div>
          </div>
        </div>
        {isMenuOpen && (
            <div className="md:hidden mt-4">
                <nav className="flex flex-col items-center space-y-4">
                    <a href="#features" onClick={(e) => handleNavClick(e, 'features')} className="text-foreground hover:text-primary transition-colors">Features</a>
                    <a href="#how-it-works" onClick={(e) => handleNavClick(e, 'how-it-works')} className="text-foreground hover:text-primary transition-colors">How It Works</a>
                    <a href="#tech-stack" onClick={(e) => handleNavClick(e, 'tech-stack')} className="text-foreground hover:text-primary transition-colors">Technology</a>
                    <a href="#contact" onClick={(e) => handleNavClick(e, 'contact')} className="text-foreground hover:text-primary transition-colors">Contact</a>
                </nav>
            </div>
        )}
      </header>

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
        <div className="max-w-3xl mt-12 mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
            Intelligent Aquarium Automation
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-10">
           RRJ Watch connects your aquarium’s IoT devices to a cloud-based dashboard, enabling full automation of essential tasks such as feeding and pH balancing, while providing real-time monitoring to ensure a healthy and thriving aquatic ecosystem.
          </p>
           <Button onClick={() => router.push("/login")} size="lg" className="text-base lg:text-lg">
            Access Your Dashboard
          </Button>
        </div>

        <div id="features" className="w-full max-w-5xl mb-20 scroll-mt-24">
            <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-12">Key System Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
                <Card key={index} className="text-center shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
                    <CardHeader className="items-center">
                        {feature.icon}
                        <CardTitle className="text-lg sm:text-xl lg:text-2xl">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">{feature.description}</p>
                    </CardContent>
                </Card>
            ))}
            </div>
        </div>

        <div id="how-it-works" className="w-full max-w-5xl mb-20 scroll-mt-24">
          <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-12">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground mb-4 text-xl sm:text-2xl font-bold">1</div>
              <h4 className="text-lg lg:text-xl font-semibold mb-2">Data Collection</h4>
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">An IoT device with multiple sensors is placed in the aquarium to continuously capture live data on temperature, pH, and turbidity.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground mb-4 text-xl sm:text-2xl font-bold">2</div>
              <h4 className="text-lg lg:text-xl font-semibold mb-2">Cloud Sync</h4>
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">The data is securely transmitted to a Firebase backend in real-time, where it's stored and processed for historical analysis and live monitoring.</p>
            </div>
             <div className="flex flex-col items-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground mb-4 text-xl sm:text-2xl font-bold">3</div>
              <h4 className="text-lg lg:text-xl font-semibold mb-2">Monitor & Automate</h4>
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">Users can view live and historical data on the dashboard, configure schedules, and the system automatically triggers feeders or pH balancers based on set rules.</p>
            </div>
          </div>
        </div>

        <div id="tech-stack" className="w-full max-w-5xl mb-20 scroll-mt-24">
          <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-12">Technology Stack</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="text-center shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="items-center">
                    <Cpu className="w-10 h-10 text-primary mb-4" />
                    <CardTitle className="text-lg sm:text-xl lg:text-2xl">IoT & Hardware</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">A custom IoT device streams sensor data for a responsive and connected experience.</p>
                </CardContent>
            </Card>
            <Card className="text-center shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="items-center">
                    <Cloud className="w-10 h-10 text-primary mb-4" />
                    <CardTitle className="text-lg sm:text-xl lg:text-2xl">Next.js & Firebase</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm sm_text-base lg:text-lg text-muted-foreground">Built with Next.js for a fast frontend and Firebase for a scalable, real-time backend.</p>
                </CardContent>
            </Card>
          </div>
        </div>

      </main>

      <footer id="contact" className="py-6 border-t mt-auto bg-background/50 scroll-mt-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs sm:text-sm text-muted-foreground">
          <p>Contact RRJ Aquatique:</p>
          <p>Email: <a href="mailto:rrjaquatique@gmail.com" className="text-primary hover:underline">rrjaquatique@gmail.com</a> | Phone: (043) 784 2313</p>
          {currentYear && <p className="mt-2">&copy; {currentYear} RRJ Watch. All rights reserved.</p>}
        </div>
      </footer>
    </div>
  );
}
