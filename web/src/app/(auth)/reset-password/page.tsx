'use client';
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Import UI components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Eye, EyeOff, CheckCircle, Key, AlertCircle } from 'lucide-react';

// Form schema with password confirmation
const resetPasswordSchema = z.object({
  password: z.string()
    .min(6, { message: 'Password must be at least 6 characters' })
    .max(50, { message: 'Password must be less than 50 characters' }),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage({ 
  params 
}: { 
  params: { token: string } 
}) {
  const router = useRouter();
  const resetToken = params.token;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tokenValidationDetails, setTokenValidationDetails] = useState<{
    tokenLength?: number;
    receivedToken?: string;
  }>({});

  // Log token details on component mount
  useEffect(() => {
    console.log('Reset Password Page Mounted');
    console.log('Received Reset Token:', resetToken);
    console.log('Reset Token Length:', resetToken?.length);

    // Additional validation logging
    setTokenValidationDetails({
      tokenLength: resetToken?.length,
      receivedToken: resetToken
    });
  }, [resetToken]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Submit Reset Password Request');
      console.log('Reset Token:', resetToken);
      console.log('Token Length:', resetToken.length);
      
      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/reset-password/${resetToken}`,
          { password: data.password }
        );
        
        console.log('Reset Password Response:', response.data);
        
        setSuccess(true);
        setLoading(false);
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } catch (err: any) {
        console.error('Reset Password Error:', {
          status: err.response?.status,
          data: err.response?.data,
          message: err.message,
          fullError: err
        });
        
        // More detailed error handling
        const errorMessage = err.response?.data?.message || 
          err.response?.data?.details?.message || 
          'Failed to reset password. The link may have expired.';
        
        setError(errorMessage);
        
        // If additional details are available, log them
        if (err.response?.data?.details) {
          setTokenValidationDetails(prev => ({
            ...prev,
            ...err.response.data.details
          }));
        }
        
        setLoading(false);
      }
    } catch (generalError) {
      console.error('General Submit Error:', generalError);
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  // If no token is provided, show an error
  if (!resetToken) {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-xl text-center text-destructive">Invalid Reset Link</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>
                  The password reset link is invalid or has expired. Please request a new one.
                </AlertDescription>
              </Alert>
              <div className="flex justify-center mt-4">
                <Button asChild>
                  <Link href="/forgot-password">Request New Reset Link</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <footer className="py-4 text-center text-sm text-muted-foreground border-t">
          <div className="container">
            © {new Date().getFullYear()} All rights reserved.
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex items-center justify-center py-12 px-4 bg-gradient-to-b from-primary/5 to-background">
        <Card className="w-full max-w-md shadow-lg border-muted">
          <CardHeader className="space-y-2 pb-6">
            <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-2">
              <Key className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">Create New Password</CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6 text-sm">
                <AlertCircle className="h-4 w-4 mr-2" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success ? (
              <div className="space-y-6">
                <Alert className="bg-green-50 border-green-200 text-green-800">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <AlertDescription>
                    Your password has been successfully reset! Redirecting to login...
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Rest of the form remains the same */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    New Password
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-10"
                      {...register('password')}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive mt-1">{errors.password.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-10"
                      {...register('confirmPassword')}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive mt-1">{errors.confirmPassword.message}</p>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full font-medium mt-6" 
                  disabled={loading}
                  size="lg"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
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