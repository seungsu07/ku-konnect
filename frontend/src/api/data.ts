import type { Scheme } from "../../../common/dto";
import type { Building, ClassRoom, Course, Lecture, LectureClass, Professor, TimeTable } from "../../../common/models";

export const getCourse = (query: Scheme<'/api/data/course', 'GET', 'REQ'>) => getCourses(query).at(0);
export const getProfessor = (query: Scheme<'/api/data/professor', 'GET', 'REQ'>) => getProfessors(query).at(0);
export const getLecture = (query: Scheme<'/api/data/lecture', 'GET', 'REQ'>) => getLectures(query).at(0);
export const getLectureClass = (query: Scheme<'/api/data/lectureclass', 'GET', 'REQ'>) => getLectureClasses(query).at(0);
export const getClassRoom = (query: Scheme<'/api/data/classroom', 'GET', 'REQ'>) => getClassRooms(query).at(0);
export const getBuilding = (query: Scheme<'/api/data/building', 'GET', 'REQ'>) => getBuildings(query).at(0);

export function getCourses(
    query: Scheme<'/api/data/course', 'GET', 'REQ'>
): Course[] {
    return null as any;
};

export function getProfessors(
    query: Scheme<'/api/data/professor', 'GET', 'REQ'>
): Professor[] {
    return null as any;
};

export function getLectures(
    query: Scheme<'/api/data/lecture', 'GET', 'REQ'>
): Lecture[] {
    return null as any;
};

export function getLectureClasses(
    query: Scheme<'/api/data/lectureclass', 'GET', 'REQ'>
): LectureClass[] {
    return null as any;
};

export function getClassRooms(
    query: Scheme<'/api/data/classroom', 'GET', 'REQ'>
): ClassRoom[] {
    return null as any;
};

export function getBuildings(
    query: Scheme<'/api/data/building', 'GET', 'REQ'>
): Building[] {
    return null as any;
};

export function createTimeTable(
    param: Scheme<'/api/data/timetable', 'POST', 'REQ'>
): TimeTable | null {
    return null as any;
};