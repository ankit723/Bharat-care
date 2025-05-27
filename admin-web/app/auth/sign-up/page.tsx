'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Manually define Specialization enum values for the frontend
// Ideally, this would be auto-generated or imported if setup allows
const specializationEnum = [
  "CARDIOLOGY", "PEDIATRICS", "GYNECOLOGY", "ORTHOPEDICS", "SURGERY",
  "DERMATOLOGY", "NEUROLOGY", "ONCOLOGY", "ENDOCRINOLOGY",
  "GASTROENTEROLOGY", "HEMATOLOGY", "INFECTIOUS_DISEASES"
];

const SignUpPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    addressLine: '',
    city: '',
    state: '',
    pin: '',
    country: '',
    password: '',
    confirmPassword: '',
    role: '',
    specialization: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  const handleRoleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      role: value,
      specialization: ''
    }));
  };

  const handleSpecializationChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      specialization: value
    }));
  };

  const handleSignUp = async () => {
    setIsLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.role === 'DOCTOR' && !formData.specialization) {
      setError('Please select a specialization for the doctor role.');
      setIsLoading(false);
      return;
    }

    const { confirmPassword, ...submissionData } = formData;
    if (submissionData.role !== 'DOCTOR') {
      delete (submissionData as any).specialization;
    } else if (submissionData.specialization === '') {
      // This case should ideally be caught by the check above, but as a safeguard
      setError('Specialization is required for doctors.');
      setIsLoading(false);
      return;
    }

    try {
      const {isAuthSuccess} = await signUp(submissionData);
      if(isAuthSuccess){
        router.push('/dashboard');
      }else{
        setError('Sign up failed. Please check your details and try again.');
      }
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred during sign up.');
    } finally {
        setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f1f5f9] to-[#e2e8f0] py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl">
        <div className="absolute top-0 left-0 right-0 h-20 bg-primary shadow-md"></div>
        <div className="text-center mb-8 relative z-10 mt-24">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">
            Create Your Account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join our healthcare platform
          </p>
        </div>
        
        <Card className="border-0 shadow-xl overflow-hidden">
          <CardContent className="p-8 space-y-6">
            {error && <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-md">{error}</p>}
            <div className="w-full grid grid-cols-1 md:grid-cols-2 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
              <Label htmlFor="role" className="text-sm font-medium">
                I am a
              </Label>
              <Select value={formData.role} onValueChange={handleRoleChange}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DOCTOR">Doctor</SelectItem>
                  <SelectItem value="CHECKUP_CENTER">Checkup Center</SelectItem>
                  <SelectItem value="MEDSTORE">Medicine Store</SelectItem>
                </SelectContent>
              </Select>
              </div>
            

              {formData.role === 'DOCTOR' && (
                <div className="space-y-2">
                  <Label htmlFor="specialization" className="text-sm font-medium">
                    Specialization <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.specialization} onValueChange={handleSpecializationChange}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select specialization" />
                    </SelectTrigger>
                    <SelectContent>
                      {specializationEnum.map(spec => (
                        <SelectItem key={spec} value={spec}>
                          {spec.charAt(0).toUpperCase() + spec.slice(1).toLowerCase().replace(/_/g, ' ' )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Full Name / Organization Name
                </Label>
                <Input 
                  id="name" 
                  placeholder="John Doe / City Hospital"
                  required 
                  className="h-11 ring-[oklch(0.723_0.219_149.579)] focus-visible:ring-[oklch(0.723_0.219_149.579)]"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              
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
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Phone Number
                </Label>
                <Input 
                  id="phone" 
                  type="tel" 
                  placeholder="+91 XXXXXXXXXX" 
                  required 
                  className="h-11 ring-[oklch(0.723_0.219_149.579)] focus-visible:ring-[oklch(0.723_0.219_149.579)]"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="addressLine" className="text-sm font-medium">
                  Address Line
                </Label>
                <Input 
                  id="addressLine" 
                  placeholder="123 Main St" 
                  required 
                  className="h-11 ring-[oklch(0.723_0.219_149.579)] focus-visible:ring-[oklch(0.723_0.219_149.579)]"
                  value={formData.addressLine}
                  onChange={(e) => setFormData({ ...formData, addressLine: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm font-medium">
                  City
                </Label>
                <Input 
                  id="city" 
                  placeholder="Mumbai" 
                  required 
                  className="h-11 ring-[oklch(0.723_0.219_149.579)] focus-visible:ring-[oklch(0.723_0.219_149.579)]"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="state" className="text-sm font-medium">
                  State
                </Label>
                <Input 
                  id="state" 
                  placeholder="Maharashtra" 
                  required 
                  className="h-11 ring-[oklch(0.723_0.219_149.579)] focus-visible:ring-[oklch(0.723_0.219_149.579)]"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="pin" className="text-sm font-medium">
                  PIN Code
                </Label>
                <Input 
                  id="pin" 
                  placeholder="400001" 
                  required 
                  className="h-11 ring-[oklch(0.723_0.219_149.579)] focus-visible:ring-[oklch(0.723_0.219_149.579)]"
                  value={formData.pin}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="country" className="text-sm font-medium">
                Country
              </Label>
              <Input 
                id="country" 
                placeholder="India" 
                required 
                className="h-11 ring-[oklch(0.723_0.219_149.579)] focus-visible:ring-[oklch(0.723_0.219_149.579)]"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  className="h-11 ring-[oklch(0.723_0.219_149.579)] focus-visible:ring-[oklch(0.723_0.219_149.579)]"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm Password
                </Label>
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  required 
                  className="h-11 ring-[oklch(0.723_0.219_149.579)] focus-visible:ring-[oklch(0.723_0.219_149.579)]"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="px-8 pb-8 pt-0">
            <Button 
              className="w-full h-11 bg-primary hover:bg-primary/80"
              onClick={handleSignUp}
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </CardFooter>
        </Card>
        
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-medium text-primary hover:text-primary/80">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;