export interface ValidationError {
  type: 'error' | 'warning' | 'info';
  message: string;
  line?: number;
  column?: number;
  suggestion?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  suggestions: ValidationError[];
  performanceHints: string[];
}

export interface SQLToken {
  type: 'keyword' | 'identifier' | 'string' | 'number' | 'operator' | 'punctuation' | 'comment';
  value: string;
  line: number;
  column: number;
}

export class SQLValidator {
  private static instance: SQLValidator;
  private readonly SQL_KEYWORDS = [
    'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'HAVING', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 
    'INNER JOIN', 'OUTER JOIN', 'UNION', 'UNION ALL', 'WITH', 'AS', 'ON', 'AND', 'OR', 'IN', 
    'BETWEEN', 'LIKE', 'IS NULL', 'IS NOT NULL', 'LIMIT', 'OFFSET', 'DISTINCT', 'COUNT', 'SUM', 
    'AVG', 'MAX', 'MIN', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'OVER', 'PARTITION BY', 'ROW_NUMBER',
    'RANK', 'DENSE_RANK', 'LAG', 'LEAD', 'FIRST_VALUE', 'LAST_VALUE'
  ];

  private readonly PERFORMANCE_KEYWORDS = [
    'EXPLAIN', 'ANALYZE', 'INDEX', 'HINT', 'FORCE', 'IGNORE'
  ];

  static getInstance(): SQLValidator {
    if (!SQLValidator.instance) {
      SQLValidator.instance = new SQLValidator();
    }
    return SQLValidator.instance;
  }

