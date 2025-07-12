/**
 * API Route: Process PDF Documents
 * 
 * This endpoint processes PDF documents from the manuals table,
 * extracts text content, generates embeddings, and stores them
 * for RAG retrieval.
 * 
 * Route: /api/rag/process-pdf
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenAI } from '@google/genai'
import axios from 'axios'
import pdfParse from 'pdf-parse'

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const genai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!
})

/**
 * Interface for PDF chunk data
 */
interface PDFChunk {
  model_number: string
  page_number: number
  content: string
  chunk_index: number
}

/**
 * Split text into manageable chunks for processing
 */
function splitTextIntoChunks(text: string, maxChunkSize: number = 1000, overlap: number = 100): string[] {
  // Input validation
  if (!text || typeof text !== 'string') {
    console.log('Invalid text input for chunking')
    return []
  }
  
  if (text.length === 0) {
    console.log('Empty text for chunking')
    return []
  }
  
  // Ensure reasonable parameters
  maxChunkSize = Math.max(100, Math.min(maxChunkSize, 10000)) // Between 100-10000 chars
  overlap = Math.max(0, Math.min(overlap, maxChunkSize * 0.5)) // Max 50% overlap
  
  console.log(`Chunking text of length ${text.length} with maxChunkSize=${maxChunkSize}, overlap=${overlap}`)
  
  const chunks: string[] = []
  let startIndex = 0
  let iterationCount = 0
  const maxIterations = Math.ceil(text.length / (maxChunkSize - overlap)) + 10 // Safety buffer
  
  while (startIndex < text.length && iterationCount < maxIterations) {
    iterationCount++
    
    // Calculate end index
    let endIndex = Math.min(startIndex + maxChunkSize, text.length)
    
    // Try to break at a sentence or paragraph boundary (only if not at the end)
    if (endIndex < text.length) {
      const searchStart = Math.max(startIndex, endIndex - maxChunkSize)
      const searchEnd = endIndex
      
      // Look for good break points in reverse order of preference
      const lastNewline = text.lastIndexOf('\n\n', searchEnd) // Double newline (paragraph)
      const lastSingleNewline = text.lastIndexOf('\n', searchEnd) // Single newline
      const lastPeriod = text.lastIndexOf('. ', searchEnd) // Period with space
      const lastDot = text.lastIndexOf('.', searchEnd) // Any period
      
      // Choose the best break point
      let breakPoint = -1
      if (lastNewline > searchStart) {
        breakPoint = lastNewline + 2
      } else if (lastSingleNewline > searchStart) {
        breakPoint = lastSingleNewline + 1
      } else if (lastPeriod > searchStart) {
        breakPoint = lastPeriod + 2
      } else if (lastDot > searchStart) {
        breakPoint = lastDot + 1
      }
      
      // Use break point if it's reasonable (not too close to start)
      if (breakPoint > startIndex + maxChunkSize * 0.3) {
        endIndex = breakPoint
      }
    }
    
    // Ensure valid indices
    if (startIndex >= endIndex || startIndex < 0 || endIndex > text.length) {
      console.error(`Invalid indices: startIndex=${startIndex}, endIndex=${endIndex}, textLength=${text.length}`)
      break
    }
    
    // Extract chunk
    try {
      const chunk = text.slice(startIndex, endIndex).trim()
      if (chunk.length > 0) {
        chunks.push(chunk)
      }
    } catch (error) {
      console.error(`Error extracting chunk at indices ${startIndex}-${endIndex}:`, error)
      break
    }
    
    // Calculate next start index
    const nextStart = endIndex - overlap
    
    // Ensure we're making progress
    if (nextStart <= startIndex) {
      startIndex = startIndex + Math.max(1, maxChunkSize - overlap)
    } else {
      startIndex = nextStart
    }
    
    // Prevent infinite loops
    if (startIndex < 0) {
      startIndex = endIndex
    }
  }
  
  console.log(`Created ${chunks.length} chunks from text of length ${text.length}`)
  
  // Validate chunks
  const validChunks = chunks.filter(chunk => chunk && chunk.length > 0 && chunk.length <= maxChunkSize * 2)
  
  if (validChunks.length !== chunks.length) {
    console.log(`Filtered out ${chunks.length - validChunks.length} invalid chunks`)
  }
  
  return validChunks
}

/**
 * Generate embeddings for text chunks
 */
