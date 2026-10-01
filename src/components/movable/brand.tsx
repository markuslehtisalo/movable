import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
export function Brand({ className }: { className?: string }) {
  return <Link href="/" aria-label="Movable home" className={cn("inline-flex items-center gap-2 text-xl font-semibold tracking-tight", className)}><span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground"><ArrowUpRight className="size-5" aria-hidden /></span>movable</Link>;
}
