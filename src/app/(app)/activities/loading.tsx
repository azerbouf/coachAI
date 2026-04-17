export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
      <div className="skeleton h-8 w-40 rounded" />
      <div className="flex gap-2">
        {[1,2,3].map(i => <div key={i} className="skeleton h-8 w-20 rounded-lg" />)}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="card flex items-center gap-4">
            <div className="skeleton w-10 h-10 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-48 rounded" />
              <div className="skeleton h-3 w-64 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
