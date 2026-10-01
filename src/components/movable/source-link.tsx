import { ArrowUpRight } from "lucide-react";
import type { Source } from "@/lib/movable/contracts";
export function SourceLink({ source }: { source: Source }) {
  return <a href={source.url} target="_blank" rel="noopener noreferrer" className="flex items-start justify-between gap-3 rounded-lg border p-3 text-sm hover:bg-muted"><span><span className="font-medium">{source.title}</span><span className="mt-1 block text-xs text-muted-foreground">{source.organization} · {source.reviewStatus === "reviewed" && source.reviewedAt ? `Reviewed ${source.reviewedAt}` : "Needs review"}</span></span><ArrowUpRight className="size-4 shrink-0" aria-hidden /></a>;
}
