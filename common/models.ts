export type TimeStamp = number;

/** 과목 종류 */
export type CourseType =
  | 'major'             // 전공
  | 'major_required'    // 전공필수
  | 'general'           // 교양
  | 'general_required'  // 교양필수
  | 'inter'             // 융합
  | 'inter_required';   // 융합필수

export const COURSE_TYPE_MAPPING:
  { id: CourseType, label: string }[] = [
    { id: 'major', label: '전공' },
    { id: 'major_required', label: '전공필수' },
    { id: 'general', label: '교양' },
    { id: 'general_required', label: '교양필수' },
    { id: 'inter', label: '융합' },
    { id: 'inter_required', label: '융합필수' }
  ];

/** 요일 */
export type Day =
  | 'sun'   // 일
  | 'mon'   // 월
  | 'tue'   // 화
  | 'wed'   // 수
  | 'thu'   // 목
  | 'fri'   // 금
  | 'sat';  // 토

export const DAY_MAPPING:
  { id: Day, label: string }[] = [
    { id: 'sun', label: '일' },
    { id: 'mon', label: '월' },
    { id: 'tue', label: '화' },
    { id: 'wed', label: '수' },
    { id: 'thu', label: '목' },
    { id: 'fri', label: '금' },
    { id: 'sat', label: '토' }
  ];

/** 학기 */
export type Semester =
  | 'first'   // 1학기
  | 'second'  // 2학기
  | 'summer'  // 계절학기-여름
  | 'winter'; // 계절학기-겨울

export const SEMESTER_MAPPING:
  { id: Semester, label: string }[] = [
    { id: 'first', label: '1학기' },
    { id: 'second', label: '2학기' },
    { id: 'summer', label: '계절학기-여름' },
    { id: 'winter', label: '계절학기-겨울' }
  ];

export interface TYPE_ENTITY {
  ['user']: User;
  ['user_profile']: UserProfile;
  ['campus']: Campus;
  ['college']: College;
  ['department']: Department;
  ['professor']: Professor;
  ['course']: Course;
  ['comment']: Comment;
  ['lecture']: Lecture;
  ['lecture_class']: LectureClass;
  ['building']: Building;
  ['class_room']: ClassRoom;
  ['post']: Post;
  ['board']: Board;
  ['time_table']: TimeTable;
  ['graduation_progress']: GraduationProgress;
  ['session']: Session;
};

export type EntityType = keyof TYPE_ENTITY;

export type TypeEntity<T extends EntityType> = TYPE_ENTITY[T];

export type EntityID<T extends EntityType> =
  `${string}-${string}-${string}-${string}-${string}` &
  { readonly __brand?: T };

export interface Entity<T extends EntityType> {
  id: EntityID<T>;
  type: T
}

export type WithoutID<T extends Entity<EntityType>> = Omit<T, 'id'>;

/** 유저 */
export interface User extends Entity<'user'> {
  /** 로그인 정보 */
  login: {
    /** 로그인 아이디 */
    id: string;
    /** 비밀번호 */
    password: string;
  };
  /** 성명 */
  name: string;
  /** 프로필 */
  profiles: EntityID<'user_profile'>[];
  /** 학번 */
  student_id: string;
  /** 캠퍼스 */
  campus: EntityID<'campus'>;
  /** 단과대 */
  college: EntityID<'college'>;
  /** 학과 */
  department: {
    major: EntityID<'department'>;
    minor: EntityID<'department'> | null;
    status: 'none' | 'minor' | 'double' | 'advanced';
  };
  /** 학교 메일 */
  univ_mail: string;
  /** 개인 메일 */
  mail: string | null;
  /** 데이터 */
  data: {
    /** 시간표 */
    timetables: EntityID<'time_table'>[];
    /** 졸업 학점 */
    graduation_progress: EntityID<'graduation_progress'> | null;
    /** 게시물 */
    posts: EntityID<'post'>[];
    /** 댓글 */
    comments: EntityID<'comment'>[];
  };
}

/** 유저 프로필 */
export interface UserProfile extends Entity<'user_profile'> {
  /** 닉네임 */
  nickname: string;
  /** 사진-Base64 */
  image: string;
}

/** 교수 */
export interface Professor extends Entity<'professor'> {
  /** 로그인 아이디 */
  login: {
    /** 로그인 아이디 */
    id: string;
    /** 비밀번호 */
    password: string;
  };
  /** 성명 */
  name: string;
  /** 연락처 */
  tel: string;
  /** 메일 */
  mail: string;
}

/** 캠퍼스 */
export interface Campus extends Entity<'campus'> {
  /** 캠퍼스 이름 */
  name: string;
  /** 단과대 */
  colleges: EntityID<'college'>[];
}

/** 단과대 */
export interface College extends Entity<'college'> {
  /** 가상 여부 */
  virtual?: boolean;
  /** 학번 식별번호 */
  code_num?: number;
  /** 단과대 이름 */
  name: string;
  /** 학과 */
  departments: EntityID<'department'>[];
  /** 캠퍼스 */
  campus: EntityID<'campus'>;
}

