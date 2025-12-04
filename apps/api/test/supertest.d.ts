declare module 'supertest' {
  import { Application } from 'express';
  
  export interface Response {
    status: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body: any;
    text: string;
    headers: Record<string, string>;
  }
  
  export interface Test {
    expect(status: number): this;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(body: any): this;
    expect(field: string, val: string): this;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    send(body?: any): this;
    set(field: string, val?: string): this;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    end(callback?: (err: any, res: Response) => void): this;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    then(onFulfilled?: (res: Response) => any, onRejected?: (err: any) => any): Promise<Response>;
  }
  
  export interface SuperTest {
    get(url: string): Test;
    post(url: string): Test;
    put(url: string): Test;
    patch(url: string): Test;
    delete(url: string): Test;
    head(url: string): Test;
    options(url: string): Test;
    [method: string]: (url: string) => Test;
  }
  
  function request(app: Application): SuperTest;
  
  export = request;
}
