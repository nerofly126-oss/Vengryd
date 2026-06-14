-- Direct messaging between buyers and vendors.
-- A conversation is a unique thread per (vendor, buyer). The two participants are
-- the buyer and the vendor's owner (seller_id). Messages belong to a conversation.

create table if not exists public.conversations (
  id text primary key default gen_random_uuid()::text,
  vendor_id text not null references public.vendors (id) on delete cascade,
  buyer_id uuid not null references auth.users (id) on delete cascade,
  seller_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now()),
  last_message_at timestamptz not null default timezone('utc'::text, now()),
  unique (vendor_id, buyer_id)
);

create index if not exists conversations_buyer_idx on public.conversations (buyer_id);
create index if not exists conversations_seller_idx on public.conversations (seller_id);

create table if not exists public.messages (
  id text primary key default gen_random_uuid()::text,
  conversation_id text not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at);

-- Populate seller_id from the vendor on insert (so a buyer can't spoof the recipient).
create or replace function public.set_conversation_seller()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select seller_id into new.seller_id from public.vendors where id = new.vendor_id;
  if new.seller_id is null then
    raise exception 'This vendor is not claimed by a seller yet.';
  end if;
  return new;
end;
$$;

drop trigger if exists conversations_set_seller on public.conversations;
create trigger conversations_set_seller
before insert on public.conversations
for each row execute function public.set_conversation_seller();

-- Bump last_message_at on the parent conversation when a message lands.
create or replace function public.touch_conversation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set last_message_at = timezone('utc'::text, now())
  where id = new.conversation_id;
  return null;
end;
$$;

drop trigger if exists messages_touch_conversation on public.messages;
create trigger messages_touch_conversation
after insert on public.messages
for each row execute function public.touch_conversation();

-- ---------------- RLS: only the two participants ----------------
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

drop policy if exists "Participants read conversations" on public.conversations;
create policy "Participants read conversations" on public.conversations for select to authenticated
using (auth.uid() = buyer_id or auth.uid() = seller_id);

drop policy if exists "Buyers start conversations" on public.conversations;
create policy "Buyers start conversations" on public.conversations for insert to authenticated
with check (auth.uid() = buyer_id);

drop policy if exists "Participants read messages" on public.messages;
create policy "Participants read messages" on public.messages for select to authenticated
using (
  exists (
    select 1 from public.conversations c
    where c.id = conversation_id and (auth.uid() = c.buyer_id or auth.uid() = c.seller_id)
  )
);

drop policy if exists "Participants send messages" on public.messages;
create policy "Participants send messages" on public.messages for insert to authenticated
with check (
  auth.uid() = sender_id
  and exists (
    select 1 from public.conversations c
    where c.id = conversation_id and (auth.uid() = c.buyer_id or auth.uid() = c.seller_id)
  )
);

-- Enable realtime delivery for new messages (idempotent).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end
$$;
