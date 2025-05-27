'use client';

import { useChat, type Message as VercelAIMessage } from 'ai/react';
import { useState, useEffect, useRef, FormEvent } from 'react';
import { Topic, SubTopic } from '@/lib/constants';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
// import DOMPurify from 'dompurify'; // <<< REMOVED if sanitizeHtml is removed

interface ChatInterfaceProps {
  topic: Topic;
  subtopic?: SubTopic;
  initialSystemMessage: string;
  knowledgeBaseScope: { topicId: string; subtopicId?: string };
  userId: string;
}

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
          id: 'system-init',
          role: 'system',
          content: initialSystemMessage,
        },
      ],
      onFinish: (message) => {
        console.log('AI finished responding. Message ID:', message.id);
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
    initialLoadDoneRef.current = false;
  }, [topic.id, subtopic?.id]);

  useEffect(() => {
    if (isMounted && !initialLoadDoneRef.current && topic?.title) {
      const nonSystemMessages = messages.filter(m => m.role === 'user' || m.role === 'assistant');
      if (nonSystemMessages.length === 0) {
        append({
          role: 'user',
          content: `Hi! I'm interested in learning about ${subtopic?.title ? `${subtopic.title} within ${topic.title}` : topic.title}. Can you give me a brief introduction or some key points to start with?`
        });
        initialLoadDoneRef.current = true;
      }
    }
  }, [isMounted, messages, append, topic, subtopic, initialSystemMessage]);

  const customHandleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    handleSubmit(e);
  };

  const displayedMessages = messages.filter(m => m.role !== 'system');

  // SanitizeHtml function removed as it was unused
  // const sanitizeHtml = (htmlContent: string) => { ... };

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