export interface DatabaseTable {
  name: string;
  description?: string;
  columns: DatabaseColumn[];
  primaryKey?: string;
  indexes?: string[];
  foreignKeys?: ForeignKey[];
}

export interface DatabaseColumn {
  name: string;
  type: string;
  nullable: boolean;
  description?: string;
  defaultValue?: string;
  constraints?: string[];
}

export interface ForeignKey {
  column: string;
  references: {
    table: string;
    column: string;
  };
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT';
}

export interface DatabaseSchema {
  id: string;
  name: string;
  description?: string;
  tables: DatabaseTable[];
  createdAt: number;
  updatedAt: number;
  isDefault?: boolean;
  version: string;
}

export class SchemaManager {
  private static instance: SchemaManager;
  private readonly STORAGE_KEY = 'excel_sql_assistant_schemas';
  private readonly DEFAULT_SCHEMA_KEY = 'excel_sql_assistant_default_schema';

  static getInstance(): SchemaManager {
    if (!SchemaManager.instance) {
      SchemaManager.instance = new SchemaManager();
    }
    return SchemaManager.instance;
  }

  // Schema Management
  async getSchemas(): Promise<DatabaseSchema[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      const schemas = stored ? JSON.parse(stored) : [];
      
      // Ensure default schema exists
      if (schemas.length === 0) {
        const defaultSchema = this.createDefaultSchema();
        schemas.push(defaultSchema);
        await this.saveSchemas(schemas);
      }
      
      return schemas;
    } catch (error) {
      console.error('Error loading schemas:', error);
      return [this.createDefaultSchema()];
    }
  }

  async getSchema(id: string): Promise<DatabaseSchema | null> {
    const schemas = await this.getSchemas();
    return schemas.find(s => s.id === id) || null;
  }

  async getDefaultSchema(): Promise<DatabaseSchema> {
    try {
      const defaultId = localStorage.getItem(this.DEFAULT_SCHEMA_KEY);
      if (defaultId) {
        const schema = await this.getSchema(defaultId);
        if (schema) return schema;
      }
    } catch (error) {
      console.error('Error loading default schema:', error);
    }
    
    // Return first schema or create default
    const schemas = await this.getSchemas();
    return schemas[0] || this.createDefaultSchema();
  }

  async setDefaultSchema(id: string): Promise<void> {
    localStorage.setItem(this.DEFAULT_SCHEMA_KEY, id);
  }

  async createSchema(schema: Omit<DatabaseSchema, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<string> {
    const schemas = await this.getSchemas();
    const newSchema: DatabaseSchema = {
      ...schema,
      id: this.generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: '1.0'
    };
    
    schemas.push(newSchema);
    await this.saveSchemas(schemas);
    return newSchema.id;
  }

  async updateSchema(id: string, updates: Partial<DatabaseSchema>): Promise<void> {
    const schemas = await this.getSchemas();
    const index = schemas.findIndex(s => s.id === id);
    if (index !== -1) {
      schemas[index] = {
        ...schemas[index],
        ...updates,
        updatedAt: Date.now()
      };
      await this.saveSchemas(schemas);
    }
  }

  async deleteSchema(id: string): Promise<void> {
    const schemas = await this.getSchemas();
    const filtered = schemas.filter(s => s.id !== id);
    
    // Don't allow deletion of the last schema
    if (filtered.length === 0) {
      throw new Error('Cannot delete the last schema');
    }
    
    await this.saveSchemas(filtered);
    
    // If deleted schema was default, set first schema as default
    const defaultId = localStorage.getItem(this.DEFAULT_SCHEMA_KEY);
    if (defaultId === id) {
      await this.setDefaultSchema(filtered[0].id);
    }
  }

  async duplicateSchema(id: string, newName: string): Promise<string> {
    const original = await this.getSchema(id);
    if (!original) {
      throw new Error('Schema not found');
    }
    
    const duplicated: Omit<DatabaseSchema, 'id' | 'createdAt' | 'updatedAt'> = {
      name: newName,
      description: `${original.description} (Copy)`,
      tables: original.tables,
      version: original.version
    };
    
    return await this.createSchema(duplicated);
  }

  // Table Management
  async addTable(schemaId: string, table: Omit<DatabaseTable, 'name'> & { name: string }): Promise<void> {
    const schemas = await this.getSchemas();
    const schemaIndex = schemas.findIndex(s => s.id === schemaId);
    if (schemaIndex === -1) {
      throw new Error('Schema not found');
    }
    
    schemas[schemaIndex].tables.push(table);
    schemas[schemaIndex].updatedAt = Date.now();
    await this.saveSchemas(schemas);
  }

  async updateTable(schemaId: string, tableName: string, updates: Partial<DatabaseTable>): Promise<void> {
    const schemas = await this.getSchemas();
    const schemaIndex = schemas.findIndex(s => s.id === schemaId);
    if (schemaIndex === -1) {
      throw new Error('Schema not found');
    }
    
    const tableIndex = schemas[schemaIndex].tables.findIndex(t => t.name === tableName);
    if (tableIndex === -1) {
      throw new Error('Table not found');
    }
    
    schemas[schemaIndex].tables[tableIndex] = {
      ...schemas[schemaIndex].tables[tableIndex],
      ...updates
    };
    schemas[schemaIndex].updatedAt = Date.now();
    await this.saveSchemas(schemas);
  }

  async deleteTable(schemaId: string, tableName: string): Promise<void> {
    const schemas = await this.getSchemas();
    const schemaIndex = schemas.findIndex(s => s.id === schemaId);
    if (schemaIndex === -1) {
      throw new Error('Schema not found');
    }
    
    schemas[schemaIndex].tables = schemas[schemaIndex].tables.filter(t => t.name !== tableName);
    schemas[schemaIndex].updatedAt = Date.now();
    await this.saveSchemas(schemas);
  }

  // Schema Validation
  validateSchema(schema: DatabaseSchema): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!schema.name.trim()) {
      errors.push('Schema name is required');
    }
    
    if (schema.tables.length === 0) {
      errors.push('Schema must have at least one table');
    }
    
    const tableNames = new Set<string>();
    schema.tables.forEach(table => {
      if (!table.name.trim()) {
        errors.push('Table name is required');
      } else if (tableNames.has(table.name)) {
        errors.push(`Duplicate table name: ${table.name}`);
      } else {
        tableNames.add(table.name);
      }
      
      if (table.columns.length === 0) {
        errors.push(`Table ${table.name} must have at least one column`);
      }
      
      const columnNames = new Set<string>();
      table.columns.forEach(column => {
        if (!column.name.trim()) {
          errors.push(`Column name is required in table ${table.name}`);
        } else if (columnNames.has(column.name)) {
          errors.push(`Duplicate column name ${column.name} in table ${table.name}`);
        } else {
          columnNames.add(column.name);
        }
        
        if (!column.type.trim()) {
          errors.push(`Column type is required for ${column.name} in table ${table.name}`);
        }
      });
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Export/Import
  async exportSchema(id: string): Promise<string> {
    const schema = await this.getSchema(id);
    if (!schema) {
      throw new Error('Schema not found');
    }
    
    const exportData = {
      schema,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  async importSchema(jsonData: string): Promise<string> {
    try {
      const data = JSON.parse(jsonData);
      if (!data.schema || !data.schema.name || !data.schema.tables) {
        throw new Error('Invalid schema format');
      }
      
      const validation = this.validateSchema(data.schema);
      if (!validation.isValid) {
        throw new Error(`Schema validation failed: ${validation.errors.join(', ')}`);
      }
      
      // Remove id and timestamps for import
      const { id, createdAt, updatedAt, ...schemaData } = data.schema;
      return await this.createSchema(schemaData);
    } catch (error) {
      throw new Error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Schema to SQL Context
  generateSchemaContext(schema: DatabaseSchema): string {
    let context = `Database: ${schema.name}\n`;
    if (schema.description) {
      context += `Description: ${schema.description}\n`;
    }
    context += `Tables:\n`;
    
    schema.tables.forEach(table => {
      context += `- ${table.name} (\n`;
      table.columns.forEach(column => {
        const nullable = column.nullable ? 'NULL' : 'NOT NULL';
        const defaultValue = column.defaultValue ? ` DEFAULT ${column.defaultValue}` : '';
        context += `    ${column.name} ${column.type} ${nullable}${defaultValue},\n`;
      });
      context += `  )`;
      if (table.description) {
        context += ` -- ${table.description}`;
      }
      context += `\n`;
    });
    
    return context;
  }

  // Private Methods
  private async saveSchemas(schemas: DatabaseSchema[]): Promise<void> {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(schemas));
    } catch (error) {
      console.error('Error saving schemas:', error);
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private createDefaultSchema(): DatabaseSchema {
    return {
      id: 'default-freight-schema',
      name: 'Freight Analytics',
      description: 'Default schema for freight and logistics analysis',
      tables: [
        {
          name: 'freight_data',
          description: 'Main freight shipment data',
          columns: [
            { name: 'id', type: 'INT', nullable: false, description: 'Primary key' },
            { name: 'carrier', type: 'VARCHAR(50)', nullable: false, description: 'Carrier name' },
            { name: 'origin', type: 'VARCHAR(100)', nullable: false, description: 'Origin location' },
            { name: 'destination', type: 'VARCHAR(100)', nullable: false, description: 'Destination location' },
            { name: 'cost', type: 'DECIMAL(10,2)', nullable: false, description: 'Shipment cost' },
            { name: 'weight', type: 'DECIMAL(8,2)', nullable: true, description: 'Shipment weight' },
            { name: 'shipment_date', type: 'DATE', nullable: false, description: 'Shipment date' },
            { name: 'quarter', type: 'VARCHAR(10)', nullable: false, description: 'Quarter' },
            { name: 'year', type: 'INT', nullable: false, description: 'Year' },
            { name: 'service_type', type: 'VARCHAR(50)', nullable: true, description: 'Service type' },
            { name: 'delivery_time_days', type: 'INT', nullable: true, description: 'Delivery time in days' },
            { name: 'status', type: 'VARCHAR(20)', nullable: false, description: 'Shipment status' }
          ],
          primaryKey: 'id'
        },
        {
          name: 'carriers',
          description: 'Carrier information',
          columns: [
            { name: 'id', type: 'INT', nullable: false, description: 'Primary key' },
            { name: 'name', type: 'VARCHAR(50)', nullable: false, description: 'Carrier name' },
            { name: 'type', type: 'VARCHAR(20)', nullable: true, description: 'Carrier type' },
            { name: 'region', type: 'VARCHAR(50)', nullable: true, description: 'Service region' },
            { name: 'rating', type: 'DECIMAL(3,2)', nullable: true, description: 'Customer rating' }
          ],
          primaryKey: 'id'
        },
        {
          name: 'routes',
          description: 'Route information',
          columns: [
            { name: 'id', type: 'INT', nullable: false, description: 'Primary key' },
            { name: 'origin', type: 'VARCHAR(100)', nullable: false, description: 'Origin location' },
            { name: 'destination', type: 'VARCHAR(100)', nullable: false, description: 'Destination location' },
            { name: 'distance_miles', type: 'INT', nullable: true, description: 'Distance in miles' },
            { name: 'typical_cost', type: 'DECIMAL(10,2)', nullable: true, description: 'Typical cost for route' }
          ],
          primaryKey: 'id'
        }
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isDefault: true,
      version: '1.0'
    };
  }
}

export const schemaManager = SchemaManager.getInstance(); 