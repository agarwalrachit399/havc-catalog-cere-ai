/**
 * RAG Q&A Component
 * 
 * A simple, expandable component that allows users to ask questions
 * about HVAC manuals using the RAG system. Can be used for specific
 * models or general questions.
 * 
 * Features:
 * - Expandable/collapsible interface
 * - Loading states
 * - Error handling
 * - Source citations
 * - Model-specific or general queries
 */

"use client"

import { useState } from 'react'
import { MessageCircle, Send, ChevronDown, ChevronUp, Loader2, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/**
 * Interface for RAG response
 */
interface RAGResponse {
  answer: string
  sources: {
    model_number: string
    similarity: number
    preview: string
  }[]
  question: string
  model_number?: string
}

/**
 * Props for the RAG Q&A component
 */
interface RAGQAProps {
  modelNumber?: string // If provided, searches only for this model
  className?: string
}

export default function RAGQA({ modelNumber, className = '' }: RAGQAProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [question, setQuestion] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<RAGResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  /**
   * Handle question submission
   */
  const handleAskQuestion = async () => {
    if (!question.trim()) return

    setIsLoading(true)
    setError(null)
    setResponse(null)

    try {
      const res = await fetch('/api/rag/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question.trim(),
          model_number: modelNumber
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to get answer')
      }

      const data: RAGResponse = await res.json()
      setResponse(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      console.error('Error asking question:', err)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Handle Enter key press
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault()
      handleAskQuestion()
    }
  }

  /**
   * Clear the conversation
   */
  const handleClear = () => {
    setQuestion('')
    setResponse(null)
    setError(null)
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header - Always visible */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">
              Ask AI Assistant
            </h3>
            <p className="text-sm text-gray-500">
              {modelNumber 
                ? `Ask questions about ${modelNumber} manual`
                : 'Ask questions about HVAC manuals'
              }
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="border-t p-4 space-y-4">
          {/* Question Input */}
          <div className="flex gap-2">
            <Input
              placeholder={
                modelNumber 
                  ? `Ask about ${modelNumber} manual...`
                  : 'Ask about installation, specifications, troubleshooting...'
              }
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={handleAskQuestion}
              disabled={!question.trim() || isLoading}
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Examples */}
          {!response && !error && (
            <div className="text-sm text-gray-500">
              <p className="mb-2">Try asking:</p>
              <ul className="space-y-1">
                <li>• "What are the electrical requirements?"</li>
                <li>• "How do I install this unit?"</li>
                <li>• "What are the clearance requirements?"</li>
                <li>• "Troubleshooting steps for error codes"</li>
              </ul>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center gap-2 text-blue-600 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Searching manuals and generating answer...
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClear}
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Response */}
          {response && (
            <div className="space-y-4">
              {/* Answer */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-start gap-2 mb-2">
                  <BookOpen className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-blue-900 text-sm">Answer</h4>
                    {response.model_number && (
                      <p className="text-blue-700 text-xs">
                        For model: {response.model_number}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                  {response.answer}
                </div>
              </div>

              {/* Sources */}
              {response.sources && response.sources.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-gray-700">
                    Sources ({response.sources.length})
                  </h5>
                  <div className="space-y-2">
                    {response.sources.map((source, index) => (
                      <div 
                        key={index}
                        className="p-2 bg-gray-50 border rounded text-xs"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-gray-700">
                            {source.model_number}
                          </span>
                          <span className="text-gray-500">
                            {Math.round((source.similarity || 0) * 100)}% relevant
                          </span>
                        </div>
                        <p className="text-gray-600">{source.preview}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleClear}
                >
                  Ask Another Question
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}