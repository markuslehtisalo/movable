import { MovableProvider } from "@/lib/movable/client";
import { WorkspacePage } from "@/features/workspace/workspace-page";
export const metadata = { title: "Explore an example" };
export default function Page() { return <MovableProvider mode="demo"><WorkspacePage /></MovableProvider>; }
