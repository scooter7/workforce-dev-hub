'use client';

import { useState } from 'react';
import ChatList from '@/components/chat/ChatList';
import ChatWindow from '@/components/chat/ChatWindow';

export default function MessagesPage() {
  const [selectedChat, setSelectedChat] = useState<null | { id: string }>(null);

  return (
    <div className="flex flex-col md:flex-row h-[80vh] bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="w-full md:w-1/3 border-r bg-gray-50 p-4 overflow-y-auto">
        <ChatList onSelectChat={setSelectedChat} />
      </div>
      <div className="flex-1 p-4 flex flex-col">
        {selectedChat ? (
          <ChatWindow chatId={selectedChat.id} />
        ) : (
          <div className="flex flex-1 items-center justify-center text-gray-400">
            <span>Select a chat to start messaging</span>
          </div>
        )}
      </div>
    </div>
  );
}