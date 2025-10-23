-- Add DELETE policy for messages so users can delete their own messages
create policy "messages_delete_own"
  on public.messages for delete
  using (
    auth.uid() = sender_id and
    exists (
      select 1 from public.conversation_participants
      where conversation_id = messages.conversation_id and user_id = auth.uid()
    )
  );
