
import React, { useState, useRef, useEffect } from 'react';
import { Resizable } from 're-resizable';
import { Bot, Send, X, Info, Copy, MessageCircleQuestion } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const examplePrompts = [
  'What is a leaked PDF?',
  'What does this GitHub link mean?',
  'Is my domain at risk?',
  'How to fix exposed directories?',
  'Summarize my scan results.'
];

const faqs = [
  {
    question: 'What is a leaked PDF?',
    answer: 'A leaked PDF is a document that has been made publicly accessible, often unintentionally. It may contain sensitive or confidential information. If you find a PDF in your scan results, review its contents and remove or secure it if necessary.'
  },
  {
    question: 'What does this GitHub link mean?',
    answer: 'A GitHub link in your scan results points to a file or repository that may contain your domain or sensitive data. Review the linked content and remove any exposed secrets or credentials.'
  },
  {
    question: 'Is my domain at risk?',
    answer: 'If your scan results show exposed files, directories, or credentials, your domain may be at risk. Follow the recommended protection steps to secure your assets.'
  },
  {
    question: 'How to fix exposed directories?',
    answer: 'Restrict public access to sensitive directories using server configuration, authentication, or by removing unnecessary files. Regularly audit your web server for exposures.'
  },
  {
    question: 'How do I protect my site from leaks?',
    answer: 'Use strong passwords, limit public file access, monitor for new exposures, and remove sensitive data from public repositories.'
  }
];



const SYSTEM_PROMPT = `You are a helpful assistant in a domain leak scanner platform. Your job is to help users understand the scan results (PDF leaks, exposed directories, GitHub repos) and guide them with clear, simple advice. You do not perform scans. You explain risks, offer protection tips, and respond like a human guide. Do not expose backend logic. Speak simply and professionally.`;

const ChatBot = ({ scanContext }) => {
  const [messages, setMessages] = useState([
    { role: 'bot', content: 'Hi! I am HCARF AI Assistant. Ask me anything about your scan results, leaks, or GitHub exposures!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [suggestions, setSuggestions] = useState(examplePrompts);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (open && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  const sendMessage = async (msg) => {
    if (!msg.trim()) return;
    setMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setInput('');
    setLoading(true);
    setSuggestions([]);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, scanContext, systemPrompt: SYSTEM_PROMPT })
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'bot', content: data.reply || 'Sorry, I could not answer that.' }]);
      // Suggest follow-up prompts
      setSuggestions([
        'Summarize my scan results.',
        'What should I do next?',
        'How do I protect my site from leaks?'
      ]);
    } catch {
      setMessages((prev) => [...prev, { role: 'bot', content: 'AI service unavailable.' }]);
    }
    setLoading(false);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <>
      {/* Floating Chat Button */}
      {/* Floating Chat Button */}
      <div className="fixed bottom-8 right-8 z-50">
        {!open && (
          <Button size="icon" aria-label="Open chat" className="rounded-full bg-gradient-to-r from-purple-600 to-pink-500 shadow-xl hover:scale-110 transition-transform" onClick={() => setOpen(true)}>
            <Bot className="h-7 w-7 text-white" />
          </Button>
        )}
      </div>
      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-24 right-8 z-50 max-w-full animate-fade-in cursor-move">
          <Resizable
            defaultSize={{ width: 360, height: 480 }}
            minWidth={280}
            minHeight={320}
            maxWidth={520}
            maxHeight={700}
            enable={{ top:false, right:true, bottom:true, left:false, topRight:true, bottomRight:true, bottomLeft:false, topLeft:false }}
            className="rounded-2xl shadow-2xl border border-slate-700 bg-slate-900/95 dark:bg-slate-900/95 bg-white/95"
          >
            <Card className="bg-transparent border-none shadow-none rounded-2xl h-full">
              <CardContent className="p-0 flex flex-col h-full">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-gradient-to-r from-purple-700 to-pink-600 rounded-t-2xl">
                <div className="flex items-center gap-2 text-white font-bold text-lg">
                  <Bot className="h-5 w-5" /> HCARF AI
                </div>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="ghost" aria-label="FAQ" onClick={() => setShowFAQ((v) => !v)}>
                    <MessageCircleQuestion className="h-5 w-5 text-white" />
                  </Button>
                  <Button size="icon" variant="ghost" aria-label="Close chat" onClick={() => setOpen(false)}>
                    <X className="h-5 w-5 text-white" />
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 bg-slate-900/80 dark:bg-slate-900/80 bg-white/80">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`rounded-xl px-3 py-2 max-w-[80%] text-sm ${m.role === 'user' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-100 border border-purple-700 dark:bg-slate-800 bg-white border border-purple-200'}`}>
                      {m.content}
                      {m.role === 'bot' && (
                        <Button size="icon" variant="ghost" className="ml-2 p-1" aria-label="Copy protection steps" onClick={() => handleCopy(m.content)}>
                          <Copy className="h-4 w-4 text-purple-400" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <form className="flex items-center gap-2 p-3 border-t border-slate-700 bg-slate-900/90 dark:bg-slate-900/90 bg-white/90" onSubmit={e => { e.preventDefault(); sendMessage(input); }}>
                <Input
                  className="flex-1 bg-slate-800 border-slate-700 text-white dark:bg-slate-800 dark:text-white bg-white text-black placeholder-slate-400 rounded-full px-4 py-2"
                  placeholder="Ask about your scan results..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
                <Button type="submit" size="icon" className="rounded-full bg-gradient-to-r from-purple-600 to-pink-500" disabled={loading || !input.trim()}>
                  <Send className="h-5 w-5 text-white" />
                </Button>
              </form>
              {/* Example prompts and suggestions */}
              <div className="px-4 pb-3 pt-1 text-xs text-slate-400 flex flex-wrap gap-2">
                {(suggestions.length > 0 ? suggestions : examplePrompts).map((p, i) => (
                  <button
                    key={i}
                    className="bg-slate-800 border border-purple-700 rounded-full px-3 py-1 hover:bg-purple-700 hover:text-white transition-colors"
                    onClick={e => { e.preventDefault(); setInput(p); }}
                  >
                    {p}
                  </button>
                ))}
              </div>
              {/* FAQ Panel */}
              {showFAQ && (
                <div className="absolute bottom-20 right-0 w-full max-w-xs bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 rounded-xl shadow-xl p-4 z-50 animate-fade-in">
                  <div className="flex items-center mb-2 text-purple-700 dark:text-purple-300 font-bold"><Info className="h-4 w-4 mr-2" />FAQs</div>
                  {faqs.map((faq, i) => (
                    <div key={i} className="mb-3">
                      <div className="font-semibold text-black dark:text-white mb-1">{faq.question}</div>
                      <div className="text-xs text-gray-700 dark:text-gray-300 mb-1">{faq.answer}</div>
                      <Button size="sm" variant="outline" className="text-xs px-2 py-1" onClick={() => handleCopy(faq.answer)}>
                        <Copy className="h-3 w-3 mr-1 inline" /> Copy Steps
                      </Button>
                    </div>
                  ))}
                  <Button size="sm" variant="ghost" className="mt-2 w-full" onClick={() => setShowFAQ(false)}>Close FAQ</Button>
                </div>
              )}
              </CardContent>
            </Card>
          </Resizable>
        </div>
      )}
    </>
  );
};

export default ChatBot;
