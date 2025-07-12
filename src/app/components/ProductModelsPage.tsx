/**
 * ProductModelsPage Component
 * 
 * Displays all models for a specific product type within a brand. This is the most
 * detailed view in the application hierarchy, showing individual product models
 * with their specifications and action buttons.
 * 
 * Route: /brand/[brandId]/product/[productId]
 * 
 * Features:
 * - Displays brand and product type information
 * - Lists all models for the selected product type
 * - Shows model specifications from specification_v1 table
 * - Search functionality for filtering models
 * - Navigation breadcrumbs showing full path
 * - Action buttons for each model (PDF, Settings)
 * - Loading states and error handling
 * - Fallback image handling for missing model images
 * 
 * Data Flow:
 * 1. Fetches brand details using brandId
 * 2. Fetches product type details using productId
 * 3. Fetches models associated with the product type
 * 4. Fetches specifications for each model from specification_v1 table
 * 5. Combines all data for display
 */

"use client"

import { useState, useEffect } from 'react'
import { Search, ChevronRight, ArrowLeft, FileText, Settings } from 'lucide-react'
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

/**
 * Model interface defining the structure of model data from Supabase
 * Includes optional specifications array populated from specification_v1 table
 */
interface Model {
  id: number
  model_number: string
  title: string
  link: string
  image: string
  product_type_id: number
  specifications?: string[] // Populated from specification_v1 table
}

