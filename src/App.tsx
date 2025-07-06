import React, { useState, useEffect } from 'react';
import { Stack, Text, MessageBar, MessageBarType, Toggle, Spinner, SpinnerSize, IconButton, Pivot, PivotItem, DefaultButton } from '@fluentui/react';
import InputBox from './components/InputBox';
import RunQueryButton from './components/RunQueryButton';
import LoadingSpinner from './components/LoadingSpinner';
import SQLPreview from './components/SQLPreview';
import WorksheetDropdown from './components/WorksheetDropdown';
import RangeSelector from './components/RangeSelector';
import TooltipHelp from './components/TooltipHelp';
import ErrorBoundary from './components/ErrorBoundary';
import AdvancedOptions from './components/AdvancedOptions';
import QueryHistory from './components/QueryHistory';
import SchemaManager from './components/SchemaManager';
import SQLValidator from './components/SQLValidator';
import ExportOptionsComponent from './components/ExportOptions';
import { getWorksheetNames } from './utils/excelHelpers';
import { openAIService, SQLGenerationOptions } from './utils/openaiService';
import { mockDataGenerator } from './utils/mockDataGenerator';
import { queryHistoryManager } from './utils/queryHistory';
import { schemaManager, DatabaseSchema } from './utils/schemaManager';
import { sqlValidator, ValidationResult } from './utils/sqlValidator';

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [sql, setSql] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [worksheets, setWorksheets] = useState<string[]>([]);
  const [selectedWorksheet, setSelectedWorksheet] = useState<string>('');
  const [selectedRange, setSelectedRange] = useState<string>('');
  const [useOpenAI, setUseOpenAI] = useState(true);
  const [sqlOptions, setSqlOptions] = useState<SQLGenerationOptions>({
    includeComments: true,
    limitResults: 100,
    preferCTEs: false,
    includePerformanceHints: false
  });
  const [apiStats, setApiStats] = useState({ requestCount: 0, lastRequestTime: 0 });
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [currentSchema, setCurrentSchema] = useState<DatabaseSchema | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [mockData, setMockData] = useState<any[][]>([]);
  const [executionTime, setExecutionTime] = useState<number>(0);
  
  // UI State
  const [showQueryHistory, setShowQueryHistory] = useState(false);
  const [showSchemaManager, setShowSchemaManager] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [activeTab, setActiveTab] = useState('main');

  useEffect(() => {
    // Load worksheets and default schema on component mount
    loadWorksheets();
    loadDefaultSchema();
  }, []);

  useEffect(() => {
    // Update API stats
    const stats = openAIService.getUsageStats();
    setApiStats(stats);
  }, [loading]);

  const loadWorksheets = async () => {
    try {
      const names = await getWorksheetNames();
      setWorksheets(names);
      if (names.length > 0) {
        setSelectedWorksheet(names[0]);
      }
    } catch (err) {
      console.error('Failed to load worksheets:', err);
    }
  };

  const loadDefaultSchema = async () => {
    try {
      const schema = await schemaManager.getDefaultSchema();
      setCurrentSchema(schema);
    } catch (err) {
      console.error('Failed to load default schema:', err);
    }
  };

  const handleRunQuery = async () => {
    if (!question.trim()) {
      setError('Please enter a question first.');
      return;
    }
    
    setLoading(true);
    setError(null);
    const startTime = Date.now();
    
    try {
      let generatedSQL: string;
      
      if (useOpenAI) {
        // Use OpenAI API for SQL generation
        generatedSQL = await openAIService.generateSQL(question, sqlOptions);
      } else {
        // Use fallback mock SQL generation
        generatedSQL = generateMockSQL(question);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
      }
      
      setSql(generatedSQL);
      
      // Generate mock data for preview
      const data = mockDataGenerator.generateDataFromSQL(generatedSQL, {
        includeHeaders: true,
        formatForExcel: true,
        maxRows: 20
      });
      setMockData(data);
      
      // Add to query history
      await queryHistoryManager.addQuery(question, generatedSQL, true, Date.now() - startTime);
      
    } catch (err) {
      console.error('SQL generation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to convert question to SQL: ${errorMessage}`);
      
      // Add failed query to history
      await queryHistoryManager.addQuery(question, '', false, Date.now() - startTime, errorMessage);
    } finally {
      setExecutionTime(Date.now() - startTime);
      setLoading(false);
    }
  };

  const generateMockSQL = (question: string): string => {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('carrier') && lowerQuestion.includes('cost')) {
      return `-- Carrier cost analysis
SELECT 
  carrier, 
  SUM(cost) as total_cost,
  COUNT(*) as shipments,
  AVG(cost) as avg_cost_per_shipment
FROM freight_data 
WHERE quarter = 'Q1 2025' 
GROUP BY carrier
ORDER BY total_cost DESC`;
    }
    
    if (lowerQuestion.includes('quarter') || lowerQuestion.includes('q1')) {
      return `-- Quarterly analysis
SELECT 
  quarter,
  carrier,
  SUM(cost) as total_cost,
  COUNT(*) as shipment_count
FROM freight_data 
WHERE quarter = 'Q1 2025' 
GROUP BY quarter, carrier
ORDER BY quarter, total_cost DESC`;
    }
    
    if (lowerQuestion.includes('total') || lowerQuestion.includes('sum')) {
      return `-- Total freight analysis
SELECT 
  SUM(cost) as total_freight_cost,
  COUNT(*) as total_shipments,
  AVG(cost) as avg_shipment_cost
FROM freight_data 
WHERE quarter = 'Q1 2025'`;
    }
    
    if (lowerQuestion.includes('performance') || lowerQuestion.includes('delivery')) {
      return `-- Performance metrics
SELECT 
  carrier,
  AVG(delivery_time_days) as avg_delivery_time,
  COUNT(*) as total_shipments,
  SUM(CASE WHEN status = 'Delivered' THEN 1 ELSE 0 END) as delivered_shipments
FROM freight_data 
WHERE quarter = 'Q1 2025'
GROUP BY carrier
ORDER BY avg_delivery_time ASC`;
    }
    
    // Default SQL for any question
    return `-- General freight data
SELECT 
  carrier,
  quarter,
  cost,
  shipment_date,
  service_type
FROM freight_data 
WHERE quarter = 'Q1 2025'
ORDER BY shipment_date DESC
LIMIT 100`;
  };

  const handleInsertToExcel = async () => {
    try {
      // Use existing mock data or generate new data
      const dataToInsert = mockData.length > 0 ? mockData : mockDataGenerator.generateDataFromSQL(sql, {
        includeHeaders: true,
        formatForExcel: true,
        maxRows: 50
      });
      
      // Insert data to Excel
      if (selectedRange && selectedWorksheet) {
        await mockDataGenerator.insertDataToRange(selectedWorksheet, selectedRange, dataToInsert);
      } else {
        // Insert to active worksheet if no specific range selected
        await mockDataGenerator.insertDataToActiveWorksheet(dataToInsert);
      }
    } catch (err) {
      console.error('Failed to insert data to Excel:', err);
      setError('Failed to insert data to Excel. Please try again.');
    }
  };

  const handleSelectQueryFromHistory = (question: string, sql: string) => {
    setQuestion(question);
    setSql(sql);
  };

  const handleSchemaChange = (schema: DatabaseSchema) => {
    setCurrentSchema(schema);
  };

  const handleValidationComplete = (result: ValidationResult) => {
    setValidationResult(result);
  };

  return (
    <ErrorBoundary>
      <Stack tokens={{ childrenGap: 16, padding: 16 }} styles={{ root: { width: 400, minHeight: '100vh', background: '#fff' } }}>
        <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
          <Text variant="xLarge">Excel SQL Assistant</Text>
          <Stack horizontal tokens={{ childrenGap: 4 }}>
            <IconButton
              iconProps={{ iconName: 'History' }}
              title="Query History"
              onClick={() => setShowQueryHistory(true)}
            />
            <IconButton
              iconProps={{ iconName: 'Database' }}
              title="Schema Manager"
              onClick={() => setShowSchemaManager(true)}
            />
            <IconButton
              iconProps={{ iconName: 'Download' }}
              title="Export Options"
              onClick={() => setShowExportOptions(true)}
              disabled={!sql.trim()}
            />
          </Stack>
        </Stack>

        <Pivot selectedKey={activeTab} onLinkClick={(item) => setActiveTab(item?.props.itemKey || 'main')}>
          <PivotItem headerText="Main" itemKey="main">
            <Stack tokens={{ childrenGap: 16 }}>
              <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
                <TooltipHelp />
                <Toggle 
                  label="Use OpenAI" 
                  checked={useOpenAI} 
                  onText="OpenAI" 
                  offText="Mock" 
                  onChange={(_, checked) => setUseOpenAI(checked || false)}
                />
              </Stack>
        
              {useOpenAI && (
                <Stack tokens={{ childrenGap: 8 }}>
                  <Text variant="small">API Requests: {apiStats.requestCount}</Text>
                  <AdvancedOptions 
                    options={sqlOptions}
                    onOptionsChange={setSqlOptions}
                    isOpen={showAdvancedOptions}
                    onToggle={() => setShowAdvancedOptions(!showAdvancedOptions)}
                  />
                </Stack>
              )}
              
              <InputBox 
                value={question} 
                onChange={setQuestion} 
                placeholder="Ask a question about your freight data..."
              />
              
              <RunQueryButton 
                onClick={handleRunQuery} 
                loading={loading} 
                disabled={!question.trim()}
              />
              
              {loading && <LoadingSpinner />}
              
              {error && (
                <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError(null)}>
                  {error}
                </MessageBar>
              )}
              
              {sql && (
                <Stack tokens={{ childrenGap: 8 }}>
                  <SQLPreview sql={sql} onCopy={() => console.log('SQL copied')} />
                  
                  <Stack horizontal tokens={{ childrenGap: 8 }}>
                    <WorksheetDropdown 
                      worksheets={worksheets} 
                      selected={selectedWorksheet} 
                      onChange={setSelectedWorksheet} 
                    />
                    <RangeSelector 
                      worksheet={selectedWorksheet} 
                      value={selectedRange} 
                      onChange={setSelectedRange} 
                    />
                  </Stack>
                  
                  <DefaultButton 
                    text="Insert Data to Excel" 
                    onClick={handleInsertToExcel}
                    disabled={!sql.trim()}
                  />
                </Stack>
              )}
            </Stack>
          </PivotItem>
          
          <PivotItem headerText="Validation" itemKey="validation">
            <SQLValidator 
              sql={sql} 
              schema={currentSchema}
              onValidationComplete={handleValidationComplete}
            />
          </PivotItem>
        </Pivot>

        {/* Modals */}
        <QueryHistory
          isVisible={showQueryHistory}
          onClose={() => setShowQueryHistory(false)}
          onSelectQuery={handleSelectQueryFromHistory}
        />
        
        <SchemaManager
          isVisible={showSchemaManager}
          onClose={() => setShowSchemaManager(false)}
          onSchemaChange={handleSchemaChange}
        />
        
        <ExportOptionsComponent
          sql={sql}
          question={question}
          data={mockData}
          executionTime={executionTime}
          isVisible={showExportOptions}
          onClose={() => setShowExportOptions(false)}
        />
      </Stack>
    </ErrorBoundary>
  );
};

export default App; 