/** 과목 종류: 전공 | 교양 | 융합 */
export type CourseType = 'major' | 'general' | 'inter';

/** 요일 */
export type Day = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';

/** 학기: 1학기 | 2학기 | 계절-여름 | 계절-겨울 */
export type Semester = 'first' | 'second' | 'summer' | 'winter';

/** 6 ~ 18글자 */
export type UserID = string;

/** 유저 정보 */
export interface User {
    /** 아이디 */
    id: UserID;
    /** 비밀번호 */
    password: string;
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
}

/** UUID */
export type UserProfileID = string;

export interface UserProfile {
    /** 식별자 */
    id: UserProfileID;
    /** 닉네임 */
    nickname: string;
    /** 사진-Base64 */
    image: string;
}

/** 4글자 (ex. COSE - 컴퓨터학과) */
export type DepartmentID = string;

/** 학과 정보 */
export interface Department {
    /** 식별자 */
    id: DepartmentID;
    /** 학과 이름 */
    name: string;
    /** 학과 번호 */
    code: number;
}

export type ProfessorID = string;

/** 교수 정보 */
export interface Professor {
    /** 식별자 */
    id: ProfessorID;
    /** 성명 */
    name: string;
    /** 연락처 */
    tel: string;
    /** 메일 */
    mail: string;
}

/** 학수번호 - 6글자 이상 */
export type CourseID = string;

/** 과목 정보 */
export interface Course {
    /** 과목 코드 */
    id: CourseID;
    /** 과목명 */
    name: string;
    /** 필수여부 */
    required: boolean;
    /** 전공/교양/융합 */
    course_type: CourseType;
}

export type LectureID = string;

/** 강의 정보 */
export interface Lecture {
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

export type LectureClassID = string;

/** 분반 정보 */
export interface LectureClass {
    /** 식별자 */
    id: LectureClassID;
    /** 강의 코드 */
    lect_code: string;
    /** 교시 */
    periods: PeriodID[]; // Period ID
}

export type PeriodID = string;

/** 교시 */
export interface Period {
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

export type BuildingID = string;

/** 건물 */
export interface Building {
    /** 건물 코드 */
    id: BuildingID;
    /** 건물명 */
    name: string;
    /** 지도상 좌표 */
    location: Coordinate;
}

export type ClassRoomID = string;

/** 교실 */
export interface ClassRoom {
    /** 식별자 */
    id: ClassRoomID;
    /** 건물 코드 */
    bldg_id: BuildingID;
    /** 호실 */
    room: string;
}

export type TimeTableID = string;

/** 시간표 */
export interface TimeTable {
    /** 식별자 */
    id: TimeTableID;
    /** 소유자 */
    user_id: UserID;
    /** 주 시간표 여부 */
    selected: boolean;
    /** 일 */
    days: { [day: string]: TimeTableDay };
}

/** 시간표 일 */
export interface TimeTableDay {
    day: Day;
    periods: PeriodID[];
}

export type RoadmapID = string;

/** 로드맵 */
export interface Roadmap {
    /** 식별자 */
    id: RoadmapID;
    // TODO
}

// Community

export type PostID = string;

export interface Post {
    /** 식별자 */
    id: PostID;
    board: BoardID;
    author: UserID;
    title: string;
    content: string;
    views: number;
    created_at: Date;
    updated_at: Date;
    visible: boolean;
}

export type BoardID = string;

export interface Board {
    id: BoardID;
    posts: PostID[];
}

export const DAY_MAPPING: { id: Day; label: string }[] = [
  { id: 'mon', label: '월' },
  { id: 'tue', label: '화' },
  { id: 'wed', label: '수' },
  { id: 'thu', label: '목' },
  { id: 'fri', label: '금' },
];



/** AI 시간표 생성 선호 조건 (가중치) */
export interface Preferences {
  /** 공강 희망 요일 */
  daysOff: Day[];
  /** 점심시간 보장 선호 (true면 가급적 점심시간은 비워둠) */
  lunchTimeLock: boolean;
  /** 최대 연강 한도 (ex. 3이면 최대 3연강) */
  maxConsecutive: number;
  /** 시간표 압축 정도 가중치 (우주공강 최소화) */
  compactnessWeight: number;
  /** 캠퍼스 이동 거리 최소화 가중치 */
  campusDistanceWeight: number;
  /** 아침 수업(1교시 등) 회피 가중치 */
  avoidMorningWeight: number;
}

/** AI 시간표 생성 필수 강제 조건 (반드시 지켜야 하는 조건) */
export interface HardConstraints {
  /** 점심시간 보장 필수 여부 */
  lunchTimeLock: boolean;
  /** 최대 연강 한도 필수 여부 */
  maxConsecutive: boolean;
  /** 우주공강 최소화 필수 여부 */
  compactnessWeight: boolean;
  /** 캠퍼스 이동 거리 최소화 필수 여부 */
  campusDistanceWeight: boolean;
  /** 아침 수업 회피 필수 여부 */
  avoidMorningWeight: boolean;
}

/** 생성된 시간표 대안 (후보) */
export interface Alternative {
  /** 대안 식별자 (ID) */
  id: number;
  /** 대안 이름 (ex. "추천 1순위", "아침 없는 시간표" 등) */
  name: string;
  /** 해당 대안에 포함된 강의 목록 */
  lectures: Lecture[];
}

/** 졸업 학점 현황 데이터 */
export interface GraduationCreditData {
  /** 구분명 (ex. 전공, 교양, 일반) */
  name: string;
  /** 취득 학점 값 */
  value: number;
  /** 차트에 표시될 색상 코드 */
  color: string;
}

/** 졸업 요건 진행률 데이터 */
export interface GraduationProgressData {
  /** 식별자 */
  id: string;
  /** 요건명 (ex. 전공필수, 핵심교양) */
  name: string;
  /** 현재 취득 학점/이수 횟수 */
  current: number;
  /** 목표 학점/요구 횟수 */
  target: number;
  /** 프로그레스 바 색상 코드 */
  color: string;
}
