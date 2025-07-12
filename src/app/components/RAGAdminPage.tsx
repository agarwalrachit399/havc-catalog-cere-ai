/**
 * RAG Admin Setup Page
 * 
 * A simple admin interface to set up and manage the RAG system.
 * Allows processing PDFs, checking status, and testing the system.
 * 
 * Route: /admin/rag
 * 
 * Features:
 * - Process all PDFs from manuals table
 * - Check processing status
 * - Test RAG system
 * - View system health
 */

"use client"

import { useState, useEffect } from 'react'
import { 
  PlayCircle, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Database,
  MessageSquare,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/**
 * Interface for processing status
 */
interface ProcessingStatus {
  totalProcessedModels: number
  processedModels: string[]
}

/**
 * Interface for processing result
 */
interface ProcessingResult {
  message: string
  results: Array<{
    success: boolean
    modelNumber: string
    chunksProcessed?: number
    error?: string
  }>
  successful: number
  failed: number
}

export default function RAGAdminPage() {
  const [status, setStatus] = useState<ProcessingStatus | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null)
  const [testQuestion, setTestQuestion] = useState('')
  const [testResult, setTestResult] = useState<any>(null)
  const [isTesting, setIsTesting] = useState(false)
  const [systemHealth, setSystemHealth] = useState<any>(null)
  const [isCleaning, setIsCleaning] = useState(false)
  const [cleanResult, setCleanResult] = useState<string | null>(null)

  /**
   * Load processing status on component mount
   */
  useEffect(() => {
    loadStatus()
    checkSystemHealth()
  }, [])

  /**
   * Load current processing status
   */
  const loadStatus = async () => {
    try {
      const response = await fetch('/api/rag/process-pdf')
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      }
    } catch (error) {
      console.error('Error loading status:', error)
    }
  }

  /**
   * Check system health
   */
  const checkSystemHealth = async () => {
    try {
      const response = await fetch('/api/rag/ask?test=1')
      if (response.ok) {
        const data = await response.json()
        setSystemHealth(data)
      }
    } catch (error) {
      console.error('Error checking system health:', error)
      setSystemHealth({ status: 'error', error: 'Failed to connect' })
    }
  }

  /**
   * Process all PDFs
   */
  const processAllPDFs = async () => {
    setIsProcessing(true)
    setProcessingResult(null)

    try {
      const response = await fetch('/api/rag/process-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ process_all: true }),
      })

      const data = await response.json()
      setProcessingResult(data)
      
      // Reload status after processing
      await loadStatus()
    } catch (error) {
      console.error('Error processing PDFs:', error)
      setProcessingResult({
        message: 'Error processing PDFs',
        results: [],
        successful: 0,
        failed: 1
      })
    } finally {
      setIsProcessing(false)
    }
  }

  /**
   * Test the RAG system
   */
  const testRAG = async () => {
    if (!testQuestion.trim()) return

    setIsTesting(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/rag/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: testQuestion }),
      })

      const data = await response.json()
      setTestResult(data)
    } catch (error) {
      console.error('Error testing RAG:', error)
      setTestResult({ error: 'Failed to test RAG system' })
    } finally {
      setIsTesting(false)
    }
  }

  /**
   * Clean the manual_chunks database
   */
  const cleanDatabase = async () => {
    if (!confirm('Are you sure you want to delete all processed manual chunks? This action cannot be undone.')) {
      return
    }

    setIsCleaning(true)
    setCleanResult(null)

    try {
      const response = await fetch('/api/rag/clean', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      
      if (response.ok) {
        setCleanResult(`Successfully cleaned database. Removed ${data.deletedCount || 0} chunks.`)
        // Reload status after cleaning
        await loadStatus()
        await checkSystemHealth()
      } else {
        setCleanResult(`Error: ${data.error || 'Failed to clean database'}`)
      }
    } catch (error) {
      console.error('Error cleaning database:', error)
      setCleanResult('Error: Failed to clean database')
    } finally {
      setIsCleaning(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            RAG System Administration
          </h1>
          <p className="text-gray-600">
            Manage and configure the Retrieval-Augmented Generation system for HVAC manuals.
          </p>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">System Health</h2>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={checkSystemHealth}
              disabled={!systemHealth}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
          
          {systemHealth ? (
            <div className={`flex items-center gap-2 p-3 rounded-md ${
              systemHealth.status === 'healthy' 
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {systemHealth.status === 'healthy' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span>
                {systemHealth.status === 'healthy' 
                  ? `System is healthy. ${systemHealth.chunksFound || 0} chunks found in test.`
                  : `System error: ${systemHealth.error || 'Unknown error'}`
                }
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Checking system health...
            </div>
          )}
        </div>

        {/* Processing Status */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Processing Status</h2>
            <Button variant="outline" size="sm" onClick={loadStatus}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
          
          {status ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600" />
                <span className="text-gray-700">
                  {status.totalProcessedModels} models processed
                </span>
              </div>
              
              {status.processedModels.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Processed Models:</p>
                  <div className="flex flex-wrap gap-2">
                    {status.processedModels.slice(0, 10).map((model) => (
                      <span 
                        key={model}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                      >
                        {model}
                      </span>
                    ))}
                    {status.processedModels.length > 10 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        +{status.processedModels.length - 10} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-500">Loading status...</div>
          )}
        </div>

        {/* PDF Processing */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Database Management</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Clean Database</h3>
              <p className="text-gray-600 mb-3">
                Remove all processed manual chunks from the database. Do this before reprocessing all PDFs.
              </p>
              
              <Button 
                onClick={cleanDatabase}
                disabled={isCleaning}
                variant="outline"
                className="w-full sm:w-auto mb-3"
              >
                {isCleaning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Cleaning Database...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    Clean Database
                  </>
                )}
              </Button>

              {cleanResult && (
                <div className={`p-3 rounded-md text-sm ${
                  cleanResult.startsWith('Error') 
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-green-50 text-green-700 border border-green-200'
                }`}>
                  {cleanResult}
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-900 mb-2">Process PDFs</h3>
              <p className="text-gray-600 mb-3">
                Process all PDF manuals to extract text and generate embeddings for RAG search.
                This may take several minutes depending on the number of PDFs.
              </p>
              
              <Button 
                onClick={processAllPDFs}
                disabled={isProcessing}
                className="w-full sm:w-auto"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing PDFs...
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Process All PDFs
                  </>
                )}
              </Button>
            </div>

            {/* Processing Results */}
            {processingResult && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <h3 className="font-medium text-gray-900 mb-2">Processing Results</h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-700">{processingResult.message}</p>
                  <div className="flex gap-4 text-sm">
                    <span className="text-green-600">
                      ✓ Successful: {processingResult.successful}
                    </span>
                    <span className="text-red-600">
                      ✗ Failed: {processingResult.failed}
                    </span>
                  </div>
                  
                  {processingResult.results && processingResult.results.length > 0 && (
                    <div className="mt-3">
                      <details className="cursor-pointer">
                        <summary className="text-sm font-medium text-gray-700">
                          View detailed results
                        </summary>
                        <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                          {processingResult.results.map((result, index) => (
                            <div 
                              key={index}
                              className={`text-xs p-2 rounded ${
                                result.success 
                                  ? 'bg-green-50 text-green-700'
                                  : 'bg-red-50 text-red-700'
                              }`}
                            >
                              <span className="font-medium">{result.modelNumber}:</span>
                              {result.success 
                                ? ` ${result.chunksProcessed} chunks processed`
                                : ` Error - ${result.error}`
                              }
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Test RAG System */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Test RAG System</h2>
          <div className="space-y-4">
            <p className="text-gray-600">
              Test the RAG system by asking a question about HVAC manuals.
            </p>
            
            <div className="flex gap-2">
              <Input
                placeholder="Ask a question about HVAC manuals..."
                value={testQuestion}
                onChange={(e) => setTestQuestion(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isTesting && testRAG()}
                className="flex-1"
              />
              <Button 
                onClick={testRAG}
                disabled={!testQuestion.trim() || isTesting}
              >
                {isTesting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <MessageSquare className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Test Results */}
            {testResult && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                {testResult.error ? (
                  <div className="text-red-700">
                    <strong>Error:</strong> {testResult.error}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <strong className="text-gray-900">Answer:</strong>
                      <p className="mt-1 text-gray-700">{testResult.answer}</p>
                    </div>
                    
                    {testResult.sources && testResult.sources.length > 0 && (
                      <div>
                        <strong className="text-gray-900">Sources ({testResult.sources.length}):</strong>
                        <div className="mt-1 space-y-1">
                          {testResult.sources.map((source: any, index: number) => (
                            <div key={index} className="text-sm text-gray-600">
                              • {source.model_number} ({Math.round(source.similarity * 100)}% relevant)
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Setup Instructions</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Ensure your Gemini API key is configured in environment variables</li>
            <li>Run the database migration to create the manual_chunks table</li>
            <li><strong>Clean the database</strong> using the "Clean Database" button above</li>
            <li><strong>Process all PDFs</strong> using the "Process All PDFs" button above</li>
            <li>Test the system using the test form above</li>
            <li>The RAG Q&A component will now be available throughout the application</li>
          </ol>
        </div>
      </div>
    </div>
  )
}