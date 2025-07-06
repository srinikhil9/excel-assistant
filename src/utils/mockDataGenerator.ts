// Mock data generator for sophisticated SQL queries
export interface MockDataOptions {
  includeHeaders?: boolean;
  formatForExcel?: boolean;
  maxRows?: number;
}

export class MockDataGenerator {
  private static carriers = [
    { name: 'FedEx', type: 'Express', region: 'North America', rating: 4.8 },
    { name: 'UPS', type: 'Ground', region: 'North America', rating: 4.6 },
    { name: 'DHL', type: 'International', region: 'Global', rating: 4.7 },
    { name: 'USPS', type: 'Standard', region: 'North America', rating: 4.2 },
    { name: 'Amazon Logistics', type: 'E-commerce', region: 'North America', rating: 4.5 }
  ];

  private static origins = [
    'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ',
    'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA', 'Dallas, TX', 'San Jose, CA'
  ];

  private static destinations = [
    'Miami, FL', 'Seattle, WA', 'Denver, CO', 'Boston, MA', 'Atlanta, GA',
    'Las Vegas, NV', 'Portland, OR', 'Austin, TX', 'Nashville, TN', 'Charlotte, NC'
  ];

  private static serviceTypes = ['Express', 'Ground', 'Air Freight', 'Ocean Freight', 'Rail'];

  static generateDataFromSQL(sql: string, options: MockDataOptions = {}): any[] {
    const lowerSQL = sql.toLowerCase();
    
    // Determine the type of query and generate appropriate data
    if (this.isCarrierAnalysisQuery(lowerSQL)) {
      return this.generateCarrierAnalysisData(options);
    }
    
    if (this.isTimeSeriesQuery(lowerSQL)) {
      return this.generateTimeSeriesData(options);
    }
    
    if (this.isRouteAnalysisQuery(lowerSQL)) {
      return this.generateRouteAnalysisData(options);
    }
    
    if (this.isPerformanceMetricsQuery(lowerSQL)) {
      return this.generatePerformanceMetricsData(options);
    }
    
    if (this.isCostAnalysisQuery(lowerSQL)) {
      return this.generateCostAnalysisData(options);
    }
    
    if (this.isTrendAnalysisQuery(lowerSQL)) {
      return this.generateTrendAnalysisData(options);
    }
    
    // Default: generate basic freight data
    return this.generateBasicFreightData(options);
  }

  private static isCarrierAnalysisQuery(sql: string): boolean {
    return sql.includes('carrier') && (sql.includes('group by') || sql.includes('sum(') || sql.includes('count('));
  }

  private static isTimeSeriesQuery(sql: string): boolean {
    return sql.includes('quarter') || sql.includes('year') || sql.includes('month') || sql.includes('date');
  }

  private static isRouteAnalysisQuery(sql: string): boolean {
    return sql.includes('origin') || sql.includes('destination') || sql.includes('route');
  }

  private static isPerformanceMetricsQuery(sql: string): boolean {
    return sql.includes('delivery_time') || sql.includes('performance') || sql.includes('rating');
  }

  private static isCostAnalysisQuery(sql: string): boolean {
    return sql.includes('cost') && (sql.includes('sum(') || sql.includes('avg(') || sql.includes('total'));
  }

  private static isTrendAnalysisQuery(sql: string): boolean {
    return sql.includes('trend') || sql.includes('window') || sql.includes('over(');
  }

  private static generateCarrierAnalysisData(options: MockDataOptions): any[] {
    const data = this.carriers.map(carrier => ({
      carrier: carrier.name,
      total_cost: Math.round(Math.random() * 200000 + 50000),
      total_shipments: Math.round(Math.random() * 100 + 20),
      avg_cost_per_shipment: Math.round(Math.random() * 2000 + 500),
      service_type: carrier.type,
      region: carrier.region,
      rating: carrier.rating
    }));

    return this.limitAndFormatData(data, options);
  }

