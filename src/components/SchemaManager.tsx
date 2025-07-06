import React, { useState, useEffect } from 'react';
import { 
  Stack, 
  Text, 
  DefaultButton, 
  PrimaryButton, 
  TextField, 
  Dropdown, 
  IDropdownOption,
  IconButton,
  MessageBar,
  MessageBarType,
  Spinner,
  SpinnerSize,
  Dialog,
  DialogType,
  DialogFooter,
  List,
  Toggle,
  SpinButton
} from '@fluentui/react';
import { schemaManager, DatabaseSchema, DatabaseTable, DatabaseColumn } from '../utils/schemaManager';
import { exportManager } from '../utils/exportManager';

interface SchemaManagerProps {
  isVisible: boolean;
  onClose: () => void;
  onSchemaChange: (schema: DatabaseSchema) => void;
}

const SchemaManager: React.FC<SchemaManagerProps> = ({ isVisible, onClose, onSchemaChange }) => {
  const [schemas, setSchemas] = useState<DatabaseSchema[]>([]);
  const [selectedSchema, setSelectedSchema] = useState<DatabaseSchema | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showTableDialog, setShowTableDialog] = useState(false);
  const [editingSchema, setEditingSchema] = useState<Partial<DatabaseSchema>>({});
  const [editingTable, setEditingTable] = useState<Partial<DatabaseTable>>({});
  const [exporting, setExporting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    if (isVisible) {
      loadSchemas();
    }
  }, [isVisible]);

  const loadSchemas = async () => {
    setLoading(true);
    try {
      const schemasData = await schemaManager.getSchemas();
      setSchemas(schemasData);
      if (schemasData.length > 0 && !selectedSchema) {
        setSelectedSchema(schemasData[0]);
      }
    } catch (error) {
      console.error('Error loading schemas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchema = async () => {
    if (!editingSchema.name || !editingSchema.tables || editingSchema.tables.length === 0) {
      setValidationErrors(['Schema name and at least one table are required']);
      return;
    }

    setLoading(true);
    try {
      const schemaId = await schemaManager.createSchema(editingSchema as any);
      await loadSchemas();
      setShowCreateDialog(false);
      setEditingSchema({});
      setValidationErrors([]);
    } catch (error) {
      setValidationErrors([error instanceof Error ? error.message : 'Failed to create schema']);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSchema = async () => {
    if (!selectedSchema || !editingSchema.name) {
      setValidationErrors(['Schema name is required']);
      return;
    }

    setLoading(true);
    try {
      await schemaManager.updateSchema(selectedSchema.id, editingSchema);
      await loadSchemas();
      setShowEditDialog(false);
      setEditingSchema({});
      setValidationErrors([]);
    } catch (error) {
      setValidationErrors([error instanceof Error ? error.message : 'Failed to update schema']);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSchema = async () => {
    if (!selectedSchema) return;

    setLoading(true);
    try {
      await schemaManager.deleteSchema(selectedSchema.id);
      await loadSchemas();
      setSelectedSchema(null);
    } catch (error) {
      console.error('Error deleting schema:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefaultSchema = async (schema: DatabaseSchema) => {
    await schemaManager.setDefaultSchema(schema.id);
    onSchemaChange(schema);
  };

  const handleExportSchema = async (format: 'json' | 'sql' | 'markdown') => {
    if (!selectedSchema) return;

    setExporting(true);
    try {
      await exportManager.exportSchema(selectedSchema, format);
    } catch (error) {
      console.error('Error exporting schema:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleAddTable = () => {
    setEditingTable({
      name: '',
      description: '',
      columns: []
    });
    setShowTableDialog(true);
  };

  const handleSaveTable = async () => {
    if (!selectedSchema || !editingTable.name || !editingTable.columns || editingTable.columns.length === 0) {
      setValidationErrors(['Table name and at least one column are required']);
      return;
    }

    setLoading(true);
    try {
      await schemaManager.addTable(selectedSchema.id, editingTable as any);
      await loadSchemas();
      setShowTableDialog(false);
      setEditingTable({});
      setValidationErrors([]);
    } catch (error) {
      setValidationErrors([error instanceof Error ? error.message : 'Failed to add table']);
    } finally {
      setLoading(false);
    }
  };

  const schemaOptions: IDropdownOption[] = schemas.map(schema => ({
    key: schema.id,
    text: schema.name
  }));

  const renderTable = (table: DatabaseTable) => (
    <Stack 
      key={table.name} 
      tokens={{ childrenGap: 8 }} 
      styles={{ 
        root: { 
          padding: 12, 
          border: '1px solid #e0e0e0', 
          borderRadius: 4 
        } 
      }}
    >
      <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
        <Text variant="medium" styles={{ root: { fontWeight: 'bold' } }}>
          {table.name}
        </Text>
        <IconButton
          iconProps={{ iconName: 'Delete' }}
          title="Delete table"
          onClick={async () => {
            if (selectedSchema) {
              await schemaManager.deleteTable(selectedSchema.id, table.name);
              await loadSchemas();
            }
          }}
        />
      </Stack>
      
      {table.description && (
        <Text variant="small" styles={{ root: { color: '#666' } }}>
          {table.description}
        </Text>
      )}

      <Stack tokens={{ childrenGap: 4 }}>
        {table.columns.map(column => (
          <Stack key={column.name} horizontal tokens={{ childrenGap: 8 } as any}>
            <Text variant="small" styles={{ root: { width: 120 } }}>
              {column.name}
            </Text>
            <Text variant="small" styles={{ root: { width: 100 } }}>
              {column.type}
            </Text>
            <Text variant="small" styles={{ root: { width: 80 } }}>
              {column.nullable ? 'NULL' : 'NOT NULL'}
            </Text>
            {column.description && (
              <Text variant="small" styles={{ root: { color: '#666', flex: 1 } }}>
                {column.description}
              </Text>
            )}
          </Stack>
        ))}
      </Stack>
    </Stack>
  );

  if (!isVisible) return null;

  return (
    <Stack tokens={{ childrenGap: 16 }} styles={{ root: { padding: 16, height: '100%' } }}>
      <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
        <Text variant="xLarge">Schema Manager</Text>
        <IconButton iconProps={{ iconName: 'ChromeClose' }} onClick={onClose} />
      </Stack>

      <Stack horizontal tokens={{ childrenGap: 8 }}>
        <Dropdown
          placeholder="Select schema"
          options={schemaOptions}
          selectedKey={selectedSchema?.id}
          onChange={(_, option) => {
            const schema = schemas.find(s => s.id === option?.key);
            if (schema) {
              setSelectedSchema(schema);
              onSchemaChange(schema);
            }
          }}
          styles={{ root: { flex: 1 } }}
        />
        <DefaultButton
          text="Create Schema"
          onClick={() => {
            setEditingSchema({});
            setShowCreateDialog(true);
          }}
        />
        <DefaultButton
          text="Edit Schema"
          onClick={() => {
            if (selectedSchema) {
              setEditingSchema(selectedSchema);
              setShowEditDialog(true);
            }
          }}
          disabled={!selectedSchema}
        />
        <DefaultButton
          text="Delete Schema"
          onClick={handleDeleteSchema}
          disabled={!selectedSchema || schemas.length <= 1}
        />
      </Stack>

      {selectedSchema && (
        <>
          <Stack horizontal tokens={{ childrenGap: 8 }}>
            <Text variant="medium" styles={{ root: { fontWeight: 'bold' } }}>
              {selectedSchema.name}
            </Text>
            {selectedSchema.description && (
              <Text variant="small" styles={{ root: { color: '#666' } }}>
                {selectedSchema.description}
              </Text>
            )}
            <DefaultButton
              text="Set as Default"
              onClick={() => handleSetDefaultSchema(selectedSchema)}
            />
          </Stack>

          <Stack horizontal tokens={{ childrenGap: 8 }}>
            <DefaultButton
              text="Add Table"
              onClick={handleAddTable}
            />
            <DefaultButton
              text="Export JSON"
              onClick={() => handleExportSchema('json')}
              disabled={exporting}
            />
            <DefaultButton
              text="Export SQL"
              onClick={() => handleExportSchema('sql')}
              disabled={exporting}
            />
            <DefaultButton
              text="Export Markdown"
              onClick={() => handleExportSchema('markdown')}
              disabled={exporting}
            />
          </Stack>

          {exporting && (
            <MessageBar messageBarType={MessageBarType.info}>
              <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
                <Spinner size={SpinnerSize.small} />
                <Text>Exporting schema...</Text>
              </Stack>
            </MessageBar>
          )}

          <Stack tokens={{ childrenGap: 8 }} styles={{ root: { flex: 1, overflow: 'auto' } }}>
            {selectedSchema.tables.map(renderTable)}
          </Stack>
        </>
      )}

      {/* Create Schema Dialog */}
      <Dialog
        hidden={!showCreateDialog}
        onDismiss={() => setShowCreateDialog(false)}
        dialogContentProps={{
          type: DialogType.normal,
          title: 'Create New Schema',
          subText: 'Define a new database schema'
        }}
        maxWidth={600}
      >
        <Stack tokens={{ childrenGap: 12 }}>
          <TextField
            label="Schema Name"
            value={editingSchema.name || ''}
            onChange={(_, newValue) => setEditingSchema(prev => ({ ...prev, name: newValue }))}
            required
          />
          <TextField
            label="Description"
            multiline
            rows={3}
            value={editingSchema.description || ''}
            onChange={(_, newValue) => setEditingSchema(prev => ({ ...prev, description: newValue }))}
          />
          {validationErrors.length > 0 && (
            <MessageBar messageBarType={MessageBarType.error}>
              {validationErrors.map((error, index) => (
                <div key={index}>{error}</div>
              ))}
            </MessageBar>
          )}
        </Stack>
        <DialogFooter>
          <DefaultButton text="Cancel" onClick={() => setShowCreateDialog(false)} />
          <PrimaryButton text="Create" onClick={handleCreateSchema} disabled={loading} />
        </DialogFooter>
      </Dialog>

      {/* Edit Schema Dialog */}
      <Dialog
        hidden={!showEditDialog}
        onDismiss={() => setShowEditDialog(false)}
        dialogContentProps={{
          type: DialogType.normal,
          title: 'Edit Schema',
          subText: 'Modify schema properties'
        }}
        maxWidth={600}
      >
        <Stack tokens={{ childrenGap: 12 }}>
          <TextField
            label="Schema Name"
            value={editingSchema.name || ''}
            onChange={(_, newValue) => setEditingSchema(prev => ({ ...prev, name: newValue }))}
            required
          />
          <TextField
            label="Description"
            multiline
            rows={3}
            value={editingSchema.description || ''}
            onChange={(_, newValue) => setEditingSchema(prev => ({ ...prev, description: newValue }))}
          />
          {validationErrors.length > 0 && (
            <MessageBar messageBarType={MessageBarType.error}>
              {validationErrors.map((error, index) => (
                <div key={index}>{error}</div>
              ))}
            </MessageBar>
          )}
        </Stack>
        <DialogFooter>
          <DefaultButton text="Cancel" onClick={() => setShowEditDialog(false)} />
          <PrimaryButton text="Update" onClick={handleUpdateSchema} disabled={loading} />
        </DialogFooter>
      </Dialog>

      {/* Add Table Dialog */}
      <Dialog
        hidden={!showTableDialog}
        onDismiss={() => setShowTableDialog(false)}
        dialogContentProps={{
          type: DialogType.normal,
          title: 'Add Table',
          subText: 'Define a new table'
        }}
        maxWidth={800}
      >
        <Stack tokens={{ childrenGap: 12 }}>
          <TextField
            label="Table Name"
            value={editingTable.name || ''}
            onChange={(_, newValue) => setEditingTable(prev => ({ ...prev, name: newValue }))}
            required
          />
          <TextField
            label="Description"
            multiline
            rows={2}
            value={editingTable.description || ''}
            onChange={(_, newValue) => setEditingTable(prev => ({ ...prev, description: newValue }))}
          />
          <Text variant="medium">Columns</Text>
          {/* Simple column editor - in a real app, this would be more sophisticated */}
          <Stack tokens={{ childrenGap: 8 }}>
            {editingTable.columns?.map((column, index) => (
              <Stack key={index} horizontal tokens={{ childrenGap: 8 } as any}>
                <TextField
                  placeholder="Column name"
                  value={column.name}
                  onChange={(_, newValue) => {
                    const newColumns = [...(editingTable.columns || [])];
                    newColumns[index] = { ...column, name: newValue || '' };
                    setEditingTable(prev => ({ ...prev, columns: newColumns }));
                  }}
                  styles={{ root: { width: 150 } }}
                />
                <TextField
                  placeholder="Type"
                  value={column.type}
                  onChange={(_, newValue) => {
                    const newColumns = [...(editingTable.columns || [])];
                    newColumns[index] = { ...column, type: newValue || '' };
                    setEditingTable(prev => ({ ...prev, columns: newColumns }));
                  }}
                  styles={{ root: { width: 120 } }}
                />
                <Toggle
                  label="Nullable"
                  checked={column.nullable}
                  onChange={(_, checked) => {
                    const newColumns = [...(editingTable.columns || [])];
                    newColumns[index] = { ...column, nullable: checked || false };
                    setEditingTable(prev => ({ ...prev, columns: newColumns }));
                  }}
                />
                <IconButton
                  iconProps={{ iconName: 'Delete' }}
                  onClick={() => {
                    const newColumns = editingTable.columns?.filter((_, i) => i !== index);
                    setEditingTable(prev => ({ ...prev, columns: newColumns }));
                  }}
                />
              </Stack>
            ))}
            <DefaultButton
              text="Add Column"
              onClick={() => {
                const newColumns = [...(editingTable.columns || []), {
                  name: '',
                  type: 'VARCHAR(255)',
                  nullable: true,
                  description: ''
                }];
                setEditingTable(prev => ({ ...prev, columns: newColumns }));
              }}
            />
          </Stack>
          {validationErrors.length > 0 && (
            <MessageBar messageBarType={MessageBarType.error}>
              {validationErrors.map((error, index) => (
                <div key={index}>{error}</div>
              ))}
            </MessageBar>
          )}
        </Stack>
        <DialogFooter>
          <DefaultButton text="Cancel" onClick={() => setShowTableDialog(false)} />
          <PrimaryButton text="Add Table" onClick={handleSaveTable} disabled={loading} />
        </DialogFooter>
      </Dialog>
    </Stack>
  );
};

export default SchemaManager; 