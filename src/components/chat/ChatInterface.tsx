'use client';

import { useChat, type Message as VercelAIMessage } from 'ai/react';
import { useState, useEffect, useRef, FormEvent } from 'react';
import { Topic, SubTopic } from '@/lib/constants';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ReactMarkdown from 'react-markdown'; // <<< ADDED IMPORT
import remarkGfm from 'remark-gfm';         // <<< ADDED IMPORT
import DOMPurify from 'dompurify';          // <<< ADDED IMPORT FOR SANITIZATION (Good Practice)


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

  // Sanitize HTML content before rendering (important if using ReactMarkdown with html passthrough or custom renderers)
  const sanitizeHtml = (htmlContent: string) => {
    if (typeof window !== 'undefined') { // DOMPurify only runs on the client
        return DOMPurify.sanitize(htmlContent, { USE_PROFILES: { html: true } });
    }
    return htmlContent; // Return as is during SSR (ReactMarkdown should handle basic MD safely)
  };


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
              className={`px-4 py-2 rounded-xl shadow prose prose-sm max-w-full break-words ${ // Added prose classes, adjusted max-width
                m.role === 'user'
                  ? 'bg-brand-primary text-white prose-invert max-w-xs md:max-w-md lg:max-w-lg' // User messages can keep their max-width
                  : 'bg-gray-100 text-gray-800 max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-3xl' // AI messages wider
              }`}
            >
              {/* Render AI messages with ReactMarkdown, user messages as plain text */}
              {m.role === 'assistant' ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  // For security with remarkGfm, ensure html is handled safely if you enable it.
                  // By default, react-markdown sanitizes HTML.
                  // If you use components prop to render HTML, ensure those are safe.
                  // Example: to pass HTML through (less safe unless content is 100% trusted or sanitized before):
                  // rehypePlugins={[rehypeRaw]}
                  // children={m.content}
                  // Using children prop directly is safer for standard markdown.
                >
                  {m.content}
                </ReactMarkdown>
              ) : (
                <p className="whitespace-pre-wrap">{m.content}</p> // User messages as plain text
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