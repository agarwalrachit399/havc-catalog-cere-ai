/**
 * Product Models Page Component
 * 
 * Dynamic route page that displays all models for a specific product type
 * within a brand. Both brandId and productId are passed through Next.js
 * dynamic routing.
 * 
 * Route: /brand/[brandId]/product/[productId]
 */

// src/app/brand/[brandId]/product/[productId]/page.tsx
import ProductModelsPage from '../../../../components/ProductModelsPage'

export default function Page() {
  return <ProductModelsPage />
}