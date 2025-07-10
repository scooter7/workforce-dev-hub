'use client'; // This directive marks this as a Client Component

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client'; // Using the client-side Supabase instance
import Button from '@/components/ui/Button'; // We'll create a generic Button component later
import Input from '@/components/ui/Input';   // We'll create a generic Input component later

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);


  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error('Sign in error:', signInError);
      setError(signInError.message || 'Could not authenticate user. Please check your credentials.');
      setIsLoading(false);
      return;
    }

    // On successful login, Supabase auth helper handles session and cookies.
    // The middleware and layouts/pages will then redirect if necessary.
    // We can also force a client-side navigation if desired for immediate UX feedback.
    // setMessage('Login successful! Redirecting...');

    // Option 1: Let the page/layout handle redirect after session update.
    // This is often cleaner as the server components will re-evaluate.
    router.refresh(); // This will re-run the server components on the current route,
                      // which includes the auth check in LoginPage that will redirect.

    // Option 2: Direct client-side redirect (can sometimes cause a flash if server also redirects)
    // router.push('/'); // Or your dashboard path

    // No need to setIsLoading(false) here if router.refresh() leads to unmount/redirect
    // but if there's a delay or no redirect, ensure it's set.
    // If staying on the page for a message:
    // setIsLoading(false);
  };

  return (
    <form onSubmit={handleLogin} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email address
        </label>
        <Input
          type="email"
          id="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="you@example.com"
          disabled={isLoading}
          className="mt-1" // Pass className for Input component to merge
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <Input
          type="password"
          id="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="••••••••"
          disabled={isLoading}
          className="mt-1"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md text-center">
          {error}
        </p>
      )}
      {message && (
          <p className="text-sm text-blue-600 bg-blue-100 p-3 rounded-md text-center">
            {message}
          </p>
        )}


      <div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Log In'}
        </Button>
      </div>
    </form>
  );
}