export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-10">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-4xl font-bold text-slate-900">
          WorkshopOS Dashboard
        </h1>

        <p className="mt-3 text-slate-600">
          Welcome! Authentication is working successfully.
        </p>

        <div className="mt-8 rounded-xl bg-white p-6 shadow">
          <h2 className="text-xl font-semibold">
            Next Steps
          </h2>

          <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-700">
            <li>Create Workshops</li>
            <li>Manage Participants</li>
            <li>Check In Attendees</li>
            <li>Generate Certificates</li>
          </ul>
        </div>
      </div>
    </main>
  );
}