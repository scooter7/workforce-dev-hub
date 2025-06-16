// src/components/chat/ChatInterface.tsx
'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { useChat, type Message as VercelAIMessage } from 'ai/react';
import { SubTopic, Topic } from '@/lib/constants';
import { useAuth } from '@/components/providers/AuthProvider';
import { toast } from 'sonner';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PlusIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/solid';

export default function ChatInterface({ topic, subtopic }: { topic: Topic, subtopic: SubTopic }) {
  const { user, profile } = useAuth();
  const [isInitialPromptSent, setIsInitialPromptSent] = useState(false);
  const { messages, input, handleInputChange, handleSubmit, append, isLoading } = useChat({
    api: '/api/chat',
    body: {
      knowledgeBaseScope: {
        topicId: topic.id,
        subtopicId: subtopic.id,
      },
      userId: user?.id,
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
    if (!isInitialPromptSent && append && user) {
      const userPrompt = `I'd like to learn about "${subtopic.title}" within the topic of "${topic.title}". Can you give me an overview?`;
      append({
        role: 'user',
        content: userPrompt,
      });
      setIsInitialPromptSent(true);
    }
  }, [append, isInitialPromptSent, subtopic.title, topic.title, user]);

  const customHandleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    handleSubmit(e);
  };
  
  // A robust avatar function
  const getAvatarUrl = (role: string) => {
    if (role === 'user') {
      // Assuming profile might have an avatar_url, otherwise check user_metadata
      // @ts-ignore
      return profile?.avatar_url || user?.user_metadata?.avatar_url || '/user-avatar.png';
    }
    // Using a known working icon from your public folder
    return '/favicon.ico';
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 shadow-sm z-10">
        <div className="flex items-center space-x-4">
          <Link href="/" className="text-gray-500 hover:text-gray-800">
             &larr;
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-neutral-text dark:text-gray-200">{topic.title}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{subtopic.title}</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((m: VercelAIMessage) => (
          <div key={m.id} className={`flex items-start gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <img 
              src={getAvatarUrl(m.role)} 
              alt={m.role === 'user' ? 'User' : 'AI'} 
              className="w-8 h-8 rounded-full bg-white border border-gray-200"
            />
            <div
              className={`max-w-xl p-3 rounded-lg shadow-sm prose prose-sm break-words ${
                m.role === 'user'
                  ? 'bg-brand-primary text-white prose-invert'
                  : 'bg-white dark:bg-gray-700 dark:text-gray-200'
              }`}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {m.content}
              </ReactMarkdown>
            </div>
          </div>
        ))}

        {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
          <div className="flex items-start gap-3">
            <img src={getAvatarUrl('assistant')} alt="AI" className="w-8 h-8 rounded-full" />
            <div className="max-w-xl p-3 rounded-lg bg-white dark:bg-gray-700 shadow-sm">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3 md:p-4">
        {/* Restored Action Buttons */}
        <div className="flex items-center space-x-3 mb-3">
          <Link href="/goals" className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <PlusIcon className="h-5 w-5 mr-1.5" />
              Create Goal
            </Button>
          </Link>
          <Link href="/quizzes" className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <QuestionMarkCircleIcon className="h-5 w-5 mr-1.5" />
              Build Knowledge
            </Button>
          </Link>
        </div>
        
        <form onSubmit={customHandleSubmit} className="flex items-center space-x-2">
          <Input
            type="text"
            className="flex-grow"
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            disabled={isLoading || !isInitialPromptSent}
          />
          <Button
            type="submit"
            className="flex-shrink-0"
            disabled={isLoading || !isInitialPromptSent || !input.trim()}
          >
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}