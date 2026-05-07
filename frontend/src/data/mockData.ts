import type { Department, Course, Lecture, Professor, Period, ClassRoom, Building, LectureClass } from '../../../common/models';

type UUID = `${string}-${string}-${string}-${string}-${string}`;
export const asId = (s: string) => {
  const clean = s.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().padEnd(8, '0').slice(0, 8);
  return `${clean}-0000-0000-0000-000000000000` as UUID;
};

export const MOCK_DEPARTMENTS: Department[] = [
  { id: asId('dept-1'), type: 'department', code: 'COSE', name: '컴퓨터학과' },
  { id: asId('dept-2'), type: 'department', code: 'GEOG', name: '교양교육원' },
  { id: asId('dept-3'), type: 'department', code: 'INTS', name: '융합전공' },
];

export const MOCK_COURSES: Course[] = [
  { id: asId('COSE213'), type: 'course', code: 'COSE213', name: '알고리즘', course_type: 'major_required', department: MOCK_DEPARTMENTS[0] },
  { id: asId('COSE341'), type: 'course', code: 'COSE341', name: '운영체제', course_type: 'major_required', department: MOCK_DEPARTMENTS[0] },
  { id: asId('COSE371'), type: 'course', code: 'COSE371', name: '데이터베이스', course_type: 'major_required', department: MOCK_DEPARTMENTS[0] },
  { id: asId('COSE361'), type: 'course', code: 'COSE361', name: '인공지능', course_type: 'major', department: MOCK_DEPARTMENTS[0] },
  { id: asId('COSE342'), type: 'course', code: 'COSE342', name: '컴퓨터네트워크', course_type: 'major_required', department: MOCK_DEPARTMENTS[0] },
  { id: asId('COSE312'), type: 'course', code: 'COSE312', name: '소프트웨어공학', course_type: 'major', department: MOCK_DEPARTMENTS[0] },
  { id: asId('COSE331'), type: 'course', code: 'COSE331', name: '컴퓨터그래픽스', course_type: 'major', department: MOCK_DEPARTMENTS[0] },
  { id: asId('GEOG121'), type: 'course', code: 'GEOG121', name: '서양미술사', course_type: 'general', department: MOCK_DEPARTMENTS[1] },
  { id: asId('INTS101'), type: 'course', code: 'INTS101', name: '인사이드파이썬', course_type: 'inter', department: MOCK_DEPARTMENTS[2] },
];

export const MOCK_PROFESSORS: Professor[] = [
  { id: asId('prof-1'), type: 'professor', name: '김정석', tel: '', mail: '', login: { id: 'p1', password: '' } },
  { id: asId('prof-2'), type: 'professor', name: '유혁', tel: '', mail: '', login: { id: 'p2', password: '' } },
  { id: asId('prof-3'), type: 'professor', name: '김상원', tel: '', mail: '', login: { id: 'p3', password: '' } },
  { id: asId('prof-4'), type: 'professor', name: '이성환', tel: '', mail: '', login: { id: 'p4', password: '' } },
  { id: asId('prof-5'), type: 'professor', name: '유민수', tel: '', mail: '', login: { id: 'p5', password: '' } },
  { id: asId('prof-6'), type: 'professor', name: '최진영', tel: '', mail: '', login: { id: 'p6', password: '' } },
  { id: asId('prof-7'), type: 'professor', name: '신동빈', tel: '', mail: '', login: { id: 'p7', password: '' } },
  { id: asId('prof-8'), type: 'professor', name: '홍길동', tel: '', mail: '', login: { id: 'p8', password: '' } },
  { id: asId('prof-9'), type: 'professor', name: '박철수', tel: '', mail: '', login: { id: 'p9', password: '' } },
];

export const MOCK_BUILDINGS: Building[] = [
  { id: asId('bldg-1'), type: 'building', name: '정보통신관', location: [0, 0] },
  { id: asId('bldg-2'), type: 'building', name: '신공학관', location: [0, 0] },
  { id: asId('bldg-3'), type: 'building', name: '우당교양관', location: [0, 0] },
];