async function generateEmbeddings(chunks: string[]): Promise<number[][]> {
  console.log(`Generating embeddings for ${chunks.length} chunks`)
  
  if (!chunks || chunks.length === 0) {
    console.log('No chunks to process for embeddings')
    return []
  }
  
  const embeddings: number[][] = []
  const batchSize = 5 // Process in smaller batches to avoid rate limits
  const delayBetweenRequests = 200 // 200ms delay between requests
  const maxRetries = 3
  
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize)
    console.log(`Processing embedding batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}`)
    
    for (const chunk of batch) {
      let attempts = 0
      let embedding: number[] | null = null
      
      // Validate chunk
      if (!chunk || typeof chunk !== 'string' || chunk.trim().length === 0) {
        console.log(`Skipping empty or invalid chunk at index ${embeddings.length}`)
        embeddings.push([]) // Add empty embedding for consistency
        continue
      }
      
      // Limit chunk size for embedding API
      const maxChunkLength = 8000 // Conservative limit for text-embedding-004
      const processChunk = chunk.length > maxChunkLength 
        ? chunk.substring(0, maxChunkLength) 
        : chunk
      
      while (attempts < maxRetries && embedding === null) {
        try {
          console.log(`Generating embedding for chunk ${embeddings.length + 1} (attempt ${attempts + 1})`)
          
          const result = await genai.models.embedContent({
            model: 'text-embedding-004',
            contents: [processChunk],
            config: {
              taskType: 'RETRIEVAL_DOCUMENT'
            }
          })
          
          if (result.embeddings && result.embeddings.length > 0 && result.embeddings[0].values) {
            embedding = result.embeddings[0].values
            console.log(`Successfully generated embedding with ${embedding.length} dimensions`)
          } else {
            throw new Error('No embedding values returned from API')
          }
          
        } catch (error) {
          attempts++
          console.error(`Embedding attempt ${attempts} failed:`, error instanceof Error ? error.message : error)
          
          if (attempts >= maxRetries) {
            console.error(`Failed to generate embedding after ${maxRetries} attempts, using empty embedding`)
            embedding = [] // Use empty array as fallback
          } else {
            // Wait before retry with exponential backoff
            const waitTime = delayBetweenRequests * Math.pow(2, attempts - 1)
            console.log(`Waiting ${waitTime}ms before retry...`)
            await new Promise(resolve => setTimeout(resolve, waitTime))
          }
        }
      }
      
      embeddings.push(embedding || [])
      
      // Rate limiting delay
      if (embeddings.length < chunks.length) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenRequests))
      }
    }
  }
  
  console.log(`Generated ${embeddings.length} embeddings (${embeddings.filter(e => e.length > 0).length} successful)`)
  
  // Validate embeddings
  const validEmbeddings = embeddings.filter(e => Array.isArray(e) && e.length > 0)
  if (validEmbeddings.length === 0) {
    throw new Error('No valid embeddings were generated')
  }
  
  if (validEmbeddings.length < embeddings.length * 0.5) {
    console.warn(`Only ${validEmbeddings.length}/${embeddings.length} embeddings were successful`)
  }
  
  return embeddings
}

/**
 * Process a single PDF document
 */
