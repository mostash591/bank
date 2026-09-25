import React, { useState, useRef, useEffect } from 'react';
import { TreeNode, DataField } from '../types';
import { sanitizeHtml, validateFile, generateId } from '../utils/sanitize';

interface NodeDetailProps {
  node: TreeNode | null;
  onUpdateNode: (node: TreeNode) => void;
  onPrint: () => void;
}

const NodeDetail: React.FC<NodeDetailProps> = ({ node, onUpdateNode, onPrint }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [newFieldType, setNewFieldType] = useState<'text' | 'image' | 'pdf'>('text');
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editFieldValue, setEditFieldValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (node) {
      setEditTitle(node.title);
      setIsEditing(false);
      setEditingFieldId(null);
    }
  }, [node?.id]);

  if (!node) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400" dir="rtl">
        <i className="fas fa-hand-pointer text-5xl mb-4"></i>
        <p className="text-lg">یک شاخه را انتخاب کنید</p>
        <p className="text-sm mt-2">برای مشاهده و ویرایش اطلاعات</p>
      </div>
    );
  }

  const handleSaveTitle = () => {
    if (editTitle.trim()) {
      onUpdateNode({ ...node, title: editTitle.trim(), updatedAt: new Date().toISOString() });
      setIsEditing(false);
    }
  };

  const handleAddField = () => {
    if (!newFieldLabel.trim()) {
      setError('لطفاً برچسب فیلد را وارد کنید');
      return;
    }
    if (newFieldType === 'text' && !newFieldValue.trim()) {
      setError('لطفاً مقدار فیلد متنی را وارد کنید');
      return;
    }
    if ((newFieldType === 'image' || newFieldType === 'pdf') && !newFieldValue) {
      setError('لطفاً فایل را انتخاب کنید');
      return;
    }

    const newField: DataField = {
      id: generateId(),
      type: newFieldType,
      label: newFieldLabel.trim(),
      value: newFieldValue,
    };

    onUpdateNode({
      ...node,
      fields: [...node.fields, newField],
      updatedAt: new Date().toISOString(),
    });

    setNewFieldLabel('');
    setNewFieldValue('');
    setError('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = newFieldType === 'image'
      ? ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      : ['application/pdf'];

    const validation = validateFile(file, allowedTypes, 10);
    if (!validation.valid) {
      setError(validation.error || 'فایل نامعتبر');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setNewFieldValue(reader.result as string);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteField = (fieldId: string) => {
    onUpdateNode({
      ...node,
      fields: node.fields.filter(f => f.id !== fieldId),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleUpdateField = (fieldId: string) => {
    onUpdateNode({
      ...node,
      fields: node.fields.map(f =>
        f.id === fieldId ? { ...f, value: editFieldValue } : f
      ),
      updatedAt: new Date().toISOString(),
    });
    setEditingFieldId(null);
  };

  const renderField = (field: DataField) => {
    const isEditingThis = editingFieldId === field.id;

    return (
      <div key={field.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium
              ${field.type === 'text' ? 'bg-blue-100 text-blue-700' : ''}
              ${field.type === 'image' ? 'bg-green-100 text-green-700' : ''}
              ${field.type === 'pdf' ? 'bg-red-100 text-red-700' : ''}
            `}>
              {field.type === 'text' && '📝 متن'}
              {field.type === 'image' && '🖼️ تصویر'}
              {field.type === 'pdf' && '📄 PDF'}
            </span>
            <span className="text-sm font-medium text-gray-700">{sanitizeHtml(field.label)}</span>
          </div>
          <div className="flex items-center gap-1">
            {field.type === 'text' && (
              <button
                onClick={() => {
                  setEditingFieldId(field.id);
                  setEditFieldValue(field.value);
                }}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-amber-100 text-amber-600 hover:bg-amber-200 transition-colors"
                title="ویرایش"
              >
                <i className="fas fa-pen text-[10px]"></i>
              </button>
            )}
            <button
              onClick={() => handleDeleteField(field.id)}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
              title="حذف"
            >
              <i className="fas fa-trash text-[10px]"></i>
            </button>
          </div>
        </div>

        {/* Field Content */}
        {isEditingThis ? (
          <div className="space-y-2">
            <textarea
              value={editFieldValue}
              onChange={(e) => setEditFieldValue(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm resize-y min-h-[80px] focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none"
              dir="rtl"
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleUpdateField(field.id)}
                className="px-3 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600"
              >
                ذخیره
              </button>
              <button
                onClick={() => setEditingFieldId(null)}
                className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded-lg hover:bg-gray-400"
              >
                انصراف
              </button>
            </div>
          </div>
        ) : (
          <div>
            {field.type === 'text' && (
              <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed" dir="rtl">
                {sanitizeHtml(field.value)}
              </p>
            )}
            {field.type === 'image' && (
              <img
                src={field.value}
                alt={sanitizeHtml(field.label)}
                className="max-w-full max-h-64 rounded-lg border border-gray-200 object-contain"
              />
            )}
            {field.type === 'pdf' && (
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                <i className="fas fa-file-pdf text-red-500 text-2xl"></i>
                <div className="flex-1">
                  <p className="text-sm text-gray-700 font-medium">{sanitizeHtml(field.label)}</p>
                  <a
                    href={field.value}
                    download={sanitizeHtml(field.label) + '.pdf'}
                    className="text-xs text-blue-500 hover:underline"
                  >
                    دانلود فایل PDF
                  </a>
                </div>
                <a
                  href={field.value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600"
                >
                  مشاهده
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
        <div className="flex items-center justify-between">
          {isEditing ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none"
                dir="rtl"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
              />
              <button onClick={handleSaveTitle} className="px-3 py-2 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600">
                <i className="fas fa-check ml-1"></i> ذخیره
              </button>
              <button onClick={() => { setIsEditing(false); setEditTitle(node.title); }} className="px-3 py-2 bg-gray-200 text-gray-700 text-xs rounded-lg hover:bg-gray-300">
                انصراف
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <i className="fas fa-folder-open text-amber-500"></i>
                {sanitizeHtml(node.title)}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 bg-amber-100 text-amber-700 text-xs rounded-lg hover:bg-amber-200 transition-colors"
                >
                  <i className="fas fa-pen ml-1"></i> ویرایش عنوان
                </button>
                <button
                  onClick={onPrint}
                  className="px-3 py-1.5 bg-purple-100 text-purple-700 text-xs rounded-lg hover:bg-purple-200 transition-colors"
                >
                  <i className="fas fa-print ml-1"></i> چاپ
                </button>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
          <span><i className="fas fa-clock ml-1"></i> ایجاد: {new Date(node.createdAt).toLocaleDateString('fa-IR')}</span>
          <span><i className="fas fa-sync-alt ml-1"></i> بروزرسانی: {new Date(node.updatedAt).toLocaleDateString('fa-IR')}</span>
          <span><i className="fas fa-database ml-1"></i> {node.fields.length} فیلد | {node.children.length} زیرشاخه</span>
        </div>
      </div>

      {/* Add Field Form */}
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
          <i className="fas fa-plus-circle text-blue-500"></i>
          افزودن فیلد جدید
        </h3>
        {error && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs flex items-center gap-2">
            <i className="fas fa-exclamation-circle"></i>
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Field Type */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">نوع فیلد</label>
            <div className="flex gap-1">
              {(['text', 'image', 'pdf'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => { setNewFieldType(type); setNewFieldValue(''); setError(''); }}
                  className={`flex-1 px-2 py-2 text-xs rounded-lg border transition-colors
                    ${newFieldType === type
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                    }`}
                >
                  {type === 'text' && '📝 متن'}
                  {type === 'image' && '🖼️ تصویر'}
                  {type === 'pdf' && '📄 PDF'}
                </button>
              ))}
            </div>
          </div>

          {/* Label */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">برچسب</label>
            <input
              type="text"
              value={newFieldLabel}
              onChange={(e) => setNewFieldLabel(e.target.value)}
              placeholder="عنوان فیلد..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none"
              dir="rtl"
            />
          </div>

          {/* Value */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">مقدار</label>
            {newFieldType === 'text' ? (
              <input
                type="text"
                value={newFieldValue}
                onChange={(e) => setNewFieldValue(e.target.value)}
                placeholder="مقدار متن..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none"
                dir="rtl"
              />
            ) : (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={newFieldType === 'image' ? 'image/*' : '.pdf'}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
                >
                  {newFieldValue ? '✅ فایل انتخاب شد' : `📁 انتخاب ${newFieldType === 'image' ? 'تصویر' : 'PDF'}`}
                </button>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={handleAddField}
          className="mt-3 px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
        >
          <i className="fas fa-plus ml-1"></i> افزودن
        </button>
      </div>

      {/* Fields List */}
      <div className="p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-600 flex items-center gap-2">
          <i className="fas fa-list text-gray-400"></i>
          فیلدهای اطلاعاتی ({node.fields.length})
        </h3>
        {node.fields.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <i className="fas fa-inbox text-3xl mb-2"></i>
            <p className="text-sm">هنوز فیلدی اضافه نشده است</p>
          </div>
        ) : (
          node.fields.map(renderField)
        )}
      </div>
    </div>
  );
};

export default NodeDetail;
