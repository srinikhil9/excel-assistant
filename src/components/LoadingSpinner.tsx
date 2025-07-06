import React from 'react';
import { Spinner, SpinnerSize } from '@fluentui/react';

const LoadingSpinner: React.FC = () => (
  <Spinner label="Converting your question to SQL..." size={SpinnerSize.medium} />
);

export default LoadingSpinner; 