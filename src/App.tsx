import React, { useState, useEffect, useCallback } from 'react';
import { TreeNode } from './types';
import { saveToStorage, loadFromStorage } from './utils/crypto';
import { generateId } from './utils/sanitize';
import TreeView from './components/TreeView';
import NodeDetail from './components/NodeDetail';
import SearchPanel from './components/SearchPanel';

const STORAGE_KEY = 'tree_db_data';

function findNode(nodes: TreeNode[], id: string): TreeNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNode(node.children, id);
    if (found) return found;
  }
  return null;
}

function addChildToNode(nodes: TreeNode[], parentId: string, newChild: TreeNode): TreeNode[] {
  return nodes.map((node) => {
    if (node.id === parentId) {
      return { ...node, children: [...node.children, newChild] };
    }
    if (node.children.length > 0) {
      return { ...node, children: addChildToNode(node.children, parentId, newChild) };
    }
    return node;
  });
}

function removeNodeFromTree(nodes: TreeNode[], id: string): TreeNode[] {
  return nodes
    .filter((node) => node.id !== id)
    .map((node) => ({
      ...node,
      children: removeNodeFromTree(node.children, id),
    }));
}

function updateNodeInTree(nodes: TreeNode[], updatedNode: TreeNode): TreeNode[] {
  return nodes.map((node) => {
    if (node.id === updatedNode.id) return updatedNode;
    return { ...node, children: updateNodeInTree(node.children, updatedNode) };
  });
}

