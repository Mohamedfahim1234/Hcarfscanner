import React from 'react';
import { Bot, User } from 'lucide-react';

export default function AIAssistantMessage({ message }) {
  const isUser = message.role === 'user';
  const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  return (
    <div className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && <Bot className="w-6 h-6 text-purple-500" />}
      <div className={`rounded-xl px-4 py-2 max-w-[75%] text-sm shadow ${isUser ? 'bg-purple-600 text-white' : 'bg-white dark:bg-slate-800 text-black dark:text-white border border-purple-200 dark:border-purple-700'}`}>
        <div>{message.content}</div>
        <div className="text-xs text-right text-slate-400 mt-1">{time}</div>
      </div>
      {isUser && <User className="w-6 h-6 text-slate-400" />}
    </div>
  );
}
