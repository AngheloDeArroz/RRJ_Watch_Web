
"use client";

import { useState, type FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { FirebaseError } from 'firebase/app';
import { Eye, EyeOff } from 'lucide-react';
import { ThemeToggleButton } from '@/components/ui/ThemeToggleButton';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const getFirebaseAuthErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please try again.';
      case 'auth/invalid-email':
        return 'The email address is not valid.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await login(auth, email, password);
      toast({ title: "Login Successful", description: "Redirecting to your dashboard..." });
      router.push('/dashboard');
    } catch (err) {
      console.error("Authentication error:", err);
      let errorMessage = 'An unexpected error occurred.';
      if (err instanceof FirebaseError) {
        errorMessage = getFirebaseAuthErrorMessage(err.code);
      }
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-gradient-to-br from-background to-blue-100 p-4">
       <Card className="w-full max-w-md shadow-2xl relative">
        <div className="absolute top-4 right-4">
          <ThemeToggleButton />
        </div>
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-4 mb-4">
            <Image
              src="/images/logo.png"
              alt="RRJ Watch Logo"
              width={96}
              height={96}
              className="rounded-full"
              data-ai-hint="company logo"
            />
             <div>
                <div className="flex items-center justify-center gap-2">
                    <CardTitle className="text-2xl font-bold text-primary font-headline">
                        Welcome Back!
                    </CardTitle>
                </div>
                <CardDescription>
                    Sign in to access your dashboard.
                </CardDescription>
             </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
            )}
            <Button type="submit" className="w-full text-base py-6" disabled={isLoading}>
              {isLoading ? 'Processing...' : 'Login'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-4 pt-4">
           <p className="text-xs text-muted-foreground">Forgot your credentials? Please contact the developer.</p>
           <Button 
              variant="link" 
              className="font-normal text-muted-foreground h-auto p-0 text-xs hover:text-primary" 
              onClick={() => router.push('/')}
            >
              Back to Landing Page
           </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
