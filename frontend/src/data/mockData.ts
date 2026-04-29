import type { Course, Lecture, Professor, Period, ClassRoom, Building, LectureClass } from '../../../common/models';

export const MOCK_COURSES: Course[] = [
  { id: 'COSE213', name: '알고리즘', required: true, course_type: 'major' },
  { id: 'COSE341', name: '운영체제', required: true, course_type: 'major' },
  { id: 'COSE371', name: '데이터베이스', required: true, course_type: 'major' },
  { id: 'COSE361', name: '인공지능', required: false, course_type: 'major' },
  { id: 'COSE342', name: '컴퓨터네트워크', required: true, course_type: 'major' },
  { id: 'COSE312', name: '소프트웨어공학', required: false, course_type: 'major' },
  { id: 'COSE331', name: '컴퓨터그래픽스', required: false, course_type: 'major' },
  { id: 'GEOG121', name: '서양미술사', required: false, course_type: 'general' },
  { id: 'INTS101', name: '인사이드파이썬', required: false, course_type: 'inter' },
];

export const MOCK_PROFESSORS: Professor[] = [
  { id: 'prof-1', name: '김정석', tel: '', mail: '' },
  { id: 'prof-2', name: '유혁', tel: '', mail: '' },
  { id: 'prof-3', name: '김상원', tel: '', mail: '' },
  { id: 'prof-4', name: '이성환', tel: '', mail: '' },
  { id: 'prof-5', name: '유민수', tel: '', mail: '' },
  { id: 'prof-6', name: '최진영', tel: '', mail: '' },
  { id: 'prof-7', name: '신동빈', tel: '', mail: '' },
  { id: 'prof-8', name: '홍길동', tel: '', mail: '' },
  { id: 'prof-9', name: '박철수', tel: '', mail: '' },
];

export const MOCK_BUILDINGS: Building[] = [
  { id: 'bldg-1', name: '정보통신관', location: [0, 0] },
  { id: 'bldg-2', name: '신공학관', location: [0, 0] },
  { id: 'bldg-3', name: '우당교양관', location: [0, 0] },
];

export const MOCK_ROOMS: ClassRoom[] = [
  { id: 'rm-1', bldg_id: 'bldg-1', room: '206호' },
  { id: 'rm-2', bldg_id: 'bldg-2', room: '101호' },
  { id: 'rm-3', bldg_id: 'bldg-3', room: '403호' },
  { id: 'rm-4', bldg_id: 'bldg-2', room: '202호' },
  { id: 'rm-5', bldg_id: 'bldg-1', room: '105호' },
  { id: 'rm-6', bldg_id: 'bldg-2', room: 'B101호' },
  { id: 'rm-7', bldg_id: 'bldg-3', room: '203호' },
  { id: 'rm-8', bldg_id: 'bldg-1', room: '301호' },
  { id: 'rm-9', bldg_id: 'bldg-2', room: '205호' },
  { id: 'rm-10', bldg_id: 'bldg-3', room: '102호' },
];

export const MOCK_PERIODS: Period[] = [
  // 대안 1
  { id: 'pd-1', class_code: 'cls-1', day: 'mon', time: 9, room_code: 'rm-1' },
  { id: 'pd-1-2', class_code: 'cls-1', day: 'wed', time: 9, room_code: 'rm-1' },
  { id: 'pd-2', class_code: 'cls-2', day: 'mon', time: 10.5, room_code: 'rm-2' },
  { id: 'pd-2-2', class_code: 'cls-2', day: 'wed', time: 10.5, room_code: 'rm-2' },
  { id: 'pd-3', class_code: 'cls-3', day: 'wed', time: 13, room_code: 'rm-3' },
  { id: 'pd-4', class_code: 'cls-4', day: 'wed', time: 14.5, room_code: 'rm-4' },
  { id: 'pd-5', class_code: 'cls-5', day: 'thu', time: 10.5, room_code: 'rm-1' },

  // 대안 2
  { id: 'pd-6', class_code: 'cls-6', day: 'tue', time: 13, room_code: 'rm-5' },
  { id: 'pd-7', class_code: 'cls-7', day: 'thu', time: 15, room_code: 'rm-6' },
  { id: 'pd-8', class_code: 'cls-8', day: 'fri', time: 13, room_code: 'rm-7' },

  // 대안 3
  { id: 'pd-9', class_code: 'cls-9', day: 'mon', time: 10, room_code: 'rm-8' },
  { id: 'pd-10', class_code: 'cls-10', day: 'mon', time: 12, room_code: 'rm-8' },
  { id: 'pd-11', class_code: 'cls-11', day: 'tue', time: 10, room_code: 'rm-9' },
  { id: 'pd-12', class_code: 'cls-12', day: 'wed', time: 10, room_code: 'rm-10' },
];

