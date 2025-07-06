import React from 'react';
import { TextField, DefaultButton, Stack } from '@fluentui/react';

interface RangeSelectorProps {
  value: string;
  onChange: (range: string) => void;
  worksheet: string;
}

const RangeSelector: React.FC<RangeSelectorProps> = ({ 
  value, 
  onChange, 
  worksheet 
}) => {
  const handleGetSelection = async () => {
    try {
      await Excel.run(async (context) => {
        const range = context.workbook.getSelectedRange();
        range.load('address');
        await context.sync();
        onChange(range.address);
      });
    } catch (err) {
      console.error('Failed to get selected range:', err);
    }
  };

  return (
    <Stack horizontal tokens={{ childrenGap: 8 } as any}>
      <TextField 
        label="Result Range" 
        placeholder={`${worksheet}!A1`}
        value={value}
        onChange={(_, newValue) => onChange(newValue || '')}
        styles={{ root: { flex: 1 } }}
      />
      <DefaultButton 
        text="Get Selection" 
        onClick={handleGetSelection}
        styles={{ root: { marginTop: 20 } }}
      />
    </Stack>
  );
};

export default RangeSelector; 