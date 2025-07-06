import OpenAI from 'openai';

// Initialize OpenAI client
const apiKey = process.env.REACT_APP_OPENAI_API_KEY;

if (!apiKey) {
  console.error("OpenAI API key not found. Please set REACT_APP_OPENAI_API_KEY environment variable.");
  // You might want to throw an error here or handle it gracefully
  // For now, let's proceed, but OpenAI calls will fail.
}

const openai = new OpenAI({
  apiKey: apiKey, // Use the API key from environment variable
  dangerouslyAllowBrowser: true // Note: In production, this should be handled server-side
});

// Database schema context for better SQL generation
const DATABASE_SCHEMA = `
Database: freight_analytics
Tables:
- freight_data (
    id INT PRIMARY KEY,
    carrier VARCHAR(50),
    origin VARCHAR(100),
    destination VARCHAR(100),
    cost DECIMAL(10,2),
    weight DECIMAL(8,2),
    shipment_date DATE,
    quarter VARCHAR(10),
    year INT,
    service_type VARCHAR(50),
    delivery_time_days INT,
    status VARCHAR(20)
  )
- carriers (
    id INT PRIMARY KEY,
    name VARCHAR(50),
    type VARCHAR(20),
    region VARCHAR(50),
    rating DECIMAL(3,2)
  )
- routes (
    id INT PRIMARY KEY,
    origin VARCHAR(100),
    destination VARCHAR(100),
    distance_miles INT,
    typical_cost DECIMAL(10,2)
  )
`;

// SQL generation system prompt
const SYSTEM_PROMPT = `You are an expert SQL analyst specializing in freight and logistics data analysis. 

${DATABASE_SCHEMA}

Generate SQL queries that are:
1. Optimized for performance (use appropriate indexes, limit results when needed)
2. Well-formatted and readable
3. Include meaningful column aliases
4. Use proper aggregation functions (SUM, COUNT, AVG, etc.)
5. Include ORDER BY clauses for meaningful sorting
6. Use appropriate WHERE clauses for filtering
7. Consider using CTEs (Common Table Expressions) for complex queries
8. Include comments explaining the logic

Common analysis patterns:
- Cost analysis by carrier, route, or time period
- Performance metrics (delivery times, costs per mile)
- Trend analysis over quarters/years
- Comparative analysis between carriers
- Route optimization insights
- Service type performance

Always return only the SQL query, no explanations or markdown formatting.`;

export interface SQLGenerationOptions {
  includeComments?: boolean;
  limitResults?: number;
  preferCTEs?: boolean;
  includePerformanceHints?: boolean;
}

export class OpenAIService {
  private static instance: OpenAIService;
  private requestCount = 0;
  private lastRequestTime = 0;
  private readonly RATE_LIMIT_DELAY = 1000; // 1 second between requests

  static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }

  async generateSQL(
    question: string, 
    options: SQLGenerationOptions = {}
  ): Promise<string> {
    // Rate limiting
    await this.enforceRateLimit();

    try {
      const userPrompt = this.buildUserPrompt(question, options);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3, // Lower temperature for more consistent SQL
        max_tokens: 1000,
        top_p: 0.9
      });

      this.requestCount++;
      this.lastRequestTime = Date.now();

      const sql = response.choices[0]?.message?.content?.trim();
      
      if (!sql) {
        throw new Error('No SQL generated from OpenAI');
      }

      return this.postProcessSQL(sql, options);
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error(`Failed to generate SQL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildUserPrompt(question: string, options: SQLGenerationOptions): string {
    let prompt = `Generate SQL for: "${question}"\n\n`;
    
    if (options.includeComments) {
      prompt += "Include comments explaining the query logic.\n";
    }
    
    if (options.limitResults) {
      prompt += `Limit results to ${options.limitResults} rows.\n`;
    }
    
    if (options.preferCTEs) {
      prompt += "Use Common Table Expressions (CTEs) for better readability.\n";
    }
    
    if (options.includePerformanceHints) {
      prompt += "Include performance optimization hints in comments.\n";
    }

    // Add context about common analysis patterns
    prompt += `
Consider these analysis patterns:
- Time-based analysis: GROUP BY quarter, year, MONTH(shipment_date)
- Carrier comparison: JOIN with carriers table for additional info
- Route analysis: JOIN with routes table for distance/cost metrics
- Performance metrics: AVG(delivery_time_days), cost per mile calculations
- Trend analysis: Window functions for running totals/percentages
`;

    return prompt;
  }

  private postProcessSQL(sql: string, options: SQLGenerationOptions): string {
    // Clean up the SQL
    let processedSQL = sql
      .replace(/```sql\s*/gi, '') // Remove markdown code blocks
      .replace(/```\s*$/gi, '')   // Remove trailing code blocks
      .trim();

    // Add default LIMIT if not present and limitResults is specified
    if (options.limitResults && !processedSQL.toLowerCase().includes('limit')) {
      processedSQL += `\nLIMIT ${options.limitResults}`;
    }

    // Ensure proper formatting
    processedSQL = this.formatSQL(processedSQL);

    return processedSQL;
  }

  private formatSQL(sql: string): string {
    // Basic SQL formatting for readability
    const keywords = [
      'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'HAVING', 
      'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN',
      'UNION', 'UNION ALL', 'WITH', 'AS', 'ON', 'AND', 'OR', 'IN',
      'BETWEEN', 'LIKE', 'IS NULL', 'IS NOT NULL', 'LIMIT', 'OFFSET'
    ];

    let formatted = sql;
    
    // Add line breaks before major clauses
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      formatted = formatted.replace(regex, `\n${keyword}`);
    });

    // Clean up multiple line breaks
    formatted = formatted.replace(/\n\s*\n/g, '\n');
    
    return formatted.trim();
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.RATE_LIMIT_DELAY) {
      const delay = this.RATE_LIMIT_DELAY - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Get usage statistics
  getUsageStats() {
    return {
      requestCount: this.requestCount,
      lastRequestTime: this.lastRequestTime
    };
  }

  // Reset usage statistics
  resetUsageStats() {
    this.requestCount = 0;
    this.lastRequestTime = 0;
  }
}

// Export singleton instance
export const openAIService = OpenAIService.getInstance(); 