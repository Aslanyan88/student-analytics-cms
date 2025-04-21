'use client';

import React, { useState } from 'react';
import { OpenAI } from "openai";
import { Send, Bot, Loader2, X, MinusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize: () => void;
}

export default function AIAssistant({ isOpen, onClose, onMinimize }: AIAssistantProps) {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const client = new OpenAI({
        apiKey: process.env.NEXT_PUBLIC_KLUSTER_API_KEY || "89858956-0641-439a-8d70-6cb90053a326",
        baseURL: process.env.NEXT_PUBLIC_KLUSTER_BASE_URL || "https://api.kluster.ai/v1",
        dangerouslyAllowBrowser: true // Enable browser usage with caution
      });
      
      const completion = await client.chat.completions.create({
        model: "klusterai/Meta-Llama-3.1-8B-Instruct-Turbo",
        messages: [
          { role: "user", content: prompt }
        ]
      });
      
      setResponse(completion.choices[0]?.message?.content || "No response received.");
      setPrompt('');
    } catch (err: any) {
      console.error("AI Assistant error:", err);
      setError(err.message || "Failed to get a response from the AI assistant.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white rounded-lg shadow-xl z-50 border border-gray-200 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-primary px-4 py-3 text-white flex justify-between items-center">
        <div className="flex items-center">
          <Bot className="h-5 w-5 mr-2" />
          <h3 className="font-medium">AI Assistant</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={onMinimize} className="text-white hover:text-gray-200 focus:outline-none">
            <MinusCircle className="h-4 w-4" />
          </button>
          <button onClick={onClose} className="text-white hover:text-gray-200 focus:outline-none">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {/* Chat content */}
      <div className="p-4 max-h-96 overflow-y-auto flex-1 bg-gray-50">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md mb-3 text-sm">
            {error}
          </div>
        )}
        
        {!response && !error && (
          <div className="text-gray-500 text-sm">
            How can I help you today?
          </div>
        )}
        
        {response && (
          <div className="bg-blue-50 p-3 rounded-md mb-3 text-sm">
            <p className="text-gray-900">{response}</p>
          </div>
        )}
      </div>
      
      {/* Input form */}
      <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-200">
        <div className="flex space-x-2">
          <textarea
            placeholder="Ask me anything..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="flex-1 border border-gray-300 rounded-md p-2 text-sm min-h-[60px] max-h-32 resize-none focus:ring-2 focus:ring-primary focus:border-primary"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            onClick={handleSubmit}
            disabled={isLoading || !prompt.trim()}
            className="bg-primary hover:bg-primary/90 self-end"
            size="sm"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}