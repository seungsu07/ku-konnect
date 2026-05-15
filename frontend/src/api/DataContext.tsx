import React, { createContext, useState, useEffect, type ReactNode } from 'react';
import { dataApi } from './data';
import type { TimeTable, Period } from '../../../common/models';

export interface SubjectBoard {
  id: string;
  realBoardId?: string;
  name: string;
  prof: string;
  code: string;
  newPosts: number;
}

export interface AppDataContextType {
  savedTimetables: (TimeTable & { renderableClasses?: any[] })[];
  subjectBoards: SubjectBoard[];
  userProfile: any | null;
  isDataLoading: boolean;
  refreshData: (silent?: boolean) => Promise<void>;
}

export const AppDataContext = createContext<AppDataContextType>({
  savedTimetables: [],
  subjectBoards: [],
  userProfile: null,
  isDataLoading: true,
  refreshData: async () => { },
});

const inflateTimetable = async (tt: TimeTable, cache: Map<string, any>): Promise<TimeTable & { renderableClasses: any[] }> => {
  if ((tt as any).renderableClasses) return tt as any;

  const renderableClasses: any[] = [];
  const grouped = new Map<string, any[]>();

  const fetchWithCache = async (key: string, fetcher: () => Promise<any>) => {
    if (cache.has(key)) return cache.get(key);
    const promise = fetcher();
    cache.set(key, promise);
    const res = await promise;
    cache.set(key, res);
    return res;
  };

  await Promise.all(tt.classes.map(async (classId) => {
    const cls = await fetchWithCache(`cls-${classId}`, () => dataApi.getLectureClass({ id: classId as any }));
    if (!cls) return;

    const lecture = await fetchWithCache(`lect-${cls.lecture}`, () => dataApi.getLecture({ id: cls.lecture }));
    if (!lecture) return;

    const [course, professor, ...periodData] = await Promise.all([
      fetchWithCache(`course-${lecture.course}`, () => dataApi.getCourse({ id: lecture.course })),
      lecture.professor ? fetchWithCache(`prof-${lecture.professor}`, () => dataApi.getProfessor({ id: lecture.professor })) : Promise.resolve(undefined),
      ...cls.periods.map(async (period: Period) => {
        const room = await fetchWithCache(`room-${period.room}`, () => dataApi.getClassRoom({ id: period.room }));
        const building = room ? await fetchWithCache(`bld-${room.building}`, () => dataApi.getBuilding({ id: room.building })) : undefined;
        return { period, room, building };
      })
    ]);

    const duration = lecture.hours / (cls.periods.length || 1);

    periodData.forEach(({ period, room, building }) => {
      const entry = {
        id: `${classId}-${period.day}-${period.time}`,
        lectureId: lecture.id,
        courseName: course?.name || '알 수 없음',
        courseCode: course?.code || '----',
        courseType: course?.course_type || 'major',
        credit: lecture.credit,
        profName: professor?.name || '미지정',
        day: period.day,
        start: 9 + (period.time - 1) * 1.5,
        end: 9 + (period.time - 1) * 1.5 + duration,
        location: `${building?.name || ''} ${room?.room || ''}`.trim(),
        warning: false
      };

      if (!grouped.has(classId as string)) grouped.set(classId as string, []);
      grouped.get(classId as string)!.push(entry);
    });
  }));

  grouped.forEach(list => {
    const dayGroups = new Map<string, any[]>();
    list.forEach(entry => {
      if (!dayGroups.has(entry.day)) dayGroups.set(entry.day, []);
      dayGroups.get(entry.day)!.push(entry);
    });

    dayGroups.forEach(dayList => {
      dayList.sort((a, b) => a.start - b.start);
      let current = dayList[0];
      if (!current) return;
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

  return { ...tt, renderableClasses };
};

export const AppDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [savedTimetables, setSavedTimetables] = useState<(TimeTable & { renderableClasses?: any[] })[]>([]);
  const [subjectBoards, setSubjectBoards] = useState<SubjectBoard[]>([]);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const refreshData = async (silent: boolean = false) => {
    if (!silent) setIsDataLoading(true);
    const loginId = localStorage.getItem('login_id');
    if (!loginId) {
      setSavedTimetables([]);
      setSubjectBoards([]);
      setUserProfile(null);
      setIsDataLoading(false);
      return;
    }

    try {
      // 1. Fetch My Profile using the new 'my: true' flag
      const profiles = await dataApi.getUserProfiles({ my: true } as any);
      if (profiles && profiles.length > 0) {
        setUserProfile(profiles[0]);
      }
      // 2. Fetch Timetables
      const timetables = await dataApi.getTimeTables({});

      const globalCache = new Map<string, any>();
      const inflatedTimetables = await Promise.all(timetables.map((tt: TimeTable) => inflateTimetable(tt, globalCache)));
      setSavedTimetables(inflatedTimetables);

      const activeTimetable = inflatedTimetables.find(tt => tt.selected);
      if (activeTimetable) {
        const boards: SubjectBoard[] = [];
        const seenCourses = new Set<string>();

        await Promise.all(activeTimetable.classes.map(async (classId: string) => {
          const cls = await globalCache.get(`cls-${classId}`) || await dataApi.getLectureClass({ id: classId as any });
          if (!cls) return;

          const lecture = await globalCache.get(`lect-${cls.lecture}`) || await dataApi.getLecture({ id: cls.lecture });
          if (!lecture) return;

          if (seenCourses.has(lecture.course)) return;
          seenCourses.add(lecture.course);

          const course = await globalCache.get(`course-${lecture.course}`) || await dataApi.getCourse({ id: lecture.course });
          const professor = lecture.professor
            ? (await globalCache.get(`prof-${lecture.professor}`) || await dataApi.getProfessor({ id: lecture.professor }))
            : null;

          if (!course) return;

          // Try to find a real board for this lecture (backend uses __lectureId__ as board name)
          const boardName = `__${lecture.id}__`;
          const realBoards = await dataApi.getBoards({ name: boardName });
          const realBoard = realBoards.length > 0 ? realBoards[0] : null;

          boards.push({
            id: course.id,
            realBoardId: realBoard?.id,
            name: course.name,
            prof: professor?.name || '미지정',
            code: course.code,
            newPosts: realBoard?.post_count || 0
          });
        }));

        setSubjectBoards(boards);
      } else {
        setSubjectBoards([]);
      }
    } catch (error) {
      console.error('Failed to fetch app data:', error);
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  return (
    <AppDataContext.Provider value={{ savedTimetables, subjectBoards, userProfile, isDataLoading, refreshData }}>
      {children}
    </AppDataContext.Provider>
  );
};
