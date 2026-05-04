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

export type EntityType =
  | 'user'
  | 'user_profile'
  | 'department'
  | 'professor'
  | 'course'
  | 'lecture'
  | 'lecture_class'
  | 'period'
  | 'building'
  | 'class_room'
  | 'comment'
  | 'post'
  | 'board'
  | 'time_table'
  | 'graduation_progress'
  | 'session';

/** 엔티티 식별자 */
export interface EntityID<T extends EntityType> {
  id: `${string}-${string}-${string}-${string}-${string}`;
  type: T;
}

export interface Entity {
  id: EntityID<EntityType>;
}

export type WithoutID<T extends Entity> = Omit<T, 'id'>;

/** 유저 식별자 */
export type UserID = EntityID<'user'>;

/** 유저 */
export interface User extends Entity {
  /** 식별자 */
  id: UserID;
  login: {
    /** 로그인 아이디 */
    id: string;
    /** 비밀번호 */
    password: string;
  };
  /** 성명 */
  name: string;
  /** 프로필 */
  profiles: UserProfileID[];
  /** 학번 */
  student_id: string;
  /** 학과 코드 */
  dept_id: DepartmentID;
  /** 학교 메일 */
  univ_mail: string;
  /** 개인 메일 */
  mail: string;
  /** 데이터 */
  data: {
    /** 시간표 */
    timetables: TimeTableID[];
    /** 졸업 학점 */
    graduation_progress: GraduationProgressID;
    /** 게시물 */
    posts: PostID[];
    /** 댓글 */
    comments: CommentID[];
  };
}

/** 유저 프로필 식별자 */
export type UserProfileID = EntityID<'user_profile'>;

/** 유저 프로필 */
export interface UserProfile extends Entity {
  /** 식별자 */
  id: UserProfileID;
  /** 닉네임 */
  nickname: string;
  /** 사진-Base64 */
  image: string;
}

/** 학과 식별자 */
export type DepartmentID = EntityID<'department'>;

/** 학과 */
export interface Department extends Entity {
  /** 식별자 */
  id: DepartmentID;
  /** 학과 코드
   * @description 4글자
   * @example COSE */
  code: string;
  /** 학과 이름 */
  name: string;
}

/** 교수 식별자 */
export type ProfessorID = EntityID<'professor'>;

/** 교수 */
export interface Professor extends Entity {
  /** 식별자 */
  id: ProfessorID;
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

/** 과목 식별자 */
export type CourseID = EntityID<'course'>;

/** 과목 */
export interface Course extends Entity {
  /** 식별자 */
  id: CourseID;
  /** 학수번호
   * @description 6글자 이상
   * @example COSE3310
   */
  code: string;
  /** 과목명 */
  name: string;
  /** 전공/교양/융합 */
  course_type: CourseType;
}

/** 강의 식별자 */
export type LectureID = EntityID<'lecture'>;

/** 강의 */
export interface Lecture extends Entity {
  /** 식별자 */
  id: LectureID;
  /** 과목 코드 */
  course_code: CourseID;
  /** 개설연도 */
  ay: number;
  /** 학기 */
  sem: Semester;
  /** 교수 코드 */
  prof_id: ProfessorID;
  /** 학과 코드 */
  dept_code: string;
  /** 분반 코드 */
  classes: LectureClassID[];
  /** 강의시간 */
  hours: number;
  /** 실습시간 */
  lab_hours: number;
  /** 학점 */
  credit: number;
}

/** 분반 식별자 */
export type LectureClassID = EntityID<'lecture_class'>;

/** 분반 */
export interface LectureClass extends Entity {
  /** 식별자 */
  id: LectureClassID;
  /** 강의 코드 */
  lect_code: string;
  /** 교시 */
  periods: PeriodID[]; // Period ID
}

/** 교시 식별자 */
export type PeriodID = EntityID<'period'>;

/** 교시 */
export interface Period extends Entity {
  /** 식별자 */
  id: PeriodID;
  /** 분반 코드 */
  class_code: string;
  /** 요일 */
  day: Day;
  /** 교시 번호 */
  time: number;
  /** 교실 번호 */
  room_code: string;
}

/** 지도상 좌표 */
export type Coordinate = [number, number];

/** 건물 식별자 */
export type BuildingID = EntityID<'building'>;

/** 건물 */
export interface Building extends Entity {
  /** 식별자 */
  id: BuildingID;
  /** 건물명 */
  name: string;
  /** 지도상 좌표 */
  location: Coordinate;
}

/** 교실 식별자 */
export type ClassRoomID = EntityID<'class_room'>;

/** 교실 */
export interface ClassRoom extends Entity {
  /** 식별자 */
  id: ClassRoomID;
  /** 건물 코드 */
  bldg_id: BuildingID;
  /** 호실 */
  room: string;
}

/** 댓글 식별자 */
export type CommentID = EntityID<'comment'>;

/** 댓글 */
export interface Comment extends Entity {
  /** 식별자 */
  id: CommentID;
  /** 게시글 */
  post: PostID;
  /** 작성자 */
  author: UserID;
  /** 내용 */
  content: string;
  /** 생성 시간 */
  created_at: TimeStamp;
  /** 수정 시간 */
  updated_at: TimeStamp;
  /** 공개 여부 */
  visible: boolean;
}

/** 게시글 식별자 */
export type PostID = EntityID<'post'>;

/** 게시글 */
export interface Post extends Entity {
  /** 식별자 */
  id: PostID;
  /** 게시판 */
  board: BoardID;
  /** 작성자 */
  author: UserID;
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
  comments: CommentID[];
}

/** 게시판 식별자 */
export type BoardID = EntityID<'board'>;

/** 게시판 */
export interface Board extends Entity {
  /** 식별자 */
  id: BoardID;
  /** 게시판 이름 */
  name: string;
  /** 게시글 */
  posts: PostID[];
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

/** 시간표 식별자 */
export type TimeTableID = EntityID<'time_table'>;

/** 시간표 */
export interface TimeTable extends Entity {
  /** 식별자 */
  id: TimeTableID;
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
  periods: PeriodID[];
}

/** 분수 */
export type Fraction = [number, number];

/** RGB 컬러 */
export type RGB = [number, number, number];

/** 졸업 진행률 식별자 */
export type GraduationProgressID = EntityID<'graduation_progress'>;

/** 졸업 진행률 */
export interface GraduationProgress extends Entity {
  id: GraduationProgressID;
  value: Fraction;
  color: RGB;
  details: {
    [K in CourseType]: {
      value: Fraction;
      color: RGB;
    };
  };
}

/** 세션 식별자 */
export type SessionID = EntityID<'session'>;

/** 세션 */
export interface Session extends Entity {
  /** 식별자 */
  id: SessionID;
  /** 타입 */
  type: string;
  /** 데이터 */
  data: any;
  /** 만료 여부 */
  expired: boolean;
  /** 만료 시각 */
  expires_at: TimeStamp;
}
