export interface PaginationState {
  pageIndex: number;
  pageSize: number;
  totalCount: number;
}

export interface FilterState {
  sortOption: number;
  academicLevel?: number;
  departmentId?: number;
}

export type TabType = 'Students' | 'Professors' | 'Admins';