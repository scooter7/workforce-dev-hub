// scooter7/workforce-dev-hub/workforce-dev-hub-664dcb65bf6188fb247406ce2e6c515de2d28cc4/src/app/(dashboard)/coach-connect/page.tsx
import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Coach Connect',
  description: 'Learn about LifeRamp Coaching and schedule a session with a coach.',
};

export default function CoachConnectPage() {
  return (
    <div
      className="w-full min-h-full p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center"
      style={{
        backgroundImage: `url(https://liferamp360.com/wp-content/uploads/2023/03/Group-343.svg)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="max-w-2xl w-full bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-8 text-center flex flex-col items-center">
        <h1 className="text-3xl font-bold text-neutral-text mb-6">Learn about LifeRamp Coaching</h1>

        <div className="mb-4">
          <Image
            src="https://d3v0px0pttie1i.cloudfront.net/uploads/user/avatar/16908916/0cf8de51.jpeg"
            alt="Amy Andrews"
            width={128}
            height={128}
            className="rounded-full ring-4 ring-white shadow-md"
            priority
          />
        </div>
        
        <h2 className="text-2xl font-semibold text-neutral-text">Amy Andrews</h2>
        
        <p className="mt-2 text-gray-600 max-w-lg">
          Amy enjoys helping others find their passions, further develop their skills, and locate ways to leverage those passions and skills to drive their goals.
        </p>
        
        <div className="mt-8 w-full max-w-xs">
          <Link
            href="https://calendly.com/amy-andrews-liferamp"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block w-full text-center text-white font-semibold py-3 px-6 rounded-full text-lg shadow-lg transition-transform transform hover:scale-105"
            style={{
              background: 'linear-gradient(to right, #2DD4BF, #3B82F6)',
            }}
          >
            Schedule
          </Link>
        </div>
      </div>
    </div>
  );
}