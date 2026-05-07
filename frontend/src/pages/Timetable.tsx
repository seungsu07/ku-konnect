import React, { useState, useEffect, useRef } from 'react';
import styles from './Timetable.module.css';
import LeftPanel from '../components/Timetable/LeftPanel';
import CenterPanel from '../components/Timetable/CenterPanel';
import RightPanel from '../components/Timetable/RightPanel';
import { Loader2, AlertCircle } from 'lucide-react';

import type { TimeTable, Lecture, Preferences } from '../../../common/models';
import type { WorkerInput, WorkerOutput } from '../workers/timetableWorker';

const Timetable: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [currentAlternativeIndex, setCurrentAlternativeIndex] = useState(0);
  const [generatedTimetables, setGeneratedTimetables] = useState<TimeTable[]>([]);
  const [deadEndReason, setDeadEndReason] = useState<string | null>(null);

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

      </div>
    </div>
  );
};

export default Timetable;
