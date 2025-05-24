'use client';

import { useChat, type Message as VercelAIMessage } from 'ai/react';
import { useState, useEffect, useRef, FormEvent } from 'react';
import { Topic, SubTopic } from '@/lib/constants';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
// import ReactMarkdown from 'react-markdown';
// import remarkGfm from 'remark-gfm';

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
  const initialLoadDoneRef = useRef(false); // To ensure initial prompt is sent only once per topic load

  const { messages, input, handleInputChange, handleSubmit, isLoading, error, setMessages, append } =
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
        console.log('AI finished responding:', message);
        // Example: fetch('/api/points/add', { method: 'POST', body: JSON.stringify({ userId, action: 'chat_message' }) });
      },
      onError: (err) => {
        console.error("Chat error:", err);
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
    // Reset initial load flag when topic changes, so new topic gets intro message
    initialLoadDoneRef.current = false;
  }, [topic.id, subtopic?.id]); // Depend on topic/subtopic ID

  // Effect to send an initial prompt when the chat for a new topic loads
  useEffect(() => {
    if (isMounted && !initialLoadDoneRef.current && topic?.title) {
      // Check if the only message is the system message, or if there are no assistant/user messages yet
      const nonSystemMessages = messages.filter(m => m.role === 'user' || m.role === 'assistant');
      if (nonSystemMessages.length === 0) {
        append({
          role: 'user', // This will appear as a user message, initiating the AI's response
          content: `Hi! I'm interested in learning about ${subtopic?.title ? `${subtopic.title} within ${topic.title}` : topic.title}. Can you give me a brief introduction or some key points to start with?`
        });
        initialLoadDoneRef.current = true; // Mark that initial prompt has been sent
      }
    }
  }, [isMounted, messages, append, topic, subtopic, initialSystemMessage]); // Add initialSystemMessage to re-trigger if it changes based on topic


  const customHandleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    handleSubmit(e); // This sends the user's typed message
  };

  const displayedMessages = messages.filter(m => m.role !== 'system');

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-inner overflow-hidden">
      <div className="flex-grow p-4 md:p-6 space-y-4 overflow-y-auto">
        {/* Display only user and assistant messages */}
        {displayedMessages.map((m: VercelAIMessage) => (
          <div
            key={m.id}
            className={`flex ${
              m.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-xl shadow ${
                m.role === 'user'
                  ? 'bg-brand-primary text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {isLoading && ( // Show loading indicator when AI is thinking OR when the initial message is being sent
        <div className="p-4 text-center text-sm text-gray-500 border-t">
          AI is thinking...
        </div>
      )}
      {error && (
        <div className="p-4 text-center text-sm text-red-500 border-t">
          Error: {error.message || 'An error occurred.'} Please try again.
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
            disabled={isLoading} // Disable input while AI is processing or initial message is sending
            autoFocus
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading && messages.length > displayedMessages.length ? 'Sending...' : 'Send'} {/* More specific loading for user input */}
          </Button>
        </form>
      </div>
    </div>
  );
}