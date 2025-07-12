# HVAC Catalog - Cere Assignment

A modern web application for browsing HVAC equipment catalogs with hierarchical navigation from brands to individual product models. Built with Next.js, TypeScript, and Supabase.

Focus on [**Carrier**](https://www.carrier.com/carrier/en/worldwide/)

## 📊 Data Sources & Structure

### Data Acquisition Process

The data for this application was systematically extracted from multiple HVAC brand websites using an automated approach due to the comprehensive nature and large volume of products available.

#### **Data Extraction Methodology**

1. **Initial Analysis & Planning**
   - Analyzed different HVAC brand websites and their product offerings
   - Identified that manual extraction was infeasible due to the extensive product catalogs
   - Determined the need for an automated extraction approach and finalized **Carrier** as the brand to focus on

2. **Sitemap Generation & Link Processing**
   - Started with seed product page links from the brand website
   - Generated XML sitemaps to discover all product-related URLs
   - Categorized XML links hierarchically (Brand → Product Type → Model)
   - Removed duplicate and irrelevant links to ensure data quality

3. **Automated Data Extraction**
   - Utilized **Octoparse** (online web scraping tool) to configure extraction workflows
   - Created dedicated workflows for:
     - **Product Information**: Brand names, product types, model numbers, images, descriptions
     - **Technical Specifications**: Detailed model specifications and technical data
   - Configured extraction rules to handle different website structures and formats

4. **Data Processing & Cleaning**
   - Processed raw extracted data to remove duplicates
   - Standardized data formats and naming conventions
   - Grouped related information logically
   - Validated data integrity and completeness

#### **Data Structure Organization**

The processed data was organized into **4 CSV files** representing the hierarchical structure:

1. **`brands.csv`**
   - **Purpose**: Master list of HVAC manufacturers
   - **Fields**: `id`, `name`, `image_url`
   - **Content**: Brand identifiers, company names, and logo images

2. **`product_types.csv`**
   - **Purpose**: Product categories within each brand
   - **Fields**: `id`, `name`, `brand_id`, `image_url`
   - **Content**: Product category information linked to specific brands

3. **`models.csv`**
   - **Purpose**: Individual product models within each product type
   - **Fields**: `id`, `model_number`, `title`, `link`, `image`, `product_type_id`
   - **Content**: Detailed model information with references to product types

4. **`specification_v1.csv`**
   - **Purpose**: Technical specifications for each model
   - **Fields**: `model_number`, `specs`
   - **Content**: Detailed technical specifications linked to model numbers

#### **Database Implementation**

- **Platform**: Supabase (PostgreSQL-based)
- **Loading Process**: Direct CSV import into corresponding database tables
- **Relationships**: Maintained referential integrity through foreign key constraints
- **Indexing**: Optimized for search performance on frequently queried fields

#### **Data Quality Measures**

- **Deduplication**: Comprehensive duplicate removal across all data levels
- **Validation**: Ensured data consistency and format standardization
- **Completeness**: Verified all hierarchical relationships were properly maintained
- **Image Handling**: Validated image URLs and implemented fallback mechanisms

## 🚀 Setup Instructions

### Prerequisites

Before setting up the application, ensure you have the following installed on your system:

- **Node.js** (version 18.17.0 or higher)
  - Download from [nodejs.org](https://nodejs.org/)
  - Verify installation: `node --version`
- **npm** (comes with Node.js) or **yarn** package manager
  - Verify npm: `npm --version`
- **Git** for cloning the repository
  - Download from [git-scm.com](https://git-scm.com/)

### Environment Setup

1. **Clone the Repository**

   ```bash
   git clone <repository-url>
   cd havc-catalog-cere-ai
   ```

2. **Install Dependencies**

   ```bash
   npm install
   # or if using yarn
   yarn install
   ```

3. **Environment Configuration**

   Create a `.env.local` file in the root directory and add your Supabase credentials:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   **Note:** Replace the placeholder values with your actual Supabase project credentials. These are required for database connectivity.

4. **Database Setup**

   Ensure your Supabase database has the following tables with the required structure:
   - `brands` - Contains brand information (id, name, image_url)
   - `product_types` - Contains product categories (id, name, brand_id, image_url)
   - `models` - Contains individual product models (id, model_number, title, link, image, product_type_id)
   - `specification_v1` - Contains model specifications (model_number, specs)

### Running the Application

1. **Development Mode**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

   The application will start on [http://localhost:3000](http://localhost:3000)

2. **Production Build**

   ```bash
   # Build the application
   npm run build
   # or
   yarn build
   
   # Start the production server
   npm run start
   # or
   yarn start
   ```

3. **Code Quality Check**

   ```bash
   npm run lint
   # or
   yarn lint
   ```

### Troubleshooting Setup

- **Port already in use**: If port 3000 is occupied, Next.js will automatically suggest an alternative port
- **Environment variables**: Ensure `.env.local` file is in the root directory and contains valid Supabase credentials
- **Dependencies issues**: Try deleting `node_modules` and `package-lock.json`, then run `npm install` again
- **Database connection**: Verify Supabase project is active and credentials are correct

## 📱 Usage and Features

### Navigation Structure

The application follows a hierarchical browsing pattern with three main levels:

#### 1. **Home Page** (`/`)

- **Purpose**: Entry point displaying all available HVAC brands
- **Features**:
  - Grid view of brand logos and names
  - Search functionality across all brands
  - Models/Parts toggle buttons (UI elements for future functionality)
- **Navigation**: Click on any brand to view its product types

#### 2. **Brand Products Page** (`/brand/[brandId]`)

- **Purpose**: Shows all product categories for a selected brand
- **Features**:
  - Brand-specific search with placeholder text
  - Breadcrumb navigation showing current path
  - List of product types with images and names
- **Navigation**:
  - Back button returns to home page
  - Click on any product type to view its models

#### 3. **Product Models Page** (`/brand/[brandId]/product/[productId]`)

- **Purpose**: Displays individual models within a product category
- **Features**:
  - Comprehensive model listings with specifications
  - Model-specific search functionality
  - Action buttons for each model (PDF and Settings - UI only)
  - Full breadcrumb navigation path
- **Navigation**:
  - Back button returns to brand products page
  - Breadcrumbs allow quick navigation to any level

### Search Functionality

#### **Search Behavior**

- **Case-insensitive**: Search works regardless of letter case
- **Real-time filtering**: Results update immediately as you type
- **Contextual placeholders**: Search hints adapt to current page context
- **Comprehensive matching**: Searches across relevant fields for each page level

#### **Search Scope by Page**

1. **Home Page**: Searches through brand names
2. **Brand Products**: Searches through product type names within the selected brand
3. **Product Models**: Searches through model numbers and titles within the selected product type

#### **Search Features**

- **Clear placeholder text**: Shows context-specific search hints (e.g., "Search for Carrier")
- **Instant results**: No need to press enter; filtering happens on keystroke
- **Empty state handling**: Displays helpful messages when no results found
- **Search persistence**: Search terms maintained during navigation sessions

### User Interface Features

#### **Loading States**

- **Skeleton loaders**: Smooth loading animations while data fetches
- **Progressive loading**: Different content sections load independently
- **Error handling**: Graceful fallbacks for missing data or failed requests

#### **Responsive Design**

- **Mobile-optimized**: Touch-friendly interface with appropriate sizing
- **Flexible layouts**: Adapts to different screen sizes and orientations
- **Consistent spacing**: Uniform padding and margins throughout the application

#### **Visual Feedback**

- **Hover effects**: Interactive elements provide visual feedback
- **Focus states**: Keyboard navigation support with visible focus indicators
- **Transition animations**: Smooth state changes and page transitions

### Image Handling

- **Automatic fallbacks**: Placeholder images display when original images fail to load
- **Optimized loading**: Next.js Image component provides automatic optimization
- **External image support**: Configured to handle images from Carrier CMS domains

### Data Display

#### **Brand Information**

- Logo display with fallback handling
- Alphabetically sorted brand listings
- Click-to-navigate functionality

#### **Product Details**

- Product type images and descriptions
- Hierarchical organization by brand
- Clear visual separation between categories

#### **Model Specifications**

- Model numbers as primary identifiers
- Technical specifications displayed as comma-separated values
- Additional model information (title, images, links)
- Action buttons for future PDF and configuration features

### Accessibility Features

- **Keyboard navigation**: All interactive elements accessible via keyboard
- **Focus management**: Clear focus indicators throughout the interface
- **Semantic HTML**: Proper heading hierarchy and element structure
- **Alt text**: Descriptive alternative text for all images
- **Screen reader support**: Compatible with assistive technologies

### Performance Optimizations

- **Image optimization**: Automatic image compression and format selection
- **Code splitting**: Efficient JavaScript bundling with Next.js
- **Database queries**: Optimized Supabase queries with proper indexing
- **Client-side filtering**: Fast search without server round trips for small datasets

## 🛠️ Technical Architecture

### Frontend Technology Stack

- **Next.js 15.3.5**: React framework with App Router
- **React 19**: Latest React with server components
- **TypeScript 5**: Type safety and developer experience
- **Tailwind CSS 4**: Utility-first styling with design tokens
- **Lucide React**: Consistent iconography

### Backend & Database

- **Supabase**: Backend-as-a-Service with PostgreSQL
- **Real-time subscriptions**: Live data updates (infrastructure ready)
- **Row Level Security**: Database security policies

### UI Components

- **Radix UI**: Accessible component primitives
- **shadcn/ui**: Pre-built component library
- **Class Variance Authority**: Type-safe component variants

## 🚧 Challenges & Solutions

### Technical Specification Data Processing

#### **Challenge: Inconsistent Specification Formats**

The most significant challenge encountered during development was extracting and processing technical specifications for HVAC models. Unlike structured product information (names, images, URLs), technical specifications had no standardized format across different:

- **Brand websites**: Each manufacturer used different layouts and terminology
- **Product categories**: Specifications varied dramatically between product types (air conditioners vs. heat pumps vs. furnaces)
- **Data presentation**: Some specs were in tables, others in lists, paragraphs, or mixed formats
- **Naming conventions**: Inconsistent field names and units of measurement

#### **Solution: Multi-Stage Data Processing Pipeline**

**1. Comprehensive Data Extraction**

- Extracted all available specification data without initial filtering
- Captured both structured and unstructured specification content
- Preserved original formatting context for analysis

**2. Data Cleaning & Filtering**

- Removed clearly unnecessary information (marketing copy, legal disclaimers, navigation elements)
- Identified and separated actual technical specifications from descriptive content
- Standardized common measurement units and terminology

**3. Manual Formatting Rules Development**

- Analyzed patterns across thousands of specification entries
- Developed custom parsing rules for common specification formats:
  - **Table-based specs**: Extracted key-value pairs from HTML tables
  - **List formats**: Processed bulleted and numbered specification lists
  - **Paragraph specs**: Used pattern matching to identify specification sentences
  - **Mixed formats**: Created hybrid parsing strategies for complex layouts

**4. Exception Handling**

- Identified specification entries that didn't fit standard parsing rules
- Manually reviewed and processed edge cases
- Created specific handling rules for unique specification formats
- Implemented fallback strategies for unparseable content

#### **Technical Implementation**

- **Preprocessing**: Normalized HTML structure and removed formatting artifacts
- **Pattern Recognition**: Used regular expressions and string matching for common spec patterns
- **Quality Validation**: Implemented checks to ensure parsed specifications were meaningful
- **Manual Review**: Conducted spot checks and manual verification of parsing accuracy

#### **Results Achieved**

- Successfully parsed and structured over 90% of technical specifications automatically
- Maintained data quality while handling diverse specification formats
- Created a scalable approach that could accommodate future brand additions
- Ensured consistent specification display across the application interface

This documentation provides everything needed to set up, run, and understand the HVAC Catalog application. For additional technical details, refer to the inline code comments throughout the codebase.
