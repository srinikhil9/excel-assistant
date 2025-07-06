import React from 'react';
import { Dropdown, IDropdownOption } from '@fluentui/react';

interface WorksheetDropdownProps {
  worksheets: string[];
  selected: string;
  onChange: (worksheet: string) => void;
}

const WorksheetDropdown: React.FC<WorksheetDropdownProps> = ({ 
  worksheets, 
  selected, 
  onChange 
}) => {
  const options: IDropdownOption[] = worksheets.map(name => ({
    key: name,
    text: name
  }));

  return (
    <Dropdown 
      label="Target Worksheet" 
      options={options} 
      selectedKey={selected}
      onChange={(_, option) => option && onChange(option.key as string)}
      styles={{ root: { width: '100%' } }}
      disabled={worksheets.length === 0}
    />
  );
};

export default WorksheetDropdown; 