import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Send, MessageCircle, Check, CheckCheck, ArrowLeft } from "lucide-react";
import { useConversations, useMessages, useSendMessage, useMarkRead, type Conversation } from "@/lib/messaging";
import { useCurrentUser } from "@/lib/auth";
import { SellerNav } from "@/components/SellerNav";
import { LoadingOverlay } from "@/components/LoadingOverlay";

// Messaging page (routes: /messages for buyers, /seller/messages for sellers) — conversation
// list plus an active chat thread, backed by Supabase via the messaging hooks.

// Formats an ISO timestamp as a short local time (e.g. "09:41").
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Page chrome (header with back button + marketplace link); shows the seller bottom nav when navInset is set.
function Shell({ children, navInset }: { children: React.ReactNode; navInset?: boolean }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <Link to="/" className="font-display text-2xl font-black tracking-tight text-foreground">
              ven<span className="text-primary">gryd</span>
            </Link>
          </div>
          <Link to="/marketplace" className="text-sm font-semibold text-primary hover:underline">
            Marketplace
          </Link>
        </div>
      </header>
      <main className={`mx-auto max-w-5xl px-4 pt-8 sm:px-6 ${navInset ? "pb-24" : "pb-8"}`}>{children}</main>
      {navInset ? <SellerNav /> : null}
    </div>
  );
}

// Returns the other party's display name relative to the current user (buyer name if I'm the seller, else vendor name).
function partyLabel(c: Conversation, userId: string) {
  // If I'm the seller, the other party is the buyer; otherwise it's the vendor.
  return c.sellerId === userId ? c.buyerName : c.vendorName;
}

// Round avatar that shows an image when available, otherwise the name's first initial.
function Avatar({ url, name, size = "h-9 w-9" }: { url?: string; name: string; size?: string }) {
  return (
    <div className={`${size} shrink-0 overflow-hidden rounded-full bg-secondary`}>
      {url ? (
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-sm font-bold text-muted-foreground">
          {name.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}

// Single chat thread: streams messages for `conversation`, auto-scrolls to the latest,
// marks the other party's messages read while open, and sends new messages (restoring text on error).
function Thread({
  conversation,
  userId,
  onBack,
  navInset,
}: {
  conversation: Conversation;
  userId: string;
  onBack: () => void;
  navInset?: boolean;
}) {
  const { data: messages, isFetching } = useMessages(conversation.id);
  const send = useSendMessage(conversation.id);
  const { mutate: markRead } = useMarkRead();
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const title = partyLabel(conversation, userId);
  // Only buyers see a vendor avatar; sellers see the buyer (initials).
  const avatarUrl = conversation.sellerId === userId ? undefined : conversation.vendorImageUrl;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark the other party's messages as read while this thread is open.
  useEffect(() => {
    if (messages.some((m) => m.senderId !== userId && !m.readAt)) markRead(conversation.id);
  }, [conversation.id, messages, userId, markRead]);

  // Sends the trimmed message body, optimistically clearing the input and restoring it on failure.
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText("");
    send.mutate(body, {
      onError: (err) => {
        setText(body);
        toast.error(err instanceof Error ? err.message : "Couldn't send message.");
      },
    });
  };

  return (
    <div className={`flex flex-col ${navInset ? "h-[calc(100vh-12rem)] md:h-[68vh]" : "h-[calc(100vh-9rem)] md:h-[72vh]"}`}>
      {/* Chat header */}
      <div className="flex items-center gap-3 border-b border-border p-3">
        <button
          type="button"
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground md:hidden"
          aria-label="Back to conversations"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Avatar url={avatarUrl} name={title} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{title}</p>
          <p className="truncate text-xs text-muted-foreground">{conversation.vendorName}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            {isFetching ? "Loading…" : "No messages yet — say hello."}
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === userId;
            return (
              <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                <div
                  className={`max-w-[80%] px-3 py-2 text-sm ${
                    mine
                      ? "rounded-2xl rounded-br-sm bg-primary text-primary-foreground"
                      : "rounded-2xl rounded-bl-sm bg-white text-neutral-900 shadow-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                </div>
                <div className="mt-1 flex items-center gap-1 px-1 text-[10px] text-muted-foreground">
                  <span>{fmtTime(m.createdAt)}</span>
                  {mine ? (
                    m.readAt ? <CheckCheck className="h-3.5 w-3.5 text-primary" /> : <Check className="h-3.5 w-3.5" />
                  ) : null}
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
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
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-display font-bold uppercase tracking-tight text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

/**
 * Messages page used for both buyer (/messages) and seller (/seller/messages) inboxes via `role`.
 * Auth-gated. Shows a role-filtered conversation list plus the selected thread (chosen via the
 * `?c=` query param); on mobile it shows the list first and opens a thread full-screen.
 */
const MessagesPage = ({ role }: { role: "buyer" | "seller" }) => {
  const { data: user } = useCurrentUser();
  const { data: conversations, isFetching } = useConversations();
  const [params, setParams] = useSearchParams();
  const active = params.get("c");

  // Explicit selection only — so mobile opens the list first (WhatsApp-style).
  const activeId = active && conversations.some((c) => c.id === active) ? active : null;
  const activeConv = conversations.find((c) => c.id === activeId) ?? null;

  // Each page shows only its side: the seller inbox (buyers → me) or the buyer
  // inbox (me → vendors). Same data, kept in sync, just filtered by role.
  const navInset = role === "seller";
  const shown = conversations.filter((c) => (role === "seller" ? c.sellerId : c.buyerId) === user?.id);

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
    <Shell navInset={navInset}>
      <h1 className={`mb-6 font-display text-3xl font-black uppercase tracking-tighter ${activeId ? "hidden md:block" : ""}`}>
        {role === "seller" ? "Inbox" : "Messages"}
      </h1>

      {conversations.length === 0 ? (
        isFetching ? (
          <LoadingOverlay />
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-border py-16 text-center">
            <MessageCircle className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">No conversations yet.</p>
            <Link to="/marketplace" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
              Browse vendors
            </Link>
          </div>
        )
      ) : (
        <div className="md:grid md:grid-cols-[320px_1fr] md:gap-6">
          {/* Conversation list — hidden on mobile once a chat is open */}
          <aside className={`flex-col gap-2 ${activeId ? "hidden md:flex" : "flex"}`}>
            {shown.length === 0 ? (
              <p className="px-1 py-6 text-sm text-muted-foreground">
                {role === "seller" ? "No buyers have messaged you yet." : "You haven't messaged any vendors yet."}
              </p>
            ) : null}

            {shown.map((c) => {
              const selected = c.id === activeId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setParams({ c: c.id })}
                  className={`flex items-center gap-3 rounded-lg p-3 text-left transition-colors ${
                    selected ? "bg-secondary" : "hover:bg-secondary/60"
                  }`}
                >
                  <Avatar url={c.sellerId === user.id ? undefined : c.vendorImageUrl} name={partyLabel(c, user.id)} size="h-10 w-10" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{partyLabel(c, user.id)}</p>
                    <p className="truncate text-xs text-muted-foreground">{c.vendorName}</p>
                  </div>
                </button>
              );
            })}
          </aside>

          {/* Active thread — full-screen on mobile, side pane on desktop */}
          <section className={activeId ? "block" : "hidden md:block"}>
            {activeConv ? (
              <Thread conversation={activeConv} userId={user.id} onBack={() => setParams({})} navInset={navInset} />
            ) : (
              <p className="py-20 text-center text-sm text-muted-foreground">Select a conversation to start chatting.</p>
            )}
          </section>
        </div>
      )}
    </Shell>
  );
};

export default MessagesPage;
