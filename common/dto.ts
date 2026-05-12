import {
  type Board,
  type Building,
  type Campus,
  type ClassRoom,
  type College,
  type Comment,
  type Course,
  type Department,
  type GraduationProgress,
  type Lecture,
  type LectureClass,
  type Post,
  type Professor,
  type UserProfile,
  type Session,
  type EntityID,
  type TimeTable,
  type User,
  type CourseType,
  type RGB
} from './models.ts';

export type ErrorString =
  | 'bad_request'
  | 'campus_doesnt_exist'
  | 'department_doesnt_exist'
  | 'college_doesnt_exist'
  | 'mail_not_verified'
  | 'try_get_verifying_code'
  | 'code_doesnt_match'
  | 'user_doesnt_exist'
  | 'timetable_doesnt_exist'
  | 'unauthorized'
  | 'no_permission'
  | 'unexpected';

export type Path =
  | '/api/auth/verify/mail'
  | '/api/auth/verify/tel'
  | '/api/auth/signup'
  | '/api/auth/login'
  | '/api/data/user'
  | '/api/data/userprofile'
  | '/api/data/professor'
  | '/api/data/campus'
  | '/api/data/college'
  | '/api/data/department'
  | '/api/data/course'
  | '/api/data/lecture'
  | '/api/data/lectureclass'
  | '/api/data/building'
  | '/api/data/classroom'
  | '/api/data/comment'
  | '/api/data/post'
  | '/api/data/board'
  | '/api/data/timetable'
  | '/api/data/graduationprogress'
  | '/api/data/session';

export type Method =
  | 'GET'
  | 'POST'
  | 'PATCH'
  | 'PUT'
  | 'DELETE';

export type Kind = keyof Pair;

export interface Pair {
  REQ: Record<string, any>;
  RES:
    | { success: true; }
    | { success: false; e: ErrorString; };
};

export type MethodOf<T extends Path> = {
  [K in keyof PATH_ROUTE[T]]: PATH_ROUTE[T][K] extends undefined?
    never: K;
}[keyof PATH_ROUTE[T]];

export type KindOf<T extends Path, U extends MethodOf<T>> =
  keyof PATH_ROUTE[T][U];

