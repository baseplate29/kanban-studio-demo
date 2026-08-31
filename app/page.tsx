import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Workspace } from "@/components/workspace";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Board } from "@/lib/board";

// Guest mode with in-memory state: no database or auth yet.
// The live demo replaces this with a session check and a board
// loaded from Postgres (see docs/DEMO.md).
const initialBoard: Board = {
  columns: [
    { id: "todo", name: "To Do", cards: [] },
    { id: "in-progress", name: "In Progress", cards: [] },
    { id: "done", name: "Done", cards: [] },
  ],
};

export default function Home() {
  return (
    <SidebarProvider>
      <AppSidebar username="guest" />
      <SidebarInset className="h-svh min-w-0 overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-vertical:h-4 data-vertical:self-auto"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Board</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>
        <Workspace initialBoard={initialBoard} />
      </SidebarInset>
    </SidebarProvider>
  );
}
