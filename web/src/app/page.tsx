'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './contexts/AuthContext';
import { Button } from './components/ui/button';
import Link from 'next/link';
import { BookOpen, BarChart2, ClipboardCheck, UserCheck } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // If user is authenticated, redirect to the appropriate dashboard
    if (!loading && user) {
      router.push(`/dashboard/${user.role.toLowerCase()}`);
    }
  }, [loading, user, router]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-sm py-4">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="text-xl font-bold">
            {/* logo */}
          </div>
          {!user ? (
            <Button asChild variant="secondary">
              <Link href="/login">Login</Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href={`/dashboard/${user.role.toLowerCase()}`}>Dashboard</Link>
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-primary/5 to-background">
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
              Education Management & Analytics Platform
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              An all-in-one solution for educational institutions to manage classes, track performance, and enhance learning outcomes.
            </p>
            <Button size="lg" asChild className="px-8 py-6 text-lg font-medium shadow-md hover:shadow-lg transition-shadow">
              <Link href="/login">Access Your Dashboard</Link>
            </Button>
          </div>
        </section>

        {/* Role Cards Section */}
        <section className="py-16 bg-background">
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">Tailored for Everyone</h2>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="bg-card p-8 rounded-xl shadow-sm border border-muted hover:shadow-md transition-shadow text-center">
                <div className="bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">For Administrators</h3>
                <p className="text-muted-foreground mb-6">
                  Get a comprehensive view of your institution's performance. Manage faculty, course allocation, and make data-driven decisions.
                </p>
                <div className="text-sm space-y-2 text-left mx-auto max-w-xs">
                  <div className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5"></div>
                    <span>Institution-wide analytics</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5"></div>
                    <span>Resource management</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5"></div>
                    <span>Faculty oversight</span>
                  </div>
                </div>
              </div>

              <div className="bg-card p-8 rounded-xl shadow-sm border border-muted hover:shadow-md transition-shadow text-center">
                <div className="bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                  <ClipboardCheck className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">For Teachers</h3>
                <p className="text-muted-foreground mb-6">
                  Streamline your teaching workflow. Create and grade assignments, track attendance, and monitor student progress effortlessly.
                </p>
                <div className="text-sm space-y-2 text-left mx-auto max-w-xs">
                  <div className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5"></div>
                    <span>Classroom management</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5"></div>
                    <span>Assignment creation</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5"></div>
                    <span>Performance insights</span>
                  </div>
                </div>
              </div>

              <div className="bg-card p-8 rounded-xl shadow-sm border border-muted hover:shadow-md transition-shadow text-center">
                <div className="bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                  <BarChart2 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">For Students</h3>
                <p className="text-muted-foreground mb-6">
                  Stay on top of your academic journey. Access assignments, check grades, and visualize your performance across subjects.
                </p>
                <div className="text-sm space-y-2 text-left mx-auto max-w-xs">
                  <div className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5"></div>
                    <span>Assignment tracking</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5"></div>
                    <span>Personal progress metrics</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5"></div>
                    <span>Due date management</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-muted/30">
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">Powerful Features</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="bg-background p-6 rounded-xl shadow-sm border border-border text-center hover:shadow-md transition-shadow">
                <div className="flex justify-center mb-4">
                  <UserCheck className="h-12 w-12 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-3">Smart Attendance</h3>
                <p className="text-sm text-muted-foreground">Track and analyze attendance patterns with automated insights and reporting.</p>
              </div>
              <div className="bg-background p-6 rounded-xl shadow-sm border border-border text-center hover:shadow-md transition-shadow">
                <div className="flex justify-center mb-4">
                  <BarChart2 className="h-12 w-12 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-3">Visual Analytics</h3>
                <p className="text-sm text-muted-foreground">Interactive charts and visualizations that make data interpretation intuitive.</p>
              </div>
              <div className="bg-background p-6 rounded-xl shadow-sm border border-border text-center hover:shadow-md transition-shadow">
                <div className="flex justify-center mb-4">
                  <ClipboardCheck className="h-12 w-12 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-3">Assignment Hub</h3>
                <p className="text-sm text-muted-foreground">Centralized platform for creating, distributing, and grading assignments.</p>
              </div>
              <div className="bg-background p-6 rounded-xl shadow-sm border border-border text-center hover:shadow-md transition-shadow">
                <div className="flex justify-center mb-4">
                  <BookOpen className="h-12 w-12 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-3">Course Management</h3>
                <p className="text-sm text-muted-foreground">Effortlessly organize courses, materials, and student enrollments.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary/5">
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Access your dashboard and unlock the full potential of our education management platform.
            </p>
            <Button size="lg" asChild className="font-medium">
              <Link href="/login">Login to Your Account</Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-muted py-8 border-t border-border">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Education Management Platform. All rights reserved.
            </div>
            <div className="flex gap-6 text-sm">
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">Help</Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}