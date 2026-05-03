import { IAdmin } from './IAdmin';

export interface IAdminResponse {
  data: IAdmin[];
  pageSize: number;
  pageIndex: number;
  totalSize: number;
}