  validateSQL(sql: string, schema?: any): ValidationResult {
    const tokens = this.tokenize(sql);
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const suggestions: ValidationError[] = [];
    const performanceHints: string[] = [];

    // Basic syntax validation
    this.validateBasicSyntax(tokens, errors, warnings);
    
    // SQL structure validation
    this.validateSQLStructure(tokens, errors, warnings);
    
    // Performance validation
    this.validatePerformance(sql, tokens, warnings, performanceHints);
    
    // Schema validation (if schema provided)
    if (schema) {
      this.validateAgainstSchema(tokens, schema, errors, warnings);
    }

    // Best practices validation
    this.validateBestPractices(sql, tokens, suggestions);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      performanceHints
    };
  }

  private tokenize(sql: string): SQLToken[] {
    const tokens: SQLToken[] = [];
    const lines = sql.split('\n');
    
    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum];
      const trimmedLine = line.trim();
      
      // Skip empty lines
      if (!trimmedLine) continue;
      
      // Handle comments
      if (trimmedLine.startsWith('--')) {
        tokens.push({
          type: 'comment',
          value: trimmedLine,
          line: lineNum + 1,
          column: 1
        });
        continue;
      }

      // Simple tokenization (for basic validation)
      const words = trimmedLine.split(/\s+/);
      let column = 1;
      
      for (const word of words) {
        if (!word) continue;
        
        let type: SQLToken['type'] = 'identifier';
        
        if (this.SQL_KEYWORDS.includes(word.toUpperCase())) {
          type = 'keyword';
        } else if (word.match(/^[0-9]+(\.[0-9]+)?$/)) {
          type = 'number';
        } else if (word.startsWith("'") && word.endsWith("'")) {
          type = 'string';
        } else if (word.match(/^[+\-*/=<>!]+$/)) {
          type = 'operator';
        } else if (word.match(/^[(),;.]+$/)) {
          type = 'punctuation';
        }
        
        tokens.push({
          type,
          value: word,
          line: lineNum + 1,
          column
        });
        
        column += word.length + 1; // +1 for space
      }
    }
    
    return tokens;
  }

  private validateBasicSyntax(tokens: SQLToken[], errors: ValidationError[], warnings: ValidationError[]): void {
    let hasSelect = false;
    let hasFrom = false;
    let parenCount = 0;
    
    for (const token of tokens) {
      if (token.type === 'keyword') {
        if (token.value.toUpperCase() === 'SELECT') {
          hasSelect = true;
        } else if (token.value.toUpperCase() === 'FROM') {
          hasFrom = true;
        }
      } else if (token.type === 'punctuation') {
        if (token.value === '(') {
          parenCount++;
        } else if (token.value === ')') {
          parenCount--;
          if (parenCount < 0) {
            errors.push({
              type: 'error',
              message: 'Unmatched closing parenthesis',
              line: token.line,
              column: token.column
            });
          }
        }
      }
    }
    
    if (!hasSelect) {
      errors.push({
        type: 'error',
        message: 'Missing SELECT clause',
        suggestion: 'Add a SELECT clause to specify which columns to retrieve'
      });
    }
    
    if (!hasFrom) {
      errors.push({
        type: 'error',
        message: 'Missing FROM clause',
        suggestion: 'Add a FROM clause to specify the table(s) to query'
      });
    }
    
    if (parenCount > 0) {
      errors.push({
        type: 'error',
        message: 'Unmatched opening parenthesis',
        suggestion: 'Check for missing closing parentheses'
      });
    }
  }

  private validateSQLStructure(tokens: SQLToken[], errors: ValidationError[], warnings: ValidationError[]): void {
    const keywords = tokens.filter(t => t.type === 'keyword').map(t => t.value.toUpperCase());
    const keywordSequence = keywords.join(' ');
    
    // Check for common structural issues
    if (keywordSequence.includes('GROUP BY') && !keywordSequence.includes('SELECT')) {
      errors.push({
        type: 'error',
        message: 'GROUP BY without SELECT',
        suggestion: 'GROUP BY must be used with SELECT'
      });
    }
    
    if (keywordSequence.includes('HAVING') && !keywordSequence.includes('GROUP BY')) {
      errors.push({
        type: 'error',
        message: 'HAVING without GROUP BY',
        suggestion: 'HAVING must be used with GROUP BY'
      });
    }
    
    if (keywordSequence.includes('ORDER BY') && !keywordSequence.includes('SELECT')) {
      errors.push({
        type: 'error',
        message: 'ORDER BY without SELECT',
        suggestion: 'ORDER BY must be used with SELECT'
      });
    }
    
    // Check for SELECT * without LIMIT
    const hasSelectStar = tokens.some(t => 
      t.type === 'keyword' && t.value.toUpperCase() === 'SELECT' &&
      tokens[tokens.indexOf(t) + 1]?.value === '*'
    );
    
    if (hasSelectStar && !keywordSequence.includes('LIMIT')) {
      warnings.push({
        type: 'warning',
        message: 'SELECT * without LIMIT may return large result sets',
        suggestion: 'Consider adding a LIMIT clause or selecting specific columns'
      });
    }
  }

  private validatePerformance(sql: string, tokens: SQLToken[], warnings: ValidationError[], performanceHints: string[]): void {
    const upperSQL = sql.toUpperCase();
    
    // Check for potential performance issues
    if (upperSQL.includes('SELECT *') && !upperSQL.includes('LIMIT')) {
      performanceHints.push('Consider selecting specific columns instead of using SELECT *');
    }
    
    if (upperSQL.includes('LIKE') && upperSQL.includes('%') && !upperSQL.includes('INDEX')) {
      performanceHints.push('LIKE queries with leading wildcards may be slow; consider using indexes');
    }
    
    if (upperSQL.includes('ORDER BY') && !upperSQL.includes('LIMIT')) {
      performanceHints.push('ORDER BY without LIMIT may be expensive on large datasets');
    }
    
    if (upperSQL.includes('GROUP BY') && !upperSQL.includes('HAVING')) {
      performanceHints.push('Consider if you need HAVING clause with GROUP BY');
    }
    
    // Check for missing WHERE clauses on large tables
    const hasFrom = tokens.some(t => t.type === 'keyword' && t.value.toUpperCase() === 'FROM');
    const hasWhere = tokens.some(t => t.type === 'keyword' && t.value.toUpperCase() === 'WHERE');
    
    if (hasFrom && !hasWhere) {
      warnings.push({
        type: 'warning',
        message: 'Query without WHERE clause may scan entire table',
        suggestion: 'Consider adding a WHERE clause to filter results'
      });
    }
  }

  private validateAgainstSchema(tokens: SQLToken[], schema: any, errors: ValidationError[], warnings: ValidationError[]): void {
    // Extract table names from FROM and JOIN clauses
    const tableNames = new Set<string>();
    const columnReferences = new Set<string>();
    
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      
      if (token.type === 'keyword' && token.value.toUpperCase() === 'FROM') {
        const nextToken = tokens[i + 1];
        if (nextToken && nextToken.type === 'identifier') {
          tableNames.add(nextToken.value);
        }
      }
      
      if (token.type === 'keyword' && token.value.toUpperCase().includes('JOIN')) {
        const nextToken = tokens[i + 1];
        if (nextToken && nextToken.type === 'identifier') {
          tableNames.add(nextToken.value);
        }
      }
    }
    
    // Validate table names against schema
    if (schema.tables) {
      const schemaTableNames = schema.tables.map((t: any) => t.name);
      
      for (const tableName of tableNames) {
        if (!schemaTableNames.includes(tableName)) {
          warnings.push({
            type: 'warning',
            message: `Table '${tableName}' not found in schema`,
            suggestion: 'Verify table name or check schema definition'
          });
        }
      }
    }
  }

  private validateBestPractices(sql: string, tokens: SQLToken[], suggestions: ValidationError[]): void {
    const upperSQL = sql.toUpperCase();
    
    // Check for best practices
    if (upperSQL.includes('SELECT *')) {
      suggestions.push({
        type: 'info',
        message: 'Consider selecting specific columns instead of SELECT *',
        suggestion: 'This improves performance and makes the query more explicit'
      });
    }
    
    if (!upperSQL.includes('ORDER BY') && upperSQL.includes('LIMIT')) {
      suggestions.push({
        type: 'info',
        message: 'Consider adding ORDER BY with LIMIT',
        suggestion: 'Without ORDER BY, the results may be unpredictable'
      });
    }
    
    if (upperSQL.includes('COUNT(*)') && upperSQL.includes('WHERE')) {
      suggestions.push({
        type: 'info',
        message: 'Consider using COUNT(1) instead of COUNT(*)',
        suggestion: 'COUNT(1) is often more efficient than COUNT(*)' 
      });
    }
    
    // Check for proper aliasing
    const hasJoins = upperSQL.includes('JOIN');
    const hasAliases = /[A-Za-z_][A-Za-z0-9_]*\s+AS\s+[A-Za-z_][A-Za-z0-9_]*/i.test(sql);
    
    if (hasJoins && !hasAliases) {
      suggestions.push({
        type: 'info',
        message: 'Consider using table aliases for better readability',
        suggestion: 'Example: FROM table1 t1 JOIN table2 t2 ON t1.id = t2.id'
      });
    }
  }

  // Format SQL with proper indentation
  formatSQL(sql: string): string {
    const lines = sql.split('\n');
    const formattedLines: string[] = [];
    let indentLevel = 0;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        formattedLines.push('');
        continue;
      }
      
      // Handle comments
      if (trimmed.startsWith('--')) {
        formattedLines.push('  '.repeat(indentLevel) + trimmed);
        continue;
      }
      
      const upperLine = trimmed.toUpperCase();
      
      // Decrease indent for closing keywords
      if (upperLine.startsWith('END') || upperLine.startsWith(')')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }
      
      // Add formatted line
      formattedLines.push('  '.repeat(indentLevel) + trimmed);
      
      // Increase indent for opening keywords
      if (upperLine.startsWith('CASE') || upperLine.startsWith('(')) {
        indentLevel++;
      }
    }
    
    return formattedLines.join('\n');
  }

  // Get SQL suggestions based on common patterns
  getSuggestions(sql: string): string[] {
    const suggestions: string[] = [];
    const upperSQL = sql.toUpperCase();
    
    if (upperSQL.includes('SELECT *')) {
      suggestions.push('Replace SELECT * with specific column names for better performance');
    }
    
    if (upperSQL.includes('LIKE') && upperSQL.includes('%')) {
      suggestions.push('Consider using indexes for LIKE queries with wildcards');
    }
    
    if (upperSQL.includes('ORDER BY') && !upperSQL.includes('LIMIT')) {
      suggestions.push('Add LIMIT clause to ORDER BY for better performance');
    }
    
    if (upperSQL.includes('GROUP BY') && !upperSQL.includes('HAVING')) {
      suggestions.push('Consider if HAVING clause is needed for filtering grouped results');
    }
    
    return suggestions;
  }
}

export const sqlValidator = SQLValidator.getInstance(); 