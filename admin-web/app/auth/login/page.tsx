'use client'
import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); 
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      console.log(email, password);
      const {isAuthSuccess, user} = await login(email, password);
      if(isAuthSuccess){
        router.push('/dashboard');
      }else{
        setError('Login failed');
      }
    } catch (error) {
      setError('Login failed');
    } finally {
      setIsLoading(false);
    }
  };
            
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f1f5f9] to-[#e2e8f0] py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="absolute top-0 left-0 right-0 h-20 bg-primary shadow-md"></div>
        <div className="text-center mb-8 relative z-10 mt-24">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your account to continue
          </p>
        </div>
        
        <Card className="border-0 shadow-xl overflow-hidden">
          {error && <p className="text-red-500">{error}</p>}
          <CardContent className="p-8 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="you@example.com" 
                required 
                className="h-11 ring-[oklch(0.723_0.219_149.579)] focus-visible:ring-[oklch(0.723_0.219_149.579)]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
              </div>
              <Input 
                id="password" 
                type="password" 
                required 
                className="h-11 ring-[oklch(0.723_0.219_149.579)] focus-visible:ring-[oklch(0.723_0.219_149.579)]"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </CardContent>
          
          <CardFooter className="px-8 pb-8 pt-0">
            <Button 
              className="w-full h-11 bg-primary hover:bg-primary/80"
              onClick={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </CardFooter>
        </Card>
        
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/auth/sign-up" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;