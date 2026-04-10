/** 과목 종류: 전공 | 교양 | 융합 */
export type CourseType = 'major' | 'general' | 'inter';

/** 요일 */
export type Day = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';

/** 학기: 1학기 | 2학기 | 계절-여름 | 계절-겨울 */
export type Semester = 'first' | 'second' | 'summer' | 'winter';

export interface UserID extends String {}

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
    student_id: StudentID;
    /** 단과대 코드 */
    college_id: CollegeID;
    /** 학교 메일 */
    univ_mail: string;
    /** 개인 메일 */
    mail: string;
}

export interface UserProfileID extends String {}

export interface UserProfile {
    id: UserProfileID;
    nickname: string;
    
}

export interface StudentID extends String {}

export interface ProfessorID extends String {}

export interface CollegeID extends String {}

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

export interface CourseID extends String {}

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

export interface LectureID extends String {}

/** 강의 정보 */
export interface Lecture {
    /** 식별자 */
    id: LectureID;
    /** 과목 코드 */
    course_code: string;
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

export interface LectureClassID extends String {}

/** 분반 정보 */
export interface LectureClass {
    /** 식별자 */
    id: LectureClassID;
    /** 강의 코드 */
    lect_code: string;
    /** 교시 */
    periods: PeriodID[]; // Period ID
}

export interface PeriodID extends String {}

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

export interface BuildingID extends String {}

/** 건물 */
export interface Building {
    /** 건물 코드 */
    id: BuildingID;
    /** 건물명 */
    name: string;
    /** 지도상 좌표 */
    location: Coordinate;
}

export interface ClassRoomID extends String {}

/** 교실 */
export interface ClassRoom {
    /** 식별자 */
    id: ClassRoomID;
    /** 건물 코드 */
    bldg_id: BuildingID;
    /** 호실 */
    room: string;
}

export interface TimeTableID extends String {}

/** 시간표 */
export interface TimeTable {
    /** 식별자 */
    id: TimeTableID;
    /** 소유자 */
    user_id: UserID;
    /** 주 시간표 여부 */
    selected: boolean;
    /** 일 */
    days: {[day: string]: TimeTableDay};
}

/** 시간표 일 */
export interface TimeTableDay {
    day: Day;
    periods: PeriodID[];
}

export interface RoadmapID extends String {}

/** 로드맵 */
export interface Roadmap {
    /** 식별자 */
    id: RoadmapID;
    // TODO
}

// Community

export interface PostID extends String {}

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

export interface BoardID extends String {}

export interface Board {
    id: BoardID;
    posts: PostID[];
}






