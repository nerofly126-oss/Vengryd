import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Send, MessageCircle } from "lucide-react";
import { useConversations, useMessages, useSendMessage, type Conversation } from "@/lib/messaging";
import { useCurrentUser } from "@/lib/auth";
import { LoadingOverlay } from "@/components/LoadingOverlay";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="font-display text-2xl font-black tracking-tight text-foreground">
            ven<span className="text-primary">gryd</span>
          </Link>
          <Link to="/dashboard" className="text-sm font-semibold text-primary hover:underline">
            Marketplace
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}

function partyLabel(c: Conversation, userId: string) {
  // If I'm the seller, the other party is the buyer; otherwise it's the vendor.
  return c.sellerId === userId ? c.buyerName : c.vendorName;
}

function Thread({ conversationId, userId }: { conversationId: string; userId: string }) {
  const { data: messages, isFetching } = useMessages(conversationId);
  const send = useSendMessage(conversationId);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText("");
    send.mutate(body);
  };

  return (
    <div className="flex h-[60vh] flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            {isFetching ? "Loading…" : "No messages yet — say hello."}
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === userId;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] px-4 py-2 text-sm ${
                    mine
                      ? "bg-primary text-primary-foreground"
                      : "border-2 border-border bg-card text-foreground"
                  }`}
                >
                  {m.body}
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={submit} className="flex gap-2 border-t border-border p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 rounded-xl border-2 border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary/50"
        />
        <button
          type="submit"
          disabled={!text.trim() || send.isPending}
          className="flex items-center gap-2 bg-primary px-5 py-2.5 text-sm font-display font-bold uppercase tracking-tight text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          <Send className="h-4 w-4" /> Send
        </button>
      </form>
    </div>
  );
}

const Messages = () => {
  const { data: user } = useCurrentUser();
  const { data: conversations, isFetching } = useConversations();
  const [params, setParams] = useSearchParams();
  const active = params.get("c");

  // Default to the newest conversation when none is selected.
  const activeId = useMemo(() => {
    if (active && conversations.some((c) => c.id === active)) return active;
    return conversations[0]?.id ?? null;
  }, [active, conversations]);

  if (!user) {
    return (
      <Shell>
        <div className="py-20 text-center">
          <p className="text-sm text-muted-foreground">Sign in to view your messages.</p>
          <Link to="/auth" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="mb-6 font-display text-3xl font-black uppercase tracking-tighter">Messages</h1>

      {conversations.length === 0 ? (
        isFetching ? (
          <LoadingOverlay />
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-border py-16 text-center">
            <MessageCircle className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">No conversations yet.</p>
            <Link to="/dashboard" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
              Browse vendors
            </Link>
          </div>
        )
      ) : (
        <div className="grid gap-6 md:grid-cols-[280px_1fr]">
          {/* Conversation list */}
          <aside className="flex flex-col gap-2">
            {conversations.map((c) => {
              const selected = c.id === activeId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setParams({ c: c.id })}
                  className={`flex items-center gap-3 border-2 p-3 text-left transition-colors ${
                    selected ? "border-primary bg-card" : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-secondary">
                    {c.vendorImageUrl ? (
                      <img src={c.vendorImageUrl} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{partyLabel(c, user.id)}</p>
                    <p className="truncate text-xs text-muted-foreground">{c.vendorName}</p>
                  </div>
                </button>
              );
            })}
          </aside>

          {/* Active thread */}
          <section className="border-2 border-border bg-card">
            {activeId ? (
              <Thread conversationId={activeId} userId={user.id} />
            ) : (
              <p className="py-20 text-center text-sm text-muted-foreground">Select a conversation.</p>
            )}
          </section>
        </div>
      )}
    </Shell>
  );
};

export default Messages;
