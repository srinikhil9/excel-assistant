export interface ExportOptions {
  format: 'csv' | 'json' | 'excel' | 'sql' | 'markdown';
  includeHeaders?: boolean;
  includeMetadata?: boolean;
  filename?: string;
  encoding?: 'utf-8' | 'utf-16';
}

export interface ExportData {
  sql: string;
  question: string;
  data?: any[][];
  metadata?: {
    generatedAt: string;
    executionTime?: number;
    rowCount?: number;
    columnCount?: number;
  };
}

export class ExportManager {
  private static instance: ExportManager;

  static getInstance(): ExportManager {
    if (!ExportManager.instance) {
      ExportManager.instance = new ExportManager();
    }
    return ExportManager.instance;
  }

  async exportData(data: ExportData, options: ExportOptions): Promise<void> {
    const filename = options.filename || this.generateFilename(options.format);
    
    switch (options.format) {
      case 'csv':
        await this.exportToCSV(data, filename, options);
        break;
      case 'json':
        await this.exportToJSON(data, filename, options);
        break;
      case 'excel':
        await this.exportToExcel(data, filename, options);
        break;
      case 'sql':
        await this.exportToSQL(data, filename, options);
        break;
      case 'markdown':
        await this.exportToMarkdown(data, filename, options);
        break;
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  private async exportToCSV(data: ExportData, filename: string, options: ExportOptions): Promise<void> {
    if (!data.data || data.data.length === 0) {
      throw new Error('No data to export');
    }

    let csvContent = '';
    
    // Add metadata as comments if requested
    if (options.includeMetadata) {
      csvContent += `# SQL Query: ${data.sql}\n`;
      csvContent += `# Question: ${data.question}\n`;
      csvContent += `# Generated: ${data.metadata?.generatedAt || new Date().toISOString()}\n`;
      if (data.metadata?.executionTime) {
        csvContent += `# Execution Time: ${data.metadata.executionTime}ms\n`;
      }
      csvContent += '\n';
    }

    // Add headers if requested
    if (options.includeHeaders && data.data.length > 0) {
      const headers = data.data[0];
      csvContent += headers.map(header => this.escapeCSV(header)).join(',') + '\n';
      
      // Add data rows (skip first row if it's headers)
      for (let i = 1; i < data.data.length; i++) {
        csvContent += data.data[i].map(cell => this.escapeCSV(cell)).join(',') + '\n';
      }
    } else {
      // Add all data rows
      for (const row of data.data) {
        csvContent += row.map(cell => this.escapeCSV(cell)).join(',') + '\n';
      }
    }

    await this.downloadFile(csvContent, filename, 'text/csv');
  }

  private async exportToJSON(data: ExportData, filename: string, options: ExportOptions): Promise<void> {
    const exportData: any = {
      sql: data.sql,
      question: data.question,
      data: data.data || []
    };

    if (options.includeMetadata && data.metadata) {
      exportData.metadata = data.metadata;
    }

    const jsonContent = JSON.stringify(exportData, null, 2);
    await this.downloadFile(jsonContent, filename, 'application/json');
  }

  private async exportToExcel(data: ExportData, filename: string, options: ExportOptions): Promise<void> {
    // For Excel export, we'll create a simple HTML table that Excel can open
    let htmlContent = `
      <html>
        <head>
          <meta charset="utf-8">
          <title>SQL Query Results</title>
        </head>
        <body>
          <table border="1">
    `;

    if (options.includeMetadata) {
      htmlContent += `
        <tr><td colspan="${data.data?.[0]?.length || 1}" style="background-color: #f0f0f0; font-weight: bold;">
          SQL Query: ${data.sql}
        </td></tr>
        <tr><td colspan="${data.data?.[0]?.length || 1}" style="background-color: #f0f0f0;">
          Question: ${data.question}
        </td></tr>
        <tr><td colspan="${data.data?.[0]?.length || 1}" style="background-color: #f0f0f0;">
          Generated: ${data.metadata?.generatedAt || new Date().toISOString()}
        </td></tr>
      `;
    }

    if (data.data && data.data.length > 0) {
      // Add headers
      if (options.includeHeaders) {
        htmlContent += '<tr style="background-color: #4472C4; color: white; font-weight: bold;">';
        for (const header of data.data[0]) {
          htmlContent += `<td>${this.escapeHTML(header)}</td>`;
        }
        htmlContent += '</tr>';
        
        // Add data rows (skip first row if it's headers)
        for (let i = 1; i < data.data.length; i++) {
          htmlContent += '<tr>';
          for (const cell of data.data[i]) {
            htmlContent += `<td>${this.escapeHTML(cell)}</td>`;
          }
          htmlContent += '</tr>';
        }
      } else {
        // Add all data rows
        for (const row of data.data) {
          htmlContent += '<tr>';
          for (const cell of row) {
            htmlContent += `<td>${this.escapeHTML(cell)}</td>`;
          }
          htmlContent += '</tr>';
        }
      }
    }

    htmlContent += `
          </table>
        </body>
      </html>
    `;

    await this.downloadFile(htmlContent, filename.replace('.xlsx', '.html'), 'text/html');
  }

  private async exportToSQL(data: ExportData, filename: string, options: ExportOptions): Promise<void> {
    let sqlContent = '';
    
    if (options.includeMetadata) {
      sqlContent += `-- SQL Query Export\n`;
      sqlContent += `-- Generated: ${data.metadata?.generatedAt || new Date().toISOString()}\n`;
      sqlContent += `-- Question: ${data.question}\n`;
      sqlContent += `-- Execution Time: ${data.metadata?.executionTime || 'N/A'}ms\n\n`;
    }

    sqlContent += `-- Original Query\n`;
    sqlContent += `${data.sql};\n\n`;

    if (data.data && data.data.length > 0) {
      sqlContent += `-- Sample Data (${data.data.length} rows)\n`;
      sqlContent += `-- Columns: ${data.data[0]?.join(', ')}\n\n`;
      
      // Generate INSERT statements for the data
      const tableName = this.extractTableName(data.sql);
      if (tableName) {
        sqlContent += `-- INSERT statements for ${tableName}\n`;
        for (let i = 1; i < Math.min(data.data.length, 10); i++) { // Limit to 10 rows
          const row = data.data[i];
          const values = row.map(value => {
            if (value === null || value === undefined) return 'NULL';
            if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
            return value;
          }).join(', ');
          sqlContent += `INSERT INTO ${tableName} VALUES (${values});\n`;
        }
        if (data.data.length > 10) {
          sqlContent += `-- ... and ${data.data.length - 10} more rows\n`;
        }
      }
    }

    await this.downloadFile(sqlContent, filename, 'text/plain');
  }

  private async exportToMarkdown(data: ExportData, filename: string, options: ExportOptions): Promise<void> {
    let markdownContent = '';
    
    if (options.includeMetadata) {
      markdownContent += `# SQL Query Results\n\n`;
      markdownContent += `**Generated:** ${data.metadata?.generatedAt || new Date().toISOString()}\n\n`;
      markdownContent += `**Question:** ${data.question}\n\n`;
      if (data.metadata?.executionTime) {
        markdownContent += `**Execution Time:** ${data.metadata.executionTime}ms\n\n`;
      }
    }

    markdownContent += `## SQL Query\n\n`;
    markdownContent += `\`\`\`sql\n${data.sql}\n\`\`\`\n\n`;

    if (data.data && data.data.length > 0) {
      markdownContent += `## Results (${data.data.length} rows)\n\n`;
      
      // Create markdown table
      if (options.includeHeaders && data.data.length > 0) {
        const headers = data.data[0];
        markdownContent += `| ${headers.join(' | ')} |\n`;
        markdownContent += `| ${headers.map(() => '---').join(' | ')} |\n`;
        
        // Add data rows (skip first row if it's headers)
        for (let i = 1; i < data.data.length; i++) {
          markdownContent += `| ${data.data[i].join(' | ')} |\n`;
        }
      } else {
        // Add all data rows
        for (const row of data.data) {
          markdownContent += `| ${row.join(' | ')} |\n`;
        }
      }
    }

    await this.downloadFile(markdownContent, filename, 'text/markdown');
  }

  // Export query history
  async exportQueryHistory(history: any[], format: 'json' | 'csv' | 'markdown'): Promise<void> {
    const filename = `query_history_${new Date().toISOString().split('T')[0]}.${format}`;
    
    switch (format) {
      case 'json':
        await this.downloadFile(JSON.stringify(history, null, 2), filename, 'application/json');
        break;
      case 'csv':
        const csvContent = this.convertHistoryToCSV(history);
        await this.downloadFile(csvContent, filename, 'text/csv');
        break;
      case 'markdown':
        const markdownContent = this.convertHistoryToMarkdown(history);
        await this.downloadFile(markdownContent, filename, 'text/markdown');
        break;
    }
  }

  // Export schema
  async exportSchema(schema: any, format: 'json' | 'sql' | 'markdown'): Promise<void> {
    const filename = `${schema.name.replace(/\s+/g, '_')}_schema.${format}`;
    
    switch (format) {
      case 'json':
        await this.downloadFile(JSON.stringify(schema, null, 2), filename, 'application/json');
        break;
      case 'sql':
        const sqlContent = this.convertSchemaToSQL(schema);
        await this.downloadFile(sqlContent, filename, 'text/plain');
        break;
      case 'markdown':
        const markdownContent = this.convertSchemaToMarkdown(schema);
        await this.downloadFile(markdownContent, filename, 'text/markdown');
        break;
    }
  }

  // Private helper methods
  private generateFilename(format: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    return `sql_export_${timestamp}.${format}`;
  }

  private async downloadFile(content: string, filename: string, mimeType: string): Promise<void> {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  private escapeCSV(value: any): string {
    if (value === null || value === undefined) return '';
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  }

  private escapeHTML(value: any): string {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private extractTableName(sql: string): string | null {
    const match = sql.match(/FROM\s+(\w+)/i);
    return match ? match[1] : null;
  }

  private convertHistoryToCSV(history: any[]): string {
    if (history.length === 0) return '';
    
    const headers = ['Question', 'SQL', 'Timestamp', 'Success', 'Execution Time'];
    let csv = headers.join(',') + '\n';
    
    for (const item of history) {
      const row = [
        this.escapeCSV(item.question),
        this.escapeCSV(item.sql),
        this.escapeCSV(new Date(item.timestamp).toISOString()),
        this.escapeCSV(item.success),
        this.escapeCSV(item.executionTime || '')
      ];
      csv += row.join(',') + '\n';
    }
    
    return csv;
  }

  private convertHistoryToMarkdown(history: any[]): string {
    let markdown = '# Query History\n\n';
    markdown += `Total queries: ${history.length}\n\n`;
    
    for (const item of history) {
      markdown += `## ${item.question}\n\n`;
      markdown += `**Timestamp:** ${new Date(item.timestamp).toISOString()}\n\n`;
      markdown += `**Success:** ${item.success ? 'Yes' : 'No'}\n\n`;
      if (item.executionTime) {
        markdown += `**Execution Time:** ${item.executionTime}ms\n\n`;
      }
      markdown += `\`\`\`sql\n${item.sql}\n\`\`\`\n\n---\n\n`;
    }
    
    return markdown;
  }

  private convertSchemaToSQL(schema: any): string {
    let sql = `-- Database Schema: ${schema.name}\n`;
    if (schema.description) {
      sql += `-- Description: ${schema.description}\n`;
    }
    sql += `-- Generated: ${new Date().toISOString()}\n\n`;
    
    for (const table of schema.tables) {
      sql += `-- Table: ${table.name}\n`;
      if (table.description) {
        sql += `-- Description: ${table.description}\n`;
      }
      sql += `CREATE TABLE ${table.name} (\n`;
      
      const columns = table.columns.map((col: any) => {
        let columnDef = `  ${col.name} ${col.type}`;
        if (!col.nullable) columnDef += ' NOT NULL';
        if (col.defaultValue) columnDef += ` DEFAULT ${col.defaultValue}`;
        return columnDef;
      });
      
      sql += columns.join(',\n') + '\n';
      sql += `);\n\n`;
    }
    
    return sql;
  }

  private convertSchemaToMarkdown(schema: any): string {
    let markdown = `# Database Schema: ${schema.name}\n\n`;
    if (schema.description) {
      markdown += `${schema.description}\n\n`;
    }
    
    for (const table of schema.tables) {
      markdown += `## Table: ${table.name}\n\n`;
      if (table.description) {
        markdown += `${table.description}\n\n`;
      }
      
      markdown += `| Column | Type | Nullable | Description |\n`;
      markdown += `|--------|------|----------|-------------|\n`;
      
      for (const column of table.columns) {
        markdown += `| ${column.name} | ${column.type} | ${column.nullable ? 'Yes' : 'No'} | ${column.description || ''} |\n`;
      }
      
      markdown += '\n';
    }
    
    return markdown;
  }
}

export const exportManager = ExportManager.getInstance(); 