type PATH_ROUTE_SCHEME = {
  [K in Path]: {
    [L in Method]?: Pair;
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
    GET: {
      REQ: {
        tel: string;
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
        tel: string;
        code: string;
        user: EntityID<'user'>;
      };
      
      RES: {
        success: true;
      } | {
        success: false;
        e: ErrorString;
      };
    };
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
  
  '/api/data/user': {
    GET: {
      REQ: Partial<Pick<User, 'id'>>;
      
      RES: {
        success: true;
        data: Pick<User,
          | 'id'
          | 'login_id'
          | 'name'
          | 'student_id'
          | 'campus'
          | 'college'
          | 'department'
          | 'univ_mail'
          | 'mail'
        >;
      } | {
        success: false;
        e: ErrorString;
      };
    };
    
    PATCH: {
      REQ: {
        id: EntityID<'user'>;
        data: Partial<Pick<User,
          | 'name'
          | 'student_id'
          | 'campus'
          | 'college'
          | 'department'
        >> & {
          mail?: {
            address: string;
            token: EntityID<'session'>;
          };
          univ_mail?: {
            address: string;
            token: EntityID<'session'>;
          };
          password?: string;
        };
      };
      
      RES: {
        success: true;
        modified: { [K in keyof User]?: boolean };
      } | {
        success: false;
        e: ErrorString;
      };
    };
    
    DELETE: {
      REQ: {
        id: string;
        password: string;
      };
      
      RES: {
        success: true;
        deleted_at: number;
      } | {
        success: false;
        e: ErrorString;
      };
    };
  };
  
  '/api/data/userprofile': {
    GET: {
      REQ: Partial<Pick<UserProfile, 'id' | 'user' | 'nickname'>>;
      
      RES: {
        success: true;
        data: UserProfile;
      } | {
        success: false;
        e: ErrorString;
      };
    };
    
    POST: {
      REQ: Pick<UserProfile, 'nickname' | 'image'>;
      
      RES: {
        success: true;
        data: UserProfile;
      } | {
        success: false;
        e: ErrorString;
      };
    };
    
    PATCH: {
      REQ: {
        id: EntityID<'user_profile'>;
        data: Partial<Pick<UserProfile, 'nickname' | 'image'>>;
      };
      
      RES: {
        success: true;
        modified: { [K in keyof UserProfile]?: boolean };
      } | {
        success: false;
        e: ErrorString;
      };
    };
    
    DELETE: {
      REQ: EntityID<'user_profile'>;
      
      RES: {
        success: true;
      } | {
        success: false;
        e: ErrorString;
      };
    };
  };
  
  '/api/data/professor': {
    GET: {
      REQ: Partial<Pick<Professor, 'id' | 'name' | 'tel' | 'mail'>>;
      
      RES: {
        success: true;
        data: Pick<Professor, 'name' | 'tel' | 'mail'>;
      } | {
        success: false;
        e: ErrorString;
      };
    };
  };
  
  '/api/data/campus': {
    GET: {
      REQ: Partial<Pick<Campus, 'id' | 'name'>>;
      
      RES: {
        success: true;
        data: Campus[];
      } | {
        success: false;
        e: ErrorString;
      };
    };
  };
  
  '/api/data/college': {
    GET: {
      REQ: Partial<Pick<College, 'id' | 'virtual' | 'code_num' | 'name' | 'campus'>>;
      
      RES: {
        success: true;
        data: College[];
      } | {
        success: false;
        e: ErrorString;
      };
    };
  };
  
  '/api/data/department': {
    GET: {
      REQ: Partial<Pick<Department, 'id' | 'code' | 'name' | 'college'>>;
      
      RES: {
        success: true;
        data: Department;
      } | {
        success: false;
        e: ErrorString;
      };
    };
  };
  
  '/api/data/course': {
    GET: {
      REQ: Partial<Pick<Course, 'id' | 'code' | 'name' | 'course_type' | 'department'>>;
      
      RES: {
        success: true;
        data: Course;
      } | {
        success: false;
        e: ErrorString;
      };
    };
  };
  
  '/api/data/lecture': {
    GET: {
      REQ: Partial<Pick<Lecture,
        | 'id'
        | 'course'
        | 'ay'
        | 'sem'
        | 'professor'
        | 'hours'
        | 'lab_hours'
        | 'credit'
      >>;
      
      RES: {
        success: true;
        data: Lecture;
      } | {
        success: false;
        e: ErrorString;
      };
    };
  };
  
  '/api/data/lectureclass': {
    GET: {
      REQ: Partial<Pick<LectureClass, 'id' | 'code' | 'lecture'>>;
      
      RES: {
        success: true;
        data: LectureClass
      } | {
        success: false;
        e: ErrorString;
      };
    };
  };
  
  '/api/data/building': {
    GET: {
      REQ: Partial<Pick<Building, 'id' | 'name' | 'location'>>;
      
      RES: {
        success: true;
        data: Building;
      } | {
        success: false;
        e: ErrorString;
      };
    };
  };
  
  '/api/data/classroom': {
    GET: {
      REQ: Partial<Pick<ClassRoom, 'id' | 'building' | 'room'>>;
      
      RES: {
        success: true;
        data: ClassRoom;
      } | {
        success: false;
        e: ErrorString;
      };
    };
  };
  
  '/api/data/comment': {
    GET: {
      REQ: Partial<Pick<Comment, 'id' | 'post'>>
        & { page?: number; };
      
      RES: {
        success: true;
        data: Pick<Comment,
          | 'id'
          | 'post'
          | 'content'
          | 'created_at'
          | 'updated_at'
          | 'visible'
        > & Partial<Pick<Comment, 'author'>>;
      } | {
        success: false;
        e: ErrorString;
      };
    };
    
    POST: {
      REQ: Pick<Comment,
        | 'post'
        | 'content'
        | 'visible'
      >;
      
      RES: {
        success: true;
        data: Comment;
      } | {
        success: false;
        e: ErrorString;
      };
    };
    
    PATCH: {
      REQ: {
        id: EntityID<'comment'>;
        data: Partial<Pick<Comment, 'content' | 'visible'>>;
      };
      
      RES: {
        success: true;
        modified: { [K in keyof Comment]?: boolean };
      } | {
        success: false;
        e: ErrorString;
      };
    };
    
    DELETE: {
      REQ: EntityID<'comment'>;
      
      RES: {
        success: true;
      } | {
        success: false;
        e: ErrorString;
      };
    };
  };
  
  '/api/data/post': {
    GET: {
      REQ: Partial<Pick<Post,
        | 'id'
        | 'board'
        | 'title'
        | 'content'
      >> & { page?: number; };
      
      RES: {
        success: true;
        data: Pick<Post,
          | 'id'
          | 'board'
          | 'title'
          | 'content'
          | 'view_count'
          | 'comment_count'
          | 'created_at'
          | 'updated_at'
          | 'visible'
        > & Partial<Pick<Post, 'author'>>;
      } | {
        success: false;
        e: ErrorString;
      };
    };
    
    POST: {
      REQ: Pick<Post,
        | 'board'
        | 'title'
        | 'content'
        | 'visible'
      >;
      
      RES: {
        success: true;
        data: Post;
      } | {
        success: false;
        e: ErrorString;
      };
    };
    
    PATCH: {
      REQ: {
        id: EntityID<'post'>;
        data: Partial<Pick<Post,
          | 'title'
          | 'content'
          | 'visible'
        >>;
      };
      
      RES: {
        success: true;
        modified: { [K in keyof Post]?: boolean };
      } | {
        success: false;
        e: ErrorString;
      };
    };
    
    DELETE: {
      REQ: EntityID<'post'>;
      
      RES: {
        success: true;
      } | {
        success: false;
        e: ErrorString;
      };
    };
  };
  
  '/api/data/board': {
    GET: {
      REQ: Partial<Pick<Board, 'id' | 'name'>>;
      
      RES: {
        success: true;
        data: Board;
      } | {
        success: false;
        e: ErrorString;
      };
    };
  };
  
  '/api/data/timetable': {
    GET: {
      REQ: Partial<Pick<TimeTable, 'id' | 'user'>>;
      
      RES: {
        success: true;
        data: TimeTable
      } | {
        success: false;
        e: ErrorString;
      };
    };
    
    POST: {
      REQ: Pick<TimeTable,
        | 'name'
        | 'selected'
        | 'days'
      >;
      
      RES: {
        success: true;
        data: TimeTable;
      } | {
        success: false;
        e: ErrorString;
      };
    };
    
    PATCH: {
      REQ: {
        id: EntityID<'time_table'>;
        data: Partial<Pick<TimeTable, 'name' | 'selected' | 'days'>>;
      };
      
      RES: {
        success: true;
        modified: { [K in keyof TimeTable]?: boolean };
      } | {
        success: false;
        e: ErrorString;
      };
    };
    
    DELETE: {
      REQ: EntityID<'time_table'>;
      
      RES: {
        success: true;
      } | {
        success: false;
        e: ErrorString;
      };
    };
  };
  
  '/api/data/graduationprogress': {
    GET: {
      REQ: Partial<Pick<GraduationProgress, 'id' | 'user'>>;
      
      RES: {
        success: true;
        data: GraduationProgress;
      } | {
        success: false;
        e: ErrorString;
      };
    };
    
    PATCH: {
      REQ: {
        id: EntityID<'graduation_progress'>;
        data: Partial<Pick<GraduationProgress, 'color'>>
          & { details?: { [K in CourseType]?: { color?: RGB; } } };
      };
      
      RES: {
        success: true;
        modified: { [K in keyof GraduationProgress]?: boolean };
      } | {
        success: false;
        e: ErrorString;
      };
    };
  };
  
  '/api/data/session': {
    GET: {
      REQ: Partial<Pick<Session, 'id'>>;
      
      RES: {
        success: true;
        data: Session;
      } | {
        success: false;
        e: ErrorString;
      };
    };
    
    PATCH: {
      REQ: {
        id: EntityID<'session'>;
        data: Partial<Pick<Session, 'expired' | 'expires_at'>>;
      }
      
      RES: {
        success: true;
        modified: { [K in keyof Session]?: boolean };
      } | {
        success: false;
        e: ErrorString;
      };
    };
    
    DELETE: {
      REQ: EntityID<'session'>;
      
      RES: {
        success: true;
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
  V = undefined,
  W = {}
> =
  V extends undefined? (data: Scheme<T, U, 'REQ'>) => Scheme<T, U, 'RES'> & W:
  V extends any[]? (data: Scheme<T, U, 'REQ'>, ...args: V) => Scheme<T, U, 'RES'> & W:
  (data: Scheme<T, U, 'REQ'>, arg: V) => Scheme<T, U, 'RES'> & W;

export type TypeGuardObject<T, E = never> =
  // T extends string | number | boolean | bigint | symbol | null | undefined? TypeGuarder<T, E>:
  { [K in keyof T]: TypeGuarder<T[K], E> };

export type TypeGuarder<T, E = never> = (arg: any) => T | E;

export type PickIndices<T extends any[], U extends number[]> =
  U extends []? []:
  U extends [infer V extends keyof T, ...infer W extends number[]]? [T[V], ...PickIndices<T, W>]:
  never;

export function stringGuarder<E>(e: E): TypeGuarder<string, E> {
  return (t) => typeof t == 'string'? t: e;
}

export function numberGuarder<E>(e: E): TypeGuarder<number, E> {
  return (t) => typeof t == 'number'? t: e;
}

export function booleanGuarder<E>(e: E): TypeGuarder<boolean, E> {
  return (t) => typeof t == 'boolean'? t: e;
}

export function bigintGuarder<E>(e: E): TypeGuarder<bigint, E> {
  return (t) => typeof t == 'bigint'? t: e;
}

export function symbolGuarder<E>(e: E): TypeGuarder<symbol, E> {
  return (t) => typeof t == 'symbol'? t: e;
}

export function nullGuarder<E>(e: E): TypeGuarder<null, E> {
  return (t) => t === null? t: e;
}

export function undefinedGuarder<E>(e: E): TypeGuarder<undefined, E> {
  return (t) => typeof t == 'undefined'? t: e;
}

export function arrayGuarder<E>(e: E): TypeGuarder<any[], E> {
  return (t) => Array.isArray(t)? t: e;
}

export function objectGuarder<E = any>(e: E): TypeGuarder<object, E> {
  return (t) => typeof t == 'object'? t === null? e: t: e;
}

type A<U> = U extends TypeGuarder<infer V, any>? V: never;