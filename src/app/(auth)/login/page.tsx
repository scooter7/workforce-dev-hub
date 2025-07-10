// src/app/(auth)/login/page.tsx
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';
import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';

export const metadata = {
  title: `Login - ${APP_NAME}`,
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    return redirect('/'); 
  }

  const message = typeof searchParams?.message === 'string' ? searchParams.message : undefined;
  const error = typeof searchParams?.error === 'string' ? searchParams.error : undefined;

  return (
    <div 
      className="flex flex-col items-center justify-center w-full flex-1 px-4" // flex-1 to fill space in AuthLayout
      style={{
        backgroundImage: `url(/LifeRamp_LifeRamp.jpg)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Inner card for the form content */}
      <div className="w-full max-w-md p-8 space-y-6 bg-white/90 backdrop-blur-sm rounded-xl shadow-2xl my-auto">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-brand-primary">Welcome Back!</h1>
          <p className="mt-2 text-gray-700">Log in to access your dashboard.</p>
        </div>

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
          <p className="text-gray-700">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-medium text-brand-primary hover:underline">
              Sign up
            </Link>
          </p>
          <p className="mt-2 text-gray-700">
            <Link href="/forgot-password" className="font-medium text-brand-primary hover:underline">
              Forgot your password?
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}