export const MOCK_ROOMS: ClassRoom[] = [
  { id: asId('rm-1'), type: 'class_room', building: MOCK_BUILDINGS[0], room: '206호' },
  { id: asId('rm-2'), type: 'class_room', building: MOCK_BUILDINGS[1], room: '101호' },
  { id: asId('rm-3'), type: 'class_room', building: MOCK_BUILDINGS[2], room: '403호' },
  { id: asId('rm-4'), type: 'class_room', building: MOCK_BUILDINGS[1], room: '202호' },
  { id: asId('rm-5'), type: 'class_room', building: MOCK_BUILDINGS[0], room: '105호' },
  { id: asId('rm-6'), type: 'class_room', building: MOCK_BUILDINGS[1], room: 'B101호' },
  { id: asId('rm-7'), type: 'class_room', building: MOCK_BUILDINGS[2], room: '203호' },
  { id: asId('rm-8'), type: 'class_room', building: MOCK_BUILDINGS[0], room: '301호' },
  { id: asId('rm-9'), type: 'class_room', building: MOCK_BUILDINGS[1], room: '205호' },
  { id: asId('rm-10'), type: 'class_room', building: MOCK_BUILDINGS[2], room: '102호' },
];

export type MockPeriod = Period & { id: UUID, type: 'period' };

export const MOCK_PERIODS: MockPeriod[] = [
  // Course 0 - OS - Prof 0 - Class 1
  { id: asId('pd-101'), type: 'period', day: 'mon', time: 9, room: MOCK_ROOMS[0] },
  { id: asId('pd-102'), type: 'period', day: 'wed', time: 9, room: MOCK_ROOMS[0] },
  // Course 0 - OS - Prof 0 - Class 2
  { id: asId('pd-103'), type: 'period', day: 'mon', time: 10.5, room: MOCK_ROOMS[0] },
  { id: asId('pd-104'), type: 'period', day: 'wed', time: 10.5, room: MOCK_ROOMS[0] },
  // Course 0 - OS - Prof 1 - Class 3
  { id: asId('pd-105'), type: 'period', day: 'tue', time: 9, room: MOCK_ROOMS[1] },
  { id: asId('pd-106'), type: 'period', day: 'thu', time: 9, room: MOCK_ROOMS[1] },
  // Course 0 - OS - Prof 1 - Class 4
  { id: asId('pd-107'), type: 'period', day: 'tue', time: 10.5, room: MOCK_ROOMS[1] },
  { id: asId('pd-108'), type: 'period', day: 'thu', time: 10.5, room: MOCK_ROOMS[1] },
  
  // Course 1 - Network - Prof 2 - Class 5 (4교시)
  { id: asId('pd-201'), type: 'period', day: 'mon', time: 13.5, room: MOCK_ROOMS[2] },
  { id: asId('pd-202'), type: 'period', day: 'wed', time: 13.5, room: MOCK_ROOMS[2] },
  // Course 1 - Network - Prof 3 - Class 6 (4교시)
  { id: asId('pd-203'), type: 'period', day: 'tue', time: 13.5, room: MOCK_ROOMS[3] },
  { id: asId('pd-204'), type: 'period', day: 'thu', time: 13.5, room: MOCK_ROOMS[3] },

  // Course 2 - DB - Prof 4 - Class 7 (1,2 연강)
  { id: asId('pd-301'), type: 'period', day: 'fri', time: 9, room: MOCK_ROOMS[4] },
  { id: asId('pd-302'), type: 'period', day: 'fri', time: 10.5, room: MOCK_ROOMS[4] },

  // Course 3 - SE - Prof 5 - Class 8 (5교시)
  { id: asId('pd-401'), type: 'period', day: 'mon', time: 15, room: MOCK_ROOMS[5] },
  { id: asId('pd-402'), type: 'period', day: 'wed', time: 15, room: MOCK_ROOMS[5] },
];

