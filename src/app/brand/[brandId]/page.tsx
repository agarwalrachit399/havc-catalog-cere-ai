/**
 * Brand Products Page Component
 * 
 * Dynamic route page that displays all product types for a specific brand.
 * The brandId is passed through Next.js dynamic routing.
 * 
 * Route: /brand/[brandId]
 */

// src/app/brand/[brandId]/page.tsx
import BrandProductsPage from "../../components/BrandProductPage"

export default function Page() {
  return <BrandProductsPage />
}
