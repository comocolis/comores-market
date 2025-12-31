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
  
  // Référence pour la zone limite (le cadre mobile)
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
      {/* 1. LA CAGE INVISIBLE (CONRAINTS)
        Elle se positionne exactement comme l'app mobile (centrée, max-480px).
        Le bouton ne pourra pas sortir de cette div.
      */}
      <div 
        ref={constraintsRef} 
        className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] h-full z-[500] pointer-events-none"
      >
        
        {/* 2. L'ÉLÉMENT DÉPLAÇABLE (DRAGGABLE)
          Il est en absolute DANS la cage.
        */}
        <motion.div 
          drag 
          dragConstraints={constraintsRef}
          dragElastic={0.1} // Effet élastique sur les bords
          dragMomentum={false} // S'arrête net quand on lâche
          className="absolute bottom-32 right-4 pointer-events-auto touch-none"
        >
            
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  // Empêche le drag quand on clique DANS la fenêtre de chat
                  onPointerDown={(e) => e.stopPropagation()} 
                  className="absolute bottom-20 right-0 w-[340px] max-w-[calc(100vw-32px)] bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col origin-bottom-right cursor-default"
                  style={{ height: '520px', maxHeight: '60vh' }}
                >
                  {/* Header Prestige */}
                  <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-5 flex justify-between items-center">
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

                  {/* Chat - Zone de messages */}
                  <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-hide bg-slate-50/50">
                    {history.length === 0 && (
                      <div className="text-center py-8">
                        <div className="bg-amber-100 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600 shadow-inner">
                          <Bot size={28} />
                        </div>
                        <p className="text-gray-900 font-black text-sm mb-1">Expert Comores Market</p>
                        <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest px-4">Je vous écoute.</p>
                      </div>
                    )}
                    
                    {history.map((chat, i) => (
                      <div key={i} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3.5 rounded-[1.2rem] text-sm shadow-sm leading-relaxed ${
                          chat.role === 'user' 
                          ? 'bg-gray-900 text-white rounded-tr-none' 
                          : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none font-medium'
                        }`}>
                          <div className="prose prose-sm prose-p:my-0 prose-strong:text-amber-600 prose-strong:font-bold">
                            <ReactMarkdown>
                              {chat.parts[0].text}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    ))}

                    {loading && (
                      <div className="flex justify-start">
                        <div className="bg-white p-3 rounded-[1.2rem] rounded-tl-none border border-gray-100 shadow-sm">
                          <Loader2 size={16} className="animate-spin text-amber-500" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input Zone */}
                  <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-50">
                    <div className="relative">
                      <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Poser une question..."
                        className="w-full bg-gray-50 rounded-2xl py-3.5 pl-4 pr-12 text-xs font-bold shadow-inner focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                      />
                      <button
                        type="submit"
                        disabled={!message.trim() || loading}
                        className="absolute right-1.5 top-1.5 bg-amber-500 text-white p-2 rounded-xl shadow-lg shadow-amber-500/20 active:scale-90 transition-all disabled:opacity-30"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bouton d'activation (Draggable Handle) */}
            <motion.div 
                className="relative group cursor-grab active:cursor-grabbing"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
              {/* Indicateur visuel de drag (poignée) */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 rounded-full p-1">
                 <GripVertical size={12} />
              </div>

              <button
                onClick={() => setIsOpen(!isOpen)}
                // Stop propagation ici pour éviter de déclencher un drag si on clique juste
                onPointerDown={(e) => isOpen && e.stopPropagation()} 
                className="bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl shadow-amber-500/40 border-4 border-white transition-all overflow-hidden"
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