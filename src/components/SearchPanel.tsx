import React, { useState } from 'react';
import { TreeNode, DataField, SearchCriteria } from '../types';
import { sanitizeHtml } from '../utils/sanitize';

interface SearchPanelProps {
  nodes: TreeNode[];
  onSelectNode: (id: string) => void;
  onClose: () => void;
}

interface SearchResult {
  nodeId: string;
  nodeTitle: string;
  field: DataField;
  matchText: string;
}

function searchTree(nodes: TreeNode[], criteria: SearchCriteria): SearchResult[] {
  const results: SearchResult[] = [];

  function traverse(nodeList: TreeNode[]) {
    for (const node of nodeList) {
      // Check date filter
      if (criteria.dateFrom || criteria.dateTo) {
        const nodeDate = new Date(node.updatedAt);
        if (criteria.dateFrom && nodeDate < new Date(criteria.dateFrom)) {
          // skip date check for this node, still check children
        } else if (criteria.dateTo && nodeDate > new Date(criteria.dateTo + 'T23:59:59')) {
          // skip date check for this node
        }
      }

      // Search in fields
      for (const field of node.fields) {
        if (criteria.fieldType !== 'all' && field.type !== criteria.fieldType) continue;

        if (criteria.keyword) {
          const searchIn = field.type === 'text' ? field.value : field.label;
          if (searchIn.toLowerCase().includes(criteria.keyword.toLowerCase())) {
            results.push({
              nodeId: node.id,
              nodeTitle: node.title,
              field,
              matchText: field.type === 'text'
                ? field.value.substring(0, 100) + (field.value.length > 100 ? '...' : '')
                : field.label,
            });
          }
        } else if (criteria.fieldType !== 'all') {
          results.push({
            nodeId: node.id,
            nodeTitle: node.title,
            field,
            matchText: field.label,
          });
        }
      }

      // Also search in node title
      if (criteria.keyword && node.title.toLowerCase().includes(criteria.keyword.toLowerCase())) {
        if (node.fields.length === 0 || !results.some(r => r.nodeId === node.id)) {
          results.push({
            nodeId: node.id,
            nodeTitle: node.title,
            field: { id: '', type: 'text', label: 'عنوان شاخه', value: node.title },
            matchText: node.title,
          });
        }
      }

      // Recurse children
      if (node.children.length > 0) {
        traverse(node.children);
      }
    }
  }

  traverse(nodes);
  return results;
}

const SearchPanel: React.FC<SearchPanelProps> = ({ nodes, onSelectNode, onClose }) => {
  const [criteria, setCriteria] = useState<SearchCriteria>({
    keyword: '',
    fieldType: 'all',
    dateFrom: '',
    dateTo: '',
  });
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = () => {
    const found = searchTree(nodes, criteria);
    setResults(found);
    setHasSearched(true);
  };

  const handleClear = () => {
    setCriteria({ keyword: '', fieldType: 'all', dateFrom: '', dateTo: '' });
    setResults([]);
    setHasSearched(false);
  };

  return (
    <div className="h-full flex flex-col bg-white" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-l from-indigo-50 to-white">
        <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
          <i className="fas fa-search text-indigo-500"></i>
          جستجوی پیشرفته
        </h2>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
        >
          <i className="fas fa-times text-sm"></i>
        </button>
      </div>

      {/* Search Form */}
      <div className="p-4 space-y-3 border-b border-gray-100">
        {/* Keyword */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block">کلمه کلیدی</label>
          <input
            type="text"
            value={criteria.keyword}
            onChange={(e) => setCriteria({ ...criteria, keyword: e.target.value })}
            placeholder="عبارت مورد جستجو..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none"
            dir="rtl"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>

        {/* Field Type */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block">نوع فیلد</label>
          <div className="flex gap-1">
            {[
              { value: 'all', label: 'همه' },
              { value: 'text', label: '📝 متن' },
              { value: 'image', label: '🖼️ تصویر' },
              { value: 'pdf', label: '📄 PDF' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setCriteria({ ...criteria, fieldType: opt.value as SearchCriteria['fieldType'] })}
                className={`flex-1 px-2 py-1.5 text-xs rounded-lg border transition-colors
                  ${criteria.fieldType === opt.value
                    ? 'bg-indigo-500 text-white border-indigo-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">از تاریخ</label>
            <input
              type="date"
              value={criteria.dateFrom}
              onChange={(e) => setCriteria({ ...criteria, dateFrom: e.target.value })}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-300 outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">تا تاریخ</label>
            <input
              type="date"
              value={criteria.dateTo}
              onChange={(e) => setCriteria({ ...criteria, dateTo: e.target.value })}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-300 outline-none"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleSearch}
            className="flex-1 px-4 py-2 bg-indigo-500 text-white text-sm rounded-lg hover:bg-indigo-600 transition-colors shadow-sm"
          >
            <i className="fas fa-search ml-1"></i> جستجو
          </button>
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors"
          >
            <i className="fas fa-eraser ml-1"></i> پاک‌سازی
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-4">
        {hasSearched && (
          <p className="text-xs text-gray-500 mb-3">
            {results.length} نتیجه یافت شد
          </p>
        )}
        {results.length === 0 && hasSearched ? (
          <div className="text-center py-8 text-gray-400">
            <i className="fas fa-search-minus text-3xl mb-2"></i>
            <p className="text-sm">نتیجه‌ای یافت نشد</p>
          </div>
        ) : (
          <div className="space-y-2">
            {results.map((result, idx) => (
              <div
                key={`${result.nodeId}-${result.field.id}-${idx}`}
                onClick={() => { onSelectNode(result.nodeId); onClose(); }}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <i className="fas fa-folder text-amber-500 text-xs"></i>
                  <span className="text-sm font-medium text-gray-700">{sanitizeHtml(result.nodeTitle)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px]
                    ${result.field.type === 'text' ? 'bg-blue-100 text-blue-600' : ''}
                    ${result.field.type === 'image' ? 'bg-green-100 text-green-600' : ''}
                    ${result.field.type === 'pdf' ? 'bg-red-100 text-red-600' : ''}
                  `}>
                    {result.field.type === 'text' && 'متن'}
                    {result.field.type === 'image' && 'تصویر'}
                    {result.field.type === 'pdf' && 'PDF'}
                  </span>
                  <span className="text-xs text-gray-500">{sanitizeHtml(result.matchText)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPanel;
