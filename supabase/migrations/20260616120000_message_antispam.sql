-- Anti-spam for direct messages: rate limit per sender + block rapid duplicates.
create or replace function public.check_message_rate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent integer;
begin
  -- Max 20 messages per minute per sender.
  select count(*) into recent
  from public.messages
  where sender_id = new.sender_id
    and created_at > timezone('utc'::text, now()) - interval '1 minute';
  if recent >= 20 then
    raise exception 'You''re sending messages too quickly. Please wait a moment.';
  end if;

  -- Block an identical message repeated within 30s in the same conversation.
  if exists (
    select 1 from public.messages m
    where m.conversation_id = new.conversation_id
      and m.sender_id = new.sender_id
      and m.body = new.body
      and m.created_at > timezone('utc'::text, now()) - interval '30 seconds'
  ) then
    raise exception 'That looks like a duplicate message.';
  end if;

  return new;
end;
$$;

drop trigger if exists messages_rate_limit on public.messages;
create trigger messages_rate_limit
before insert on public.messages
for each row execute function public.check_message_rate();
