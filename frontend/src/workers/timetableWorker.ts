import type { Lecture, Preferences, TimeTable, Day, EntityID, Period } from '../../../common/models';
import { getClassRoom, getBuilding, getLectures, getLectureClasses, getCourse, getProfessor } from '../api/data';

export interface WorkerInput {
  basket: Lecture[];
  prefs: Preferences;
  bannedCells: Record<string, boolean>;
}

export interface WorkerOutput {
  timetables: TimeTable[];
  reason?: string;
}

const DISPLAY_DAYS: Day[] = ['mon', 'tue', 'wed', 'thu', 'fri'];
const LUNCH_MIN = 11.5;
const LUNCH_MAX = 14.0;
const MOVEMENT_THRESHOLD = 20; // Example threshold
const NULL_ID = '0-0-0-0-0';

function cartesianProduct<T>(arrays: T[][]): T[][] {
  if (arrays.length === 0) return [[]];
  return arrays.reduce<T[][]>((a, b) => a.flatMap(x => b.map(y => [...x, y])), [[]]);
}

const getWeight = (val: number) => {
  if (val === 1) return 0;
  if (val === 5) return 1000000; // Extreme penalty / Hard constraint
  if (val === 4) return 500;
  if (val === 3) return 100;
  return 10;
};

self.onmessage = async (e: MessageEvent<WorkerInput>) => {
  const { basket, prefs, bannedCells } = e.data;

  const courseGroups = new Map<EntityID<'course'>, Lecture[]>();
  const coursePriority = new Map<EntityID<'course'>, number>();

  basket.forEach((lect, idx) => {
    const cid = lect.course;
    if (!courseGroups.has(cid)) {
      courseGroups.set(cid, []);
      coursePriority.set(cid, idx);
    }
    courseGroups.get(cid)!.push(lect);
  });

  const uniqueCourseIds = Array.from(courseGroups.keys());

  // === 1. PRE-FETCH CACHING PHASE ===
  const lectureMap = new Map<EntityID<'lecture'>, Lecture>();
  const classMap = new Map<EntityID<'lecture_class'>, import('../../../common/models').LectureClass>();
  const roomMap = new Map<EntityID<'class_room'>, import('../../../common/models').ClassRoom>();
  const buildingMap = new Map<EntityID<'building'>, import('../../../common/models').Building>();
  const courseMap = new Map<EntityID<'course'>, import('../../../common/models').Course>();
  const professorMap = new Map<EntityID<'professor'>, import('../../../common/models').Professor>();

  const classArrays: EntityID<'lecture_class'>[][] = [];

  for (const cid of uniqueCourseIds) {
    const course = await getCourse({ id: cid });
    if (course) courseMap.set(cid, course);

    const lectures = await getLectures({ course: cid });
    const classIds: EntityID<'lecture_class'>[] = [];

    for (const l of lectures) {
      lectureMap.set(l.id, l);

      if (l.professor && !professorMap.has(l.professor)) {
        const prof = await getProfessor({ id: l.professor });
        if (prof) professorMap.set(l.professor, prof);
      }

      const classes = await getLectureClasses({ lecture: l.id });
      for (const cls of classes) {
        classMap.set(cls.id, cls);
        classIds.push(cls.id);

        for (const p of cls.periods) {
          if (!roomMap.has(p.room)) {
            const room = await getClassRoom({ id: p.room });
            if (room) {
              roomMap.set(room.id, room);
              if (!buildingMap.has(room.building)) {
                const bld = await getBuilding({ id: room.building });
                if (bld) buildingMap.set(bld.id, bld);
              }
            }
          }
        }
      }
    }
    classArrays.push([NULL_ID as EntityID<'lecture_class'>, ...classIds]);
  }

  // === 2. COMBINATION & FILTERING PHASE ===
  interface Candidate {
    classes: EntityID<'lecture_class'>[];
    penalty: number;
  }

  let candidates: Candidate[] = [];
  const deadEndCounts = {
    overlap: 0,
    dayOff: 0,
    lunch: 0,
    banned: 0,
    hardMorning: 0,
    hardCompact: 0,
    hardCampus: 0,
  };

  // 데카르트 곱(Cartesian Product)으로 모든 분반 경우의 수 생성
  const combinations = cartesianProduct(classArrays);

  combinations.forEach(classCombo => {
    let isValid = true;
    let periods: (Period & { duration: number })[] = [];
    const scheduledByDay: Record<string, { start: number, end: number }[]> = {
      sun: [], mon: [], tue: [], wed: [], thu: [], fri: [], sat: []
    };
    const activeClasses = classCombo.filter(id => id !== NULL_ID);

    if (activeClasses.length === 0) return;

    for (const clsId of activeClasses) {
      const cls = classMap.get(clsId);
      if (!cls) continue;

      const lecture = lectureMap.get(cls.lecture);
      const duration = lecture ? lecture.hours / cls.periods.length : 1.5;

      for (const p of cls.periods) {
        const start = p.time;
        const end = start + duration;

        const collision = scheduledByDay[p.day].some(existing =>
          (start < existing.end && end > existing.start)
        );

        if (collision) {
          isValid = false;
          deadEndCounts.overlap++;
          break;
        }
        scheduledByDay[p.day].push({ start, end });
        periods.push({ ...p, duration });
      }
      if (!isValid) break;
    }
    if (!isValid) return;

    const daysOffSet = new Set(Object.keys(prefs.days_off.value).filter(k => prefs.days_off.value[k as Day]));
    if (periods.some(p => daysOffSet.has(p.day))) {
      deadEndCounts.dayOff++;
      return;
    }

    if (prefs.lunch_time_preserve.priority.lock) {
      if (periods.some(p => p.time >= LUNCH_MIN && p.time < LUNCH_MAX)) {
        deadEndCounts.lunch++;
        return;
      }
    }

    if (periods.some(p => {
      const dayIdx = DISPLAY_DAYS.indexOf(p.day);
      const tStart = Math.floor(p.time);
      const tEnd = Math.floor(p.time + (p as any).duration - 0.01);
      for (let t = tStart; t <= tEnd; t++) {
        const cellKey = `${dayIdx}-${t}`;
        if (bannedCells[cellKey]) return true;
      }
      return false;
    })) {
      deadEndCounts.banned++;
      return;
    }

    let penalty = 0;

    classCombo.forEach((clsId, courseIndex) => {
      if (clsId === NULL_ID) {
        const cid = uniqueCourseIds[courseIndex];
        const rank = coursePriority.get(cid)!;
        penalty += (basket.length - rank) * 1000;
      }
    });

    const dayPeriods: Record<Day, (Period & { duration: number })[]> = {
      sun: [], mon: [], tue: [], wed: [], thu: [], fri: [], sat: []
    };
    periods.forEach(p => dayPeriods[p.day].push(p));

    let compactPenalty = 0;
    let campusPenalty = 0;
    let morningPenalty = 0;

    DISPLAY_DAYS.forEach(day => {
      const dayP = dayPeriods[day].sort((a, b) => a.time - b.time);
      if (dayP.length === 0) return;

      dayP.forEach(p => {
        if (p.time < 10) morningPenalty += 10;
        else if (p.time < 11.5) morningPenalty += 5;
        else if (p.time < 13) morningPenalty += 1;
      });

      for (let i = 0; i < dayP.length - 1; i++) {
        const current = dayP[i];
        const next = dayP[i + 1];

        const gap = next.time - current.time - 1.5;
        if (gap > 0.1) {
          compactPenalty += gap;
        }

        const room1 = roomMap.get(current.room);
        const room2 = roomMap.get(next.room);
        if (room1 && room2) {
          const b1 = buildingMap.get(room1.building);
          const b2 = buildingMap.get(room2.building);
          if (b1 && b2) {
            const dx = b1.location[0] - b2.location[0];
            const dy = b1.location[1] - b2.location[1];
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > MOVEMENT_THRESHOLD) {
              campusPenalty += (dist - MOVEMENT_THRESHOLD);
            }
          }
        }
      }
    });

    if (prefs.avoid_morning.value === 5 && morningPenalty > 0) {
      deadEndCounts.hardMorning++;
      return;
    }
    if (prefs.compactness.value === 5 && compactPenalty > 0) {
      deadEndCounts.hardCompact++;
      return;
    }
    if (prefs.campus_closeness.value === 5 && campusPenalty > 0) {
      deadEndCounts.hardCampus++;
      return;
    }

    penalty += morningPenalty * getWeight(prefs.avoid_morning.value);
    penalty += compactPenalty * getWeight(prefs.compactness.value);
    penalty += campusPenalty * getWeight(prefs.campus_closeness.value);

    candidates.push({
      classes: activeClasses,
      penalty
    });
  });

  if (candidates.length === 0) {
    let maxReason = '알 수 없는 이유';
    let maxCount = -1;
    for (const [key, val] of Object.entries(deadEndCounts)) {
      if (val > maxCount) {
        maxCount = val;
        maxReason = key;
      }
    }

    let reasonMsg = '';
    if (maxReason === 'overlap') reasonMsg = '수업 시간 겹침';
    else if (maxReason === 'dayOff') reasonMsg = '공강 요일 설정';
    else if (maxReason === 'lunch') reasonMsg = '점심시간 보장 설정';
    else if (maxReason === 'banned') reasonMsg = '개인 일정 제한 영역';
    else if (maxReason === 'hardMorning') reasonMsg = '오전 수업 절대 회피 조건(5단계)';
    else if (maxReason === 'hardCompact') reasonMsg = '우주공강 절대 불가 조건(5단계)';
    else if (maxReason === 'hardCampus') reasonMsg = '캠퍼스 이동 불가 조건(5단계)';

    self.postMessage({
      timetables: [],
      reason: `${reasonMsg} 때문에 가능한 시간표 조합이 없습니다. 조건을 완화해 보세요!`
    });
    return;
  }

  candidates.sort((a, b) => a.penalty - b.penalty);
  const top3 = candidates.slice(0, 3);

  const timetables: any[] = top3.map((cand, idx) => {
    const grouped = new Map<EntityID<'lecture_class'>, any[]>();

    cand.classes.forEach(classId => {
      const cls = classMap.get(classId)!;
      const lecture = lectureMap.get(cls.lecture)!;
      const duration = lecture.hours / cls.periods.length;
      const course = courseMap.get(lecture.course);
      const professor = lecture.professor ? professorMap.get(lecture.professor) : undefined;

      cls.periods.forEach(period => {
        const room = roomMap.get(period.room);
        const building = room ? buildingMap.get(room.building) : undefined;

        const entry = {
          id: `${classId}-${period.day}-${period.time}`,
          lectureId: lecture.id,
          courseName: course?.name || '알 수 없음',
          courseCode: course?.code || '----',
          courseType: course?.course_type || 'major',
          credit: lecture.credit,
          profName: professor?.name || '미지정',
          day: period.day,
          start: period.time,
          end: period.time + duration,
          location: `${building?.name || ''} ${room?.room || ''}`.trim(),
          warning: false
        };
        if (!grouped.has(classId)) grouped.set(classId, []);
        grouped.get(classId)!.push(entry);
      });
    });

    const renderableClasses: any[] = [];
    grouped.forEach(list => {
      const dayGroups = new Map<Day, any[]>();
      list.forEach(entry => {
        if (!dayGroups.has(entry.day)) dayGroups.set(entry.day, []);
        dayGroups.get(entry.day)!.push(entry);
      });

      dayGroups.forEach(dayList => {
        dayList.sort((a, b) => a.start - b.start);
        let current = dayList[0];
        for (let i = 1; i < dayList.length; i++) {
          const next = dayList[i];
          if (next.start - current.end <= 0.3) {
            current.end = next.end;
          } else {
            renderableClasses.push(current);
            current = next;
          }
        }
        renderableClasses.push(current);
      });
    });

    return {
      id: crypto.randomUUID() as any,
      type: 'time_table',
      name: `AI 추천 ${idx + 1}순위`,
      selected: idx === 0,
      classes: cand.classes,
      user: NULL_ID as any,
      visible: false,
      renderableClasses
    };
  });

  self.postMessage({ timetables });
};