export default function ProductModelsPage() {
  // State management for component data and UI state
  const [brand, setBrand] = useState<Brand | null>(null)
  const [productType, setProductType] = useState<ProductType | null>(null)
  const [models, setModels] = useState<Model[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  
  // Next.js hooks for navigation and route parameters
  const router = useRouter()
  const params = useParams()
  const brandId = params.brandId
  const productId = params.productId

  /**
   * Effect hook to fetch all required data when route parameters change
   */
  useEffect(() => {
    if (brandId && productId) {
      fetchData()
    }
  }, [brandId, productId])

  /**
   * Comprehensive data fetching function that retrieves all necessary information
   * for the product models page. This includes:
   * 1. Brand information
   * 2. Product type information
   * 3. Models associated with the product type
   * 4. Specifications for each model
   */
  const fetchData = async () => {
    try {
      console.log('=== DEBUG: Starting fetchData ===')
      console.log('brandId:', brandId)
      console.log('productId:', productId)

      // Step 1: Fetch brand details using brandId from URL
      const { data: brandData, error: brandError } = await supabase
        .from('brands')
        .select('*')
        .eq('id', brandId)
        .single()

      console.log('Brand query result:', { brandData, brandError })

      if (brandError) {
        console.error('Error fetching brand:', brandError)
        return
      }

      setBrand(brandData)

      // Step 2: Fetch product type details using productId from URL
      const { data: productData, error: productError } = await supabase
        .from('product_types')
        .select('*')
        .eq('id', productId)
        .single()

      console.log('Product query result:', { productData, productError })

      if (productError) {
        console.error('Error fetching product:', productError)
        return
      }

      setProductType(productData)

      // Step 3: Fetch models associated with this product type
      const { data: modelsData, error: modelsError } = await supabase
        .from('models')
        .select('*')
        .eq('product_type_id', productId)
        .order('model_number', { ascending: true })

      console.log('Models query result:', { modelsData, modelsError })
      console.log('Query used: product_type_id =', productId)

      if (modelsError) {
        console.error('Error fetching models:', modelsError)
        return
      }

      // Step 4: If models exist, fetch their specifications
      if (modelsData && modelsData.length > 0) {
        // Extract all model numbers for specifications query
        const modelNumbers = modelsData.map(model => model.model_number)
        console.log('Model numbers for specs query:', modelNumbers)

        // Fetch specifications for all models from specification_v1 table
        const { data: specsData, error: specsError } = await supabase
          .from('specification_v1')
          .select('model_number, specs')
          .in('model_number', modelNumbers)

        console.log('Specifications query result:', { specsData, specsError })

        if (specsError) {
          console.error('Error fetching specifications:', specsError)
        }

        // Step 5: Group specifications by model_number for efficient lookup
        const specsMap = new Map<string, string[]>()
        if (specsData) {
          specsData.forEach(spec => {
            if (!specsMap.has(spec.model_number)) {
              specsMap.set(spec.model_number, [])
            }
            specsMap.get(spec.model_number)!.push(spec.specs)
          })
        }

        console.log('Grouped specifications:', Object.fromEntries(specsMap))

        // Step 6: Combine models with their specifications
        const modelsWithSpecs = modelsData.map(model => ({
          ...model,
          specifications: specsMap.get(model.model_number) || []
        }))

        setModels(modelsWithSpecs)
      } else {
        setModels([])
      }
      
      // Set initial search query placeholder empty
      setSearchQuery(``)
      
      console.log('=== DEBUG: fetchData completed ===')
      console.log('Final state:', {
        brand: brandData,
        productType: productData,
        modelsCount: modelsData?.length || 0
      })
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Filters models based on search query
   * Searches through model numbers and titles
   * Handles the placeholder text appropriately
   */
  const filteredModels = models.filter(model => {
    // If it's the default placeholder text, show all models
    if (searchQuery.startsWith('Search for ')) {
      console.log('Default placeholder detected, showing all models')
      return true
    }
    
    // Otherwise filter based on actual search input
    const searchTerm = searchQuery.trim().toLowerCase()
    console.log('=== DEBUG: Filtering ===')
    console.log('searchQuery:', searchQuery)
    console.log('searchTerm:', searchTerm)
    console.log('Total models:', models.length)
    
    if (!searchTerm) {
      return true
    }
    
    const matches = (
      model.model_number.toLowerCase().includes(searchTerm) ||
      model.title.toLowerCase().includes(searchTerm)
    )
    
    console.log(`Model ${model.model_number} matches: ${matches}`)
    return matches
  })
  
  console.log('Filtered models count:', filteredModels.length)

  // Loading state with comprehensive skeleton loaders
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
          <div className="h-6 bg-gray-200 rounded mb-6 w-48"></div>
          {/* Models list skeleton */}
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded"></div>
                  <div className="space-y-2">
                    <div className="w-20 h-5 bg-gray-200 rounded"></div>
                    <div className="w-16 h-4 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                  <div className="w-6 h-6 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Error state when brand or product type is not found
  if (!brand || !productType) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Product not found</h2>
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
          
          {/* Search input with product-specific placeholder */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder={`Search for ${productType.name}`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base text-gray-600"
            />
          </div>
        </div>

        {/* Breadcrumb Navigation showing full hierarchy */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <span>...</span>
          <span>/</span>
          <Link href={`/brand/${brandId}`} className="text-blue-600 hover:underline">
            {brand.name}
          </Link>
          <span>/</span>
          <span className="text-blue-600">
            {productType.name}
          </span>
        </div>
      </div>

      {/* Models List */}
      <div className="space-y-2">
        {filteredModels.map((model) => (
          <div
            key={model.id}
            className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => {
              // TODO: Navigate to model details page or handle model selection
              console.log('Model clicked:', model.model_number)
            }}
          >
            {/* Model information section */}
            <div className="flex items-center gap-4">
              {/* Model image */}
              <div className="w-12 h-12 relative">
                <Image
                  src={model.image}
                  alt={`${model.model_number} model`}
                  fill
                  className="object-contain"
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    const target = e.target as HTMLImageElement
                    target.src = '/placeholder-model.png'
                  }}
                />
              </div>
              
              {/* Model details */}
              <div>
                {/* Model number (primary identifier) */}
                <div className="text-lg font-medium text-gray-900">
                  {model.model_number}
                </div>
                {/* Model specifications (secondary information) */}
                <div className="text-sm text-gray-500">
                  {model.specifications && model.specifications.length > 0 
                    ? model.specifications.join(', ')
                    : 'No specifications available'
                  }
                </div>
              </div>
            </div>
            
            {/* Action buttons section */}
            <div className="flex items-center gap-2">
              {/* PDF/Documentation button - functionality to be implemented */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={(e) => e.stopPropagation()}
                title="View documentation"
              >
                <FileText className="h-4 w-4 text-gray-400" />
              </Button>
              
              {/* Settings/Configuration button - functionality to be implemented */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={(e) => e.stopPropagation()}
                title="Model settings"
              >
                <Settings className="h-4 w-4 text-gray-400" />
              </Button>
              
              {/* Navigation arrow */}
              <ChevronRight className="h-6 w-6 text-gray-400" />
            </div>
          </div>
        ))}
      </div>

      {/* Empty state when no models match search or product has no models */}
      {filteredModels.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No models found for {productType.name}
        </div>
      )}
    </div>
  )
}