export interface IPaginatedResponse<T> {
  pageSize: number;
  pageIndex: number;
  totalSize: number;
  data: T[];
}
