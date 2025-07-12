/**
 * HomePage Component
 * 
 * Main landing page that displays a list of HVAC brands with search functionality.
 * Users can search through brands and navigate to specific brand pages.
 * 
 * Features:
 * - Search functionality for filtering brands
 * - Navigation to brand-specific product pages
 * - Models/Parts toggle (currently for UI only)
 * - Loading states and error handling
 */

"use client"

import { useState, useEffect } from 'react'
import { Search, ChevronRight, ArrowLeft } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createClient } from '@supabase/supabase-js'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

// Initialize Supabase client with environment variables
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * Brand interface defining the structure of brand data from Supabase
 */
interface Brand {
  id: number
  name: string
  image_url: string
}

export default function HomePage() {
  // State management for component data and UI state
  const [brands, setBrands] = useState<Brand[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'models' | 'parts'>('models')
  const [loading, setLoading] = useState(true)
  
  // Next.js router for navigation
  const router = useRouter()

  /**
   * Effect hook to fetch brands data when component mounts
   */
  useEffect(() => {
    fetchBrands()
  }, [])

  /**
   * Fetches all brands from Supabase database
   * Orders brands alphabetically by name
   */
  const fetchBrands = async () => {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        console.error('Error fetching brands:', error)
        return
      }

      setBrands(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Filters brands based on search query
   * Case-insensitive search through brand names
   */
  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      {/* Header Section with Navigation and Search */}
      <div className="mb-6">
        {/* Top row with back button, search input, and grid icon */}
        <div className="flex items-center gap-4 mb-4">
          {/* Back navigation button */}
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          
          {/* Search input with icon */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Search Models and Parts"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>
          
          {/* Grid view toggle button */}
          <Button variant="outline" size="icon" className="bg-blue-600 text-white border-blue-600 hover:bg-blue-700">
            <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
              <div className="bg-white rounded-sm"></div>
              <div className="bg-white rounded-sm"></div>
              <div className="bg-white rounded-sm"></div>
              <div className="bg-white rounded-sm"></div>
            </div>
          </Button>
        </div>

        {/* Models/Parts Toggle Buttons */}
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'models' ? 'default' : 'outline'}
            onClick={() => setActiveTab('models')}
            className={`rounded-full px-6 ${
              activeTab === 'models' 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-white text-gray-700 border-gray-300'
            }`}
          >
            Models
          </Button>
          <Button
            variant={activeTab === 'parts' ? 'default' : 'outline'}
            onClick={() => setActiveTab('parts')}
            className={`rounded-full px-6 ${
              activeTab === 'parts' 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-white text-gray-700 border-gray-300'
            }`}
          >
            Parts
          </Button>
        </div>
      </div>

      {/* Main Content Section */}
      <div>
        {/* Section title */}
        <h2 className="text-xl font-semibold text-blue-600 mb-4">
          Most Searched Brands
        </h2>

        {/* Loading state with skeleton loaders */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : (
          /* Brands list */
          <div className="space-y-2">
            {filteredBrands.map((brand) => (
              <div
                key={brand.id}
                className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  router.push(`/brand/${brand.id}`)
                }}
              >
                {/* Brand information */}
                <div className="flex items-center gap-4">
                  {/* Brand logo */}
                  <div className="w-12 h-12 relative">
                    <Image
                      src={brand.image_url}
                      alt={`${brand.name} logo`}
                      fill
                      className="object-contain"
                      onError={(e) => {
                        // Fallback to placeholder if image fails to load
                        const target = e.target as HTMLImageElement
                        target.src = '/placeholder-logo.png'
                      }}
                    />
                  </div>
                  {/* Brand name */}
                  <span className="text-lg font-medium text-gray-900">
                    {brand.name}
                  </span>
                </div>
                {/* Navigation arrow */}
                <ChevronRight className="h-6 w-6 text-gray-400" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state when no brands match search */}
        {!loading && filteredBrands.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No brands found matching "{searchQuery}"
          </div>
        )}
      </div>
    </div>
  )
}