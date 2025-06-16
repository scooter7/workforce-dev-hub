// src/components/chat/ChatInterface.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useChat } from 'ai/react';
import { SubTopic, Topic } from '@/lib/constants';
import { useAuth } from '@/components/providers/AuthProvider'; // Changed from useUser to useAuth
import { toast } from 'sonner';

export default function ChatInterface({ topic, subtopic }: { topic: Topic, subtopic: SubTopic }) {
  const { user } = useAuth(); // Changed from useUser to useAuth
  const [isInitialPromptSent, setIsInitialPromptSent] = useState(false);
  const { messages, input, handleInputChange, handleSubmit, append, isLoading } = useChat({
    api: '/api/chat',
    body: {
      topicId: topic.id,
      subtopicId: subtopic.id,
    },
    onError: (error) => {
      console.error('Chat error:', error);
      toast.error('Sorry, something went wrong. Please try again.');
    },
  });

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isInitialPromptSent && append) {
      const userPrompt = `I'd like to learn about "${subtopic.title}" within the topic of "${topic.title}". Can you give me an overview?`;
      append({
        role: 'user',
        content: userPrompt,
      });
      setIsInitialPromptSent(true);
    }
  }, [append, isInitialPromptSent, subtopic.title, topic.title]);

  const getAvatarUrl = (role: string) => {
    // The original AuthProvider gives a `profile` object, let's check it for an avatar.
    // Assuming the profile might have an `avatar_url` property.
    // If not, we fall back to the user metadata.
    if (role === 'user') {
      // @ts-ignore
      return user?.profile?.avatar_url || user?.user_metadata?.avatar_url || '/user-avatar.png';
    }
    return '/logo-bg-white.png';
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <header className="bg-white border-b p-4">
        <h1 className="text-xl font-bold">{topic.title}</h1>
        <p className="text-sm text-gray-600">{subtopic.title}</p>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex items-start gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}>
            {m.role !== 'user' && (
              <img src={getAvatarUrl(m.role)} alt="AI" className="w-8 h-8 rounded-full" />
            )}
            <div
              className={`max-w-xl p-3 rounded-lg ${
                m.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white border'
              }`}
            >
              <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{m.content}</p>
            </div>
            {m.role === 'user' && (
              <img src={getAvatarUrl(m.role)} alt="User" className="w-8 h-8 rounded-full" />
            )}
          </div>
        ))}
        {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
          <div className="flex items-start gap-3">
            <img src={getAvatarUrl('assistant')} alt="AI" className="w-8 h-8 rounded-full" />
            <div className="max-w-xl p-3 rounded-lg bg-white border">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse-fast"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse-medium"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse-slow"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="bg-white border-t p-4">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <input
            className="flex-1 p-2 border rounded-lg"
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            disabled={isLoading || !isInitialPromptSent}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:bg-blue-300"
            disabled={isLoading || !isInitialPromptSent}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}