function App() {
  const [nodes, setNodes] = useState<TreeNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Load data from encrypted storage
  useEffect(() => {
    const savedData = loadFromStorage<TreeNode[]>(STORAGE_KEY);
    if (savedData) {
      setNodes(savedData);
    }
  }, []);

  // Save data to encrypted storage
  useEffect(() => {
    if (nodes.length > 0 || loadFromStorage(STORAGE_KEY)) {
      saveToStorage(STORAGE_KEY, nodes);
    }
  }, [nodes]);

  // Notification auto-dismiss
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
  }, []);

  const handleAddRoot = useCallback(() => {
    const newNode: TreeNode = {
      id: generateId(),
      title: 'شاخه جدید',
      children: [],
      fields: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
    showNotification('success', 'شاخه جدید ایجاد شد');
  }, [showNotification]);

  const handleAddChild = useCallback((parentId: string) => {
    const newNode: TreeNode = {
      id: generateId(),
      title: 'زیرشاخه جدید',
      children: [],
      fields: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNodes((prev) => addChildToNode(prev, parentId, newNode));
    setSelectedNodeId(newNode.id);
    showNotification('success', 'زیرشاخه جدید ایجاد شد');
  }, [showNotification]);

  const handleDeleteNode = useCallback((id: string) => {
    setShowConfirmDelete(id);
  }, []);

  const confirmDelete = useCallback(() => {
    if (showConfirmDelete) {
      setNodes((prev) => removeNodeFromTree(prev, showConfirmDelete));
      if (selectedNodeId === showConfirmDelete) {
        setSelectedNodeId(null);
      }
      setShowConfirmDelete(null);
      showNotification('info', 'شاخه حذف شد');
    }
  }, [showConfirmDelete, selectedNodeId, showNotification]);

  const handleUpdateNode = useCallback((updatedNode: TreeNode) => {
    setNodes((prev) => updateNodeInTree(prev, updatedNode));
  }, []);

  const handlePrint = useCallback(() => {
    const selectedNode = selectedNodeId ? findNode(nodes, selectedNodeId) : null;
    if (!selectedNode) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const fieldsHtml = selectedNode.fields.map((field) => {
      if (field.type === 'text') {
        return `<div class="field-item"><strong>${field.label}:</strong><p>${field.value}</p></div>`;
      } else if (field.type === 'image') {
        return `<div class="field-item"><strong>${field.label}:</strong><img src="${field.value}" style="max-width:400px;max-height:300px;" /></div>`;
      } else {
        return `<div class="field-item"><strong>${field.label}:</strong><p>[فایل PDF - ${field.label}]</p></div>`;
      }
    }).join('');

    const childrenHtml = selectedNode.children.length > 0
      ? `<div class="children"><h3>زیرشاخه‌ها:</h3><ul>${selectedNode.children.map(c => `<li>${c.title} (${c.fields.length} فیلد)</li>`).join('')}</ul></div>`
      : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="UTF-8">
        <title>چاپ - ${selectedNode.title}</title>
        <style>
          body { font-family: Tahoma, Arial, sans-serif; padding: 40px; direction: rtl; color: #333; }
          h1 { color: #1e40af; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
          .meta { color: #666; font-size: 12px; margin-bottom: 20px; }
          .field-item { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 10px; }
          .field-item strong { color: #1e40af; }
          .field-item p { margin: 5px 0; line-height: 1.8; }
          .field-item img { border-radius: 8px; margin-top: 8px; }
          .children { margin-top: 20px; background: #fffbeb; border: 1px solid #fbbf24; border-radius: 8px; padding: 15px; }
          .children h3 { color: #92400e; margin: 0 0 10px 0; }
          .children ul { margin: 0; padding-right: 20px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>${selectedNode.title}</h1>
        <div class="meta">
          تاریخ ایجاد: ${new Date(selectedNode.createdAt).toLocaleDateString('fa-IR')} |
          آخرین بروزرسانی: ${new Date(selectedNode.updatedAt).toLocaleDateString('fa-IR')} |
          تعداد فیلدها: ${selectedNode.fields.length}
        </div>
        ${fieldsHtml}
        ${childrenHtml}
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }, [nodes, selectedNodeId]);

  const selectedNode = selectedNodeId ? findNode(nodes, selectedNodeId) : null;

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100 overflow-hidden" dir="rtl">
      {/* Top Bar */}
      <header className="h-14 bg-gradient-to-l from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-between px-4 shadow-lg z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <i className="fas fa-database text-white text-sm"></i>
          </div>
          <h1 className="text-white font-bold text-sm md:text-base">بانک اطلاعاتی درختی</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1
              ${showSearch ? 'bg-white text-indigo-700' : 'bg-white/20 text-white hover:bg-white/30'}
            `}
          >
            <i className="fas fa-search"></i>
            <span className="hidden md:inline">جستجو</span>
          </button>
          <button
            onClick={handlePrint}
            disabled={!selectedNode}
            className="px-3 py-1.5 bg-white/20 text-white text-xs rounded-lg hover:bg-white/30 transition-colors flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <i className="fas fa-print"></i>
            <span className="hidden md:inline">چاپ</span>
          </button>
          <div className="w-px h-6 bg-white/30 mx-1"></div>
          <div className="text-white/70 text-xs hidden md:block">
            <i className="fas fa-shield-alt ml-1"></i>
            رمزنگاری فعال
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Tree View */}
        <div
          className="bg-white border-l border-gray-200 shadow-sm flex flex-col"
          style={{ width: `${sidebarWidth}px`, minWidth: '250px', maxWidth: '450px' }}
        >
          <TreeView
            nodes={nodes}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
            onAddChild={handleAddChild}
            onDeleteNode={handleDeleteNode}
            onAddRoot={handleAddRoot}
          />
        </div>

        {/* Resize Handle */}
        <div
          className="w-1 bg-gray-200 hover:bg-blue-400 cursor-col-resize transition-colors"
          onMouseDown={(e) => {
            const startX = e.clientX;
            const startWidth = sidebarWidth;
            const handleMouseMove = (ev: MouseEvent) => {
              const diff = startX - ev.clientX;
              setSidebarWidth(Math.max(250, Math.min(450, startWidth + diff)));
            };
            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
        ></div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Node Detail */}
          <div className={`flex-1 bg-white overflow-hidden ${showSearch ? 'hidden md:block' : ''}`}>
            <NodeDetail
              node={selectedNode}
              onUpdateNode={handleUpdateNode}
              onPrint={handlePrint}
            />
          </div>

          {/* Search Panel */}
          {showSearch && (
            <div className="w-full md:w-96 border-r border-gray-200 shadow-lg">
              <SearchPanel
                nodes={nodes}
                onSelectNode={(id) => { setSelectedNodeId(id); }}
                onClose={() => setShowSearch(false)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`fixed bottom-4 left-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-slide-up
          ${notification.type === 'success' ? 'bg-green-500 text-white' : ''}
          ${notification.type === 'error' ? 'bg-red-500 text-white' : ''}
          ${notification.type === 'info' ? 'bg-blue-500 text-white' : ''}
        `}>
          <i className={`fas ${notification.type === 'success' ? 'fa-check-circle' : ''} ${notification.type === 'error' ? 'fa-times-circle' : ''} ${notification.type === 'info' ? 'fa-info-circle' : ''}`}></i>
          {notification.message}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 animate-scale-in">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">حذف شاخه</h3>
              <p className="text-sm text-gray-500 mb-6">
                آیا از حذف این شاخه و تمام زیرشاخه‌ها و اطلاعات آن مطمئن هستید؟
                <br />
                <span className="text-red-500 font-medium">این عمل قابل بازگشت نیست!</span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2.5 bg-red-500 text-white text-sm rounded-xl hover:bg-red-600 transition-colors font-medium"
                >
                  <i className="fas fa-trash ml-1"></i> حذف
                </button>
                <button
                  onClick={() => setShowConfirmDelete(null)}
                  className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 text-sm rounded-xl hover:bg-gray-300 transition-colors font-medium"
                >
                  انصراف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
