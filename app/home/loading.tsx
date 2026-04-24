import Navbar from "@/components/Navbar";

function SkeletonBar({ className = "" }: { className?: string }) {
  return <div className={`h-4 animate-pulse bg-slate-200 ${className}`} />;
}

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 ${className}`} />;
}

export default function HomeLoading() {
  return (
    <>
      <Navbar />
      <section className="space-y-6 pb-8" aria-busy="true" aria-live="polite">
        <div className="border border-black bg-white p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-slate-500">
                /home dashboard
              </p>
              <SkeletonBar className="h-10 w-80" />
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <SkeletonBlock className="h-10 w-16 border border-black" />
              <SkeletonBlock className="h-10 w-20 border border-black" />
              <SkeletonBlock className="h-10 w-16 border border-black" />
            </div>
          </div>
          <div className="mt-4 border-t border-dashed border-slate-300 pt-4 text-xs uppercase tracking-[0.25em] text-slate-500">
            [ connecting to neon&hellip; ]
          </div>
        </div>

        <div className="grid gap-4 border border-black bg-white p-4 md:grid-cols-3">
          <SkeletonBlock className="h-28 border border-black bg-green-50" />
          <SkeletonBlock className="h-28 border border-black bg-red-50" />
          <SkeletonBlock className="h-28 border border-black bg-yellow-50" />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <SkeletonBlock className="h-72 border border-black bg-white" />
          <SkeletonBlock className="h-72 border border-black bg-white" />
        </div>

        <div className="space-y-4 border border-black bg-white p-4">
          <SkeletonBar className="h-6 w-56" />
          <SkeletonBar className="w-72" />
          <div className="space-y-3 pt-2">
            <SkeletonBlock className="h-20 border border-black bg-slate-50" />
            <SkeletonBlock className="h-20 border border-black bg-white" />
            <SkeletonBlock className="h-20 border border-black bg-slate-50" />
          </div>
        </div>
      </section>
    </>
  );
}
