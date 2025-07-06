import React, { useState, useEffect } from 'react';
import { 
  Stack, 
  Text, 
  SearchBox, 
  List, 
  IconButton, 
  DefaultButton, 
  Dropdown, 
  IDropdownOption,
  MessageBar,
  MessageBarType,
  Spinner,
  SpinnerSize,
  Toggle,
  Dialog,
  DialogType,
  DialogFooter,
  PrimaryButton
} from '@fluentui/react';
import { queryHistoryManager, QueryHistoryItem, QueryCategory } from '../utils/queryHistory';
import { exportManager } from '../utils/exportManager';

interface QueryHistoryProps {
  onSelectQuery: (question: string, sql: string) => void;
  isVisible: boolean;
  onClose: () => void;
}

const QueryHistory: React.FC<QueryHistoryProps> = ({ onSelectQuery, isVisible, onClose }) => {
  const [history, setHistory] = useState<QueryHistoryItem[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<QueryHistoryItem[]>([]);
  const [categories, setCategories] = useState<QueryCategory[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState<QueryHistoryItem | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (isVisible) {
      loadHistory();
    }
  }, [isVisible]);

  useEffect(() => {
    filterHistory();
  }, [history, searchText, selectedCategory, showFavoritesOnly]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const [historyData, categoriesData] = await Promise.all([
        queryHistoryManager.getHistory(),
        queryHistoryManager.getCategories()
      ]);
      setHistory(historyData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterHistory = () => {
    let filtered = history;

    // Filter by search text
    if (searchText) {
      filtered = filtered.filter(item =>
        item.question.toLowerCase().includes(searchText.toLowerCase()) ||
        item.sql.toLowerCase().includes(searchText.toLowerCase()) ||
        item.tags?.some(tag => tag.toLowerCase().includes(searchText.toLowerCase()))
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Filter by favorites
    if (showFavoritesOnly) {
      filtered = filtered.filter(item => item.isFavorite);
    }

    setFilteredHistory(filtered);
  };

  const handleSearch = (newValue?: string) => {
    setSearchText(newValue || '');
  };

  const handleCategoryChange = (event: React.FormEvent<HTMLDivElement>, option?: IDropdownOption) => {
    setSelectedCategory(option?.key as string || 'all');
  };

  const handleToggleFavorite = async (id: string) => {
    await queryHistoryManager.toggleFavorite(id);
    await loadHistory();
  };

  const handleSelectQuery = (item: QueryHistoryItem) => {
    onSelectQuery(item.question, item.sql);
    onClose();
  };

  const handleDeleteQuery = async () => {
    if (selectedQuery) {
      await queryHistoryManager.deleteQuery(selectedQuery.id);
      setShowDeleteDialog(false);
      setSelectedQuery(null);
      await loadHistory();
    }
  };

  const handleExportHistory = async (format: 'json' | 'csv' | 'markdown') => {
    setExporting(true);
    try {
      await exportManager.exportQueryHistory(filteredHistory, format);
    } catch (error) {
      console.error('Error exporting history:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleClearHistory = async () => {
    await queryHistoryManager.clearHistory();
    await loadHistory();
  };

  const categoryOptions: IDropdownOption[] = [
    { key: 'all', text: 'All Categories' },
    ...categories.map(cat => ({ key: cat.id, text: cat.name }))
  ];

  const renderHistoryItem = (item: QueryHistoryItem) => {
    const category = categories.find(c => c.id === item.category);
    const date = new Date(item.timestamp).toLocaleString();

    return (
      <Stack 
        key={item.id} 
        tokens={{ childrenGap: 8 }} 
        styles={{ 
          root: { 
            padding: 12, 
            border: '1px solid #e0e0e0', 
            borderRadius: 4,
            background: item.isFavorite ? '#fff3cd' : '#fff'
          } 
        }}
      >
        <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
          <Text variant="medium" styles={{ root: { fontWeight: 'bold' } }}>
            {item.question}
          </Text>
          <Stack horizontal tokens={{ childrenGap: 4 }}>
            <IconButton
              iconProps={{ iconName: item.isFavorite ? 'FavoriteStarFill' : 'FavoriteStar' }}
              title={item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              onClick={() => handleToggleFavorite(item.id)}
            />
            <IconButton
              iconProps={{ iconName: 'Delete' }}
              title="Delete query"
              onClick={() => {
                setSelectedQuery(item);
                setShowDeleteDialog(true);
              }}
            />
            <DefaultButton
              text="Use"
              onClick={() => handleSelectQuery(item)}
            />
          </Stack>
        </Stack>

        <Text variant="small" styles={{ root: { color: '#666' } }}>
          {date} • {item.success ? 'Success' : 'Failed'}
          {item.executionTime && ` • ${item.executionTime}ms`}
        </Text>

        {category && (
          <Stack horizontal tokens={{ childrenGap: 4 }}>
            <div 
              style={{ 
                width: 12, 
                height: 12, 
                borderRadius: '50%', 
                backgroundColor: category.color 
              }} 
            />
            <Text variant="small">{category.name}</Text>
          </Stack>
        )}

        <pre style={{ 
          background: '#f8f9fa', 
          padding: 8, 
          borderRadius: 4, 
          fontSize: 12,
          overflow: 'auto',
          maxHeight: 100
        }}>
          {item.sql}
        </pre>

        {item.tags && item.tags.length > 0 && (
          <Stack horizontal tokens={{ childrenGap: 4 }}>
            {item.tags.map(tag => (
              <span 
                key={tag}
                style={{
                  background: '#e9ecef',
                  padding: '2px 6px',
                  borderRadius: 12,
                  fontSize: 11
                }}
              >
                {tag}
              </span>
            ))}
          </Stack>
        )}
      </Stack>
    );
  };

  if (!isVisible) return null;

  return (
    <Stack tokens={{ childrenGap: 16 }} styles={{ root: { padding: 16, height: '100%' } }}>
      <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
        <Text variant="xLarge">Query History</Text>
        <IconButton iconProps={{ iconName: 'ChromeClose' }} onClick={onClose} />
      </Stack>

      <Stack horizontal tokens={{ childrenGap: 8 }}>
        <SearchBox
          placeholder="Search queries..."
          value={searchText}
          onChange={(_, newValue) => handleSearch(newValue)}
          styles={{ root: { flex: 1 } }}
        />
        <Dropdown
          placeholder="Category"
          options={categoryOptions}
          selectedKey={selectedCategory}
          onChange={handleCategoryChange}
          styles={{ root: { width: 150 } }}
        />
        <Toggle
          label="Favorites only"
          checked={showFavoritesOnly}
          onChange={(_, checked) => setShowFavoritesOnly(checked || false)}
        />
      </Stack>

      <Stack horizontal tokens={{ childrenGap: 8 }}>
        <DefaultButton
          text="Export JSON"
          onClick={() => handleExportHistory('json')}
          disabled={exporting || filteredHistory.length === 0}
        />
        <DefaultButton
          text="Export CSV"
          onClick={() => handleExportHistory('csv')}
          disabled={exporting || filteredHistory.length === 0}
        />
        <DefaultButton
          text="Export Markdown"
          onClick={() => handleExportHistory('markdown')}
          disabled={exporting || filteredHistory.length === 0}
        />
        <DefaultButton
          text="Clear History"
          onClick={handleClearHistory}
          disabled={history.length === 0}
        />
      </Stack>

      {exporting && (
        <MessageBar messageBarType={MessageBarType.info}>
          <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
            <Spinner size={SpinnerSize.small} />
            <Text>Exporting history...</Text>
          </Stack>
        </MessageBar>
      )}

      {loading ? (
        <Stack horizontalAlign="center" verticalAlign="center" styles={{ root: { flex: 1 } }}>
          <Spinner label="Loading history..." />
        </Stack>
      ) : filteredHistory.length === 0 ? (
        <Stack horizontalAlign="center" verticalAlign="center" styles={{ root: { flex: 1 } }}>
          <Text variant="large">No queries found</Text>
          <Text variant="medium" styles={{ root: { color: '#666' } }}>
            {searchText || selectedCategory !== 'all' || showFavoritesOnly 
              ? 'Try adjusting your filters' 
              : 'Your query history will appear here'
            }
          </Text>
        </Stack>
      ) : (
        <Stack tokens={{ childrenGap: 8 }} styles={{ root: { flex: 1, overflow: 'auto' } }}>
          {filteredHistory.map(renderHistoryItem)}
        </Stack>
      )}

      <Dialog
        hidden={!showDeleteDialog}
        onDismiss={() => setShowDeleteDialog(false)}
        dialogContentProps={{
          type: DialogType.normal,
          title: 'Delete Query',
          subText: 'Are you sure you want to delete this query from your history?'
        }}
      >
        <DialogFooter>
          <DefaultButton text="Cancel" onClick={() => setShowDeleteDialog(false)} />
          <PrimaryButton text="Delete" onClick={handleDeleteQuery} />
        </DialogFooter>
      </Dialog>
    </Stack>
  );
};

export default QueryHistory; 