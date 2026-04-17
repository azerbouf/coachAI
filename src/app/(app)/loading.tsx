export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
      <div className="pb-5 border-b border-border space-y-3">
        <div className="skeleton h-4 w-24 rounded" />
        <div className="skeleton h-8 w-64 rounded" />
        <div className="skeleton h-4 w-48 rounded" />
      </div>
      <div className="flex gap-6 py-3 border-b border-border">
        {[1,2,3,4].map(i => <div key={i} className="skeleton h-4 w-28 rounded" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1,2,3,4].map(i => (
          <div key={i} className="card space-y-4">
            <div className="skeleton h-3 w-24 rounded" />
            <div className="skeleton h-40 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
