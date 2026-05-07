type UUID = `${string}-${string}-${string}-${string}-${string}`;

export type Method =
  | 'GET'
  | 'POST'
  | 'PATCH'
  | 'PUT'
  | 'DELETE';

export type ErrorString =
  | 'campus_doesnt_exist'
  | 'department_doesnt_exist'
  | 'college_doesnt_exist'
  | 'unexpected';

export type Route = {
  [M in Method]?: {
    Request: any;
    Response:
    | { success: true }
    | { success: false; e: ErrorString };
  };
}

export namespace DTO {
  /** /api/auth */
  export namespace Auth {
    /** /api/auth/verify */
    export namespace Verify {
      /** /api/auth/verify/mail */
      export interface Mail extends Route {
        /** @method GET */
        GET: {
          Request: {
            address: string;
          };
                    
          Response:
          | {
              success: true;
              expires_at: string;
            }
          | {
              success: false;
              e: ErrorString;
            };
        };
        
        /** @method POST */
        POST: {
          Request: {
            address: string;
            code: string;
          };
          
          Response:
          | {
              success: true;
              token: UUID;
            }
          | {
              success: false;
              e: ErrorString;
            };
        };
      }
      
      /** /api/auth/verify/tel */
      export interface Tel {}
    }
    
    /** /api/auth/signup */
    export interface Signup extends Route {
      /** @method POST */
      POST: {
        Request: {
          campus: string;
          college: string;
          department: string;
          student_id: string;
          name: string;
          login: {
            id: string;
            password: string;
          };
          univ_mail: {
            address: string;
            token: string;
          };
        };
        
        Response:
        | {
            success: true;
          }
        | {
            success: false;
            e: ErrorString;
          };
      };
    }
    
    /** /api/auth/login */
    export interface Login extends Route {
      /** @method POST */
      POST: {
        Request: {
          id: string;
          password: string;
        };
        
        Response:
        | {
            success: true;
          }
        | {
            success: false;
            e: ErrorString;
          };
      };
    }
  }
  
  /** /api/data */
  export namespace Data {
    /** /api/data/timetable */
    export interface Timetable extends Route {
      /** @method GET */
      GET: {
        Request: {
          
        };
        
        Response:
        | {
            success: true;
          }
        | {
            success: false;
            e: ErrorString;
          }
      };
    }
  }
}

export default DTO;