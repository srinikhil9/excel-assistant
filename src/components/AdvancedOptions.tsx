import React from 'react';
import { Stack, Toggle, Text, SpinButton, DefaultButton } from '@fluentui/react';
import { SQLGenerationOptions } from '../utils/openaiService';

interface AdvancedOptionsProps {
  options: SQLGenerationOptions;
  onOptionsChange: (options: SQLGenerationOptions) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const AdvancedOptions: React.FC<AdvancedOptionsProps> = ({ 
  options, 
  onOptionsChange, 
  isOpen, 
  onToggle 
}) => {
  const handleToggleChange = (key: keyof SQLGenerationOptions, value: boolean) => {
    onOptionsChange({ ...options, [key]: value });
  };

  const handleLimitChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0) {
      onOptionsChange({ ...options, limitResults: numValue });
    }
  };

  return (
    <Stack tokens={{ childrenGap: 8 }}>
      <DefaultButton 
        text={isOpen ? "Hide Advanced Options" : "Show Advanced Options"}
        onClick={onToggle}
        iconProps={{ iconName: isOpen ? 'ChevronUp' : 'ChevronDown' }}
      />
      
      {isOpen && (
        <Stack tokens={{ childrenGap: 12 }} styles={{ root: { padding: 12, background: '#f8f8f8', borderRadius: 4 } }}>
          <Text variant="medium" styles={{ root: { fontWeight: 'bold' } }}>
            SQL Generation Options
          </Text>
          
          <Toggle 
            label="Include Comments" 
            checked={options.includeComments} 
            onText="On" 
            offText="Off"
            onChange={(_, checked) => handleToggleChange('includeComments', checked || false)}
          />
          
          <Toggle 
            label="Use Common Table Expressions (CTEs)" 
            checked={options.preferCTEs} 
            onText="On" 
            offText="Off"
            onChange={(_, checked) => handleToggleChange('preferCTEs', checked || false)}
          />
          
          <Toggle 
            label="Include Performance Hints" 
            checked={options.includePerformanceHints} 
            onText="On" 
            offText="Off"
            onChange={(_, checked) => handleToggleChange('includePerformanceHints', checked || false)}
          />
          
          <SpinButton
            label="Result Limit"
            value={options.limitResults?.toString() || '100'}
            min={1}
            max={1000}
            step={10}
            onIncrement={(value) => handleLimitChange((parseInt(value) + 10).toString())}
            onDecrement={(value) => handleLimitChange((parseInt(value) - 10).toString())}
            onValidate={handleLimitChange}
          />
        </Stack>
      )}
    </Stack>
  );
};

export default AdvancedOptions; 