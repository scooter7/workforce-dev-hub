import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Coach Connect',
  description: 'Learn about LifeRamp Coaching and get connected with a coach.',
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
      <div className="max-w-3xl w-full bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-8 text-center flex flex-col items-center">
        <h1 className="text-3xl font-bold text-neutral-text mb-6">Learn about LifeRamp Coaching</h1>

        <div className="mb-4">
          {/* Using the LifeRamp logo for a more general page */}
          <Image
            src="https://d3v0px0pttie1i.cloudfront.net/uploads/user/logo/25835639/39054a25.png"
            alt="LifeRamp Logo"
            width={128}
            height={128}
            className="rounded-full ring-4 ring-white shadow-md"
            priority
          />
        </div>

        {/* The new text about the coaching program */}
        <div className="mt-2 text-gray-600 max-w-2xl text-left space-y-4">
            <p>
                LifeRamp’s trained and certified coaches specialize in career development, leadership growth, and personal well-being—guiding individuals through customized coaching experiences that drive real results.
            </p>
            <p>
                Whether you're navigating a transition, building confidence, or striving for professional clarity, our coaches provide the tools and support to help you succeed.
            </p>
            <p>
                Our Coaching Director will personally connect you with the right coach to meet your unique goals. Contact us to find out more.
            </p>
        </div>

        <div className="mt-8 w-full max-w-xs">
          {/* A general contact link instead of a specific Calendly */}
          <a
            href="mailto:concierge@liferamp.io"
            className="inline-block w-full text-center text-white font-semibold py-3 px-6 rounded-full text-lg shadow-lg transition-transform transform hover:scale-105"
            style={{
              background: 'linear-gradient(to right, #2DD4BF, #3B82F6)',
            }}
          >
            Contact Us
          </a>
        </div>
      </div>
    </div>
  );
}