import React, { useState } from 'react';
import { TextField, Stack, DefaultButton, IconButton, PrimaryButton } from '@fluentui/react';

interface SQLPreviewProps {
  sql: string;
  setSql?: (sql: string) => void;
  onInsertToExcel?: () => void;
  onCopy?: () => void;
}

const SQLPreview: React.FC<SQLPreviewProps> = ({ sql, setSql, onInsertToExcel, onCopy }) => {
  const [editing, setEditing] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    onCopy?.();
  };

  const handleInsertToExcel = async () => {
    try {
      // Use the mock data generator for sophisticated data generation
      const { mockDataGenerator } = await import('../utils/mockDataGenerator');
      const mockData = mockDataGenerator.generateDataFromSQL(sql, {
        includeHeaders: true,
        formatForExcel: true,
        maxRows: 50
      });
      
      await Excel.run(async (context) => {
        const range = context.workbook.worksheets.getActiveWorksheet().getRange('A1');
        
        // Insert data with headers
        if (mockData.length > 0) {
          const rows = mockData.length;
          const cols = mockData[0].length;
          const targetRange = range.getResizedRange(rows - 1, cols - 1);
          targetRange.values = mockData;
          
          // Format headers
          const headerRange = range.getResizedRange(0, cols - 1);
          headerRange.format.fill.color = '#4472C4';
          headerRange.format.font.color = 'white';
          headerRange.format.font.bold = true;
        }
        
        await context.sync();
      });
      
      onInsertToExcel?.();
    } catch (err) {
      console.error('Failed to insert data to Excel:', err);
    }
  };

  return (
    <Stack tokens={{ childrenGap: 8 }}>
      <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
        <span style={{ fontWeight: 'bold' }}>SQL Preview</span>
        <Stack horizontal tokens={{ childrenGap: 4 }}>
          <IconButton 
            iconProps={{ iconName: 'Copy' }} 
            title="Copy SQL" 
            ariaLabel="Copy SQL" 
            onClick={handleCopy} 
            disabled={!sql} 
          />
          {setSql && (
            <DefaultButton 
              text={editing ? 'Save' : 'Edit SQL'} 
              onClick={() => setEditing(!editing)} 
              disabled={!sql} 
            />
          )}
        </Stack>
      </Stack>
      
      {editing && setSql ? (
        <TextField
          multiline
          value={sql}
          onChange={(_, v) => setSql(v || '')}
          styles={{ root: { width: '100%' } }}
        />
      ) : (
        <pre style={{ 
          background: '#f3f2f1', 
          padding: 8, 
          borderRadius: 4, 
          fontFamily: 'monospace', 
          fontSize: 13, 
          overflowX: 'auto',
          margin: 0
        }}>
          {sql}
        </pre>
      )}
      
      {!editing && sql && (
        <PrimaryButton 
          text="Insert to Excel" 
          onClick={handleInsertToExcel}
          iconProps={{ iconName: 'ExcelLogo' }}
        />
      )}
    </Stack>
  );
};

export default SQLPreview; 