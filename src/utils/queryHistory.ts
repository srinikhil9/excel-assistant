export interface QueryHistoryItem {
  id: string;
  question: string;
  sql: string;
  timestamp: number;
  isFavorite: boolean;
  category?: string;
  tags?: string[];
  executionTime?: number;
  success: boolean;
  errorMessage?: string;
}

export interface QueryCategory {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export class QueryHistoryManager {
  private static instance: QueryHistoryManager;
  private readonly STORAGE_KEY = 'excel_sql_assistant_history';
  private readonly FAVORITES_KEY = 'excel_sql_assistant_favorites';
  private readonly CATEGORIES_KEY = 'excel_sql_assistant_categories';

  static getInstance(): QueryHistoryManager {
    if (!QueryHistoryManager.instance) {
      QueryHistoryManager.instance = new QueryHistoryManager();
    }
    return QueryHistoryManager.instance;
  }

  // Query History Methods
  async addQuery(question: string, sql: string, success: boolean = true, executionTime?: number, errorMessage?: string): Promise<string> {
    const history = await this.getHistory();
    const newItem: QueryHistoryItem = {
      id: this.generateId(),
      question,
      sql,
      timestamp: Date.now(),
      isFavorite: false,
      success,
      executionTime,
      errorMessage,
      tags: this.extractTags(question, sql)
    };

    history.unshift(newItem);
    
    // Keep only last 100 queries
    if (history.length > 100) {
      history.splice(100);
    }

    await this.saveHistory(history);
    return newItem.id;
  }

  async getHistory(): Promise<QueryHistoryItem[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading query history:', error);
      return [];
    }
  }

  async searchHistory(query: string): Promise<QueryHistoryItem[]> {
    const history = await this.getHistory();
    const lowerQuery = query.toLowerCase();
    
    return history.filter(item => 
      item.question.toLowerCase().includes(lowerQuery) ||
      item.sql.toLowerCase().includes(lowerQuery) ||
      item.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  async getHistoryByCategory(category: string): Promise<QueryHistoryItem[]> {
    const history = await this.getHistory();
    return history.filter(item => item.category === category);
  }

  async deleteQuery(id: string): Promise<void> {
    const history = await this.getHistory();
    const filtered = history.filter(item => item.id !== id);
    await this.saveHistory(filtered);
  }

  async clearHistory(): Promise<void> {
    await this.saveHistory([]);
  }

  // Favorites Methods
  async toggleFavorite(id: string): Promise<void> {
    const history = await this.getHistory();
    const item = history.find(h => h.id === id);
    if (item) {
      item.isFavorite = !item.isFavorite;
      await this.saveHistory(history);
    }
  }

  async getFavorites(): Promise<QueryHistoryItem[]> {
    const history = await this.getHistory();
    return history.filter(item => item.isFavorite);
  }

  async addToFavorites(id: string): Promise<void> {
    await this.toggleFavorite(id);
  }

  async removeFromFavorites(id: string): Promise<void> {
    await this.toggleFavorite(id);
  }

  // Category Methods
  async getCategories(): Promise<QueryCategory[]> {
    try {
      const stored = localStorage.getItem(this.CATEGORIES_KEY);
      return stored ? JSON.parse(stored) : this.getDefaultCategories();
    } catch (error) {
      console.error('Error loading categories:', error);
      return this.getDefaultCategories();
    }
  }

  async addCategory(category: Omit<QueryCategory, 'id'>): Promise<string> {
    const categories = await this.getCategories();
    const newCategory: QueryCategory = {
      ...category,
      id: this.generateId()
    };
    categories.push(newCategory);
    await this.saveCategories(categories);
    return newCategory.id;
  }

  async updateQueryCategory(queryId: string, categoryId: string): Promise<void> {
    const history = await this.getHistory();
    const item = history.find(h => h.id === queryId);
    if (item) {
      item.category = categoryId;
      await this.saveHistory(history);
    }
  }

  async deleteCategory(categoryId: string): Promise<void> {
    const categories = await this.getCategories();
    const filtered = categories.filter(c => c.id !== categoryId);
    await this.saveCategories(filtered);
    
    // Remove category from queries
    const history = await this.getHistory();
    history.forEach(item => {
      if (item.category === categoryId) {
        item.category = undefined;
      }
    });
    await this.saveHistory(history);
  }

  // Statistics Methods
  async getStatistics(): Promise<{
    totalQueries: number;
    successfulQueries: number;
    favoriteQueries: number;
    averageExecutionTime: number;
    mostUsedTags: string[];
  }> {
    const history = await this.getHistory();
    const successful = history.filter(h => h.success);
    const favorites = history.filter(h => h.isFavorite);
    const executionTimes = history.filter(h => h.executionTime).map(h => h.executionTime!);
    
    // Count tags
    const tagCounts: { [key: string]: number } = {};
    history.forEach(item => {
      item.tags?.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    const mostUsedTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tag]) => tag);

    return {
      totalQueries: history.length,
      successfulQueries: successful.length,
      favoriteQueries: favorites.length,
      averageExecutionTime: executionTimes.length > 0 
        ? executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length 
        : 0,
      mostUsedTags
    };
  }

  // Export/Import Methods
  async exportHistory(): Promise<string> {
    const history = await this.getHistory();
    const categories = await this.getCategories();
    const data = {
      history,
      categories,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    return JSON.stringify(data, null, 2);
  }

  async importHistory(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData);
      if (data.history && Array.isArray(data.history)) {
        await this.saveHistory(data.history);
      }
      if (data.categories && Array.isArray(data.categories)) {
        await this.saveCategories(data.categories);
      }
    } catch (error) {
      throw new Error('Invalid import data format');
    }
  }

  // Private Methods
  private async saveHistory(history: QueryHistoryItem[]): Promise<void> {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving query history:', error);
    }
  }

  private async saveCategories(categories: QueryCategory[]): Promise<void> {
    try {
      localStorage.setItem(this.CATEGORIES_KEY, JSON.stringify(categories));
    } catch (error) {
      console.error('Error saving categories:', error);
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private extractTags(question: string, sql: string): string[] {
    const tags = new Set<string>();
    const text = `${question} ${sql}`.toLowerCase();
    
    // Extract common SQL keywords
    const sqlKeywords = ['select', 'from', 'where', 'group by', 'order by', 'join', 'union', 'cte', 'window'];
    sqlKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        tags.add(keyword);
      }
    });

    // Extract domain-specific terms
    const domainTerms = ['carrier', 'cost', 'freight', 'delivery', 'quarter', 'performance', 'route'];
    domainTerms.forEach(term => {
      if (text.includes(term)) {
        tags.add(term);
      }
    });

    return Array.from(tags);
  }

  private getDefaultCategories(): QueryCategory[] {
    return [
      { id: 'carrier-analysis', name: 'Carrier Analysis', color: '#0078d4', description: 'Carrier performance and cost analysis' },
      { id: 'cost-analysis', name: 'Cost Analysis', color: '#107c10', description: 'Cost breakdown and optimization' },
      { id: 'time-series', name: 'Time Series', color: '#d83b01', description: 'Trends and seasonal analysis' },
      { id: 'performance', name: 'Performance Metrics', color: '#b4009e', description: 'Delivery and service metrics' },
      { id: 'route-analysis', name: 'Route Analysis', color: '#ff8c00', description: 'Route optimization and efficiency' },
      { id: 'general', name: 'General Queries', color: '#6b69d6', description: 'General freight data queries' }
    ];
  }
}

export const queryHistoryManager = QueryHistoryManager.getInstance(); 