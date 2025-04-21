// components/ForgotPasswordPage.tsx
'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import Link from 'next/link';

// Import UI components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

// Form schema
const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resetInfo, setResetInfo] = useState<{resetUrl?: string, resetToken?: string} | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/forgot-password`,
        data
      );
      
      setSuccess(true);
      
      // In development mode, the API might return the reset URL for testing
      if (response.data.resetUrl || response.data.resetToken) {
        setResetInfo({
          resetUrl: response.data.resetUrl,
          resetToken: response.data.resetToken
        });
      }
      
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to process your request');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">

      
      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-12 px-4 bg-gradient-to-b from-primary/5 to-background">
        <Card className="w-full max-w-md shadow-lg border-muted">
          <CardHeader className="space-y-2 pb-6">
            <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-2">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">Reset Your Password</CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              Enter your email address and we'll send you a link to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6 text-sm">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success ? (
              <div className="space-y-6">
                <Alert className="bg-green-50 border-green-200 text-green-800">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <AlertDescription>
                    Reset link sent! Check your email for instructions to reset your password.
                  </AlertDescription>
                </Alert>
                
                {/* Only show in development mode for testing */}
                {resetInfo && process.env.NODE_ENV === 'development' && (
                  <div className="mt-6 p-4 border border-dashed rounded-md bg-amber-50 text-amber-800">
                    <h3 className="font-medium mb-2">Development Testing</h3>
                    <p className="text-xs mb-2">This information is only shown in development mode:</p>
                    {resetInfo.resetUrl && (
                      <div className="mb-2">
                        <p className="text-xs font-medium mb-1">Reset URL:</p>
                        <div className="text-xs bg-white p-2 rounded overflow-x-auto">
                          <Link href={resetInfo.resetUrl} className="text-blue-600 hover:underline break-all">
                            {resetInfo.resetUrl}
                          </Link>
                        </div>
                      </div>
                    )}
                    {resetInfo.resetToken && (
                      <div>
                        <p className="text-xs font-medium mb-1">Reset Token:</p>
                        <div className="text-xs bg-white p-2 rounded overflow-x-auto">
                          {resetInfo.resetToken}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex justify-center">
                  <Button asChild variant="outline">
                    <Link href="/login">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Login
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      className="pl-10"
                      {...register('email')}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full font-medium mt-6" 
                  disabled={loading}
                  size="lg"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>
                
                <div className="text-center mt-4">
                  <Button variant="link" asChild className="text-sm">
                    <Link href="/login">Back to Login</Link>
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
      
      {/* Footer */}
      <footer className="py-4 text-center text-sm text-muted-foreground border-t">
        <div className="container">
          © {new Date().getFullYear()} All rights reserved.
        </div>
      </footer>
    </div>
  );
}