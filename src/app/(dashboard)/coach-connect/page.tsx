import Image from 'next/image';

export default function CoachConnectPage() {
  return (
    <div className="bg-white p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
      <h1 className="text-4xl font-heading text-brand-primary mb-6 text-center">
        Connect with a LifeRamp Coach
      </h1>

      <div className="flex flex-col items-center text-center">
        <div className="flex-shrink-0 mb-6">
          {/* Using the LifeRamp logo for a more general page */}
          <Image
            src="https://d3v0px0pttie1i.cloudfront.net/uploads/user/logo/25835639/39054a25.png"
            alt="LifeRamp Logo"
            width={120}
            height={120}
            className="rounded-full border-4 border-brand-secondary-light"
          />
        </div>

        <div className="text-left flex-grow max-w-2xl">
          <p className="text-neutral-text-light text-lg leading-relaxed mb-4">
            LifeRamp’s trained and certified coaches specialize in career development, leadership growth, and personal well-being—guiding individuals through customized coaching experiences that drive real results.
          </p>
          <p className="text-neutral-text-light text-lg leading-relaxed mb-4">
            Whether you're navigating a transition, building confidence, or striving for professional clarity, our coaches provide the tools and support to help you succeed.
          </p>
          <p className="text-neutral-text-light text-lg leading-relaxed">
            Our Coaching Director will personally connect you with the right coach to meet your unique goals. Contact us to find out more.
          </p>
          <div className="mt-8 text-center">
            <a
              href="mailto:concierge@liferamp.io" // Using a general contact email
              className="inline-block bg-brand-secondary hover:bg-brand-secondary-medium text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105"
            >
              Contact Us to Find Your Coach
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}