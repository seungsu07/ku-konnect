import { type EntityID, type Preferences, type TimeTable } from './models.ts';

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

export type Path =
  | '/api/auth/verify/mail'
  // | '/api/auth/verify/tel'
  | '/api/auth/signup'
  | '/api/auth/login'
  | '/api/data/timetable'
  // | '/api/generate/timetable';

export type Method =
  | 'GET'
  | 'POST'
  | 'PATCH'
  | 'PUT'
  | 'DELETE';

export type Kind =
  | 'REQ'
  | 'RES';

export type MethodOf<T extends Path> = {
  [K in keyof PATH_ROUTE[T]]: PATH_ROUTE[T][K] extends undefined?
    never: K;
}[keyof PATH_ROUTE[T]];

export type KindOf<T extends Path, U extends MethodOf<T>> =
  keyof PATH_ROUTE[T][U];

type PATH_ROUTE_SCHEME = {
  [K in Path]: {
    [L in Method]?: {
      [M in Kind]: any;
    }
  };
};

export interface PATH_ROUTE extends PATH_ROUTE_SCHEME {
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

export type Scheme<
  T extends Path,
  U extends MethodOf<T> | undefined = undefined,
  V extends Kind | undefined = undefined
> =
  U extends MethodOf<T>?
    (V extends KindOf<T, U>?
      PATH_ROUTE[T][U][V]:
      PATH_ROUTE[T][U]):
    PATH_ROUTE[T];

export type RouteFunction<
  T extends Path,
  U extends MethodOf<T>,
  V = any[],
  W = {}
> = (data: Scheme<T, U, 'REQ'>, ...args: V extends any[]? V: [V]) => Scheme<T, U, 'RES'> & W;

export type TypeGuardObject<T, E = never> =
  // T extends string | number | boolean | bigint | symbol | null | undefined? TypeGuarder<T, E>:
  { [K in keyof T]: TypeGuarder<T[K], E> };

export type TypeGuarder<T, E = never> = (arg: any) => T | E;

export function makeStringGuarder<E>(e: E): TypeGuarder<string, E> {
  return (t) => typeof t == 'string'? t: e;
}

export function makeNumberGuarder<E>(e: E): TypeGuarder<number, E> {
  return (t) => typeof t == 'number'? t: e;
}

export function makeBooleanGuarder<E>(e: E): TypeGuarder<boolean, E> {
  return (t) => typeof t == 'boolean'? t: e;
}

export function makeBigintGuarder<E>(e: E): TypeGuarder<bigint, E> {
  return (t) => typeof t == 'bigint'? t: e;
}

export function makeSymbolGuarder<E>(e: E): TypeGuarder<symbol, E> {
  return (t) => typeof t == 'symbol'? t: e;
}

export function makeNullGuarder<E>(e: E): TypeGuarder<null, E> {
  return (t) => t === null? t: e;
}

export function makeUndefinedGuarder<E>(e: E): TypeGuarder<undefined, E> {
  return (t) => typeof t == 'undefined'? t: e;
}

export function makeArrayGuarder<E>(e: E): TypeGuarder<any[], E> {
  return (t) => Array.isArray(t)? t: e;
}

export function makeObjectGuarder<E = any>(e: E): TypeGuarder<object, E> {
  return (t) => typeof t == 'object'? t === null? e: t: e;
}