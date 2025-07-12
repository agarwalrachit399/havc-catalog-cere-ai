"use client"

import { useState, useEffect } from 'react'
import { Search, ChevronRight, ArrowLeft } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createClient } from '@supabase/supabase-js'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Brand {
  id: number
  name: string
  image_url: string
}

export default function HomePage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'models' | 'parts'>('models')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchBrands()
  }, [])

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

  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      {/* Header with back arrow and search */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Search Models and Parts"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>
          
          <Button variant="outline" size="icon" className="bg-blue-600 text-white border-blue-600 hover:bg-blue-700">
            <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
              <div className="bg-white rounded-sm"></div>
              <div className="bg-white rounded-sm"></div>
              <div className="bg-white rounded-sm"></div>
              <div className="bg-white rounded-sm"></div>
            </div>
          </Button>
        </div>

        {/* Models/Parts Toggle */}
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

      {/* Most Searched Brands Section */}
      <div>
        <h2 className="text-xl font-semibold text-blue-600 mb-4">
          Most Searched Brands
        </h2>

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
          <div className="space-y-2">
            {filteredBrands.map((brand) => (
              <div
                key={brand.id}
                className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  router.push(`/brand/${brand.id}`)
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 relative">
                    <Image
                      src={brand.image_url}
                      alt={`${brand.name} logo`}
                      fill
                      className="object-contain"
                      onError={(e) => {
                        // Fallback to a placeholder if image fails to load
                        const target = e.target as HTMLImageElement
                        target.src = '/placeholder-logo.png'
                      }}
                    />
                  </div>
                  <span className="text-lg font-medium text-gray-900">
                    {brand.name}
                  </span>
                </div>
                <ChevronRight className="h-6 w-6 text-gray-400" />
              </div>
            ))}
          </div>
        )}

        {!loading && filteredBrands.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No brands found matching "{searchQuery}"
          </div>
        )}
      </div>
    </div>
  )
}