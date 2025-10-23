-- Enable realtime for messages table
alter publication supabase_realtime add table messages;

-- Enable realtime for conversation_participants table  
alter publication supabase_realtime add table conversation_participants;

-- Enable realtime for conversations table
alter publication supabase_realtime add table conversations;