async function processPDFDocument(modelNumber: string, pdfUrl: string) {
  try {
    console.log(`Processing PDF for model: ${modelNumber}`)
    console.log(`PDF URL: ${pdfUrl}`)
    
    // Validate inputs
    if (!modelNumber || !pdfUrl) {
      throw new Error('Model number and PDF URL are required')
    }
    
    // Download PDF content with retries
    let pdfBuffer: Buffer | undefined = undefined;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        console.log(`Downloading PDF (attempt ${attempts + 1}/${maxAttempts})`);
        const response = await axios.get(pdfUrl, {
          responseType: 'arraybuffer',
          timeout: 60000, // Increased timeout to 60 seconds
          maxContentLength: 50 * 1024 * 1024, // Max 50MB
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; HVAC-Catalog-Bot/1.0)'
          }
        });

        pdfBuffer = Buffer.from(response.data);
        console.log(`Downloaded PDF: ${pdfBuffer.length} bytes`);
        break;

      } catch (downloadError) {
        attempts++;
        console.error(`Download attempt ${attempts} failed:`, downloadError instanceof Error ? downloadError.message : downloadError);

        if (attempts >= maxAttempts) {
          throw new Error(`Failed to download PDF after ${maxAttempts} attempts: ${downloadError instanceof Error ? downloadError.message : 'Unknown error'}`);
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 2000 * attempts));
      }
    }

    if (!pdfBuffer) {
      throw new Error('PDF buffer was not initialized. Failed to download PDF.');
    }

    // Extract text from PDF
    console.log('Extracting text from PDF...');
    let pdfData: any;

    try {
      pdfData = await pdfParse(pdfBuffer, {
        // PDF parsing options
        max: 0, // No page limit
        version: 'v1.10.100' // Specify version for compatibility
      });
    } catch (parseError) {
      console.error('PDF parsing error:', parseError);
      throw new Error(`Failed to parse PDF: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`);
    }
    
    console.log(`Extracted ${pdfData.numpages} pages, ${pdfData.text?.length || 0} characters`)
    
    if (!pdfData.text || typeof pdfData.text !== 'string' || pdfData.text.trim().length === 0) {
      console.log(`No text content found in PDF for model: ${modelNumber}`)
      return { 
        success: false, 
        message: 'No text content found in PDF',
        modelNumber 
      }
    }
    
    // Clean and validate text
    let cleanText = pdfData.text
      .replace(/\0/g, '') // Remove null characters
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '') // Remove control characters
      .trim()
    
    if (cleanText.length === 0) {
      console.log(`No valid text content after cleaning for model: ${modelNumber}`)
      return { 
        success: false, 
        message: 'No valid text content after cleaning',
        modelNumber 
      }
    }
    
    console.log(`Cleaned text length: ${cleanText.length}`)
    
    // Check for extremely large documents
    if (cleanText.length > 1000000) { // 1MB of text
      console.log(`Very large document (${cleanText.length} chars), truncating to 1MB`)
      cleanText = cleanText.substring(0, 1000000)
    }
    
    // Split text into chunks
    let chunks: string[]
    try {
      chunks = splitTextIntoChunks(cleanText, 1000, 100)
    } catch (chunkError) {
      console.error('Chunking error:', chunkError)
      throw new Error(`Failed to chunk text: ${chunkError instanceof Error ? chunkError.message : 'Unknown chunking error'}`)
    }
    
    if (chunks.length === 0) {
      console.log(`No chunks created for model: ${modelNumber}`)
      return { 
        success: false, 
        message: 'No chunks created from text',
        modelNumber 
      }
    }
    
    console.log(`Created ${chunks.length} chunks for model: ${modelNumber}`)
    
    // Limit chunks to prevent overwhelming the system
    const maxChunks = 50
    if (chunks.length > maxChunks) {
      console.log(`Too many chunks (${chunks.length}), limiting to ${maxChunks}`)
      chunks = chunks.slice(0, maxChunks)
    }
    
    // Generate embeddings with better error handling
    let embeddings: number[][]
    try {
      embeddings = await generateEmbeddings(chunks)
    } catch (embeddingError) {
      console.error('Embedding generation error:', embeddingError)
      throw new Error(`Failed to generate embeddings: ${embeddingError instanceof Error ? embeddingError.message : 'Unknown embedding error'}`)
    }
    
    if (embeddings.length !== chunks.length) {
      console.error(`Mismatch: ${chunks.length} chunks but ${embeddings.length} embeddings`)
      throw new Error(`Embedding count mismatch: expected ${chunks.length}, got ${embeddings.length}`)
    }
    
    // Prepare data for database insertion
    const chunkData: any[] = chunks.map((chunk, index) => {
      const embedding = embeddings[index]
      
      return {
        model_number: modelNumber,
        content: chunk.substring(0, 50000), // Limit content length for database
        chunk_index: index,
        page_number: Math.floor(index / 5) + 1, // Rough page estimation
        embedding: JSON.stringify(embedding || []),
        processed_at: new Date().toISOString()
      }
    })
    
    // Store chunks and embeddings in database with conflict resolution
    console.log(`Storing ${chunkData.length} chunks in database...`)
    
    try {
      // First, delete existing chunks for this model to avoid conflicts
      const { error: deleteError } = await supabase
        .from('manual_chunks')
        .delete()
        .eq('model_number', modelNumber)
      
      if (deleteError) {
        console.error('Error deleting existing chunks:', deleteError)
        // Don't throw here, continue with insert
      }
      
      // Insert new chunks
      const { error: insertError } = await supabase
        .from('manual_chunks')
        .insert(chunkData)
      
      if (insertError) {
        console.error('Error storing chunks:', insertError)
        throw insertError
      }
    } catch (dbError) {
      console.error('Database error:', dbError)
      throw new Error(`Failed to store chunks in database: ${dbError instanceof Error ? dbError.message : 'Unknown database error'}`)
    }
    
    console.log(`Successfully processed ${chunks.length} chunks for model: ${modelNumber}`)
    return { 
      success: true, 
      chunksProcessed: chunks.length,
      modelNumber,
      message: `Successfully processed ${chunks.length} chunks`
    }
    
  } catch (error) {
    console.error(`Error processing PDF for model ${modelNumber}:`, error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      modelNumber,
      message: `Failed to process PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { model_number, pdf_url, process_all } = await request.json()
    
    if (!process_all && (!model_number || !pdf_url)) {
      return NextResponse.json(
        { error: 'Either model_number and pdf_url, or process_all flag is required' },
        { status: 400 }
      )
    }
    
    if (process_all) {
      // Process all PDFs from manuals table
      console.log('Starting batch PDF processing...')
      
      const { data: manuals, error } = await supabase
        .from('manuals')
        .select('model_number, pdf_url')
        .limit(166) // Increased from 10 but still reasonable batch size
      
      if (error) {
        console.error('Error fetching manuals:', error)
        throw error
      }
      
      if (!manuals || manuals.length === 0) {
        return NextResponse.json(
          { message: 'No manuals found to process' },
          { status: 200 }
        )
      }
      
      console.log(`Found ${manuals.length} manuals to process`)
      const results = []
      let processed = 0
      
      // Process PDFs one at a time to avoid memory issues
      for (const manual of manuals) {
        processed++
        console.log(`\n=== Processing ${processed}/${manuals.length}: ${manual.model_number} ===`)
        
        try {
          // Add small delay between processing to prevent overwhelming the system
          if (processed > 1) {
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
          
          const result = await processPDFDocument(manual.model_number, manual.pdf_url)
          results.push(result)
          
          console.log(`=== Result for ${manual.model_number}:`, {
            success: result.success,
            error: result.error || 'none',
            chunks: result.chunksProcessed || 0
          })
          
          // Force garbage collection if available (Node.js)
          if (global.gc) {
            global.gc()
          }
          
        } catch (error) {
          console.error(`=== Error processing ${manual.model_number}:`, error)
          results.push({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            modelNumber: manual.model_number
          })
        }
      }
      
      const successful = results.filter(r => r.success).length
      const failed = results.filter(r => !r.success).length
      
      console.log(`\n=== Batch processing complete: ${successful} successful, ${failed} failed ===`)
      
      return NextResponse.json({
        message: `Processed ${results.length} manuals`,
        results,
        successful,
        failed,
        summary: {
          total: results.length,
          successful,
          failed,
          successRate: `${Math.round((successful / results.length) * 100)}%`
        }
      })
      
    } else {
      // Process single PDF
      console.log(`Processing single PDF: ${model_number}`)
      
      const result = await processPDFDocument(model_number, pdf_url)
      
      if (result.success) {
        return NextResponse.json(result)
      } else {
        return NextResponse.json(result, { status: 500 })
      }
    }
    
  } catch (error) {
    console.error('Error in process-pdf endpoint:', error)
    
    // Handle specific error types
    let errorMessage = 'Failed to process PDF'
    let statusCode = 500
    
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        errorMessage = 'Request timeout - PDF processing took too long'
        statusCode = 408
      } else if (error.message.includes('Invalid array length')) {
        errorMessage = 'Memory error - PDF too large or complex to process'
        statusCode = 413
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'API rate limit exceeded - please try again later'
        statusCode = 429
      } else {
        errorMessage = error.message
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'processing_error'
      },
      { status: statusCode }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get processing status
    const { searchParams } = new URL(request.url)
    const modelNumber = searchParams.get('model_number')
    
    if (modelNumber) {
      // Check if specific model is processed
      const { data, error } = await supabase
        .from('manual_chunks')
        .select('model_number, chunk_index, processed_at')
        .eq('model_number', modelNumber)
        .order('chunk_index')
      
      if (error) throw error
      
      return NextResponse.json({
        modelNumber,
        isProcessed: data && data.length > 0,
        chunksCount: data?.length || 0,
        lastProcessed: data && data.length > 0 ? data[0].processed_at : null
      })
    } else {
      // Get overall processing status
      const { data, error } = await supabase
        .from('manual_chunks')
        .select('model_number')
        .order('model_number')
      
      if (error) throw error
      
      const processedModels = [...new Set(data?.map(item => item.model_number) || [])]
      
      return NextResponse.json({
        totalProcessedModels: processedModels.length,
        processedModels
      })
    }
    
  } catch (error) {
    console.error('Error getting processing status:', error)
    return NextResponse.json(
      { error: 'Failed to get processing status' },
      { status: 500 }
    )
  }
}