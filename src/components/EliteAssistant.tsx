'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Send, X, Loader2, Bot, GripVertical } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

export default function EliteAssistant() {
  const [isVisible, setIsVisible] = useState(true)
  
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [history, setHistory] = useState<{ role: 'user' | 'model', parts: { text: string }[] }[]>([])
  const [loading, setLoading] = useState(false)
  
  const scrollRef = useRef<HTMLDivElement>(null)
  const constraintsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [history, loading, isOpen])

  // --- CORRECTION DÉFINITIVE ---
  // Utilisation de new RegExp pour éviter la confusion avec la division "/"
  const cleanResponse = (text: string) => {
    if (!text) return "";
    
    let cleaned = text;
    // On remplace les motifs techniques un par un
    cleaned = cleaned.replace(new RegExp("\\(Supabase\\s*\\[.*?\\]\\)", "gi"), "");
    cleaned = cleaned.replace(new RegExp("\\(Source\\s*\\[.*?\\]\\)", "gi"), "");
    cleaned = cleaned.replace(new RegExp("\\", "g"), "");
    
    return cleaned.trim();
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || loading) return

    const userMessage = message
    setMessage('')
    
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
        const cleanText = cleanResponse(data.text).normalize("NFC")
        setHistory(prev => [...prev, { role: 'model', parts: [{ text: cleanText }] }])
      }
    } catch (error) {
      console.error("Erreur Elite CM:", error)
      setHistory(prev => [...prev, { role: 'model', parts: [{ text: "Je ne parviens pas à répondre pour le moment." }] }])
    } finally {
      setLoading(false)
    }
  }

  if (!isVisible) return null

  return (
    <>
      <div 
        ref={constraintsRef} 
        className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-120 h-full z-50 pointer-events-none"
      >
        <motion.div 
          drag 
          dragConstraints={constraintsRef}
          dragElastic={0.1}
          dragMomentum={false}
          className="absolute bottom-32 right-4 pointer-events-auto touch-none"
        >
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  onPointerDown={(e) => e.stopPropagation()} 
                  className="absolute bottom-20 right-0 w-85 max-w-[calc(100vw-32px)] bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col origin-bottom-right cursor-default"
                  style={{ height: '520px', maxHeight: '60vh' }}
                >
                  <div className="bg-linear-to-r from-amber-500 to-orange-600 p-5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 p-2 rounded-xl">
                        <Sparkles size={18} className="text-white animate-pulse" />
                      </div>
                      <div>
                        <p className="text-white font-black text-sm uppercase tracking-widest">Elite CM</p>
                        <p className="text-white/70 text-[10px] font-bold uppercase tracking-tighter">Assistant Showroom</p>
                      </div>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="text-white/60 hover:text-white transition bg-white/10 p-2 rounded-full">
                      <X size={18} />
                    </button>
                  </div>

                  <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-hide bg-slate-50/50">
                    {history.length === 0 && (
                      <div className="text-center py-8">
                        <div className="bg-amber-100 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600 shadow-inner">
                          <Bot size={28} />
                        </div>
                        <p className="text-gray-900 font-black text-sm mb-1">Bonjour !</p>
                        <p className="text-gray-500 text-xs font-medium px-4 leading-relaxed">
                          Je suis l'IA de Comores Market. Je peux vous aider à trouver une voiture, estimer un prix ou rédiger une annonce.
                        </p>
                      </div>
                    )}
                    
                    {history.map((chat, i) => (
                      <div key={i} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3.5 rounded-[1.2rem] text-sm shadow-sm leading-relaxed ${
                          chat.role === 'user' 
                          ? 'bg-gray-900 text-white rounded-tr-none' 
                          : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none font-medium'
                        }`}>
                          <div className="prose prose-sm prose-p:my-1 prose-strong:text-amber-600 prose-strong:font-black prose-ul:pl-4 prose-li:marker:text-amber-500">
                            <ReactMarkdown>
                              {chat.parts[0].text}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    ))}

                    {loading && (
                      <div className="flex justify-start">
                        <div className="bg-white p-3 rounded-[1.2rem] rounded-tl-none border border-gray-100 shadow-sm flex items-center gap-2">
                          <Loader2 size={14} className="animate-spin text-amber-500" />
                          <span className="text-[10px] font-bold text-gray-400 animate-pulse">Réflexion...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-50">
                    <div className="relative">
                      <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Poser une question..."
                        className="w-full bg-gray-50 rounded-2xl py-3.5 pl-4 pr-12 text-xs font-bold shadow-inner focus:ring-2 focus:ring-amber-500/20 outline-none transition-all placeholder:text-gray-400"
                      />
                      <button
                        type="submit"
                        disabled={!message.trim() || loading}
                        className="absolute right-1.5 top-1.5 bg-amber-500 text-white p-2 rounded-xl shadow-lg shadow-amber-500/20 active:scale-90 transition-all disabled:opacity-30 disabled:shadow-none"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div 
                className="relative group cursor-grab active:cursor-grabbing"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
              {!isOpen && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsVisible(false)
                  }}
                  className="absolute -top-2 -left-2 w-6 h-6 bg-white text-gray-400 rounded-full flex items-center justify-center shadow-md border border-gray-100 hover:bg-red-500 hover:text-white transition-colors z-50 active:scale-90"
                >
                  <X size={12} strokeWidth={3} />
                </button>
              )}

              <div className="absolute -top-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 rounded-full p-1">
                 <GripVertical size={12} />
              </div>

              <button
                onClick={() => setIsOpen(!isOpen)}
                onPointerDown={(e) => isOpen && e.stopPropagation()} 
                className="bg-linear-to-br from-amber-400 via-amber-500 to-orange-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl shadow-amber-500/40 border-4 border-white transition-all overflow-hidden"
              >
                <Sparkles size={24} className={isOpen ? 'rotate-12 scale-110 transition-transform' : ''} />
                {!isOpen && (
                  <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  </span>
                )}
              </button>
            </motion.div>

        </motion.div>
      </div>
    </>
  )
}