/** 학과 */
export interface Department extends Entity<'department'> {
  /** 학과 코드
   * @description 4글자
   * @example COSE */
  code: string;
  /** 학과 이름 */
  name: string;
  /** 단과대 */
  college: EntityID<'college'>;
}

/** 과목 */
export interface Course extends Entity<'course'> {
  /** 학수 번호
   * @description 6글자 이상
   * @example COSE3310
   */
  code: string;
  /** 학과 */
  department: EntityID<'department'>;
  /** 과목명 */
  name: string;
  /** 전공/교양/융합 */
  course_type: CourseType;
}

/** 강의 */
export interface Lecture extends Entity<'lecture'> {
  /** 과목 */
  course: EntityID<'course'>;
  /** 개설연도 */
  ay: number;
  /** 학기 */
  sem: Semester;
  /** 교수 */
  professor: EntityID<'professor'>;
  /** 분반 */
  classes: EntityID<'lecture_class'>[];
  /** 강의시간 */
  hours: number;
  /** 실습시간 */
  lab_hours: number;
  /** 학점 */
  credit: number;
}

/** 분반 */
export interface LectureClass extends Entity<'lecture_class'> {
  /** 코드 */
  code: string;
  /** 교시 */
  periods: Period[];
}

/** 교시 */
export interface Period {
  /** 요일 */
  day: Day;
  /** 교시 번호 */
  time: number;
  /** 교실 */
  room: EntityID<'class_room'>;
}

/** 지도상 좌표 */
export type Coordinate = [number, number];

/** 건물 */
export interface Building extends Entity<'building'> {
  /** 건물명 */
  name: string;
  /** 지도상 좌표 */
  location: Coordinate;
}

/** 교실 */
export interface ClassRoom extends Entity<'class_room'> {
  /** 건물 */
  building: EntityID<'building'>;
  /** 호실 */
  room: string;
}

/** 댓글 */
export interface Comment extends Entity<'comment'> {
  /** 게시글 */
  post: EntityID<'post'>;
  /** 작성자 */
  author: EntityID<'user'>;
  /** 내용 */
  content: string;
  /** 생성 시간 */
  created_at: TimeStamp;
  /** 수정 시간 */
  updated_at: TimeStamp;
  /** 공개 여부 */
  visible: boolean;
}

/** 게시글 */
export interface Post extends Entity<'post'> {
  /** 게시판 */
  board: EntityID<'board'>;
  /** 작성자 */
  author: EntityID<'user'>;
  /** 제목 */
  title: string;
  /** 내용 */
  content: string;
  /** 조회수 */
  views: number;
  /** 생성 시간 */
  created_at: TimeStamp;
  /** 수정 시간 */
  updated_at: TimeStamp;
  /** 공개 여부 */
  visible: boolean;
  /** 댓글 */
  comments: EntityID<'comment'>[];
}

/** 게시판 */
export interface Board extends Entity<'board'> {
  /** 이름 */
  name: string;
  /** 설명 */
  description: string;
  /** 게시글 */
  posts: EntityID<'post'>[];
}

/** 우선순위 */
export interface Priority {
  /** 중요도 */
  value: number;
  /** 잠금 여부
   * @description true이면 같은 중요도 내에서 침범 불가
   */
  lock: boolean;
};

/** 시간표 AI생성 선호 조건 */
export interface Preferences {
  /** 공강 희망 요일 */
  days_off: {
    value: { [K in Day]?: boolean; }
    priority: Priority;
  }
  /** 점심시간 보장 */
  lunch_time_preserve: {
    value: boolean;
    priority: Priority;
  };
  /** 최대 연강 한도 */
  max_consecutive: {
    value: number;
    priority: Priority;
  };
  /** 시간표 압축 가중치 */
  compactness: {
    value: number;
    priority: Priority;
  };
  /** 캠퍼스 이동 거리 최소화 가중치 */
  campus_closeness: {
    value: number;
    priority: Priority;
  };
  /** 아침 수업 회피 가중치 */
  avoid_morning: {
    value: number;
    priority: Priority;
  };
}

/** 시간표 */
export interface TimeTable extends Entity<'time_table'> {
  /** 이름 */
  name: string;
  /** 주 시간표 여부 */
  selected: boolean;
  /** 일 */
  days: {
    [K in Day]?: TimeTableDay
  };
}

/** 시간표 일 */
export interface TimeTableDay {
  day: Day;
  periods: Period[];
}

/** 분수 */
export type Fraction = [number, number];

/** RGB 컬러 */
export type RGB = [number, number, number];

/** 졸업 진행률 */
export interface GraduationProgress extends Entity<'graduation_progress'> {
  value: Fraction;
  color: RGB;
  details: {
    [K in CourseType]: {
      value: Fraction;
      color: RGB;
    };
  };
}

/** 세션 */
export interface Session extends Entity<'session'> {
  /** 타입 */
  data_type: string;
  /** 데이터 */
  data: any;
  /** 만료 여부 */
  expired: boolean;
  /** 만료 시각 */
  expires_at: TimeStamp;
}
