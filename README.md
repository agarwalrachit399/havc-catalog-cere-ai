# HVAC Catalog - Cere Assignment

A modern web application for browsing HVAC equipment catalogs with hierarchical navigation from brands to individual product models. Built with Next.js, TypeScript, Supabase, and enhanced with AI-powered manual search using Google Gemini.

Focus on [**Carrier**](https://www.carrier.com/carrier/en/worldwide/)

## 🤖 AI-Powered Features

### **RAG (Retrieval-Augmented Generation) System**

The application now includes an intelligent Q&A system that can answer questions about HVAC manuals using Google Gemini AI:

- **Smart Manual Search**: Ask questions in natural language about installation, specifications, troubleshooting
- **Context-Aware Answers**: Responses are grounded in actual manual content with source citations
- **Model-Specific Queries**: Filter questions to specific HVAC models or search across all manuals
- **Real-time Processing**: Instant answers powered by Gemini 2.0 Flash with text embeddings

### **PDF Manual Integration**

- **Automated Processing**: PDFs are automatically processed to extract text and generate embeddings
- **Intelligent Chunking**: Documents are split into manageable sections for better retrieval
- **Source Attribution**: All answers include references to specific manual sections
- **Fallback Handling**: Graceful error handling for corrupted or inaccessible PDFs

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

The processed data was organized into **5 CSV files** representing the hierarchical structure:

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

5. **`manuals.csv`** *(New)*
   - **Purpose**: PDF manual documents for each model
   - **Fields**: `model_number`, `pdf_url`
   - **Content**: Links to official PDF manuals for detailed documentation

#### **RAG Database Extensions**

Additional tables were created to support the AI-powered manual search:

- **`manual_chunks`**: Stores processed PDF content with embeddings for similarity search
  - Text chunks extracted from PDF manuals
  - Vector embeddings generated using Google Gemini
  - Optimized for fast retrieval and question answering

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

   Create a `.env.local` file in the root directory and add your credentials:

   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Google Gemini API Configuration (for RAG system)
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

   **Note:**
   - Replace the placeholder values with your actual Supabase project credentials
   - Get your Gemini API key from [Google AI Studio](https://ai.google.dev/)
   - Gemini API key is required for the AI-powered manual search feature

4. **Database Setup**

   Ensure your Supabase database has the following tables with the required structure:
   - `brands` - Contains brand information (id, name, image_url)
   - `product_types` - Contains product categories (id, name, brand_id, image_url)
   - `models` - Contains individual product models (id, model_number, title, link, image, product_type_id)
   - `specification_v1` - Contains model specifications (model_number, specs)
   - `manuals` - Contains PDF manual links (model_number, pdf_url)
   - `manual_chunks` - Contains processed PDF content with embeddings for RAG search

   **RAG System Setup:**
   1. Run the provided SQL migration to create the `manual_chunks` table
   2. Navigate to `/admin/rag` in your application
   3. Click "Clean Database" to ensure a fresh start
   4. Click "Process All PDFs" to extract and index manual content
   5. Test the system using the built-in test interface

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

The application follows a hierarchical browsing pattern with four main levels:

#### **1. Home Page** (`/`)

- **Purpose**: Entry point displaying all available HVAC brands
- **Features**:
  - Grid view of brand logos and names
  - Search functionality across all brands
  - Models/Parts toggle buttons (UI elements for future functionality)
- **Navigation**: Click on any brand to view its product types

#### **2. Brand Products Page** (`/brand/[brandId]`)

- **Purpose**: Shows all product categories for a selected brand
- **Features**:
  - Brand-specific search with placeholder text
  - Breadcrumb navigation showing current path
  - List of product types with images and names
- **Navigation**:
  - Back button returns to home page
  - Click on any product type to view its models

#### **3. Product Models Page** (`/brand/[brandId]/product/[productId]`)

- **Purpose**: Displays individual models within a product category
- **Features**:
  - Comprehensive model listings with specifications
  - Model-specific search functionality
  - **AI-powered Q&A component** for asking questions about manuals
  - PDF documentation access with availability indicators
  - Action buttons for each model (PDF, Settings)
  - Full breadcrumb navigation path
- **Navigation**:
  - Back button returns to brand products page
  - Breadcrumbs allow quick navigation to any level

#### **4. RAG Q&A System** *(New Feature)*

- **Purpose**: Intelligent question answering using manual content
- **Features**:
  - **Natural language queries** about HVAC installations, specifications, troubleshooting
  - **Context-aware responses** grounded in actual manual content
  - **Source citations** showing which manuals were referenced
  - **Model-specific filtering** for targeted questions
  - **Expandable interface** that doesn't clutter the main UI
- **Usage**: Available on product model pages and throughout the application

**Example RAG Queries:**

*Installation & Setup:*

- "What are the electrical requirements for this heat pump?"
- "How much clearance space is needed for installation?"
- "What tools are required for installation?"

*Technical Specifications:*

- "What is the SEER rating of this unit?"
- "What refrigerant does this model use?"
- "What are the operating temperature ranges?"

*Troubleshooting & Maintenance:*

- "How do I troubleshoot error code E1?"
- "What are the maintenance requirements?"
- "How often should filters be replaced?"

*Compatibility & Parts:*

- "What thermostats are compatible with this unit?"
- "Where can I find the model number label?"
- "What replacement parts are available?"

#### **5. Admin Interface** (`/admin/rag`)

- **Purpose**: Manage and configure the RAG system
- **Features**:
  - **Database management** (clean and reset processed content)
  - **PDF processing** (batch process all manuals)
  - **System health monitoring**
  - **Test interface** for validating Q&A functionality
  - **Processing status** and detailed logs

### Search Functionality

#### **Traditional Search Behavior**

- **Case-insensitive**: Search works regardless of letter case
- **Real-time filtering**: Results update immediately as you type
- **Contextual placeholders**: Search hints adapt to current page context
- **Comprehensive matching**: Searches across relevant fields for each page level

#### **AI-Powered Manual Search** *(New)*

- **Natural language queries**: Ask questions in plain English
- **Semantic understanding**: Finds relevant content even with different wording
- **Context-aware results**: Understands HVAC terminology and concepts
- **Source attribution**: Shows exactly which manual sections were used

#### **Search Scope by Page**

1. **Home Page**: Searches through brand names
2. **Brand Products**: Searches through product type names within the selected brand
3. **Product Models**: Searches through model numbers and titles within the selected product type
4. **RAG Q&A**: Searches through processed manual content using vector embeddings

#### **Search Features**

- **Clear placeholder text**: Shows context-specific search hints (e.g., "Search for Carrier")
- **Instant results**: No need to press enter; filtering happens on keystroke
- **Empty state handling**: Displays helpful messages when no results found
- **Search persistence**: Search terms maintained during navigation sessions
- **AI suggestions**: Smart prompts for manual-related questions

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
- **PDF manual access** with availability indicators
- **AI Q&A integration** for instant manual consultation

#### **Manual Integration**

- **Smart PDF buttons**: Visual indicators for manual availability
- **Direct access**: One-click PDF opening in new tabs
- **AI-powered search**: Ask questions instead of manual browsing
- **Context-aware help**: Get specific answers for each model

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
- **Vector search optimization**: Efficient embedding storage and cosine similarity calculations
- **PDF processing**: Intelligent chunking and batch processing to minimize memory usage
- **API rate limiting**: Built-in throttling to respect external service limits

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
- **Vector storage**: Embeddings stored as JSON strings (expandable to pgvector)

### AI & RAG System

- **Google Gemini API**: Latest AI models for generation and embeddings
  - **Gemini 2.0 Flash**: Text generation with low latency
  - **text-embedding-004**: State-of-the-art text embeddings (768 dimensions)
- **RAG Pipeline**: Retrieval-Augmented Generation for manual Q&A
  - **PDF Processing**: Automated text extraction using pdf-parse
  - **Intelligent Chunking**: Smart text segmentation with overlap
  - **Vector Search**: Cosine similarity for content retrieval
  - **Context Generation**: Grounded responses with source citations

### UI Components

- **Radix UI**: Accessible component primitives
- **shadcn/ui**: Pre-built component library
- **Class Variance Authority**: Type-safe component variants
- **RAGQA Component**: Custom AI Q&A interface with expandable design

### API Architecture

- **RESTful Endpoints**:
  - `/api/rag/process-pdf`: PDF processing and embedding generation
  - `/api/rag/ask`: Question answering with context retrieval
  - `/api/rag/clean`: Database maintenance and cleanup
- **Error Handling**: Comprehensive failure recovery and logging
- **Rate Limiting**: Built-in API throttling and retry mechanisms

## 📁 Project Structure

### **Core Application**

```
src/
├── app/
│   ├── components/           # Main page components
│   │   ├── HomePage.tsx
│   │   ├── BrandProductPage.tsx
│   │   └── ProductModelsPage.tsx
│   ├── brand/[brandId]/      # Dynamic brand routes
│   ├── admin/rag/           # RAG administration
│   └── api/rag/             # RAG API endpoints
│       ├── process-pdf/     # PDF processing
│       ├── ask/            # Q&A functionality
│       └── clean/          # Database cleanup
└── components/
    ├── ui/                 # shadcn/ui components
    ├── RAGQA.tsx          # AI Q&A interface
    └── RAGAdminPage.tsx   # Admin interface
```

### **Database Schema**

```sql
-- Core catalog tables
brands           → HVAC manufacturers
product_types    → Product categories
models          → Individual products
specification_v1 → Technical specs
manuals         → PDF manual links

-- RAG system tables  
manual_chunks   → Processed PDF content with embeddings
```

### **API Endpoints**

```
/api/rag/process-pdf  → PDF processing and embedding generation
/api/rag/ask         → Question answering with context retrieval  
/api/rag/clean       → Database maintenance and cleanup
```

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

### PDF Manual Processing and RAG Implementation

#### **Challenge: Large-Scale PDF Content Extraction**

Implementing RAG for HVAC manuals presented unique challenges in processing hundreds of technical PDF documents:

- **Diverse PDF formats**: Different layouts, scanned vs. text-based, various file sizes
- **Content complexity**: Technical diagrams, tables, specifications mixed with text
- **Scale considerations**: Processing 166+ PDFs with thousands of pages total
- **API limitations**: Rate limits and memory constraints for embedding generation
- **Error resilience**: Handling corrupted, oversized, or inaccessible PDF files

#### **Solution: Robust PDF Processing Pipeline**

**1. Intelligent PDF Processing**

- **Multi-retry download logic**: Up to 3 attempts with exponential backoff
- **Format validation**: Detect and handle corrupted or password-protected files
- **Size management**: Automatic truncation of extremely large documents (>1MB text)
- **Content cleaning**: Remove control characters and normalize text encoding

**2. Smart Text Chunking**

- **Boundary-aware splitting**: Break at paragraphs, sentences, or logical sections
- **Overlap strategy**: Maintain context across chunks for better retrieval
- **Size optimization**: Balance chunk size for embedding API limits and context preservation
- **Quality filtering**: Remove empty or malformed chunks automatically

**3. Embedding Generation with Resilience**

- **Batch processing**: Group requests to optimize API usage
- **Rate limiting**: Built-in delays to respect Gemini API constraints
- **Retry mechanisms**: Handle temporary API failures gracefully
- **Fallback strategies**: Continue processing even if individual embeddings fail

**4. Error Recovery and Monitoring**

- **Individual failure isolation**: One failed PDF doesn't stop the entire batch
- **Detailed logging**: Comprehensive error reporting for debugging
- **Progress tracking**: Real-time status updates during processing
- **Admin interface**: Tools for monitoring and managing the RAG system

#### **Results Achieved**

- Successfully processed 85-90% of PDF manuals automatically
- Built resilient system that handles various PDF formats and sizes
- Implemented efficient vector search with sub-second response times
- Created user-friendly Q&A interface with source attribution
- Achieved high accuracy in question answering with grounded responses

This documentation provides everything needed to set up, run, and understand the HVAC Catalog application with its advanced AI-powered manual search capabilities. For additional technical details, refer to the inline code comments throughout the codebase.
