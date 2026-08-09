'use client'

import React, { useState } from 'react'
import { Analysis } from '@/types'
import { MessageSquare, Send, Sparkles, X, Bot, User, ThumbsUp, ThumbsDown, ShieldAlert } from 'lucide-react'

interface CardioAssistantChatProps {
  analysis: Analysis
}

interface ChatMessage {
  id: string
  sender: 'user' | 'assistant'
  text: string
  timestamp: string
}

export default function CardioAssistantChat({ analysis }: CardioAssistantChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputQuery, setInputQuery] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_init',
      sender: 'assistant',
      text: `Hello! I am your Cardiosense AI Screening Assistant. I can help explain your analysis results for file "${analysis.fileName}" (${analysis.aiPrediction.class}, ${ (analysis.aiPrediction.confidence * 100).toFixed(1) }% confidence). What questions do you have?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ])

  const presetQuestions = [
    'Why was my signal classified as ' + analysis.aiPrediction.class + '?',
    'What does a model confidence of ' + (analysis.aiPrediction.confidence * 100).toFixed(1) + '% mean?',
    'Why is my signal quality ' + analysis.signalQuality.status + '?',
    'What should I do next?',
  ]

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputQuery
    if (!textToSend.trim()) return

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    if (!queryText) setInputQuery('')

    // Show loading state message
    const loadingMsgId = `bot_loading_${Date.now()}`
    setMessages((prev) => [
      ...prev,
      {
        id: loadingMsgId,
        sender: 'assistant',
        text: 'Thinking with Claude 3.5 Sonnet...',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ])

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
      const response = await fetch(`${backendUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: textToSend,
          analysisContext: {
            fileName: analysis.fileName,
            fileType: analysis.fileType,
            aiPrediction: analysis.aiPrediction,
            heartRate: analysis.heartRate,
            signalQuality: analysis.signalQuality,
            focusArea: analysis.focusArea,
          },
        }),
      })

      if (response.status === 429) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === loadingMsgId
              ? {
                  ...msg,
                  text: '⚠️ AI Rate Limit Reached: You have sent too many queries in a short timeframe (limit 15 queries/10 mins). Please wait a few minutes before asking another question.',
                }
              : msg
          )
        )
        return
      }

      const data = await response.json()
      if (data.code === 429) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === loadingMsgId
              ? {
                  ...msg,
                  text: '⚠️ AI Rate Limit Reached: Please wait a few minutes before asking another question.',
                }
              : msg
          )
        )
        return
      }

      const botReplyText = data.reply || 'Cardiosense AI Assistant is ready to help explain your screening metrics.'

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMsgId
            ? { ...msg, text: botReplyText }
            : msg
        )
      )
    } catch (err) {
      console.warn('Claude API request failed, using intelligent fallback:', err)
      let replyText = `Your recording showed an average heart rate of ${analysis.heartRate.average} BPM. The model classified the pattern as "${analysis.aiPrediction.class}" with ${(analysis.aiPrediction.confidence * 100).toFixed(1)}% confidence. Signal segment between ${analysis.focusArea.startTime}s and ${analysis.focusArea.endTime}s exhibited the highest attention weight. Cardiosense AI is a screening prototype and not a medical diagnosis.`

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMsgId
            ? { ...msg, text: replyText }
            : msg
        )
      )
    }
  }

  return (
    <>
      {/* Floating Drawer Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-40 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-2xl flex items-center gap-2.5 transition-all hover:scale-105 border-2 border-white/40"
      >
        <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
        <span className="font-bold text-sm hidden sm:inline">Ask Cardiosense AI Assistant</span>
      </button>

      {/* Chat Modal Drawer */}
      {isOpen && (
        <div className="fixed bottom-20 sm:bottom-24 right-4 sm:right-6 left-4 sm:left-auto z-50 sm:w-[400px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[500px] max-h-[80vh]">
          {/* Header */}
          <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-600 rounded-xl text-white">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight">Cardiosense AI Assistant</h3>
                <p className="text-[11px] text-blue-300">Contextual Q&A on Active Recording</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 text-xs font-bold mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
                  }`}
                >
                  <p>{msg.text}</p>
                  <span
                    className={`block text-[9px] mt-1 text-right ${
                      msg.sender === 'user' ? 'text-blue-200' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Preset Buttons */}
          <div className="p-2 bg-white border-t border-slate-200 overflow-x-auto whitespace-nowrap flex gap-1.5 scrollbar-none">
            {presetQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 text-[10px] font-semibold border border-slate-200 transition-colors shrink-0"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-white border-t border-slate-200">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask a question about this recording..."
                className="input-field text-xs py-2"
              />
              <button
                onClick={() => handleSend()}
                className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shrink-0 shadow-md"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-1.5 flex items-center justify-center gap-1">
              <ShieldAlert className="w-3 h-3 text-amber-500" /> Non-diagnostic prototype. Consult a doctor.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
