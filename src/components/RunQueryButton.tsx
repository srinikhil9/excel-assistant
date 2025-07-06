import React from 'react';
import { PrimaryButton } from '@fluentui/react';

interface RunQueryButtonProps {
  loading: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const RunQueryButton: React.FC<RunQueryButtonProps> = ({ loading, onClick, disabled = false }) => {
  return (
    <PrimaryButton 
      text="Run Query" 
      onClick={onClick} 
      disabled={loading || disabled}
      iconProps={loading ? { iconName: 'Spinner' } : undefined}
    />
  );
};

export default RunQueryButton; 