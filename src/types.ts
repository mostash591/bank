export interface DataField {
  id: string;
  type: 'text' | 'image' | 'pdf';
  label: string;
  value: string; // text content or base64 data URL
}

export interface TreeNode {
  id: string;
  title: string;
  children: TreeNode[];
  fields: DataField[];
  createdAt: string;
  updatedAt: string;
}

export interface SearchCriteria {
  keyword: string;
  fieldType: 'all' | 'text' | 'image' | 'pdf';
  dateFrom: string;
  dateTo: string;
}
