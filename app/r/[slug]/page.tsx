import Image from "next/image";
import { CheckInForm } from "@/features/participants/components/check-in-form";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function CheckInPage({ params }: Props) {
  const { slug } = await params;

  return (
    <main className="min-h-screen bg-[#0B1018] text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center px-4 py-8 sm:px-6 sm:py-12 lg:px-12">
        <div className="grid w-full gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
          <section className="flex flex-col justify-center">
            <div className="mb-10">
              <Image
                src="/emg/logo-dark.png"
                alt="Enable My Growth"
                width={600}
                height={150}
                priority
                className="h-auto w-100 max-w-full"
              />
            </div>

            <p className="mb-3 uppercase tracking-[0.35em] text-amber-300 text-sm">
              Executive Workshop
            </p>

            <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              AI Powered
              <br />
              Design Thinking
            </h1>

            <p className="mt-8 max-w-xl text-lg leading-8 text-slate-300">
              Welcome to Enable My Growth.
              <br />
              We&apos;re delighted to have you with us today.
              Please complete your check-in using the form.
            </p>

            <div className="mt-12 space-y-5 text-lg text-slate-300">
              <div className="flex items-center gap-4">
                <span className="text-2xl">📅</span>
                <span>21–22 July 2026</span>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-2xl">📍</span>
                <span>Citea Hotel • Beirut</span>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-2xl">🕘</span>
                <span>9:00 AM – 5:00 PM</span>
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-[0_40px_120px_rgba(0,0,0,0.35)] sm:rounded-[32px] sm:p-10">
            <CheckInForm workshopSlug={slug} />
          </section>
        </div>
      </div>
    </main>
  );
}