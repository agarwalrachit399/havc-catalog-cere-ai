/**
 * BrandProductsPage Component
 * 
 * Displays all product types for a specific brand. Users can search through
 * products and navigate to individual product model pages.
 * 
 * Route: /brand/[brandId]
 * 
 * Features:
 * - Displays brand information and product types
 * - Search functionality for filtering products
 * - Navigation breadcrumbs
 * - Loading states and error handling
 * - Fallback image handling for missing product images
 */

"use client"

import { useState, useEffect } from 'react'
import { Search, ChevronRight, ArrowLeft } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createClient } from '@supabase/supabase-js'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import Link from 'next/link'

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

/**
 * ProductType interface defining the structure of product type data from Supabase
 */
interface ProductType {
  id: number
  name: string
  brand_id: number
  image_url: string
}

export default function BrandProductsPage() {
  // State management for component data and UI state
  const [brand, setBrand] = useState<Brand | null>(null)
  const [productTypes, setProductTypes] = useState<ProductType[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  
  // Next.js hooks for navigation and route parameters
  const router = useRouter()
  const params = useParams()
  const brandId = params.brandId

  /**
   * Effect hook to fetch brand and product data when brandId changes
   */
  useEffect(() => {
    if (brandId) {
      fetchBrandAndProducts()
    }
  }, [brandId])

  /**
   * Fetches brand details and associated product types from Supabase
   * First retrieves brand information, then fetches all product types for that brand
   */
  const fetchBrandAndProducts = async () => {
    try {
      // Fetch brand details using the brandId from URL parameters
      const { data: brandData, error: brandError } = await supabase
        .from('brands')
        .select('*')
        .eq('id', brandId)
        .single()

      if (brandError) {
        console.error('Error fetching brand:', brandError)
        return
      }

      setBrand(brandData)

      // Fetch product types associated with this brand
      const { data: productData, error: productError } = await supabase
        .from('product_types')
        .select('*')
        .eq('brand_id', brandId)
        .order('name', { ascending: true })

      if (productError) {
        console.error('Error fetching products:', productError)
        return
      }

      setProductTypes(productData || [])
      
      // Set initial search query placeholder empty
      setSearchQuery(``)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Filters product types based on search query
   * Removes the placeholder text and performs case-insensitive search
   */
  const filteredProducts = productTypes.filter(product =>
    product.name.toLowerCase().includes(
      searchQuery.replace(/search for \w+/i, '').trim().toLowerCase()
    )
  )

  // Loading state with skeleton loaders
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="animate-pulse">
          {/* Header skeleton */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            <div className="flex-1 h-12 bg-gray-200 rounded"></div>
          </div>
          {/* Breadcrumb skeleton */}
          <div className="h-6 bg-gray-200 rounded mb-6 w-32"></div>
          {/* Product list skeleton */}
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded"></div>
                  <div className="w-16 h-6 bg-gray-200 rounded"></div>
                </div>
                <div className="w-6 h-6 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Error state when brand is not found
  if (!brand) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Brand not found</h2>
          <Button onClick={() => router.push('/')} variant="outline">
            Go back to home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      {/* Header Section with Navigation and Search */}
      <div className="mb-6">
        {/* Top navigation bar */}
        <div className="flex items-center gap-4 mb-4">
          {/* Back navigation button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          
          {/* Search input with brand-specific placeholder */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder={`Search for ${brand.name}`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base text-gray-600"
            />
          </div>
        </div>

        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <span>...</span>
          <span>/</span>
          <Link href="/" className="text-blue-600 hover:underline">
            {brand.name}
          </Link>
        </div>
      </div>

      {/* Product Types List */}
      <div className="space-y-2">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => {
              
              // Navigate to product models page
              router.push(`/brand/${brandId}/product/${product.id}`)
            }}
          >
            {/* Product information */}
            <div className="flex items-center gap-4">
              {/* Product image */}
              <div className="w-12 h-12 relative">
                <Image
                  src={product.image_url}
                  alt={`${product.name} product`}
                  fill
                  className="object-contain"
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    const target = e.target as HTMLImageElement
                    target.src = '/placeholder-product.png'
                  }}
                />
              </div>
              {/* Product name */}
              <span className="text-lg font-medium text-gray-900">
                {product.name}
              </span>
            </div>
            {/* Navigation arrow */}
            <ChevronRight className="h-6 w-6 text-gray-400" />
          </div>
        ))}
      </div>

      {/* Empty state when no products match search or brand has no products */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No products found for {brand.name}
        </div>
      )}
    </div>
  )
}