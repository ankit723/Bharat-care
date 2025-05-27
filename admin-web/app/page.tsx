'use client';
import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import useAuth from '@/hooks/useAuth';

const HomePage = () => {
  const { user, isLoading } = useAuth();
  console.log(user, isLoading);
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="bg-primary/10 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
              BharatCare: Healthcare Management System
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              A comprehensive platform connecting doctors, hospitals, clinics, and patients for better healthcare management across India.
            </p>
            {isLoading || !user ?(

              <div className="flex flex-wrap gap-4">
              <Link href="/auth/login">
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  Login to Dashboard
                </Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button size="lg" variant="outline">
                  Register Now
                </Button>
              </Link>
            </div>
            ):(
              <div className="flex flex-wrap gap-4">
                <Link href="/dashboard">
                  <Button size="lg" className="bg-primary hover:bg-primary/90">
                    Go to Dashboard
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">How BharatCare Admin Works</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>For Doctors</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Manage your patients, clinics, and hospital affiliations. View and respond to reviews all in one place.</p>
            </CardContent>
            <CardFooter>
              <Link href="/auth/sign-up">
                <Button variant="outline">Register as Doctor</Button>
              </Link>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>For Hospitals</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Streamline hospital operations, manage doctors, and provide better patient care through integrated systems.</p>
            </CardContent>
            <CardFooter>
              <Link href="/auth/sign-up">
                <Button variant="outline">Register as Hospital</Button>
              </Link>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>For Patients</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Find doctors, book appointments, access medical records and manage healthcare needs efficiently.</p>
            </CardContent>
            <CardFooter>
              <Link href="/auth/sign-up">
                <Button variant="outline">Register as Patient</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="bg-primary/10 py-16 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to transform your healthcare experience?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of healthcare professionals and patients already using BharatCare.
          </p>
          <Link href="/auth/sign-up">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Get Started Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;

