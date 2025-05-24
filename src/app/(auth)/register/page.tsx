import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import RegisterForm from '@/components/auth/RegisterForm'; // We'll create this client component
import Link from 'next/link';

export const metadata = {
  title: 'Create Account',
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    // If user is already logged in, redirect to dashboard
    return redirect('/'); // Or your main dashboard path
  }

  const message = typeof searchParams?.message === 'string' ? searchParams.message : undefined;
  const error = typeof searchParams?.error === 'string' ? searchParams.error : undefined;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
      {/* This outer div is similar to LoginPage; AuthLayout will provide main styling */}
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-brand-primary">Create Your Account</h1>
          <p className="mt-2 text-gray-600">Join us and start your development journey!</p>
        </div>

        {/* RegisterForm will be a client component */}
        <RegisterForm />

        {message && (
          <p className="mt-4 text-center text-sm text-blue-600 bg-blue-100 p-3 rounded-md">
            {message}
          </p>
        )}
        {error && (
          <p className="mt-4 text-center text-sm text-red-600 bg-red-100 p-3 rounded-md">
            {error}
          </p>
        )}

        <div className="mt-6 text-center text-sm">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-brand-primary hover:underline">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}