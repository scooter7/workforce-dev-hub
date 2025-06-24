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
import Image from 'next/image'; // Import the Next.js Image component
import { UserCircle2 } from 'lucide-react'; // Bot icon is no longer needed

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
  
  const getAvatar = (role: string) => {
    const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;

    if (role === 'user') {
      return avatarUrl ? (
        <img src={avatarUrl} alt="User" className="w-8 h-8 rounded-full" />
      ) : (
        <UserCircle2 className="w-8 h-8 rounded-full text-gray-400" />
      );
    }
    
    // For the assistant, return the custom image
    return (
      <Image
        src="/chatavatar.png" // Path to your image in the /public directory
        alt="AI Assistant"
        width={32}
        height={32}
        className="rounded-full"
      />
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 shadow-sm z-10">
        <div className="flex items-center space-x-4">
          <Link href="/" className="text-gray-500 hover:text-gray-800" title="Back to Explore">
             &larr;
          </Link>
          <div>
            <h1 className="text-lg font-bold text-neutral-text dark:text-gray-200">{topic.title}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{subtopic.title}</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((m: VercelAIMessage) => (
          <div key={m.id} className={`flex items-start gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white flex items-center justify-center border border-gray-200">
              {getAvatar(m.role)}
            </div>
            <div
              className={`max-w-xl p-3 rounded-xl shadow-sm prose prose-sm break-words ${
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
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white flex items-center justify-center border border-gray-200">
               {/* Use the custom image for the loading indicator as well */}
              <Image
                src="/chatavatar.png"
                alt="AI Assistant"
                width={32}
                height={32}
                className="rounded-full"
              />
            </div>
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
