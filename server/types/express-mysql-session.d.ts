declare module 'express-mysql-session' {
  import { Store } from 'express-session';
  
  interface Options {
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
    createDatabaseTable?: boolean;
    schema?: {
      tableName?: string;
      columnNames?: {
        session_id?: string;
        expires?: string;
        data?: string;
      };
    };
  }

  function MySQLStoreFactory(session: any): {
    new (options: Options): Store;
  };

  export = MySQLStoreFactory;
}
