/**
 * API Route: Ask Question using RAG
 * 
 * This endpoint handles question answering using Retrieval-Augmented Generation.
 * It searches for relevant manual content and generates answers using Gemini.
 * 
 * Route: /api/rag/ask
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenAI } from '@google/genai'

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const genai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!
})

/**
 * Interface for retrieved chunks
 */
interface RetrievedChunk {
  model_number: string
  content: string
  chunk_index: number
  similarity?: number
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length')
  }
  
  let dotProduct = 0
  let normA = 0
  let normB = 0
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i]
    normA += vecA[i] * vecA[i]
    normB += vecB[i] * vecB[i]
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * Generate embedding for query
 */
async function generateQueryEmbedding(query: string): Promise<number[]> {
  try {
    const result = await genai.models.embedContent({
      model: 'text-embedding-004',
      contents: [query],
      config: {
        taskType: 'RETRIEVAL_QUERY'
      }
    })
    
    if (
      !result.embeddings ||
      result.embeddings.length === 0 ||
      !result.embeddings[0].values
    ) {
      throw new Error('Failed to generate query embedding')
    }
    
    return result.embeddings[0].values as number[]
  } catch (error) {
    console.error('Error generating query embedding:', error)
    throw error
  }
}

/**
 * Retrieve relevant chunks using similarity search
 */
async function retrieveRelevantChunks(
  queryEmbedding: number[], 
  modelNumber?: string, 
  limit: number = 5
): Promise<RetrievedChunk[]> {
  try {
    // Build query
    let query = supabase
      .from('manual_chunks')
      .select('model_number, content, chunk_index, embedding')
    
    // Filter by model number if provided
    if (modelNumber) {
      query = query.eq('model_number', modelNumber)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    if (!data || data.length === 0) {
      return []
    }
    
    // Calculate similarities and sort
    const chunksWithSimilarity = data
      .map(chunk => {
        try {
          const chunkEmbedding = JSON.parse(chunk.embedding)
          const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding)
          
          return {
            model_number: chunk.model_number,
            content: chunk.content,
            chunk_index: chunk.chunk_index,
            similarity
          }
        } catch (e) {
          console.error('Error parsing embedding for chunk:', chunk.chunk_index, e)
          return null
        }
      })
      .filter((chunk): chunk is { model_number: string; content: string; chunk_index: number; similarity: number } => chunk !== null)
      .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
      .slice(0, limit)
    
    console.log(`Found ${chunksWithSimilarity.length} relevant chunks`)
    return chunksWithSimilarity
    
  } catch (error) {
    console.error('Error retrieving chunks:', error)
    throw error
  }
}

/**
 * Generate answer using retrieved context
 */
async function generateAnswer(
  question: string, 
  context: RetrievedChunk[], 
  modelNumber?: string
): Promise<string> {
  try {
    // Prepare context for the prompt
    const contextText = context
      .map((chunk, index) => 
        `[Context ${index + 1} - Model: ${chunk.model_number}]\n${chunk.content}`
      )
      .join('\n\n')
    
    // Create the prompt
    const prompt = `You are a helpful assistant specializing in HVAC equipment manuals. Answer the user's question based on the provided context from official manuals.

IMPORTANT INSTRUCTIONS:
- Only answer based on the provided context
- If the context doesn't contain relevant information, say so clearly
- Be specific and technical when appropriate
- If referring to a specific model, mention the model number
- Keep answers concise but comprehensive

CONTEXT FROM MANUALS:
${contextText}

${modelNumber ? `SPECIFIC MODEL: ${modelNumber}` : ''}

USER QUESTION: ${question}

ANSWER:`
    
    const result = await genai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        temperature: 0.1, // Low temperature for more factual responses
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1024
      }
    })

    const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text

    if (!generatedText) {
      throw new Error('No response generated')
    }

    return generatedText
    
  } catch (error) {
    console.error('Error generating answer:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const { question, model_number } = await request.json()
    
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return NextResponse.json(
        { error: 'Question is required and must be a non-empty string' },
        { status: 400 }
      )
    }
    
    console.log(`Processing question: "${question}" for model: ${model_number || 'all models'}`)
    
    // Step 1: Generate embedding for the query
    const queryEmbedding = await generateQueryEmbedding(question)
    console.log('Generated query embedding')
    
    // Step 2: Retrieve relevant chunks
    const relevantChunks = await retrieveRelevantChunks(
      queryEmbedding, 
      model_number, 
      5 // Get top 5 most relevant chunks
    )
    
    if (relevantChunks.length === 0) {
      return NextResponse.json({
        answer: model_number 
          ? `I don't have manual information available for model ${model_number} to answer your question.`
          : `I don't have relevant manual information to answer your question. Please make sure the manuals have been processed.`,
        sources: [],
        question
      })
    }
    
    console.log(`Retrieved ${relevantChunks.length} relevant chunks`)
    
    // Step 3: Generate answer using context
    const answer = await generateAnswer(question, relevantChunks, model_number)
    
    // Prepare sources information
    const sources = relevantChunks.map(chunk => ({
      model_number: chunk.model_number,
      similarity: chunk.similarity,
      preview: chunk.content.substring(0, 200) + '...'
    }))
    
    return NextResponse.json({
      answer,
      sources,
      question,
      model_number: model_number || null
    })
    
  } catch (error) {
    console.error('Error in ask endpoint:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process question',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Health check endpoint
    const { searchParams } = new URL(request.url)
    const testQuery = searchParams.get('test')
    
    if (testQuery) {
      // Test the system with a simple query
      try {
        const queryEmbedding = await generateQueryEmbedding('installation requirements')
        const chunks = await retrieveRelevantChunks(queryEmbedding, undefined, 2)
        
        return NextResponse.json({
          status: 'healthy',
          test: 'passed',
          chunksFound: chunks.length,
          message: 'RAG system is working correctly'
        })
      } catch (error) {
        return NextResponse.json({
          status: 'error',
          test: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
      }
    }
    
    return NextResponse.json({
      status: 'healthy',
      endpoints: {
        POST: 'Ask a question',
        'GET?test=1': 'Run health check test'
      }
    })
    
  } catch (error) {
    return NextResponse.json(
      { status: 'error', error: 'Health check failed' },
      { status: 500 }
    )
  }
}