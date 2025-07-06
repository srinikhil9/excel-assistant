import React, { useState } from 'react';
import { 
  Stack, 
  Text, 
  DefaultButton, 
  Dropdown, 
  IDropdownOption,
  Toggle,
  TextField,
  Dialog,
  DialogType,
  DialogFooter,
  PrimaryButton,
  MessageBar,
  MessageBarType,
  Spinner,
  SpinnerSize
} from '@fluentui/react';
import { exportManager, ExportData, ExportOptions } from '../utils/exportManager';

interface ExportOptionsProps {
  sql: string;
  question: string;
  data?: any[][];
  executionTime?: number;
  isVisible: boolean;
  onClose: () => void;
}

const ExportOptionsComponent: React.FC<ExportOptionsProps> = ({ 
  sql, 
  question, 
  data, 
  executionTime, 
  isVisible, 
  onClose 
}) => {
  const [exportFormat, setExportFormat] = useState<string>('csv');
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [customFilename, setCustomFilename] = useState('');
  const [exporting, setExporting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const formatOptions: IDropdownOption[] = [
    { key: 'csv', text: 'CSV File' },
    { key: 'json', text: 'JSON File' },
    { key: 'excel', text: 'Excel (HTML)' },
    { key: 'sql', text: 'SQL Script' },
    { key: 'markdown', text: 'Markdown' }
  ];

  const handleExport = async () => {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }

    setExporting(true);
    try {
      const exportData: ExportData = {
        sql,
        question,
        data,
        metadata: {
          generatedAt: new Date().toISOString(),
          executionTime,
          rowCount: data.length,
          columnCount: data[0]?.length || 0
        }
      };

      const options: ExportOptions = {
        format: exportFormat as any,
        includeHeaders,
        includeMetadata,
        filename: customFilename || undefined
      };

      await exportManager.exportData(exportData, options);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleFormatChange = (event: React.FormEvent<HTMLDivElement>, option?: IDropdownOption) => {
    setExportFormat(option?.key as string || 'csv');
  };

  const getFormatDescription = (format: string): string => {
    switch (format) {
      case 'csv':
        return 'Comma-separated values file, suitable for Excel and other spreadsheet applications';
      case 'json':
        return 'JavaScript Object Notation, good for data processing and APIs';
      case 'excel':
        return 'HTML table format that can be opened in Excel';
      case 'sql':
        return 'SQL script with the query and sample INSERT statements';
      case 'markdown':
        return 'Markdown format with tables, suitable for documentation';
      default:
        return '';
    }
  };

  const getDefaultFilename = (): string => {
    const timestamp = new Date().toISOString().split('T')[0];
    const format = exportFormat === 'excel' ? 'html' : exportFormat;
    return `sql_export_${timestamp}.${format}`;
  };

  if (!isVisible) return null;

  return (
    <Dialog
      hidden={!isVisible}
      onDismiss={onClose}
      dialogContentProps={{
        type: DialogType.normal,
        title: 'Export Options',
        subText: 'Choose how to export your SQL query and results'
      }}
      maxWidth={600}
    >
      <Stack tokens={{ childrenGap: 16 }}>
        {showSuccess && (
          <MessageBar messageBarType={MessageBarType.success}>
            Export completed successfully!
          </MessageBar>
        )}

        {/* Format Selection */}
        <Stack tokens={{ childrenGap: 8 }}>
          <Text variant="medium">Export Format</Text>
          <Dropdown
            placeholder="Select format"
            options={formatOptions}
            selectedKey={exportFormat}
            onChange={handleFormatChange}
          />
          <Text variant="small" styles={{ root: { color: '#666' } }}>
            {getFormatDescription(exportFormat)}
          </Text>
        </Stack>

        {/* File Options */}
        <Stack tokens={{ childrenGap: 8 }}>
          <Text variant="medium">File Options</Text>
          <TextField
            label="Filename (optional)"
            placeholder={getDefaultFilename()}
            value={customFilename}
            onChange={(_, newValue) => setCustomFilename(newValue || '')}
          />
          <Toggle
            label="Include column headers"
            checked={includeHeaders}
            onChange={(_, checked) => setIncludeHeaders(checked || false)}
          />
          <Toggle
            label="Include metadata (SQL query, timestamp, etc.)"
            checked={includeMetadata}
            onChange={(_, checked) => setIncludeMetadata(checked || false)}
          />
        </Stack>

        {/* Preview */}
        <Stack tokens={{ childrenGap: 8 }}>
          <Text variant="medium">Preview</Text>
          <Stack tokens={{ childrenGap: 4 }} styles={{ root: { background: '#f8f9fa', padding: 12, borderRadius: 4 } }}>
            <Text variant="small" styles={{ root: { fontWeight: 'bold' } }}>
              {data ? `${data.length} rows` : 'No data'} • {data?.[0]?.length || 0} columns
            </Text>
            {data && data.length > 0 && (
              <Text variant="small" styles={{ root: { color: '#666' } }}>
                Columns: {data[0].join(', ')}
              </Text>
            )}
            {executionTime && (
              <Text variant="small" styles={{ root: { color: '#666' } }}>
                Execution time: {executionTime}ms
              </Text>
            )}
          </Stack>
        </Stack>

        {/* Export Actions */}
        <Stack horizontal tokens={{ childrenGap: 8 }} horizontalAlign="end">
          <DefaultButton text="Cancel" onClick={onClose} disabled={exporting} />
          <PrimaryButton 
            text={exporting ? 'Exporting...' : 'Export'} 
            onClick={handleExport} 
            disabled={exporting || !data || data.length === 0}
            iconProps={exporting ? { iconName: 'Spinner' } : undefined}
          />
        </Stack>

        {exporting && (
          <MessageBar messageBarType={MessageBarType.info}>
            <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
              <Spinner size={SpinnerSize.small} />
              <Text>Preparing export...</Text>
            </Stack>
          </MessageBar>
        )}
      </Stack>
    </Dialog>
  );
};

export default ExportOptionsComponent; 