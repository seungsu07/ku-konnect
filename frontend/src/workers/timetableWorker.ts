import type { Lecture, Preferences, TimeTable, Day, EntityID, Period } from '../../../common/models';
import { getLectureClass, getClassRoom, getBuilding, getLectures, getLectureClasses, getLecture, createTimeTable } from '../api/data';

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

self.onmessage = (e: MessageEvent<WorkerInput>) => {
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

  const classArrays: EntityID<'lecture_class'>[][] = uniqueCourseIds.map(cid => {
    // Collect ALL lectures for this course, not just the ones explicitly in the basket
    const lectures = getLectures({ course: cid });
    const classIds = lectures.flatMap(l => getLectureClasses({ lecture: l.id }).map(({ id }) => id));
    return [NULL_ID, ...classIds];
  });

  interface Candidate {
    classes: EntityID<'lecture_class'>[]; // lecture_class IDs (excluding NULL_ID)
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

  const combinations = cartesianProduct(classArrays);

  combinations.forEach(classCombo => {
    let isValid = true;
    let periods: (Period & { duration: number })[] = [];
    const scheduledByDay: Record<string, {start: number, end: number}[]> = {
      sun: [], mon: [], tue: [], wed: [], thu: [], fri: [], sat: []
    };
    const activeClasses = classCombo.filter(id => id !== NULL_ID);

    if (activeClasses.length === 0) return; // Skip completely empty timetables

    // Extract periods for this combination
    for (const clsId of activeClasses) {
        const cls = getLectureClass({ id: clsId });
        if (!cls) continue;
        
        const lecture = getLecture({ id: cls.lecture });
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

      // Check Days Off
      const daysOffSet = new Set(Object.keys(prefs.days_off.value).filter(k => prefs.days_off.value[k as Day]));
      if (periods.some(p => daysOffSet.has(p.day))) {
        deadEndCounts.dayOff++;
        return;
      }

      // Check Lunch Time Preserve
      if (prefs.lunch_time_preserve.priority.lock) {
        if (periods.some(p => p.time >= LUNCH_MIN && p.time < LUNCH_MAX)) {
          deadEndCounts.lunch++;
          return;
        }
      }

      // Check Banned Cells
      // a class takes roughly 1.25 hours, so check all hours it spans
      if (periods.some(p => {
        const dayIdx = DISPLAY_DAYS.indexOf(p.day);
        const tStart = Math.floor(p.time);
        const tEnd = Math.floor(p.time + p.duration - 0.01);
        for (let t = tStart; t <= tEnd; t++) {
          const cellKey = `${dayIdx}-${t}`;
          if (bannedCells[cellKey]) return true;
        }
        return false;
      })) {
        deadEndCounts.banned++;
        return;
      }

      // Penalty Calculation
      let penalty = 0;

    // Course Missing Penalty (Soft)
    classCombo.forEach((clsId, courseIndex) => {
      if (clsId === NULL_ID) {
        const cid = uniqueCourseIds[courseIndex];
        const rank = coursePriority.get(cid)!;
        penalty += (basket.length - rank) * 1000;
      }
    });

      // Group periods by day
      const dayPeriods: Record<Day, Period[]> = {
        sun: [], mon: [], tue: [], wed: [], thu: [], fri: [], sat: []
      };
      periods.forEach(p => dayPeriods[p.day].push(p));

      // Calculate Compactness, Campus Closeness, Avoid Morning
      let compactPenalty = 0;
      let campusPenalty = 0;
      let morningPenalty = 0;

      DISPLAY_DAYS.forEach(day => {
        const dayP = dayPeriods[day].sort((a, b) => a.time - b.time);
        if (dayP.length === 0) return;

        // Morning
        dayP.forEach(p => {
          if (p.time < 10) morningPenalty += 10;
          else if (p.time < 11.5) morningPenalty += 5;
          else if (p.time < 13) morningPenalty += 1;
        });

        // Compactness & Campus
        for (let i = 0; i < dayP.length - 1; i++) {
          const current = dayP[i];
          const next = dayP[i+1];
          
          // Gap
          const gap = next.time - current.time - 1.5; // Approximate 1.5hr per class
          if (gap > 0.1) {
            compactPenalty += gap;
          }

          // Campus
          const room1 = getClassRoom({ room: current.room });
          const room2 = getClassRoom({ room: next.room });
          if (room1 && room2) {
            const b1 = getBuilding({ id: room1.building });
            const b2 = getBuilding({ id: room2.building });
            if (b1 && b2) {
              const dx = b1.location[0] - b2.location[0];
              const dy = b1.location[1] - b2.location[1];
              const dist = Math.sqrt(dx*dx + dy*dy);
              if (dist > MOVEMENT_THRESHOLD) {
                campusPenalty += (dist - MOVEMENT_THRESHOLD);
              }
            }
          }
        }
      });

      // Apply Weights & Check Hard Constraints at extremes
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
    // Determine the biggest reason
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

  // Sort and pick top 3
  candidates.sort((a, b) => a.penalty - b.penalty);
  const top3 = candidates.slice(0, 3);

  const timetables: TimeTable[] = top3.map((cand, idx) => {
    const timeTable = createTimeTable({
      name: `AI 추천 ${idx + 1}순위 (패널티: ${Math.floor(cand.penalty)})`,
      selected: idx === 0,
      classes: cand.classes,
      visible: false
    });

    return timeTable as TimeTable; // NULL 방어 로직 필요
  });

  self.postMessage({ timetables });
};
