"use client";

import { BotIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { Board } from "@/lib/board";
import { BoardView } from "./board-view";
import { ChatSidebar } from "./chat-sidebar";

export function Workspace({ initialBoard }: { initialBoard: Board }) {
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const isMobile = useIsMobile();
  const onBoardChanged = () => setRefreshSignal((n) => n + 1);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 items-stretch">
      <BoardView initialBoard={initialBoard} refreshSignal={refreshSignal} />
      {isMobile ? (
        <>
          <Button
            type="button"
            size="icon-lg"
            aria-label="Open AI chat"
            className="fixed right-4 bottom-4 z-20 rounded-full shadow-lg"
            onClick={() => setChatOpen(true)}
          >
            <BotIcon />
          </Button>
          <Sheet open={chatOpen} onOpenChange={setChatOpen}>
            <SheetContent side="right" className="w-80 gap-0 p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>AI chat</SheetTitle>
                <SheetDescription>
                  Chat with the AI assistant that can edit the board.
                </SheetDescription>
              </SheetHeader>
              <ChatSidebar
                onBoardChanged={onBoardChanged}
                className="h-full w-full border-l-0"
              />
            </SheetContent>
          </Sheet>
        </>
      ) : (
        <ChatSidebar onBoardChanged={onBoardChanged} />
      )}
    </div>
  );
}
