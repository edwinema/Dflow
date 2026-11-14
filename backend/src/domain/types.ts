export type RecordData = Record<string, any>;
export type State = Record<string, any>;
export interface Actor {
  id: string;
  userId: string;
  userName: string;
  nickName: string;
  roles: string[];
  deptName?: string;
  empNo?: string;
  companyName?: string;
  menuPermissions?: string[];
}
export interface DomainRequest {
  body: RecordData;
  query: RecordData;
  params: Record<string, string>;
}
export interface DomainResponse {
  status(code: number): DomainResponse;
  json(value: any): any;
  send(value: any): any;
  setHeader(name: string, value: string): void;
}
export type Handler = (req: DomainRequest, res: DomainResponse) => any;
export interface Registry {
  get(path: string, handler: Handler): void;
  post(path: string, handler: Handler): void;
  put(path: string, handler: Handler): void;
  delete(path: string, handler: Handler): void;
}
