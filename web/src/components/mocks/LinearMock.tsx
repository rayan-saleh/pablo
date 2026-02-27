export function LinearMock() {
  const issues = [
    { id: "PAB-42", title: "Fix gradient extraction on Safari", status: "in-progress", priority: "urgent" },
    { id: "PAB-41", title: "Add Framer Motion keyframe capture", status: "done", priority: "high" },
    { id: "PAB-40", title: "Improve font-face URL resolution", status: "todo", priority: "medium" },
  ];

  const statusColors: Record<string, string> = {
    "in-progress": "bg-yellow-400",
    done: "bg-green-400",
    todo: "bg-zinc-500",
  };

  const priorityIcons: Record<string, string> = {
    urgent: "text-orange-400",
    high: "text-amber-400",
    medium: "text-zinc-500",
  };

  return (
    <div className="w-72 overflow-hidden rounded-lg border border-white/5 bg-[#1a1a2e] shadow-xl">
      <div className="border-b border-white/5 px-4 py-2.5">
        <span className="text-xs font-semibold text-zinc-400">Active Issues</span>
      </div>
      {issues.map((issue) => (
        <div
          key={issue.id}
          className="flex items-center gap-3 border-b border-white/5 px-4 py-3 last:border-b-0"
        >
          <div className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${statusColors[issue.status]}`} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm text-white">{issue.title}</div>
            <div className="text-xs text-zinc-500">{issue.id}</div>
          </div>
          <svg
            className={`h-4 w-4 flex-shrink-0 ${priorityIcons[issue.priority]}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 4h18M3 8h18M3 12h12"
            />
          </svg>
        </div>
      ))}
    </div>
  );
}