  private static generateTimeSeriesData(options: MockDataOptions): any[] {
    const quarters = ['Q1 2025', 'Q2 2025', 'Q3 2025', 'Q4 2025'];
    const data = quarters.map(quarter => ({
      quarter,
      year: 2025,
      total_cost: Math.round(Math.random() * 300000 + 100000),
      total_shipments: Math.round(Math.random() * 150 + 50),
      avg_delivery_time: Math.round(Math.random() * 5 + 2),
      top_carrier: this.carriers[Math.floor(Math.random() * this.carriers.length)].name
    }));

    return this.limitAndFormatData(data, options);
  }

  private static generateRouteAnalysisData(options: MockDataOptions): any[] {
    const data = this.origins.slice(0, 5).map(origin => {
      const destination = this.destinations[Math.floor(Math.random() * this.destinations.length)];
      return {
        origin,
        destination,
        distance_miles: Math.round(Math.random() * 2000 + 500),
        avg_cost: Math.round(Math.random() * 3000 + 500),
        total_shipments: Math.round(Math.random() * 50 + 10),
        cost_per_mile: Math.round((Math.random() * 2 + 0.5) * 100) / 100
      };
    });

    return this.limitAndFormatData(data, options);
  }

  private static generatePerformanceMetricsData(options: MockDataOptions): any[] {
    const data = this.carriers.map(carrier => ({
      carrier: carrier.name,
      avg_delivery_time_days: Math.round((Math.random() * 3 + 1) * 10) / 10,
      on_time_delivery_rate: Math.round((Math.random() * 20 + 80) * 10) / 10,
      customer_rating: carrier.rating,
      total_shipments: Math.round(Math.random() * 200 + 50),
      cost_per_mile: Math.round((Math.random() * 1.5 + 0.3) * 100) / 100
    }));

    return this.limitAndFormatData(data, options);
  }

  private static generateCostAnalysisData(options: MockDataOptions): any[] {
    const data = [
      { cost_category: 'Freight Charges', total_cost: 450000, percentage: 65 },
      { cost_category: 'Fuel Surcharges', total_cost: 85000, percentage: 12 },
      { cost_category: 'Accessorial Charges', total_cost: 62000, percentage: 9 },
      { cost_category: 'Insurance', total_cost: 35000, percentage: 5 },
      { cost_category: 'Customs & Duties', total_cost: 28000, percentage: 4 },
      { cost_category: 'Other Charges', total_cost: 15000, percentage: 2 }
    ];

    return this.limitAndFormatData(data, options);
  }

  private static generateTrendAnalysisData(options: MockDataOptions): any[] {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    let runningTotal = 0;
    
    const data = months.map((month, index) => {
      const monthlyCost = Math.round(Math.random() * 50000 + 20000);
      runningTotal += monthlyCost;
      
      return {
        month,
        monthly_cost: monthlyCost,
        running_total: runningTotal,
        month_number: index + 1,
        growth_rate: index > 0 ? Math.round((Math.random() * 20 - 5) * 10) / 10 : 0
      };
    });

    return this.limitAndFormatData(data, options);
  }

  private static generateBasicFreightData(options: MockDataOptions): any[] {
    const data = Array.from({ length: 10 }, (_, i) => {
      const carrier = this.carriers[Math.floor(Math.random() * this.carriers.length)];
      const origin = this.origins[Math.floor(Math.random() * this.origins.length)];
      const destination = this.destinations[Math.floor(Math.random() * this.destinations.length)];
      
      return {
        id: i + 1,
        carrier: carrier.name,
        origin,
        destination,
        cost: Math.round(Math.random() * 5000 + 500),
        weight: Math.round((Math.random() * 100 + 10) * 10) / 10,
        shipment_date: new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
        quarter: `Q${Math.floor(Math.random() * 4) + 1} 2025`,
        year: 2025,
        service_type: this.serviceTypes[Math.floor(Math.random() * this.serviceTypes.length)],
        delivery_time_days: Math.round(Math.random() * 7 + 1),
        status: ['Delivered', 'In Transit', 'Pending'][Math.floor(Math.random() * 3)]
      };
    });

    return this.limitAndFormatData(data, options);
  }

