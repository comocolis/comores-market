'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Send, X, Loader2, Bot, GripVertical } from 'lucide-react'

export default function EliteAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [history, setHistory] = useState<{ role: 'user' | 'model', parts: { text: string }[] }[]>([])
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  
  // Référence pour les limites du déplacement (l'écran)
  const constraintsRef = useRef(null)

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
    <>
      {/* Zone invisible pour limiter le drag à l'écran */}
      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-[499]" />

      <motion.div 
        drag 
        dragConstraints={constraintsRef}
        dragElastic={0.1}
        dragMomentum={false}
        // Position initiale : plus haut (bottom-28) pour ne pas gêner le BottomNav
        className="fixed bottom-28 right-6 z-[500] font-sans pointer-events-auto touch-none"
      >
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              // On empêche le drag de fermer la fenêtre quand on clique à l'intérieur
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute bottom-20 right-0 w-[350px] max-w-[calc(100vw-2rem)] bg-white/90 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white overflow-hidden flex flex-col"
              style={{ height: '500px' }}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 flex justify-between items-center cursor-default">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-xl">
                    <Sparkles size={20} className="text-white animate-pulse" />
                  </div>
                  <div>
                    <p className="text-white font-black text-sm uppercase tracking-widest">Elite CM</p>
                    <p className="text-white/70 text-[10px] font-bold uppercase">Assistant Prestige</p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-white/60 hover:text-white transition">
                  <X size={20} />
                </button>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
                {history.length === 0 && (
                  <div className="text-center py-10">
                    <div className="bg-amber-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-500">
                      <Bot size={32} />
                    </div>
                    <p className="text-gray-900 font-black text-sm">Prêt à vous servir</p>
                  </div>
                )}
                {history.map((chat, i) => (
                  <div key={i} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-[1.5rem] text-sm font-bold shadow-sm ${
                      chat.role === 'user' ? 'bg-gray-900 text-white rounded-tr-none' : 'bg-white text-gray-700 border rounded-tl-none'
                    }`}>
                      {chat.parts[0].text}
                    </div>
                  </div>
                ))}
                {loading && <Loader2 size={18} className="animate-spin text-amber-500 mx-auto" />}
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="p-4 bg-gray-50/50 border-t">
                <div className="relative">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Votre question..."
                    className="w-full bg-white rounded-2xl py-4 pl-5 pr-12 text-sm font-bold shadow-sm focus:ring-4 focus:ring-amber-500/5 outline-none"
                  />
                  <button type="submit" className="absolute right-2 top-2 bg-amber-500 text-white p-2 rounded-xl active:scale-90 transition">
                    <Send size={18} />
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bouton Flottant (Draggable) */}
        <motion.div className="relative group cursor-grab active:cursor-grabbing">
          {/* Petite poignée visuelle pour indiquer qu'on peut déplacer */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-200 rounded-full px-2">
            <GripVertical size={10} className="text-gray-400" />
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="bg-gradient-to-r from-amber-400 to-amber-600 text-white w-16 h-16 rounded-[1.8rem] flex items-center justify-center shadow-2xl shadow-amber-500/40 border-4 border-white transition-transform overflow-hidden"
          >
            <Sparkles size={28} />
            {!isOpen && <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 border-2 border-white rounded-full" />}
          </button>
        </motion.div>
      </motion.div>
    </>
  )
}