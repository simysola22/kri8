import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import {
  useListFriends,
  useSearchUsers,
  useSendFriendRequest,
  useRespondFriendRequest,
  getListFriendsQueryKey,
  getSearchUsersQueryKey,
} from "@workspace/api-client-react";
import { Search, Users, UserPlus, Check, X, UserCircle, Clock, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

type UserPublic = { id: number; name?: string | null; username?: string | null; bio?: string | null; avatarUrl?: string | null };
type FriendRequest = { id: number; requester: UserPublic; addressee: UserPublic; status: string; createdAt: string };

function UserCard({ user, action }: { user: UserPublic; action?: React.ReactNode }) {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group">
      <Avatar className="h-10 w-10 border border-white/10">
        <AvatarImage src={user.avatarUrl ?? undefined} />
        <AvatarFallback>{(user.name ?? user.username ?? "?").charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{user.name || user.username || `User #${user.id}`}</p>
        {user.username && <p className="text-xs text-muted-foreground">@{user.username}</p>}
        {user.bio && <p className="text-xs text-muted-foreground truncate mt-0.5">{user.bio}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {user.username && (
          <a
            href={`${basePath}/profile/${user.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
            title="View profile"
          >
            <Link2 className="h-3.5 w-3.5" />
          </a>
        )}
        {action}
      </div>
    </div>
  );
}

export default function SocialPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchTimer, setSearchTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const { toast } = useToast();

  const { data: friends, isLoading: friendsLoading } = useListFriends({
    query: { queryKey: getListFriendsQueryKey() },
  });
  const friendsList = (friends as any)?.friends ?? [];
  const pendingReceived: FriendRequest[] = (friends as any)?.pendingReceived ?? [];
  const pendingSent: FriendRequest[] = (friends as any)?.pendingSent ?? [];

  const { data: searchResults = [] } = useSearchUsers(
    { q: debouncedQuery },
    { query: { enabled: debouncedQuery.length >= 2, queryKey: getSearchUsersQueryKey({ q: debouncedQuery }) } }
  );

  const sendRequest = useSendFriendRequest();
  const respondRequest = useRespondFriendRequest();

  const handleSearch = (v: string) => {
    setSearchQuery(v);
    if (searchTimer) clearTimeout(searchTimer);
    const t = setTimeout(() => setDebouncedQuery(v), 400);
    setSearchTimer(t);
  };

  const handleSendRequest = (userId: number, name: string) => {
    sendRequest.mutate({ userId }, {
      onSuccess: () => {
        toast({ title: "Friend request sent", description: `Request sent to ${name}` });
        queryClient.invalidateQueries({ queryKey: getListFriendsQueryKey() });
      },
      onError: () => toast({ title: "Request already sent", variant: "destructive" }),
    });
  };

  const handleRespond = (requestId: number, status: "accepted" | "rejected") => {
    respondRequest.mutate({ requestId, data: { status } }, {
      onSuccess: () => {
        toast({ title: status === "accepted" ? "Friend added!" : "Request declined" });
        queryClient.invalidateQueries({ queryKey: getListFriendsQueryKey() });
      },
    });
  };

  // IDs already connected to skip them in search
  const connectedIds = new Set([
    ...friendsList.map((u: UserPublic) => u.id),
    ...pendingSent.map(r => r.addressee.id),
    ...pendingReceived.map(r => r.requester.id),
  ]);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Community</h1>
            <p className="text-muted-foreground mt-1">Connect with fellow creators.</p>
          </div>
        </div>

        <Tabs defaultValue="friends">
          <TabsList className="bg-card border border-white/10">
            <TabsTrigger value="friends" className="data-[state=active]:bg-white/10">
              Friends
              {friendsList.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs bg-primary/20 text-primary border-0">
                  {friendsList.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="requests" className="data-[state=active]:bg-white/10">
              Requests
              {pendingReceived.length > 0 && (
                <Badge className="ml-2 h-5 px-1.5 text-xs bg-primary text-primary-foreground border-0">
                  {pendingReceived.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="discover" className="data-[state=active]:bg-white/10">
              Discover
            </TabsTrigger>
          </TabsList>

          {/* Friends tab */}
          <TabsContent value="friends" className="mt-4">
            <Card className="bg-card border-white/10">
              <CardHeader>
                <CardTitle>Your Friends</CardTitle>
                <CardDescription>Creators you're connected with.</CardDescription>
              </CardHeader>
              <CardContent>
                {friendsLoading ? (
                  <div className="py-8 text-center text-muted-foreground text-sm">Loading…</div>
                ) : friendsList.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <UserCircle className="h-12 w-12 text-muted-foreground mx-auto opacity-40" />
                    <p className="text-muted-foreground">No friends yet. Go discover some creators!</p>
                    <Button variant="outline" className="border-white/20" onClick={() => {}}>
                      <Search className="h-4 w-4 mr-2" />
                      Find Creators
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {friendsList.map((user: UserPublic) => (
                      <UserCard key={user.id} user={user} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Requests tab */}
          <TabsContent value="requests" className="mt-4 space-y-4">
            {pendingReceived.length > 0 && (
              <Card className="bg-card border-white/10">
                <CardHeader>
                  <CardTitle className="text-base">Incoming Requests</CardTitle>
                </CardHeader>
                <CardContent className="divide-y divide-white/5">
                  {pendingReceived.map((req) => (
                    <UserCard
                      key={req.id}
                      user={req.requester}
                      action={
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="h-8 bg-primary text-primary-foreground hover:bg-primary/90"
                            onClick={() => handleRespond(req.id, "accepted")}
                            disabled={respondRequest.isPending}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 border-white/20 hover:bg-white/10"
                            onClick={() => handleRespond(req.id, "rejected")}
                            disabled={respondRequest.isPending}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      }
                    />
                  ))}
                </CardContent>
              </Card>
            )}

            {pendingSent.length > 0 && (
              <Card className="bg-card border-white/10">
                <CardHeader>
                  <CardTitle className="text-base">Sent Requests</CardTitle>
                </CardHeader>
                <CardContent className="divide-y divide-white/5">
                  {pendingSent.map((req) => (
                    <UserCard
                      key={req.id}
                      user={req.addressee}
                      action={
                        <Badge variant="outline" className="border-white/20 text-muted-foreground gap-1">
                          <Clock className="h-3 w-3" />Pending
                        </Badge>
                      }
                    />
                  ))}
                </CardContent>
              </Card>
            )}

            {pendingReceived.length === 0 && pendingSent.length === 0 && (
              <Card className="bg-card border-white/10 border-dashed">
                <CardContent className="py-12 text-center">
                  <UserPlus className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                  <p className="text-muted-foreground">No pending requests.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Discover tab */}
          <TabsContent value="discover" className="mt-4">
            <Card className="bg-card border-white/10">
              <CardHeader>
                <CardTitle>Find Creators</CardTitle>
                <CardDescription>Search by name or username.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search creators…"
                    className="pl-9 bg-background border-white/10 focus-visible:ring-primary"
                    value={searchQuery}
                    onChange={e => handleSearch(e.target.value)}
                  />
                </div>

                {debouncedQuery.length >= 2 && (
                  <div className="divide-y divide-white/5">
                    {(searchResults as UserPublic[]).length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">No creators found for "{debouncedQuery}"</p>
                    ) : (
                      (searchResults as UserPublic[]).map(user => (
                        <UserCard
                          key={user.id}
                          user={user}
                          action={
                            connectedIds.has(user.id) ? (
                              <Badge variant="outline" className="border-white/20 text-muted-foreground text-xs">
                                {friendsList.some((f: UserPublic) => f.id === user.id) ? "Friend" : "Pending"}
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 border-white/20 hover:bg-primary/20 hover:border-primary hover:text-primary"
                                onClick={() => handleSendRequest(user.id, user.name ?? user.username ?? String(user.id))}
                                disabled={sendRequest.isPending}
                              >
                                <UserPlus className="h-3.5 w-3.5 mr-1" />
                                Add
                              </Button>
                            )
                          }
                        />
                      ))
                    )}
                  </div>
                )}

                {debouncedQuery.length < 2 && (
                  <div className="py-8 text-center text-muted-foreground text-sm">
                    Type at least 2 characters to search
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
