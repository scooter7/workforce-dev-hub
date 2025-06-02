// src/app/(auth)/register/page.tsx
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import RegisterForm from '@/components/auth/RegisterForm';
import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';

export const metadata = {
  title: `Create Account - ${APP_NAME}`,
};

export default async function RegisterPage({
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
        backgroundImage: `url(/LifeRamp_Assessment.jpg)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Inner card for the form content */}
      <div className="w-full max-w-md p-8 space-y-6 bg-white/90 backdrop-blur-sm rounded-xl shadow-2xl my-auto">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-brand-primary">Create Your Account</h1>
          <p className="mt-2 text-gray-700">Join the {APP_NAME} today!</p>
        </div>

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
          <p className="text-gray-700">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-brand-primary hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}