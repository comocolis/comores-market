'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Send, X, Loader2, Bot, GripVertical } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

export default function EliteAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [history, setHistory] = useState<{ role: 'user' | 'model', parts: { text: string }[] }[]>([])
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const constraintsRef = useRef(null)

  // Scroll automatique vers le bas
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [history, loading])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || loading) return

    const userMessage = message
    setMessage('')
    
    // Historique local pour l'affichage immédiat
    const newHistory = [...history, { role: 'user' as const, parts: [{ text: userMessage }] }]
    setHistory(newHistory)
    setLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, history: history }),
      })

      const data = await response.json()
      if (data.text) {
        // Normalisation NFC pour la propreté des caractères [cite: 2025-12-17]
        const cleanText = data.text.normalize("NFC")
        setHistory(prev => [...prev, { role: 'model', parts: [{ text: cleanText }] }])
      }
    } catch (error) {
      console.error("Erreur Elite CM:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Zone de mouvement pour le bouton draggable */}
      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-[499]" />

      <motion.div 
        drag 
        dragConstraints={constraintsRef}
        dragElastic={0.1}
        dragMomentum={false}
        className="fixed bottom-28 right-6 z-[500] font-sans pointer-events-auto touch-none"
      >
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute bottom-20 right-0 w-[350px] max-w-[calc(100vw-2rem)] bg-white/98 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white overflow-hidden flex flex-col"
              style={{ height: '520px' }}
            >
              {/* Header Prestige */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-6 flex justify-between items-center cursor-default">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-xl">
                    <Sparkles size={20} className="text-white animate-pulse" />
                  </div>
                  <div>
                    <p className="text-white font-black text-sm uppercase tracking-widest">Elite CM</p>
                    <p className="text-white/70 text-[10px] font-bold uppercase tracking-tighter">Assistant Showroom</p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-white/60 hover:text-white transition">
                  <X size={20} />
                </button>
              </div>

              {/* Chat - Zone de messages avec rendu Markdown corrigé */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide bg-slate-50/50">
                {history.length === 0 && (
                  <div className="text-center py-10">
                    <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600 shadow-inner">
                      <Bot size={32} />
                    </div>
                    <p className="text-gray-900 font-black text-sm mb-1">Expert Comores Market</p>
                    <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest px-4">Sublimons vos échanges</p>
                  </div>
                )}
                
                {history.map((chat, i) => (
                  <div key={i} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-[1.5rem] text-sm shadow-sm ${
                      chat.role === 'user' 
                      ? 'bg-gray-900 text-white rounded-tr-none' 
                      : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none font-medium'
                    }`}>
                      {/* Correction du bug TypeScript : Wrapper div pour le style */}
                      <div className="whitespace-pre-wrap leading-relaxed prose prose-sm prose-p:my-0 prose-strong:text-amber-600 prose-strong:font-bold">
                        <ReactMarkdown>
                          {chat.parts[0].text}
                        </ReactMarkdown>
                      </div>
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

              {/* Input Zone */}
              <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100">
                <div className="relative">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Votre question prestige..."
                    className="w-full bg-gray-50 rounded-2xl py-4 pl-5 pr-12 text-sm font-bold shadow-inner focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
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

        {/* Bouton d'activation (Draggable) */}
        <motion.div className="relative group cursor-grab active:cursor-grabbing">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white border shadow-sm rounded-full px-2">
            <GripVertical size={12} className="text-gray-400" />
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 text-white w-16 h-16 rounded-[1.8rem] flex items-center justify-center shadow-2xl shadow-amber-500/40 border-4 border-white transition-all overflow-hidden"
          >
            <Sparkles size={28} className={isOpen ? 'rotate-12 scale-110 transition-transform' : ''} />
            {!isOpen && (
              <span className="absolute top-2 right-2 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
              </span>
            )}
          </button>
        </motion.div>
      </motion.div>
    </>
  )
}