import React, { useState, useEffect, useRef } from 'react';
import styles from './Timetable.module.css';
import LeftPanel from '../components/Timetable/LeftPanel';
import CenterPanel from '../components/Timetable/CenterPanel';
import RightPanel from '../components/Timetable/RightPanel';
import { Loader2, AlertCircle, Plus, Download } from 'lucide-react';

import type { TimeTable, Lecture, Preferences, Period } from '../../../common/models';
import type { WorkerInput, WorkerOutput } from '../workers/timetableWorker';
import { dataApi } from '../api/data';

const Timetable: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [currentAlternativeIndex, setCurrentAlternativeIndex] = useState(0);
  const [generatedTimetables, setGeneratedTimetables] = useState<TimeTable[]>([]);
  const [deadEndReason, setDeadEndReason] = useState<string | null>(null);

  // View/Create modes
  const [mode, setMode] = useState<'view' | 'create'>('view');
  const [savedTimetables, setSavedTimetables] = useState<(TimeTable & { renderableClasses?: any[] })[]>([]);
  const [activeSavedIndex, setActiveSavedIndex] = useState<number>(0);

  const workerRef = useRef<Worker | null>(null);

  const inflateTimetable = async (tt: TimeTable, cache: Map<string, any>): Promise<TimeTable & { renderableClasses: any[] }> => {
    if ((tt as any).renderableClasses) return tt as any;

    const renderableClasses: any[] = [];
    const grouped = new Map<string, any[]>();

    const fetchWithCache = async (key: string, fetcher: () => Promise<any>) => {
      if (cache.has(key)) return cache.get(key);
      const promise = fetcher();
      cache.set(key, promise); // Store promise to avoid duplicate pending requests
      const res = await promise;
      cache.set(key, res);
      return res;
    };

    // Parallelize all classes in the timetable
    await Promise.all(tt.classes.map(async (classId) => {
      const cls = await fetchWithCache(`cls-${classId}`, () => dataApi.getLectureClass({ id: classId as any }));
      if (!cls) return;

      const lecture = await fetchWithCache(`lect-${cls.lecture}`, () => dataApi.getLecture({ id: cls.lecture }));
      if (!lecture) return;

      // Parallelize Course, Professor, and Periods/Rooms/Buildings
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

        if (!grouped.has(classId)) grouped.set(classId, []);
        grouped.get(classId)!.push(entry);
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

  // Fetch saved timetables from API on mount
  useEffect(() => {
    dataApi.getTimeTables({})
      .then(async (fetched: TimeTable[]) => {
        const globalCache = new Map<string, any>();
        const inflated = await Promise.all(fetched.map(tt => inflateTimetable(tt, globalCache)));
        setSavedTimetables(inflated);
        if (inflated.length > 0) {
          const selectedIdx = inflated.findIndex(t => t.selected);
          setActiveSavedIndex(selectedIdx !== -1 ? selectedIdx : 0);
          setMode('view');
        }
      })
      .catch(() => { })
      .finally(() => setIsLoading(false));
  }, []);


  useEffect(() => {
    workerRef.current = new Worker(new URL('../workers/timetableWorker.ts', import.meta.url), { type: 'module' });

    workerRef.current.onmessage = (e: MessageEvent<WorkerOutput>) => {
      const { timetables, reason } = e.data;
      if (timetables.length > 0) {
        setGeneratedTimetables(timetables);
        setDeadEndReason(null);
      } else {
        setGeneratedTimetables([]);
        setDeadEndReason(reason || '알 수 없는 이유로 시간표를 생성하지 못했습니다.');
      }
      setIsGenerating(false);
      setHasGenerated(true);
      setCurrentAlternativeIndex(0);
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const handleGenerate = (basket: Lecture[], prefs: Preferences, bannedCells: Record<string, boolean>) => {
    setIsGenerating(true);
    setHasGenerated(false);

    const input: WorkerInput = { basket, prefs, bannedCells };
    workerRef.current?.postMessage(input);
  };



  const handlePrevAlternative = () => {
    if (currentAlternativeIndex > 0) {
      setCurrentAlternativeIndex(prev => prev - 1);
    }
  };

  const handleSaveTimetable = async (timeTable: TimeTable) => {
    const customName = prompt('저장할 시간표의 이름을 입력해주세요:', timeTable.name);
    if (!customName || !customName.trim()) return;

    setIsSaving(true);
    try {
      const res = await dataApi.createTimeTable({
        name: customName.trim(),
        selected: savedTimetables.length === 0, // 첫 시간표면 자동 선택
        classes: timeTable.classes,
        visible: false,
      });

      if (res.success) {
        const newTimetable = res.data as TimeTable;
        // Re-attach renderableClasses from the source to avoid re-inflating
        const finalTimetable = { ...newTimetable, renderableClasses: (timeTable as any).renderableClasses };

        setSavedTimetables(prev => {
          const updated = [...prev, finalTimetable];
          setActiveSavedIndex(updated.length - 1);
          return updated;
        });
        setMode('view');
        alert('시간표가 성공적으로 저장되었습니다!');
      } else {
        const errMsg = (res as any).e;
        if (errMsg === 'unauthorized') {
          alert('로그인이 필요합니다. 먼저 로그인해주세요!');
        } else {
          alert(`저장에 실패했습니다: ${errMsg || '알 수 없는 오류'}`);
        }
      }
    } catch (err: any) {
      alert(`저장 중 오류가 발생했습니다: ${err.message || '네트워크 오류'}`);
    } finally {
      setIsSaving(false);
    }
  };



  const handleNextAlternative = () => {
    if (currentAlternativeIndex < generatedTimetables.length - 1) {
      setCurrentAlternativeIndex(prev => prev + 1);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.wrapper} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <div style={{ textAlign: 'center' }}>
            <Loader2 className={styles.spinner} size={48} />
            <h3 style={{ marginTop: '16px', color: '#666' }}>시간표 불러오는 중...</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {isSaving && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px 48px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <Loader2 className={styles.spinner} size={36} />
            <p style={{ marginTop: '16px', fontWeight: 600, color: '#333' }}>시간표 저장 중...</p>
          </div>
        </div>
      )}
      <div className={styles.wrapper}>

        {mode === 'create' ? (
          <>
            {/* Left Panel - 2.5/10 */}
            <div className={styles.leftPanel}>
              <LeftPanel onGenerate={handleGenerate} />
            </div>

            {/* Center Panel - 5/10 */}
            <div className={styles.centerPanel}>
              {isGenerating ? (
                <div className={styles.loadingContainer}>
                  <Loader2 className={styles.spinner} size={48} />
                  <h3 className={styles.loadingTitle}>AI 최적 시간표 생성 중...</h3>
                  <p className={styles.loadingDesc}>최적의 시간표를 탐색하고 있습니다.</p>
                </div>
              ) : !hasGenerated ? (
                <div className={styles.emptyContainer}>
                  <div className={styles.emptyIcon}>✨</div>
                  <h3 className={styles.emptyTitle}>AI 시간표 설계를 시작해보세요</h3>
                  <p className={styles.emptyDesc}>
                    조건을 설정하고 생성하기 버튼을 누르면 나만의 맞춤 시간표를 추천해드립니다.
                  </p>
                </div>
              ) : deadEndReason ? (
                <div className={styles.emptyContainer} style={{ background: '#fef2f2', borderColor: '#fca5a5' }}>
                  <div className={styles.emptyIcon} style={{ color: '#ef4444' }}><AlertCircle size={48} /></div>
                  <h3 className={styles.emptyTitle} style={{ color: '#991b1b' }}>시간표 생성 실패</h3>
                  <p className={styles.emptyDesc} style={{ color: '#b91c1c', maxWidth: '80%' }}>
                    {deadEndReason}
                  </p>
                </div>
              ) : (
                <CenterPanel
                  timeTable={generatedTimetables[currentAlternativeIndex]}
                  mode="create"
                  currentIndex={currentAlternativeIndex}
                  totalAlternatives={generatedTimetables.length}
                  onPrev={handlePrevAlternative}
                  onNext={handleNextAlternative}
                  onSave={handleSaveTimetable}
                />
              )}
            </div>

            {/* Right Panel - 2.5/10 */}
            <div className={styles.rightPanel}>
              <RightPanel />
            </div>
          </>
        ) : (
          /* View Mode Layout (Center Only) */
          <div className={styles.centerPanel} style={{ gridColumn: '2 / 3' }}>
            {savedTimetables.length === 0 ? (
              <div className={styles.emptyContainer}>
                <div className={styles.emptyIcon}>📅</div>
                <h3 className={styles.emptyTitle}>아직 저장된 시간표가 없습니다</h3>
                <p className={styles.emptyDesc}>새로운 시간표를 만들거나 기존 시간표를 불러와보세요.</p>

                <button
                  className={styles.primaryActionBtn}
                  onClick={() => setMode('create')}
                  style={{ marginTop: '24px', padding: '16px 32px', fontSize: '1.1rem', borderRadius: '12px', background: '#ff3131', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}
                >
                  <Plus size={24} /> 새 시간표 만들기
                </button>

                <button
                  className={styles.secondaryActionBtn}
                  style={{ marginTop: '16px', padding: '10px 20px', fontSize: '0.95rem', borderRadius: '8px', background: 'transparent', color: '#666', border: '1px solid #ddd', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Download size={18} /> 시간표 불러오기
                </button>
              </div>
            ) : (
              <CenterPanel
                timeTable={savedTimetables[activeSavedIndex]}
                mode="view"
                savedTimetables={savedTimetables}
                onSelectTimetable={(id) => {
                  const idx = savedTimetables.findIndex(t => t.id === id);
                  if (idx !== -1) setActiveSavedIndex(idx);
                }}
                onCreateNew={() => setMode('create')}
              />
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default Timetable;
