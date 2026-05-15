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
  type BoolRecord,
  type RemovedID,
  type StudyGroup,
  type SessionDataType
} from './models.ts';

export type ErrorString =
  | 'bad_request'
  | 'mail_not_verified'
  | 'send_mail_failed'
  | 'try_get_verifying_code'
  | 'code_doesnt_match'
  | 'campus_doesnt_exist'
  | 'department_doesnt_exist'
  | 'college_doesnt_exist'
  | 'user_doesnt_exist'
  | 'timetable_doesnt_exist'
  | 'profile_doesnt_exist'
  | 'professor_doesnt_exist'
  | 'course_doesnt_exist'
  | 'building_doesnt_exist'
  | 'post_doesnt_exist'
  | 'comment_doesnt_exist'
  | 'board_doesnt_exist'
  | 'classroom_doesnt_exist'
  | 'graduationprogress_doesnt_exist'
  | 'studygroup_doesnt_exist'
  | 'id_exists'
  | 'used_mail'
  | 'unauthorized'
  | 'no_permission'
  | 'already_processed'
  | 'unexpected';

export type Path =
  | '/api/auth/verify/mail'
  | '/api/auth/verify/tel'
  | '/api/auth/verify/studygroup'
  | '/api/auth/signup'
  | '/api/auth/login'
  | '/api/session'
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
  | '/api/data/studygroup';

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
  
  '/api/auth/verify/studygroup': {
    GET: {
      REQ: {
        group: EntityID<'study_group'>;
        profile: EntityID<'user_profile'>;
      };
      
      RES: {
        success: true;
      } | {
        success: false;
        e: ErrorString;
      };
    };
    
    POST: {
      REQ: {
        group: EntityID<'study_group'>,
        code: string;
        profile: EntityID<'user_profile'>;
      };
      
      RES: {
        success: true;
      } | {
        success: false;
        e: ErrorString;
      };
    };
  };
  
  '/api/session': {
    DELETE: {
      REQ: {};
      
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
      REQ: Pick<User,
        | 'id'
        | 'login_id'
      >;
      
      RES: {
        success: true;
        data: (Pick<User,
          | 'id'
          | 'login_id'
        > & Partial<Pick<User,
          | 'name'
          | 'student_id'
          | 'campus'
          | 'college'
          | 'department'
          | 'univ_mail'
          | 'mail'
        >>)[];
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
          password?: {
            before: string;
            after: string;
          };
        };
      };
      
      RES: {
        success: true;
        modified: BoolRecord<Partial<User>>;
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
      REQ: Partial<Pick<UserProfile,
        | 'id'
        | 'user'
        | 'nickname'
      >>;
      
      RES: {
        success: true;
        data: Pick<UserProfile,
          | 'id'
          | 'image'
          | 'nickname'
          | 'user'
        >[];
      } | {
        success: false;
        e: ErrorString;
      };
    };
    
    POST: {
      REQ: Pick<UserProfile,
        | 'nickname'
        | 'image'
      >;
      
      RES: {
        success: true;
        data: Pick<UserProfile,
          | 'id'
          | 'image'
          | 'nickname'
          | 'user'
        >;
      } | {
        success: false;
        e: ErrorString;
      };
    };
    
    PATCH: {
      REQ: {
        id: EntityID<'user_profile'>;
        data: Partial<Pick<UserProfile,
          | 'nickname'
          | 'image'
        >>;
      };
      
      RES: {
        success: true;
        modified: BoolRecord<Partial<UserProfile>>;
      } | {
        success: false;
        e: ErrorString;
      };
    };
    
    DELETE: {
      REQ: {
        id: EntityID<'user_profile'>;
      };
      
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
      REQ: Partial<Pick<Professor,
        | 'id'
        | 'name'
        | 'tel'
        | 'mail'
      >>;
      
      RES: {
        success: true;
        data: Pick<Professor,
          | 'id'
          | 'name'
          | 'tel'
          | 'mail'
        >[];
      } | {
        success: false;
        e: ErrorString;
      };
    };
  };
  
  '/api/data/campus': {
    GET: {
      REQ: Partial<Pick<Campus,
        | 'id'
        | 'name'
      >>;
      
      RES: {
        success: true;
        data: Pick<Campus,
          | 'id'
          | 'name'
        >[];
      } | {
        success: false;
        e: ErrorString;
      };
    };
  };
  
  '/api/data/college': {
    GET: {
      REQ: Partial<Pick<College,
        | 'id'
        | 'virtual'
        | 'code_num'
        | 'name'
        | 'campus'
      >>;
      
      RES: {
        success: true;
        data: Pick<College,
          | 'id'
          | 'name'
          | 'campus'
          | 'code_num'
          | 'virtual'
        >[];
      } | {
        success: false;
        e: ErrorString;
      };
    };
  };
  
  '/api/data/department': {
    GET: {
      REQ: Partial<Pick<Department,
        | 'id'
        | 'code'
        | 'name'
        | 'college'
      >>;
      
      RES: {
        success: true;
        data: Pick<Department,
          | 'id'
          | 'name'
          | 'code'
          | 'college'
        >[];
      } | {
        success: false;
        e: ErrorString;
      };
    };
  };
  
  '/api/data/course': {
    GET: {
      REQ: Partial<Pick<Course,
        | 'id'
        | 'code'
        | 'name'
        | 'course_type'
        | 'department'
      >>;
      
      RES: {
        success: true;
        data: Pick<Course,
          | 'id'
          | 'name'
          | 'code'
          | 'course_type'
          | 'department'
        >[];
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
        data: Pick<Lecture,
          | 'id'
          | 'course'
          | 'ay'
          | 'sem'
          | 'professor'
          | 'hours'
          | 'lab_hours'
          | 'credit'
        >[];
      } | {
        success: false;
        e: ErrorString;
      };
    };
  };
  
  '/api/data/lectureclass': {
    GET: {
      REQ: Partial<Pick<LectureClass,
        | 'id'
        | 'code'
        | 'lecture'
      >>;
      
      RES: {
        success: true;
        data: Pick<LectureClass,
          | 'id'
          | 'code'
          | 'lecture'
          | 'periods'
        >[];
      } | {
        success: false;
        e: ErrorString;
      };
    };
  };
  
  '/api/data/building': {
    GET: {
      REQ: Partial<Pick<Building,
        | 'id'
        | 'name'
        | 'location'
      >>;
      
      RES: {
        success: true;
        data: Pick<Building,
          | 'id'
          | 'name'
          | 'location'
        >[];
      } | {
        success: false;
        e: ErrorString;
      };
    };
  };
  
  '/api/data/classroom': {
    GET: {
      REQ: Partial<Pick<ClassRoom,
        | 'id'
        | 'building'
        | 'room'
      >>;
      
      RES: {
        success: true;
        data: Pick<ClassRoom,
          | 'id'
          | 'building'
          | 'room'
        >[];
      } | {
        success: false;
        e: ErrorString;
      };
    };
  };
  
  '/api/data/comment': {
    GET: {
      REQ: Partial<Pick<Comment,
        | 'id'
        | 'post'
      >> & {
        page?: number;
      };
      
      RES: {
        success: true;
        data: Pick<Comment,
          | 'id'
          | 'post'
          | 'content'
          | 'created_at'
          | 'updated_at'
          | 'visible'
          | 'author'
        >[];
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
      > & {
        profile: EntityID<'user_profile'>;
      };
      
      RES: {
        success: true;
        data: Pick<Comment,
          | 'id'
          | 'post'
          | 'content'
          | 'author'
          | 'visible'
          | 'created_at'
          | 'updated_at'
        >;
      } | {
        success: false;
        e: ErrorString;
      };
    };
    
    PATCH: {
      REQ: {
        id: EntityID<'comment'>;
        data: Partial<Pick<Comment,
          | 'content'
          | 'visible'
        >>;
      };
      
      RES: {
        success: true;
        modified: BoolRecord<Partial<Comment>>;
      } | {
        success: false;
        e: ErrorString;
      };
    };
    
    DELETE: {
      REQ: {
        id: EntityID<'comment'>;
      };
      
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
      >> & {
        page?: number;
      };
      
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
          | 'author'
        >[];
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
      > & {
        profile: EntityID<'user_profile'>;
      };
      
      RES: {
        success: true;
        data: Pick<Post,
          | 'id'
          | 'board'
          | 'title'
          | 'content'
          | 'visible'
          | 'author'
          | 'comment_count'
          | 'created_at'
          | 'updated_at'
          | 'view_count'
        >;
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
        modified: BoolRecord<Partial<Post>>;
      } | {
        success: false;
        e: ErrorString;
      };
    };
    
    DELETE: {
      REQ: {
        id: EntityID<'post'>;
      };
      
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
      REQ: Partial<Pick<Board,
        | 'id'
        | 'name'
      >>;
      
      RES: {
        success: true;
        data: Pick<Board,
          | 'id'
          | 'description'
          | 'name'
          | 'post_count'
        >[];
      } | {
        success: false;
        e: ErrorString;
      };
    };
  };
  
  '/api/data/timetable': {
    GET: {
      REQ: Partial<Pick<TimeTable,
        | 'id'
        | 'user'
      >> & {
        page?: number;
      };
      
      RES: {
        success: true;
        data: Pick<TimeTable,
          | 'id'
          | 'classes'
          | 'name'
          | 'selected'
          | 'user'
          | 'visible'
        >[];
      } | {
        success: false;
        e: ErrorString;
      };
    };
    
    POST: {
      REQ: Pick<TimeTable,
        | 'name'
        | 'selected'
        | 'classes'
        | 'visible'
      >;
      
      RES: {
        success: true;
        data: Pick<TimeTable,
          | 'id'
          | 'classes'
          | 'name'
          | 'selected'
          | 'user'
          | 'visible'
        >;
      } | {
        success: false;
        e: ErrorString;
      };
    };
    
    PATCH: {
      REQ: {
        id: EntityID<'time_table'>;
        data: Partial<Pick<TimeTable,
          | 'name'
          | 'selected'
          | 'classes'
          | 'visible'
        >>;
      };
      
      RES: {
        success: true;
        modified: BoolRecord<Partial<TimeTable>>;
      } | {
        success: false;
        e: ErrorString;
      };
    };
    
    DELETE: {
      REQ: {
        id: EntityID<'time_table'>;
      };
      
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
      REQ: {
        user: EntityID<'user'>;
      };
      
      RES: {
        success: true;
        data: Pick<GraduationProgress,
          | 'id'
          | 'color'
          | 'details'
          | 'user'
          | 'value'
        >[];
      } | {
        success: false;
        e: ErrorString;
      };
    };
    
    PATCH: {
      REQ: {
        id: EntityID<'graduation_progress'>;
        data: Partial<Pick<GraduationProgress,
          | 'color'
          | 'details'
        >>;
      };
      
      RES: {
        success: true;
        modified: BoolRecord<Partial<GraduationProgress>>;
      } | {
        success: false;
        e: ErrorString;
      };
    };
  };
  
  '/api/data/studygroup': {
    GET: {
      REQ: Partial<Pick<StudyGroup,
        | 'id'
        | 'name'
        | 'post'
        | 'inviting'
      >> & {
        page?: number;
      };
      
      RES: {
        success: true;
        data: (Pick<StudyGroup,
          | 'id'
          | 'name'
          | 'user_visible'
          | 'inviting'
          | 'visible'
        > & Partial<Pick<StudyGroup,
          | 'post'
          | 'users'
          | 'pendings'
          | 'host'
          | 'chat'
          | 'verify_code'
        >>)[];
      } | {
        success: false;
        e: ErrorString;
      };
    };
    
    POST: {
      REQ: Pick<StudyGroup,
        | 'name'
        | 'user_visible'
        | 'inviting'
        | 'visible'
      > & {
        description: string;
        profile: EntityID<'user_profile'>;
      };
      
      RES: {
        success: true;
        data: Pick<StudyGroup,
          | 'id'
          | 'name'
          | 'post'
          | 'users'
          | 'pendings'
          | 'user_visible'
          | 'inviting'
          | 'host'
          | 'chat'
          | 'verify_code'
          | 'visible'
        >;
      } | {
        success: false;
        e: ErrorString;
      };
    };
    
    PATCH: {
      REQ: {
        id: EntityID<'study_group'>;
        data: Partial<Pick<StudyGroup,
          | 'name'
          | 'users'
          | 'pendings'
          | 'user_visible'
          | 'inviting'
          | 'host'
          | 'visible'
        >>;
      };
      
      RES: {
        success: true;
        modified: BoolRecord<Partial<StudyGroup>>;
      } | {
        success: false;
        e: ErrorString;
      };
    };
    
    DELETE: {
      REQ: {
        id: EntityID<'study_group'>;
      };
      
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
  V extends any[] = [],
  W = {}
> =
  (data: RemovedID<Scheme<T, U, 'REQ'>>, ...args: V) => Scheme<T, U, 'RES'> & W;

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