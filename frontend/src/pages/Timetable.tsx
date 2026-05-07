import React, { useState, useEffect, useRef } from 'react';
import styles from './Timetable.module.css';
import LeftPanel from '../components/Timetable/LeftPanel';
import CenterPanel from '../components/Timetable/CenterPanel';
import RightPanel from '../components/Timetable/RightPanel';
import { Loader2 } from 'lucide-react';

import { MOCK_LECTURES } from '../data/mockData';

const DUMMY_TIMETABLE_ALTERNATIVES = [
  {
    id: 1,
    name: '대안 1 (공강 위주)',
    lectures: [
      MOCK_LECTURES[0],
      MOCK_LECTURES[1],
      MOCK_LECTURES[2],
      MOCK_LECTURES[3],
      MOCK_LECTURES[4],
    ]
  },
  {
    id: 2,
    name: '대안 2 (오전 배제)',
    lectures: [
      MOCK_LECTURES[5],
      MOCK_LECTURES[6],
      MOCK_LECTURES[7],
    ]
  },
  {
    id: 3,
    name: '대안 3 (이동 최소화)',
    lectures: [
      MOCK_LECTURES[8],
      MOCK_LECTURES[9],
      MOCK_LECTURES[10],
      MOCK_LECTURES[11],
    ]
  }
];

import type { TimeTable, Lecture, Preferences } from '../../../common/models';
import { SAVED_TIMETABLES } from '../data/mockData';
import type { WorkerInput, WorkerOutput } from '../workers/timetableWorker';

const Timetable: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [currentAlternativeIndex, setCurrentAlternativeIndex] = useState(0);
  const [generatedTimetables, setGeneratedTimetables] = useState<TimeTable[]>([]);
  const [deadEndReason, setDeadEndReason] = useState<string | null>(null);

  // View/Create modes
  const [mode, setMode] = useState<'view' | 'create'>('view');
  const [savedTimetables, setSavedTimetables] = useState<TimeTable[]>(SAVED_TIMETABLES);
  const [activeSavedIndex, setActiveSavedIndex] = useState<number>(0);

  const workerRef = useRef<Worker | null>(null);

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

  const handleNextAlternative = () => {
    if (currentAlternativeIndex < generatedTimetables.length - 1) {
      setCurrentAlternativeIndex(prev => prev + 1);
    }
  };

  return (
    <div className={styles.container}>
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
                  <p className={styles.loadingDesc}>15,302개의 조합을 탐색하고 있습니다.</p>
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
