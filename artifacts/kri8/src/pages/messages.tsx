import { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useGetMe, useListConversations, useGetMessages, useSendMessage, getGetMessagesQueryKey, getListConversationsQueryKey } from "@workspace/api-client-react";
import { MessageSquare, Send, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type UserPublic = { id: number; name?: string | null; username?: string | null; avatarUrl?: string | null };
type Message = { id: number; senderId: number; receiverId: number; content: string; isRead: boolean; createdAt: string };
type Conversation = { partner: UserPublic; lastMessage: Message; unreadCount: number };

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function MessagesPage() {
  const [selectedPartner, setSelectedPartner] = useState<UserPublic | null>(null);
  const [messageText, setMessageText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: me } = useGetMe({ query: { queryKey: [] } });
  const myId = (me as any)?.id as number | undefined;

  const { data: conversations = [], isLoading: convsLoading } = useListConversations({
    query: {
      queryKey: getListConversationsQueryKey(),
      refetchInterval: 15000,
    },
  });

  const { data: messages = [], isLoading: msgsLoading } = useGetMessages(
    selectedPartner?.id ?? 0,
    {},
    {
      query: {
        enabled: !!selectedPartner,
        queryKey: selectedPartner ? getGetMessagesQueryKey(selectedPartner.id, {}) : [],
        refetchInterval: 5000,
      },
    }
  );

  const sendMessage = useSendMessage();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedPartner) return;
    const content = messageText.trim();
    setMessageText("");

    sendMessage.mutate(
      { userId: selectedPartner.id, data: { content } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMessagesQueryKey(selectedPartner.id, {}) });
          queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
        },
        onError: () => {
          toast({ title: "Failed to send message", variant: "destructive" });
          setMessageText(content);
        },
      }
    );
  };

  const convList = conversations as Conversation[];

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Messages</h1>
            <p className="text-muted-foreground mt-1">Chat with your creator friends.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-260px)] min-h-[400px]">
          {/* Conversations list */}
          <Card className={cn("bg-card border-white/10 flex flex-col", selectedPartner && "hidden md:flex")}>
            <CardHeader className="pb-3 shrink-0">
              <CardTitle className="text-base">Conversations</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto">
              {convsLoading ? (
                <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>
              ) : convList.length === 0 ? (
                <div className="py-12 text-center px-4">
                  <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                  <p className="text-sm text-muted-foreground">No conversations yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">Add friends and start chatting.</p>
                </div>
              ) : (
                convList.map(conv => (
                  <button
                    key={conv.partner.id}
                    onClick={() => setSelectedPartner(conv.partner)}
                    className={cn(
                      "w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors border-b border-white/5 text-left",
                      selectedPartner?.id === conv.partner.id && "bg-white/10"
                    )}
                  >
                    <Avatar className="h-9 w-9 shrink-0 border border-white/10">
                      <AvatarImage src={conv.partner.avatarUrl ?? undefined} />
                      <AvatarFallback>{(conv.partner.name ?? conv.partner.username ?? "?").charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">{conv.partner.name ?? conv.partner.username ?? `User #${conv.partner.id}`}</p>
                        <span className="text-xs text-muted-foreground shrink-0 ml-2">{formatTime(conv.lastMessage.createdAt)}</span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs text-muted-foreground truncate">{conv.lastMessage.content}</p>
                        {conv.unreadCount > 0 && (
                          <Badge className="ml-2 h-4 min-w-4 px-1 text-[10px] bg-primary text-primary-foreground border-0 shrink-0">
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          {/* Message thread */}
          <Card className={cn("md:col-span-2 bg-card border-white/10 flex flex-col", !selectedPartner && "hidden md:flex")}>
            {selectedPartner ? (
              <>
                {/* Header */}
                <div className="flex items-center gap-3 p-4 border-b border-white/10 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden rounded-full h-8 w-8"
                    onClick={() => setSelectedPartner(null)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Avatar className="h-9 w-9 border border-white/10">
                    <AvatarImage src={selectedPartner.avatarUrl ?? undefined} />
                    <AvatarFallback>{(selectedPartner.name ?? selectedPartner.username ?? "?").charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{selectedPartner.name ?? selectedPartner.username ?? `User #${selectedPartner.id}`}</p>
                    {selectedPartner.username && <p className="text-xs text-muted-foreground">@{selectedPartner.username}</p>}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {msgsLoading ? (
                    <div className="text-center text-sm text-muted-foreground py-8">Loading messages…</div>
                  ) : (messages as Message[]).length === 0 ? (
                    <div className="text-center text-sm text-muted-foreground py-8">
                      Start the conversation!
                    </div>
                  ) : (
                    (messages as Message[]).map(msg => {
                      const isMine = msg.senderId === myId;
                      return (
                        <div key={msg.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                          <div className={cn(
                            "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
                            isMine
                              ? "bg-primary text-primary-foreground rounded-tr-sm"
                              : "bg-white/10 text-foreground rounded-tl-sm"
                          )}>
                            <p>{msg.content}</p>
                            <p className={cn("text-[10px] mt-1", isMine ? "text-primary-foreground/60" : "text-muted-foreground")}>
                              {formatTime(msg.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSend} className="p-4 border-t border-white/10 flex gap-2 shrink-0">
                  <Input
                    placeholder="Type a message…"
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                    className="bg-background border-white/10 focus-visible:ring-primary"
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e as any); } }}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
                    disabled={!messageText.trim() || sendMessage.isPending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-3">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto opacity-40" />
                  <p className="text-muted-foreground">Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
