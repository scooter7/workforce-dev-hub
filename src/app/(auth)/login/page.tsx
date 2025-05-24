import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm'; // We'll create this client component
import Link from 'next/link';

export const metadata = {
  title: 'Login',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    // If user is already logged in, redirect to dashboard
    return redirect('/'); // Or your main dashboard path e.g. /dashboard
  }

  const message = typeof searchParams?.message === 'string' ? searchParams.message : undefined;
  const error = typeof searchParams?.error === 'string' ? searchParams.error : undefined;


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-brand-primary">Welcome Back!</h1>
          <p className="mt-2 text-gray-600">Log in to access your dashboard.</p>
        </div>

        {/* LoginForm will be a client component to handle interactivity */}
        <LoginForm />

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
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-medium text-brand-primary hover:underline">
              Sign up
            </Link>
          </p>
          <p className="mt-2 text-gray-600">
            <Link href="/forgot-password" className="font-medium text-brand-primary hover:underline">
              Forgot your password?
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}