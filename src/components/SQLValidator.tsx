import React, { useState, useEffect } from 'react';
import { 
  Stack, 
  Text, 
  MessageBar, 
  MessageBarType, 
  DefaultButton, 
  IconButton,
  Toggle,
  Spinner,
  SpinnerSize
} from '@fluentui/react';
import { sqlValidator, ValidationResult, ValidationError } from '../utils/sqlValidator';

interface SQLValidatorProps {
  sql: string;
  schema?: any;
  onValidationComplete?: (result: ValidationResult) => void;
}

const SQLValidator: React.FC<SQLValidatorProps> = ({ sql, schema, onValidationComplete }) => {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [autoValidate, setAutoValidate] = useState(true);

  useEffect(() => {
    if (autoValidate && sql.trim()) {
      validateSQL();
    }
  }, [sql, schema, autoValidate]);

  const validateSQL = async () => {
    if (!sql.trim()) return;

    setIsValidating(true);
    try {
      const result = sqlValidator.validateSQL(sql, schema);
      setValidationResult(result);
      onValidationComplete?.(result);
    } catch (error) {
      console.error('SQL validation error:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const formatSQL = () => {
    if (!sql.trim()) return;
    
    const formatted = sqlValidator.formatSQL(sql);
    // In a real app, you'd update the SQL in the parent component
    console.log('Formatted SQL:', formatted);
  };

  const getSuggestions = () => {
    if (!sql.trim()) return [];
    return sqlValidator.getSuggestions(sql);
  };

  const renderValidationItem = (item: ValidationError, index: number) => (
    <Stack 
      key={index} 
      tokens={{ childrenGap: 4 }} 
      styles={{ 
        root: { 
          padding: 8, 
          border: '1px solid #e0e0e0', 
          borderRadius: 4,
          background: item.type === 'error' ? '#f8d7da' : 
                      item.type === 'warning' ? '#fff3cd' : '#d1ecf1'
        } 
      }}
    >
      <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
        <Text variant="small" styles={{ root: { fontWeight: 'bold' } }}>
          {item.type.toUpperCase()}
        </Text>
        {item.line && item.column && (
          <Text variant="small" styles={{ root: { color: '#666' } }}>
            Line {item.line}, Column {item.column}
          </Text>
        )}
      </Stack>
      <Text variant="small">{item.message}</Text>
      {item.suggestion && (
        <Text variant="small" styles={{ root: { color: '#666', fontStyle: 'italic' } }}>
          Suggestion: {item.suggestion}
        </Text>
      )}
    </Stack>
  );

  if (!sql.trim()) {
    return (
      <Stack tokens={{ childrenGap: 8 }}>
        <Text variant="medium">SQL Validation</Text>
        <Text variant="small" styles={{ root: { color: '#666' } }}>
          Enter SQL to validate
        </Text>
      </Stack>
    );
  }

  return (
    <Stack tokens={{ childrenGap: 12 }}>
      <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
        <Text variant="medium">SQL Validation</Text>
        <Stack horizontal tokens={{ childrenGap: 8 }}>
          <Toggle
            label="Auto-validate"
            checked={autoValidate}
            onChange={(_, checked) => setAutoValidate(checked || false)}
          />
          <DefaultButton
            text="Validate"
            onClick={validateSQL}
            disabled={isValidating}
            iconProps={isValidating ? { iconName: 'Spinner' } : undefined}
          />
          <DefaultButton
            text="Format"
            onClick={formatSQL}
            disabled={!sql.trim()}
          />
          <IconButton
            iconProps={{ iconName: showDetails ? 'ChevronUp' : 'ChevronDown' }}
            onClick={() => setShowDetails(!showDetails)}
            title={showDetails ? 'Hide details' : 'Show details'}
          />
        </Stack>
      </Stack>

      {isValidating && (
        <MessageBar messageBarType={MessageBarType.info}>
          <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
            <Spinner size={SpinnerSize.small} />
            <Text>Validating SQL...</Text>
          </Stack>
        </MessageBar>
      )}

      {validationResult && (
        <>
          {/* Overall Status */}
          <MessageBar 
            messageBarType={validationResult.isValid ? MessageBarType.success : MessageBarType.error}
          >
            <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
              <Text>
                {validationResult.isValid ? 'SQL is valid' : 'SQL has errors'}
              </Text>
              {validationResult.errors.length > 0 && (
                <Text variant="small">
                  ({validationResult.errors.length} error{validationResult.errors.length !== 1 ? 's' : ''})
                </Text>
              )}
              {validationResult.warnings.length > 0 && (
                <Text variant="small">
                  ({validationResult.warnings.length} warning{validationResult.warnings.length !== 1 ? 's' : ''})
                </Text>
              )}
            </Stack>
          </MessageBar>

          {/* Performance Hints */}
          {validationResult.performanceHints.length > 0 && (
            <Stack tokens={{ childrenGap: 8 }}>
              <Text variant="small" styles={{ root: { fontWeight: 'bold' } }}>
                Performance Hints:
              </Text>
              {validationResult.performanceHints.map((hint, index) => (
                <Text key={index} variant="small" styles={{ root: { color: '#666' } }}>
                  • {hint}
                </Text>
              ))}
            </Stack>
          )}

          {/* Detailed Validation Results */}
          {showDetails && (
            <Stack tokens={{ childrenGap: 8 }}>
              {/* Errors */}
              {validationResult.errors.length > 0 && (
                <Stack tokens={{ childrenGap: 8 }}>
                  <Text variant="small" styles={{ root: { fontWeight: 'bold', color: '#dc3545' } }}>
                    Errors ({validationResult.errors.length}):
                  </Text>
                  {validationResult.errors.map(renderValidationItem)}
                </Stack>
              )}

              {/* Warnings */}
              {validationResult.warnings.length > 0 && (
                <Stack tokens={{ childrenGap: 8 }}>
                  <Text variant="small" styles={{ root: { fontWeight: 'bold', color: '#ffc107' } }}>
                    Warnings ({validationResult.warnings.length}):
                  </Text>
                  {validationResult.warnings.map(renderValidationItem)}
                </Stack>
              )}

              {/* Suggestions */}
              {validationResult.suggestions.length > 0 && (
                <Stack tokens={{ childrenGap: 8 }}>
                  <Text variant="small" styles={{ root: { fontWeight: 'bold', color: '#17a2b8' } }}>
                    Suggestions ({validationResult.suggestions.length}):
                  </Text>
                  {validationResult.suggestions.map(renderValidationItem)}
                </Stack>
              )}

              {/* Additional Suggestions */}
              {getSuggestions().length > 0 && (
                <Stack tokens={{ childrenGap: 8 }}>
                  <Text variant="small" styles={{ root: { fontWeight: 'bold', color: '#28a745' } }}>
                    Best Practices:
                  </Text>
                  {getSuggestions().map((suggestion, index) => (
                    <Text key={index} variant="small" styles={{ root: { color: '#666' } }}>
                      • {suggestion}
                    </Text>
                  ))}
                </Stack>
              )}
            </Stack>
          )}

          {/* Quick Stats */}
          <Stack horizontal tokens={{ childrenGap: 16 }}>
            <Text variant="small">
              Errors: {validationResult.errors.length}
            </Text>
            <Text variant="small">
              Warnings: {validationResult.warnings.length}
            </Text>
            <Text variant="small">
              Suggestions: {validationResult.suggestions.length}
            </Text>
            <Text variant="small">
              Performance Hints: {validationResult.performanceHints.length}
            </Text>
          </Stack>
        </>
      )}
    </Stack>
  );
};

export default SQLValidator; 