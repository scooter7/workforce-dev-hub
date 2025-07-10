'use client'; // This directive marks this as a Client Component

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation'; // useRouter might be used for refresh or if no email confirmation
import { supabase } from '@/lib/supabase/client'; // Client-side Supabase instance
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function RegisterForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password should be at least 6 characters.');
      return;
    }

    setIsLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName, // This data is stored in auth.users.raw_user_meta_data
          // You might want to add a default role or other initial data here
        },
        // Optional: specify a redirect URL for the email confirmation link
        // emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setIsLoading(false);

    if (signUpError) {
      console.error('Sign up error:', signUpError);
      setError(signUpError.message || 'Could not create account. Please try again.');
      return;
    }

    if (data.user && data.user.identities?.length === 0) {
       // This can happen if "Confirm email" is enabled and the user already exists but is not confirmed.
       // Supabase might return a user object but with an empty identities array.
      setError("This email may already be registered but not confirmed. Please check your email or try logging in.");
      return;
    }

    if (data.session) {
      // User is signed up and logged in (e.g., if "Confirm email" is disabled)
      setMessage('Account created successfully! Redirecting...');
      router.refresh(); // Refresh server components, which should redirect
      // router.push('/'); // Or directly navigate
    } else if (data.user) {
      // User is signed up but requires confirmation (e.g., "Confirm email" is enabled)
      setMessage(
        'Account created successfully! Please check your email to confirm your registration.'
      );
      // Clear form or offer to resend confirmation
      setFullName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } else {
      // Fallback, should ideally be covered by specific cases above
      setError('An unexpected issue occurred. Please try again.');
    }
  };

  return (
    <form onSubmit={handleRegister} className="space-y-4">
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
          Full Name
        </label>
        <Input
          type="text"
          id="fullName"
          name="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          placeholder="John Doe"
          disabled={isLoading}
          className="mt-1"
        />
      </div>
      <div>
        <label htmlFor="emailReg" className="block text-sm font-medium text-gray-700">
          Email address
        </label>
        <Input
          type="email"
          id="emailReg" // Different id from login form if they were on the same page (not the case here)
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="you@example.com"
          disabled={isLoading}
          className="mt-1"
        />
      </div>

      <div>
        <label htmlFor="passwordReg" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <Input
          type="password"
          id="passwordReg"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="•••••••• (min. 6 characters)"
          disabled={isLoading}
          className="mt-1"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          Confirm Password
        </label>
        <Input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
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
        <p className="text-sm text-green-600 bg-green-100 p-3 rounded-md text-center">
          {message}
        </p>
      )}

      <div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </Button>
      </div>
    </form>
  );
}