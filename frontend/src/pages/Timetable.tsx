import React, { useState } from 'react';
import styles from './Timetable.module.css';
import LeftPanel from '../components/Timetable/LeftPanel';
import CenterPanel from '../components/Timetable/CenterPanel';
import RightPanel from '../components/Timetable/RightPanel';
import { Loader2 } from 'lucide-react';

import type { Alternative } from '../../../common/models';
import { MOCK_LECTURES } from '../data/mockData';

const DUMMY_TIMETABLE_ALTERNATIVES: Alternative[] = [
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


const Timetable: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [currentAlternativeIndex, setCurrentAlternativeIndex] = useState(0);

  const handleGenerate = () => {
    setIsGenerating(true);
    setHasGenerated(false);
    
    // Simulate API call and heavy computation
    setTimeout(() => {
      setIsGenerating(false);
      setHasGenerated(true);
      setCurrentAlternativeIndex(0);
    }, 1500);
  };

  const handlePrevAlternative = () => {
    if (currentAlternativeIndex > 0) {
      setCurrentAlternativeIndex(prev => prev - 1);
    }
  };

  const handleNextAlternative = () => {
    if (currentAlternativeIndex < DUMMY_TIMETABLE_ALTERNATIVES.length - 1) {
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
          ) : (
              <CenterPanel 
                alternative={DUMMY_TIMETABLE_ALTERNATIVES[currentAlternativeIndex]}
                currentIndex={currentAlternativeIndex}
                totalAlternatives={DUMMY_TIMETABLE_ALTERNATIVES.length}
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
