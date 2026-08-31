import { AppSidebar } from "@/components/app-sidebar";
import { AuthScreen } from "@/components/auth-forms";
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
import { getBoard } from "@/lib/board-store";
import { getSession } from "@/lib/session";

export default async function Home() {
  const session = await getSession();
  if (!session) return <AuthScreen />;
  const board = await getBoard();

  return (
    <SidebarProvider>
      <AppSidebar username={session.username} />
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
        <Workspace initialBoard={board} />
      </SidebarInset>
    </SidebarProvider>
  );
}
