'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Send, X, Loader2, Bot, User } from 'lucide-react'

export default function EliteAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [history, setHistory] = useState<{ role: 'user' | 'model', parts: { text: string }[] }[]>([])
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Scroll automatique vers le bas lors d'un nouveau message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [history])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || loading) return

    const userMessage = message
    setMessage('')
    setHistory(prev => [...prev, { role: 'user', parts: [{ text: userMessage }] }])
    setLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, history: history }),
      })

      const data = await response.json()
      if (data.text) {
        setHistory(prev => [...prev, { role: 'model', parts: [{ text: data.text }] }])
      }
    } catch (error) {
      console.error("Erreur assistant:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-[500] font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-20 right-0 w-[350px] max-w-[calc(100vw-2rem)] bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white overflow-hidden flex flex-col"
            style={{ height: '500px' }}
          >
            {/* Header Assistant */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                  <Sparkles size={20} className="text-white animate-pulse" />
                </div>
                <div>
                  <p className="text-white font-black text-sm uppercase tracking-widest">Elite CM</p>
                  <p className="text-white/70 text-[10px] font-bold uppercase tracking-tighter">Assistant Prestige</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/60 hover:text-white transition">
                <X size={20} />
              </button>
            </div>

            {/* Chat Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
              {history.length === 0 && (
                <div className="text-center py-10">
                  <div className="bg-amber-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-500">
                    <Bot size={32} />
                  </div>
                  <p className="text-gray-900 font-black text-sm mb-2">Comment puis-je vous aider ?</p>
                  <p className="text-gray-400 text-xs px-4">Je peux rédiger vos annonces, analyser vos statistiques ou vous aider à naviguer.</p>
                </div>
              )}
              
              {history.map((chat, i) => (
                <div key={i} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-[1.5rem] text-sm font-medium leading-relaxed shadow-sm ${
                    chat.role === 'user' 
                    ? 'bg-gray-900 text-white rounded-tr-none' 
                    : 'bg-white text-gray-700 border border-gray-100 rounded-tl-none'
                  }`}>
                    {chat.parts[0].text}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white p-4 rounded-[1.5rem] rounded-tl-none border border-gray-100 shadow-sm">
                    <Loader2 size={18} className="animate-spin text-amber-500" />
                  </div>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="p-4 bg-gray-50/50 border-t border-gray-100">
              <div className="relative">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Votre question prestige..."
                  className="w-full bg-white border-none rounded-2xl py-4 pl-5 pr-12 text-sm font-bold shadow-sm focus:ring-4 focus:ring-amber-500/5 transition-all outline-none"
                />
                <button
                  type="submit"
                  disabled={!message.trim() || loading}
                  className="absolute right-2 top-2 bg-amber-500 text-white p-2 rounded-xl shadow-lg shadow-amber-500/20 active:scale-90 transition-all disabled:opacity-30"
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bouton Flottant Gold */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gradient-to-r from-amber-400 to-amber-600 text-white w-16 h-16 rounded-[1.8rem] flex items-center justify-center shadow-2xl shadow-amber-500/40 relative border-4 border-white active:scale-90 transition-transform"
      >
        <Sparkles size={28} className={isOpen ? 'rotate-90 transition-transform' : ''} />
        {/* Badge Notification */}
        {!isOpen && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-white rounded-full" />
        )}
      </motion.button>
    </div>
  )
}