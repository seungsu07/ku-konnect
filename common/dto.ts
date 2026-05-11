import { EntityID, Preferences, TimeTable } from './models';

export type Method =
  | 'GET'
  | 'POST'
  | 'PATCH'
  | 'PUT'
  | 'DELETE';

export type Kind =
  | 'REQ'
  | 'RES';

export type ErrorString =
  | 'bad_request'
  | 'campus_doesnt_exist'
  | 'department_doesnt_exist'
  | 'college_doesnt_exist'
  | 'mail_not_verified'
  | 'try_get_verifying_code'
  | 'code_doesnt_match'
  | 'user_doesnt_exist'
  | 'unexpected';

export type Route =
  | { success: true; }
  | { success: false; e: ErrorString; };

export interface PATH_ROUTE {
  '/api/auth/verify/mail': {
    GET: {
      REQ: {
        address: string;
      };
      
      RES: {
        success: true;
        expires_at: number;
      } | {
        success: false;
        e: ErrorString;
      };
    };
    
    POST: {
      REQ: {
        address: string;
        code: string;
      };
      
      RES: {
        success: true;
        token: EntityID<'session'>;
        expires_at: number;
      } | {
        success: false;
        e: ErrorString;
      };
    };
  };
  
  '/api/auth/verify/tel': {
    
  };
  
  '/api/auth/signup': {
    POST: {
      REQ: {
        campus: EntityID<'campus'>;
        college: EntityID<'college'>;
        department: EntityID<'department'>;
        student_id: string;
        name: string;
        login_id: string;
        password: string;
        univ_mail: {
          address: string;
          token: EntityID<'session'>;
        };
      };
      
      RES: {
        success: true;
      } | {
        success: false;
        e: ErrorString;
      };
    };
  };
  
  '/api/auth/login': {
    POST: {
      REQ: {
        id: string;
        password: string;
      };
      
      RES: {
        success: true;
        expires_at: number;
      } | {
        success: false;
        e: ErrorString;
      };
    };
  };
  
  '/api/data/timetable': {
    GET: {
      REQ: {
        id: EntityID<'time_table'>
      };
      
      RES: {
        success: true;
        data: TimeTable
      } | {
        success: false;
        e: ErrorString;
      };
    };
  };
  
  '/api/generate/timetable': {
    POST: {
      REQ: {
        courses: EntityID<'course'>[];
        preferences: Preferences;
      };
      
      RES: {
        success: true;
        alternatives: EntityID<'time_table'>[];
      } | {
        success: false;
        e: ErrorString;
      };
    };
  };
}

export type Path = keyof PATH_ROUTE;

export type Scheme<
  T extends Path,
  U extends keyof PATH_ROUTE[T] | undefined = undefined,
  V extends Kind | undefined = undefined
> =
  U extends keyof PATH_ROUTE[T]?
    (V extends keyof PATH_ROUTE[T][U]?
      PATH_ROUTE[T][U][V]:
      PATH_ROUTE[T][U]):
    PATH_ROUTE[T];

export type RouteFunction<
  T extends Path,
  U extends keyof PATH_ROUTE[T],
  V = any[],
  W = {}
> = (data: Scheme<T, U, 'REQ'>, ...args: V extends any[]? V: [V]) => Scheme<T, U, 'RES'> & W;

export type TypeGuarder<T> =
  T extends string? StringConstructor:
  T extends number? NumberConstructor:
  T extends boolean? BooleanConstructor:
  T extends bigint? BigIntConstructor:
  { new (...args: any[]): T } | ((...args: any[]) => T);

export type TypeGuarderObject<T> =
  { [K in keyof T]: TypeGuarder<T[K]>; };