'use client';

import { useChat, type Message as VercelAIMessage } from 'ai/react';
import { useState, useEffect, useRef, FormEvent } from 'react';
import { Topic, SubTopic } from '@/lib/constants';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import { PlusIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/solid';


interface ChatInterfaceProps {
  topic: Topic;
  subtopic?: SubTopic;
  initialSystemMessage: string;
  knowledgeBaseScope: { topicId: string; subtopicId?: string };
  userId: string;
}

const aiWelcomeMessage = `Welcome to Your LifeRamp AI Coach Concierge!

Meet your personal AI-powered coach — always here to support your growth, career moves, and personal well-being. Whether you're navigating a career transition, seeking to level up your leadership skills, or just need help staying focused and balanced, your concierge is just a tap away.

Think of this as your 24/7 thinking partner — ready to provide smart suggestions, guide you through exercises, answer questions, or help you prepare for your next big step. And when you need a human touch, we’ll connect you with one of our certified LifeRamp coaches.

Let’s build your path forward — one powerful step at a time.`;

export default function ChatInterface({
  topic,
  subtopic,
  initialSystemMessage,
  knowledgeBaseScope,
  userId,
}: ChatInterfaceProps) {
  const [isMounted, setIsMounted] = useState(false);
  const initialLoadDoneRef = useRef(false);

  const { messages, input, handleInputChange, handleSubmit, isLoading, error, append } =
    useChat({
      api: '/api/chat',
      body: {
        knowledgeBaseScope,
        userId,
      },
      initialMessages: [
        {
          id: 'system-init', // For the system prompt (invisible to user)
          role: 'system',
          content: initialSystemMessage,
        },
        {
          id: 'ai-welcome-message', // Unique ID for the AI's welcome message
          role: 'assistant',
          content: aiWelcomeMessage,
        }
      ],
      onFinish: (_message) => {
        // Optional: console.log('AI finished responding. Message ID:', message.id);
      },
      onError: (err) => {
        console.error("Chat error in useChat hook:", err);
      }
    });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setIsMounted(true);
    initialLoadDoneRef.current = false; // Reset this when topic/subtopic changes
  }, [topic.id, subtopic?.id]);

  useEffect(() => {
    if (isMounted && !initialLoadDoneRef.current && topic?.title) {
      // Check messages visible to user (assistant and user roles)
      // We expect the AI welcome message to be present.
      const actualChatMessages = messages.filter(m => m.role === 'user' || m.role === 'assistant');
      
      // If only the AI welcome message is present from the assistant, then append the user's first prompt.
      if (actualChatMessages.length === 1 && actualChatMessages[0].role === 'assistant') {
        append({
          role: 'user',
          content: `Hi! I'm interested in learning about ${subtopic?.title ? `${subtopic.title} within ${topic.title}` : topic.title}. Can you give me a brief introduction or some key points to start with?`
        });
        initialLoadDoneRef.current = true;
      } else if (actualChatMessages.length === 0) {
        // This case should be less likely if initialMessages includes the AI welcome.
        // But as a fallback if something clears messages:
         append({
          role: 'user',
          content: `Hi! I'm interested in learning about ${subtopic?.title ? `${subtopic.title} within ${topic.title}` : topic.title}. Can you give me a brief introduction or some key points to start with?`
        });
        initialLoadDoneRef.current = true;
      }
    }
  }, [isMounted, messages, append, topic, subtopic]);


  const customHandleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    handleSubmit(e);
  };

  // Filter out system messages before displaying
  const displayedMessages = messages.filter(m => m.role !== 'system');

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-inner overflow-hidden">
      <div className="flex-grow p-4 md:p-6 space-y-4 overflow-y-auto">
        {displayedMessages.map((m: VercelAIMessage) => (
          <div
            key={m.id}
            className={`flex ${
              m.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`px-4 py-2 rounded-xl shadow prose prose-sm max-w-full break-words ${
                m.role === 'user'
                  ? 'bg-brand-primary text-white prose-invert max-w-xs md:max-w-md lg:max-w-lg'
                  : 'bg-gray-100 text-gray-800 max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-3xl'
              }`}
            >
              {m.role === 'assistant' ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {m.content}
                </ReactMarkdown>
              ) : (
                <p className="whitespace-pre-wrap">{m.content}</p>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {isLoading && (
        <div className="p-4 text-center text-sm text-gray-500 border-t">
          AI is thinking...
        </div>
      )}
      {error && (
        <div className="p-4 text-center text-sm text-red-500 border-t">
          Error: {error.message || 'An error occurred.'} Please try again or refresh.
        </div>
      )}

      <div className="border-t border-gray-200 p-3 md:p-4 bg-gray-50">
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
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            className="flex-grow !shadow-none !border-gray-300 focus:!border-brand-primary focus:!ring-brand-primary"
            disabled={isLoading}
            autoFocus
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? 'Sending...' : 'Send'}
          </Button>
        </form>
      </div>
    </div>
  );
}