export const MOCK_CLASSES: LectureClass[] = [
  { id: 'cls-1', lect_code: 'lect-1', periods: ['pd-1'] },
  { id: 'cls-2', lect_code: 'lect-2', periods: ['pd-2'] },
  { id: 'cls-3', lect_code: 'lect-3', periods: ['pd-3'] },
  { id: 'cls-4', lect_code: 'lect-4', periods: ['pd-4'] },
  { id: 'cls-5', lect_code: 'lect-5', periods: ['pd-5'] },
  { id: 'cls-6', lect_code: 'lect-6', periods: ['pd-6'] },
  { id: 'cls-7', lect_code: 'lect-7', periods: ['pd-7'] },
  { id: 'cls-8', lect_code: 'lect-8', periods: ['pd-8'] },
  { id: 'cls-9', lect_code: 'lect-9', periods: ['pd-9'] },
  { id: 'cls-10', lect_code: 'lect-10', periods: ['pd-10'] },
  { id: 'cls-11', lect_code: 'lect-11', periods: ['pd-11'] },
  { id: 'cls-12', lect_code: 'lect-12', periods: ['pd-12'] },
];

export const MOCK_LECTURES: Lecture[] = [
  // 대안 1
  { id: 'lect-1', course_code: 'COSE213', ay: 2026, sem: 'first', prof_id: 'prof-1', dept_code: 'CSE', classes: ['cls-1'], hours: 1.5, lab_hours: 0, credit: 3 },
  { id: 'lect-2', course_code: 'COSE341', ay: 2026, sem: 'first', prof_id: 'prof-2', dept_code: 'CSE', classes: ['cls-2'], hours: 1.5, lab_hours: 0, credit: 3 },
  { id: 'lect-3', course_code: 'COSE371', ay: 2026, sem: 'first', prof_id: 'prof-3', dept_code: 'CSE', classes: ['cls-3'], hours: 1.5, lab_hours: 0, credit: 3 },
  { id: 'lect-4', course_code: 'COSE361', ay: 2026, sem: 'first', prof_id: 'prof-4', dept_code: 'CSE', classes: ['cls-4'], hours: 1.5, lab_hours: 0, credit: 3 },
  { id: 'lect-5', course_code: 'COSE342', ay: 2026, sem: 'first', prof_id: 'prof-5', dept_code: 'CSE', classes: ['cls-5'], hours: 1.5, lab_hours: 0, credit: 3 },
  { id: 'lect-6', course_code: 'COSE213', ay: 2026, sem: 'first', prof_id: 'prof-1', dept_code: 'CSE', classes: ['cls-6'], hours: 1.5, lab_hours: 0, credit: 3 },
  { id: 'lect-7', course_code: 'COSE341', ay: 2026, sem: 'first', prof_id: 'prof-2', dept_code: 'CSE', classes: ['cls-7'], hours: 1.5, lab_hours: 0, credit: 3 },
  { id: 'lect-8', course_code: 'GEOG121', ay: 2026, sem: 'first', prof_id: 'prof-8', dept_code: 'GEO', classes: ['cls-8'], hours: 1.5, lab_hours: 0, credit: 2 },
  { id: 'lect-9', course_code: 'COSE213', ay: 2026, sem: 'first', prof_id: 'prof-1', dept_code: 'CSE', classes: ['cls-9'], hours: 1.5, lab_hours: 0, credit: 3 },
  { id: 'lect-10', course_code: 'COSE341', ay: 2026, sem: 'first', prof_id: 'prof-2', dept_code: 'CSE', classes: ['cls-10'], hours: 1.5, lab_hours: 0, credit: 3 },
  { id: 'lect-11', course_code: 'COSE371', ay: 2026, sem: 'first', prof_id: 'prof-3', dept_code: 'CSE', classes: ['cls-11'], hours: 1.5, lab_hours: 0, credit: 3 },
  { id: 'lect-12', course_code: 'INTS101', ay: 2026, sem: 'first', prof_id: 'prof-9', dept_code: 'INT', classes: ['cls-12'], hours: 1.5, lab_hours: 0, credit: 3 },
  
  // 장바구니에 담길 과목
  { id: 'lect-13', course_code: 'COSE312', ay: 2026, sem: 'first', prof_id: 'prof-6', dept_code: 'CSE', classes: [], hours: 3, lab_hours: 0, credit: 3 },
  { id: 'lect-14', course_code: 'COSE331', ay: 2026, sem: 'first', prof_id: 'prof-7', dept_code: 'CSE', classes: [], hours: 3, lab_hours: 0, credit: 3 },
];

export const getCourse = (id: string) => MOCK_COURSES.find(c => c.id === id);
export const getProfessor = (id: string) => MOCK_PROFESSORS.find(p => p.id === id);
export const getLectureClass = (id: string) => MOCK_CLASSES.find(c => c.id === id);
export const getPeriod = (id: string) => MOCK_PERIODS.find(p => p.id === id);
export const getClassRoom = (id: string) => MOCK_ROOMS.find(r => r.id === id);
export const getBuilding = (id: string) => MOCK_BUILDINGS.find(b => b.id === id);

export const INITIAL_CART_LECTURES: Lecture[] = [
  MOCK_LECTURES[0], // 알고리즘
  MOCK_LECTURES[1], // 운영체제
  MOCK_LECTURES[2], // 데이터베이스
  MOCK_LECTURES[3], // 인공지능
  MOCK_LECTURES[4], // 컴퓨터네트워크
  MOCK_LECTURES[12], // 소프트웨어공학
  MOCK_LECTURES[13], // 컴퓨터그래픽스
];
