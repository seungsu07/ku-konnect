import type { Scheme } from "../../../common/dto";
import type { Building, ClassRoom, Course, Lecture, LectureClass, Professor, TimeTable, WithoutID } from "../../../common/models";

export declare const getCourse: (query: Scheme<'/api/data/course', 'GET', 'REQ'>) => Course | undefined;
export declare const getProfessor: (query: Scheme<'/api/data/professor', 'GET', 'REQ'>) => Professor | undefined;
export declare const getLecture: (query: Scheme<'/api/data/lecture', 'GET', 'REQ'>) => Lecture | undefined;
export declare const getLectureClass: (query: Scheme<'/api/data/lectureclass', 'GET', 'REQ'>) => LectureClass | undefined;
export declare const getClassRoom: (query: Scheme<'/api/data/classroom', 'GET', 'REQ'>) => ClassRoom | undefined;
export declare const getBuilding: (query: Scheme<'/api/data/building', 'GET', 'REQ'>) => Building | undefined;


export declare const getCourses: (query: Scheme<'/api/data/course', 'GET', 'REQ'>) => Course[];
export declare const getProfessors: (query: Scheme<'/api/data/professor', 'GET', 'REQ'>) => Professor[];
export declare const getLectures: (query: Scheme<'/api/data/lecture', 'GET', 'REQ'>) => Lecture[];
export declare const getLectureClasses: (query: Scheme<'/api/data/lectureclass', 'GET', 'REQ'>) => LectureClass[];
export declare const getClassRooms: (query: Scheme<'/api/data/classroom', 'GET', 'REQ'>) => ClassRoom[];
export declare const getBuildings: (query: Scheme<'/api/data/building', 'GET', 'REQ'>) => Building[];

export declare const createTimeTable: (param: Scheme<'/api/data/timetable', 'POST', 'REQ'>) => TimeTable | null;