export const MOCK_CLASSES: LectureClass[] = [
  { id: asId('cls-1'), type: 'lecture_class', code: '01', periods: [MOCK_PERIODS[0], MOCK_PERIODS[1]] },
  { id: asId('cls-2'), type: 'lecture_class', code: '02', periods: [MOCK_PERIODS[2], MOCK_PERIODS[3]] },
  { id: asId('cls-3'), type: 'lecture_class', code: '03', periods: [MOCK_PERIODS[4], MOCK_PERIODS[5]] },
  { id: asId('cls-4'), type: 'lecture_class', code: '04', periods: [MOCK_PERIODS[6], MOCK_PERIODS[7]] },
  
  { id: asId('cls-5'), type: 'lecture_class', code: '01', periods: [MOCK_PERIODS[8], MOCK_PERIODS[9]] },
  { id: asId('cls-6'), type: 'lecture_class', code: '02', periods: [MOCK_PERIODS[10], MOCK_PERIODS[11]] },

  { id: asId('cls-7'), type: 'lecture_class', code: '01', periods: [MOCK_PERIODS[12], MOCK_PERIODS[13]] },

  { id: asId('cls-8'), type: 'lecture_class', code: '01', periods: [MOCK_PERIODS[14], MOCK_PERIODS[15]] },
];

export const MOCK_LECTURES: Lecture[] = [
  // OS (MOCK_COURSES[0])
  { id: asId('lect-1'), type: 'lecture', course: MOCK_COURSES[0], ay: 2026, sem: 'first', professor: MOCK_PROFESSORS[0], classes: [MOCK_CLASSES[0], MOCK_CLASSES[1]], hours: 1.25, lab_hours: 0, credit: 3 },
  { id: asId('lect-2'), type: 'lecture', course: MOCK_COURSES[0], ay: 2026, sem: 'first', professor: MOCK_PROFESSORS[1], classes: [MOCK_CLASSES[2], MOCK_CLASSES[3]], hours: 1.25, lab_hours: 0, credit: 3 },
  
  // Network (MOCK_COURSES[1])
  { id: asId('lect-3'), type: 'lecture', course: MOCK_COURSES[1], ay: 2026, sem: 'first', professor: MOCK_PROFESSORS[2], classes: [MOCK_CLASSES[4]], hours: 1.25, lab_hours: 0, credit: 3 },
  { id: asId('lect-4'), type: 'lecture', course: MOCK_COURSES[1], ay: 2026, sem: 'first', professor: MOCK_PROFESSORS[3], classes: [MOCK_CLASSES[5]], hours: 1.25, lab_hours: 0, credit: 3 },

  // DB (MOCK_COURSES[2])
  { id: asId('lect-5'), type: 'lecture', course: MOCK_COURSES[2], ay: 2026, sem: 'first', professor: MOCK_PROFESSORS[4], classes: [MOCK_CLASSES[6]], hours: 1.25, lab_hours: 0, credit: 3 },

  // SE (MOCK_COURSES[3])
  { id: asId('lect-6'), type: 'lecture', course: MOCK_COURSES[3], ay: 2026, sem: 'first', professor: MOCK_PROFESSORS[5], classes: [MOCK_CLASSES[7]], hours: 1.25, lab_hours: 0, credit: 3 },
];


export const getCourse = (id: string) => MOCK_COURSES.find(c => c.id === id);
export const getProfessor = (id: string) => MOCK_PROFESSORS.find(p => p.id === id);
export const getLecturesByCourse = (courseId: string) => MOCK_LECTURES.filter(l => l.course.id === courseId);
export const getLectureClass = (id: string) => MOCK_CLASSES.find(c => c.id === id);
export const getPeriod = (id: string) => MOCK_PERIODS.find(p => p.id === id);
export const getClassRoom = (id: string) => MOCK_ROOMS.find(r => r.id === id);
export const getBuilding = (id: string) => MOCK_BUILDINGS.find(b => b.id === id);
export const getLectureByPeriod = (periodId: string) => {
  return MOCK_LECTURES.find(lect => 
    lect.classes.some(cls => {
      const lectureClass = getLectureClass(cls.id);
      return lectureClass?.periods.some(p => (p as MockPeriod).id === periodId);
    })
  );
};

export const INITIAL_CART_LECTURES: Lecture[] = [
  MOCK_LECTURES[0], // OS
  MOCK_LECTURES[2], // Network
  MOCK_LECTURES[4], // DB
  MOCK_LECTURES[5], // SE
];
