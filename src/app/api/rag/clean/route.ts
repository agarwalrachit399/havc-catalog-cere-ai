/**
 * API Route: Clean manual_chunks Database
 * 
 * This endpoint cleans the manual_chunks table, removing all processed
 * PDF data and embeddings. Useful for starting fresh.
 * 
 * Route: /api/rag/clean
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log('Starting database cleanup...')
    
    // Get count before deletion for reporting
    const { count: beforeCount, error: countError } = await supabase
      .from('manual_chunks')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.error('Error counting chunks before deletion:', countError)
      // Continue anyway, don't fail on count error
    }
    
    console.log(`Found ${beforeCount || 0} chunks to delete`)
    
    // Delete all chunks
    const { error: deleteError } = await supabase
      .from('manual_chunks')
      .delete()
      .neq('id', 0) // This deletes all rows (neq 0 is always true for valid IDs)
    
    if (deleteError) {
      console.error('Error deleting chunks:', deleteError)
      throw deleteError
    }
    
    // Verify deletion
    const { count: afterCount, error: verifyError } = await supabase
      .from('manual_chunks')
      .select('*', { count: 'exact', head: true })
    
    if (verifyError) {
      console.error('Error verifying deletion:', verifyError)
      // Don't fail, just log the error
    }
    
    const deletedCount = (beforeCount || 0) - (afterCount || 0)
    
    console.log(`Database cleanup complete. Deleted ${deletedCount} chunks. Remaining: ${afterCount || 0}`)
    
    return NextResponse.json({
      success: true,
      message: 'Database cleaned successfully',
      deletedCount,
      beforeCount: beforeCount || 0,
      afterCount: afterCount || 0
    })
    
  } catch (error) {
    console.error('Error cleaning database:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to clean database',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get current database status
    const { count, error } = await supabase
      .from('manual_chunks')
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      throw error
    }
    
    // Get sample of what's in the database
    const { data: sample, error: sampleError } = await supabase
      .from('manual_chunks')
      .select('model_number, chunk_index, processed_at')
      .order('processed_at', { ascending: false })
      .limit(5)
    
    if (sampleError) {
      console.error('Error getting sample data:', sampleError)
    }
    
    return NextResponse.json({
      totalChunks: count || 0,
      sampleData: sample || [],
      canClean: (count || 0) > 0,
      message: count === 0 ? 'Database is already clean' : `Database contains ${count} chunks`
    })
    
  } catch (error) {
    console.error('Error getting database status:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get database status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}