declare module 'better-sqlite3' {
  interface Statement {
    run(...params: unknown[]): { changes: number; lastInsertRowid: number | bigint };
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  }

  interface Database {
    prepare(sql: string): Statement;
    exec(sql: string): Database;
    transaction<T>(fn: (...args: unknown[]) => T): (...args: unknown[]) => T;
    pragma(pragma: string, options?: { simple?: boolean }): unknown;
    close(): Database;
  }

  interface DatabaseConstructor {
    new (filename: string, options?: { readonly?: boolean; fileMustExist?: boolean; timeout?: number; verbose?: (message?: unknown, ...args: unknown[]) => void }): Database;
    prototype: Database;
  }

  const Database: DatabaseConstructor;
  export = Database;
}