  private static limitAndFormatData(data: any[], options: MockDataOptions): any[] {
    let result = data;
    
    // Apply row limit
    if (options.maxRows && data.length > options.maxRows) {
      result = data.slice(0, options.maxRows);
    }
    
    // Format for Excel if requested
    if (options.formatForExcel) {
      if (options.includeHeaders) {
        const headers = Object.keys(result[0] || {});
        return [headers, ...result.map(row => headers.map(header => row[header]))];
      } else {
        return result.map(row => Object.values(row));
      }
    }
    
    return result;
  }

  // Generate data for specific table joins
  static generateJoinedData(sql: string, options: MockDataOptions = {}): any[] {
    const lowerSQL = sql.toLowerCase();
    
    if (lowerSQL.includes('carriers') && lowerSQL.includes('freight_data')) {
      return this.generateCarrierFreightJoinedData(options);
    }
    
    if (lowerSQL.includes('routes') && lowerSQL.includes('freight_data')) {
      return this.generateRouteFreightJoinedData(options);
    }
    
    return this.generateDataFromSQL(sql, options);
  }

  private static generateCarrierFreightJoinedData(options: MockDataOptions): any[] {
    const data = this.carriers.map(carrier => ({
      carrier_name: carrier.name,
      carrier_type: carrier.type,
      carrier_region: carrier.region,
      carrier_rating: carrier.rating,
      total_freight_cost: Math.round(Math.random() * 200000 + 50000),
      total_shipments: Math.round(Math.random() * 100 + 20),
      avg_cost_per_shipment: Math.round(Math.random() * 2000 + 500),
      performance_score: Math.round((Math.random() * 20 + 80) * 10) / 10
    }));

    return this.limitAndFormatData(data, options);
  }

  private static generateRouteFreightJoinedData(options: MockDataOptions): any[] {
    const data = this.origins.slice(0, 5).map(origin => {
      const destination = this.destinations[Math.floor(Math.random() * this.destinations.length)];
      return {
        origin,
        destination,
        route_distance: Math.round(Math.random() * 2000 + 500),
        typical_cost: Math.round(Math.random() * 3000 + 500),
        actual_avg_cost: Math.round(Math.random() * 3000 + 500),
        cost_variance: Math.round((Math.random() * 1000 - 500) * 10) / 10,
        shipment_count: Math.round(Math.random() * 50 + 10)
      };
    });

    return this.limitAndFormatData(data, options);
  }

  // Add Excel integration methods
  static async insertDataToRange(worksheetName: string, rangeAddress: string, data: any[][]): Promise<void> {
    try {
      await Excel.run(async (context) => {
        const worksheet = context.workbook.worksheets.getItem(worksheetName);
        const range = worksheet.getRange(rangeAddress);
        
        // Calculate the range size needed
        const rows = data.length;
        const cols = data[0]?.length || 0;
        
        if (rows > 0 && cols > 0) {
          const targetRange = range.getResizedRange(rows - 1, cols - 1);
          targetRange.values = data;
          
          // Format headers if they exist
          if (rows > 1) {
            const headerRange = range.getResizedRange(0, cols - 1);
            headerRange.format.fill.color = '#4472C4';
            headerRange.format.font.color = 'white';
            headerRange.format.font.bold = true;
          }
        }
        
        await context.sync();
      });
    } catch (error) {
      console.error('Error inserting data to range:', error);
      throw error;
    }
  }

  static async insertDataToActiveWorksheet(data: any[][]): Promise<void> {
    try {
      await Excel.run(async (context) => {
        const range = context.workbook.worksheets.getActiveWorksheet().getRange('A1');
        
        // Calculate the range size needed
        const rows = data.length;
        const cols = data[0]?.length || 0;
        
        if (rows > 0 && cols > 0) {
          const targetRange = range.getResizedRange(rows - 1, cols - 1);
          targetRange.values = data;
          
          // Format headers if they exist
          if (rows > 1) {
            const headerRange = range.getResizedRange(0, cols - 1);
            headerRange.format.fill.color = '#4472C4';
            headerRange.format.font.color = 'white';
            headerRange.format.font.bold = true;
          }
        }
        
        await context.sync();
      });
    } catch (error) {
      console.error('Error inserting data to active worksheet:', error);
      throw error;
    }
  }
}

export const mockDataGenerator = MockDataGenerator; 