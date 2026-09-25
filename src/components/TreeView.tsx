import React, { useState } from 'react';
import { TreeNode } from '../types';
import { sanitizeHtml } from '../utils/sanitize';

interface TreeViewProps {
  nodes: TreeNode[];
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
  onAddChild: (parentId: string) => void;
  onDeleteNode: (id: string) => void;
  onAddRoot: () => void;
  level?: number;
}

const TreeNodeItem: React.FC<{
  node: TreeNode;
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
  onAddChild: (parentId: string) => void;
  onDeleteNode: (id: string) => void;
  level: number;
}> = ({ node, selectedNodeId, onSelectNode, onAddChild, onDeleteNode, level }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const isSelected = selectedNodeId === node.id;

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-1 py-1.5 px-2 rounded-lg cursor-pointer transition-all duration-200 group
          ${isSelected ? 'bg-blue-100 border-r-3 border-blue-500' : 'hover:bg-gray-50'}
        `}
        style={{ paddingRight: '8px' }}
      >
        {/* Expand/Collapse */}
        <button
          onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
          className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors"
        >
          {hasChildren ? (
            <i className={`fas fa-chevron-${isExpanded ? 'down' : 'left'} text-xs`}></i>
          ) : (
            <i className="fas fa-circle text-[4px] text-gray-300"></i>
          )}
        </button>

        {/* Node Icon */}
        <i className={`fas ${hasChildren ? 'fa-folder text-amber-500' : 'fa-file-alt text-blue-400'} text-sm`}></i>

        {/* Node Title */}
        <span
          className={`flex-1 text-sm truncate ${isSelected ? 'font-semibold text-blue-800' : 'text-gray-700'}`}
          onClick={() => onSelectNode(node.id)}
          title={node.title}
        >
          {sanitizeHtml(node.title)}
        </span>

        {/* Actions */}
        <div className="hidden group-hover:flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onAddChild(node.id); }}
            className="w-6 h-6 flex items-center justify-center rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
            title="افزودن زیرشاخه"
          >
            <i className="fas fa-plus text-[10px]"></i>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDeleteNode(node.id); }}
            className="w-6 h-6 flex items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
            title="حذف"
          >
            <i className="fas fa-trash text-[10px]"></i>
          </button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="mr-4 border-r border-gray-200 pr-1">
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              selectedNodeId={selectedNodeId}
              onSelectNode={onSelectNode}
              onAddChild={onAddChild}
              onDeleteNode={onDeleteNode}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const TreeView: React.FC<TreeViewProps> = ({
  nodes,
  selectedNodeId,
  onSelectNode,
  onAddChild,
  onDeleteNode,
  onAddRoot,
}) => {
  return (
    <div className="h-full flex flex-col" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gradient-to-l from-blue-50 to-white">
        <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
          <i className="fas fa-sitemap text-blue-500"></i>
          ساختار درختی
        </h2>
        <button
          onClick={onAddRoot}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
        >
          <i className="fas fa-plus text-[10px]"></i>
          شاخه جدید
        </button>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto p-2">
        {nodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <i className="fas fa-folder-open text-4xl mb-3"></i>
            <p className="text-sm">هیچ شاخه‌ای وجود ندارد</p>
            <p className="text-xs mt-1">برای شروع یک شاخه جدید بسازید</p>
          </div>
        ) : (
          nodes.map((node) => (
            <TreeNodeItem
              key={node.id}
              node={node}
              selectedNodeId={selectedNodeId}
              onSelectNode={onSelectNode}
              onAddChild={onAddChild}
              onDeleteNode={onDeleteNode}
              level={0}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default TreeView;
