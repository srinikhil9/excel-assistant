import React from 'react';
import { TextField } from '@fluentui/react';

interface InputBoxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const InputBox: React.FC<InputBoxProps> = ({ value, onChange, placeholder = "Enter your question in natural language" }) => {
  return (
    <TextField
      label="Question"
      multiline
      rows={3}
      placeholder={placeholder}
      value={value}
      onChange={(_, newValue) => onChange(newValue || '')}
      styles={{ root: { width: '100%' } }}
    />
  );
};

export default InputBox; 