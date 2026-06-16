-- Read receipts for direct messages.
alter table public.messages add column if not exists read_at timestamptz;

-- A participant marks the *other* party's messages in a conversation as read.
create or replace function public.mark_messages_read(p_conversation_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.conversations c
    where c.id = p_conversation_id and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
  ) then
    return;
  end if;

  update public.messages
  set read_at = timezone('utc'::text, now())
  where conversation_id = p_conversation_id
    and sender_id <> auth.uid()
    and read_at is null;
end;
$$;

grant execute on function public.mark_messages_read(text) to authenticated;
