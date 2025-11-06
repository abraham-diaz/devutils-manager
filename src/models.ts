export interface SavedFunction {
  id: string;
  name: string;
  code: string;
  language: string;
  description?: string;
  tags: string[];
  createdAt: string;
  usageCount: number;
}