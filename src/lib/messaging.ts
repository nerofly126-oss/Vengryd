import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
};

export type Conversation = {
  id: string;
  vendorId: string;
  buyerId: string;
  sellerId: string;
  lastMessageAt: string;
  /** Display info for the other party, from the current user's point of view. */
  vendorName: string;
  vendorImageUrl?: string;
  buyerName: string;
  lastMessage?: string;
};

type ConversationRow = {
  id: string;
  vendor_id: string;
  buyer_id: string;
  seller_id: string;
  last_message_at: string;
  vendors: { name: string | null; image_url: string | null } | null;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

function mapMessage(row: MessageRow): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    body: row.body,
    createdAt: row.created_at,
  };
}

/** All conversations the signed-in user is part of (as buyer or seller), newest first. */
export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: async (): Promise<Conversation[]> => {
      if (!isSupabaseConfigured()) return [];
      const supabase = getSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("conversations")
        .select("id, vendor_id, buyer_id, seller_id, last_message_at, vendors(name, image_url)")
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as unknown as ConversationRow[];

      // Resolve buyer display names (FK points at auth.users, so embed isn't available).
      const buyerIds = Array.from(new Set(rows.map((r) => r.buyer_id)));
      const names = new Map<string, string>();
      if (buyerIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", buyerIds);
        for (const p of (profiles ?? []) as { id: string; full_name: string | null }[]) {
          names.set(p.id, p.full_name ?? "Buyer");
        }
      }

      return rows.map((r) => ({
        id: r.id,
        vendorId: r.vendor_id,
        buyerId: r.buyer_id,
        sellerId: r.seller_id,
        lastMessageAt: r.last_message_at,
        vendorName: r.vendors?.name ?? "Vendor",
        vendorImageUrl: r.vendors?.image_url ?? undefined,
        buyerName: names.get(r.buyer_id) ?? "Buyer",
      }));
    },
    initialData: [],
  });
}

/** Messages within a conversation, kept live via a realtime subscription. */
export function useMessages(conversationId?: string) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["messages", conversationId],
    enabled: !!conversationId,
    queryFn: async (): Promise<Message[]> => {
      if (!isSupabaseConfigured() || !conversationId) return [];
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("messages")
        .select("id, conversation_id, sender_id, body, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return ((data ?? []) as MessageRow[]).map(mapMessage);
    },
    initialData: [],
  });

  useEffect(() => {
    if (!isSupabaseConfigured() || !conversationId) return;
    const supabase = getSupabaseClient();
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const incoming = mapMessage(payload.new as MessageRow);
          qc.setQueryData<Message[]>(["messages", conversationId], (prev) => {
            const list = prev ?? [];
            if (list.some((m) => m.id === incoming.id)) return list;
            return [...list, incoming];
          });
          void qc.invalidateQueries({ queryKey: ["conversations"] });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, qc]);

  return query;
}

/** Find or create the conversation between the current buyer and a vendor; returns its id. */
export function useStartConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vendorId: string): Promise<string> => {
      const supabase = getSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sign in to message this vendor.");

      const { data: existing, error: findError } = await supabase
        .from("conversations")
        .select("id")
        .eq("vendor_id", vendorId)
        .eq("buyer_id", user.id)
        .maybeSingle();
      if (findError) throw findError;
      if (existing) return (existing as { id: string }).id;

      // seller_id is filled server-side by a trigger.
      const { data, error } = await supabase
        .from("conversations")
        .insert({ vendor_id: vendorId, buyer_id: user.id, seller_id: user.id })
        .select("id")
        .single();
      if (error) throw error;
      return (data as { id: string }).id;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useSendMessage(conversationId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: string) => {
      const trimmed = body.trim();
      if (!trimmed) return;
      const supabase = getSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sign in to send a message.");
      if (!conversationId) throw new Error("No conversation selected.");
      const { error } = await supabase
        .from("messages")
        .insert({ conversation_id: conversationId, sender_id: user.id, body: trimmed });
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["messages", conversationId] });
      void qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
