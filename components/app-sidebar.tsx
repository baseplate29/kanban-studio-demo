"use client";

import { SquareKanban } from "lucide-react";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

export function AppSidebar({ username }: { username: string }) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="cursor-default">
              <span className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <SquareKanban className="size-4" />
              </span>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Kanban Studio</span>
                <span className="truncate text-xs text-muted-foreground">
                  Shared board
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton isActive tooltip="Board">
                <SquareKanban />
                Board
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser username={username} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
