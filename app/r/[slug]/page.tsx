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
      <div className="mx-auto flex min-h-screen max-w-7xl items-center px-6 py-12 lg:px-12">
        <div className="grid w-full gap-16 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="flex flex-col justify-center">
            <div className="mb-10">
              <Image
                src="/emg/logo-dark.png"
                alt="Enable My Growth"
                width={600}
                height={150}
                priority
                className="h-auto w-100"
              />
            </div>

            <p className="mb-3 uppercase tracking-[0.35em] text-amber-300 text-sm">
              Executive Workshop
            </p>

            <h1 className="text-5xl font-bold leading-tight lg:text-6xl">
              AI Powered
              <br />
              Design Thinking
            </h1>

            <p className="mt-8 max-w-xl text-lg leading-8 text-slate-300">
              Welcome to Enable My Growth.
              <br />
              We're delighted to have you with us today.
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

          <section className="rounded-[32px] bg-white p-10 shadow-[0_40px_120px_rgba(0,0,0,0.35)]">
            <CheckInForm workshopSlug={slug} />
          </section>
        </div>
      </div>
    </main>
  );
}