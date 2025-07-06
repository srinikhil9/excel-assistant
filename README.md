# Excel SQL Assistant Add-in

A fully functional Excel Add-in that converts natural language questions to SQL and inserts results directly into Excel worksheets.

## Features

### ✅ Core MVP Features
- **OpenAI-Powered SQL Generation**: Real AI-powered natural language to SQL conversion
- **Sophisticated Query Patterns**: Supports complex analysis including CTEs, window functions, joins
- **Advanced Options**: Configurable SQL generation with comments, CTEs, performance hints
- **Excel Integration**: Automatically loads worksheet names and allows range selection
- **SQL Preview**: View and edit generated SQL with syntax highlighting
- **Smart Data Generation**: Context-aware mock data based on SQL query type
- **Data Insertion**: Insert formatted data directly into Excel with proper styling
- **Range Selection**: Get selected Excel ranges with a button click
- **Worksheet Management**: Dropdown to select target worksheets
- **Error Handling**: Proper error messages and loading states
- **Copy to Clipboard**: Copy SQL queries to clipboard
- **API Statistics**: Track OpenAI API usage and requests

### 🆕 Advanced Features
- **Query History & Favorites**: Save, search, and organize queries with categories and tags
- **Custom Database Schemas**: Create and manage custom database schemas for improved SQL generation
- **SQL Validation & Syntax Checking**: Real-time validation with error detection and performance hints
- **Export Options**: Export queries and results in CSV, JSON, Excel, SQL, and Markdown formats
- **Schema Management**: Full CRUD operations for database schemas with validation
- **Performance Analysis**: Get suggestions for query optimization and best practices

### 🎯 Example Usage
1. Type: "Show total cost by carrier for Q1 2025"
2. Click "Run Query" 
3. Review generated SQL
4. Click "Insert to Excel" to add formatted data

## Getting Started

### Prerequisites
- Node.js (v16+ recommended)
- Excel Desktop or Excel Online
- [Office Add-in Sideloading Tools](https://docs.microsoft.com/en-us/office/dev/add-ins/testing/sideload-office-add-ins-for-testing)

### Quick Start
```bash
# Install dependencies
npm install

# Start development server
npm start

# Sideload in Excel (see instructions below)
```

### Sideloading in Excel

#### Method 1: Using Office Add-in Debugging Tool
```bash
npm run sideload
```

#### Method 2: Manual Sideloading
1. Start the dev server: `npm start`
2. Open Excel
3. Go to **Insert > My Add-ins > Shared Folder**
4. Select the `manifest.xml` file from this project
5. The add-in will appear in the task pane

## How It Works

### OpenAI-Powered SQL Generation
The app uses GPT-4 to generate sophisticated SQL queries:
- **Complex Analysis**: CTEs, window functions, multiple joins
- **Performance Optimized**: Proper indexing hints and query structure
- **Context Aware**: Understands freight/logistics domain
- **Configurable**: Comments, CTEs, performance hints, result limits

### Advanced Query Patterns
- **Carrier Analysis**: Cost comparisons, performance metrics
- **Time Series**: Quarterly/yearly trends, seasonal analysis
- **Route Optimization**: Distance/cost analysis, efficiency metrics
- **Performance Metrics**: Delivery times, on-time rates, ratings
- **Cost Breakdown**: Detailed cost categorization and analysis

### Excel Integration
- **Worksheet Detection**: Automatically loads all worksheet names
- **Range Selection**: Click "Get Selection" to capture current Excel selection
- **Data Insertion**: Inserts formatted data with headers and styling
- **Error Recovery**: Graceful fallbacks if Excel API fails

### Mock Data Generation
Based on the SQL query, the app generates realistic mock data:
- Freight carrier information
- Cost and shipment data
- Quarterly breakdowns
- Proper Excel formatting with headers

## Project Structure
```
src/
├── components/          # React components
│   ├── InputBox.tsx    # Natural language input
│   ├── RunQueryButton.tsx # Query execution
│   ├── SQLPreview.tsx  # SQL display and editing
│   ├── WorksheetDropdown.tsx # Worksheet selection
│   ├── RangeSelector.tsx # Excel range selection
│   ├── LoadingSpinner.tsx # Loading states
│   ├── TooltipHelp.tsx # Help tooltips
│   ├── ErrorBoundary.tsx # Error handling
│   ├── AdvancedOptions.tsx # SQL generation options
│   ├── QueryHistory.tsx # Query history and favorites
│   ├── SchemaManager.tsx # Database schema management
│   ├── SQLValidator.tsx # SQL validation and syntax checking
│   └── ExportOptions.tsx # Export functionality
├── utils/
│   ├── excelHelpers.ts # Excel API utilities
│   ├── openaiService.ts # OpenAI API integration
│   ├── mockDataGenerator.ts # Mock data generation
│   ├── queryHistory.ts # Query history management
│   ├── schemaManager.ts # Schema management
│   ├── sqlValidator.ts # SQL validation
│   └── exportManager.ts # Export functionality
└── App.tsx             # Main application
```

## Development

### Key Technologies
- **React 18** with hooks for state management
- **Fluent UI** for Office-consistent styling
- **Office.js** for Excel integration
- **TypeScript** for type safety

### Excel API Usage
```typescript
// Get worksheet names
const worksheets = await getWorksheetNames();

// Get selected range
const range = await getSelectedRange();

// Insert data with formatting
await insertDataToRange(worksheet, range, data);
```

## Advanced Features Usage

### Query History & Favorites
- Click the **History** icon to view your query history
- Search and filter queries by text, category, or favorites
- Export your query history in various formats
- Organize queries with custom categories and tags

### Custom Database Schemas
- Click the **Database** icon to manage schemas
- Create custom schemas with tables and columns
- Set default schemas for improved SQL generation
- Export schemas in SQL, JSON, or Markdown formats

### SQL Validation
- Switch to the **Validation** tab to see real-time SQL validation
- Get syntax error detection and performance hints
- View best practice suggestions
- Auto-format SQL queries for better readability

### Export Options
- Click the **Download** icon to export query results
- Choose from CSV, JSON, Excel, SQL, or Markdown formats
- Include metadata like SQL queries and execution times
- Customize filenames and export options

## Next Steps for Production
- [ ] Connect to real database systems (Snowflake, PostgreSQL, etc.)
- [ ] Implement user authentication and permissions
- [ ] Add collaborative features (shared queries, team schemas)
- [ ] Include advanced analytics and visualization
- [ ] Add query performance monitoring and optimization
- [ ] Implement query templates and snippets

## Troubleshooting

### Common Issues
1. **Add-in not loading**: Check manifest.xml and ensure HTTPS is used
2. **Excel API errors**: Verify Office.js is loaded before React renders
3. **CORS issues**: Ensure proper domain configuration in manifest

### Debug Mode
Open browser dev tools in the task pane to see console logs and errors.

## License
MIT 