import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin, AlertTriangle } from 'lucide-react';
import styles from './CenterPanel.module.css';
import type { Alternative } from '../../../../common/models';
import { DAY_MAPPING } from '../../../../common/models';
import { getCourse, getProfessor, getLectureClass, getPeriod, getBuilding, getClassRoom } from '../../data/mockData';

interface CenterPanelProps {
  alternative: Alternative;
  currentIndex: number;
  totalAlternatives: number;
  onPrev: () => void;
  onNext: () => void;
}


const START_HOUR = 9;
const END_HOUR = 18;

const CenterPanel: React.FC<CenterPanelProps> = ({
  alternative,
  currentIndex,
  totalAlternatives,
  onPrev,
  onNext
}) => {
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  const toggleCardFlip = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFlippedCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getGridColumn = (dayId: string) => {
    const index = DAY_MAPPING.findIndex(d => d.id === dayId);
    return index !== -1 ? index + 2 : 2;
  };

  const getGridRowStart = (time: number) => {
    return Math.round((time - START_HOUR) * 2) + 1;
  };
  
  const getGridRowSpan = (start: number, end: number) => {
    return Math.round((end - start) * 2);
  };

  return (
    <div className={styles.container}>
      {/* 헤더 및 네비게이션 */}
      <div className={styles.header}>
        <div className={styles.title}>{alternative.name}</div>
        <div className={styles.navigation}>
          <button 
            className={styles.navBtn} 
            onClick={onPrev} 
            disabled={currentIndex === 0}
          >
            <ChevronLeft size={20} />
          </button>
          <span className={styles.navText}>대안 {currentIndex + 1} / {totalAlternatives}</span>
          <button 
            className={styles.navBtn} 
            onClick={onNext} 
            disabled={currentIndex === totalAlternatives - 1}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* 시간표 */}
      <div className={styles.timetableWrapper}>
        <div className={styles.gridDays}>
          <div className={styles.dayCell}></div>
          {DAY_MAPPING.map(day => (
            <div key={day.id} className={styles.dayCell}>{day.label}</div>
          ))}
        </div>
        
        <div 
          className={styles.gridBody} 
          style={{ gridTemplateRows: `repeat(${(END_HOUR - START_HOUR) * 2}, 1fr)` }}
        >
          {/* 시간과 그리드 */}
          {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (
            <React.Fragment key={`time-${i}`}>
              <div 
                className={styles.timeLabel} 
                style={{ gridRow: `${i * 2 + 1} / span 2`, gridColumn: 1 }}
              >
                {START_HOUR + i}
              </div>
              {/* Vertical lines */}
              {DAY_MAPPING.map((_, dayIdx) => (
                <div 
                  key={`line-${i}-${dayIdx}`} 
                  className={styles.gridSlot} 
                  style={{ gridRow: `${i * 2 + 1} / span 2`, gridColumn: dayIdx + 2 }}
                />
              ))}
            </React.Fragment>
          ))}

          {/* 시간표 카드 */}
          {(() => {
            const renderableClasses: any[] = [];
            alternative.lectures.forEach(lecture => {
              const course = getCourse(lecture.course_code);
              const professor = getProfessor(lecture.prof_id);

              lecture.classes.forEach(classId => {
                const lectureClass = getLectureClass(classId);
                if (!lectureClass) return;

                lectureClass.periods.forEach((periodId: string) => {
                  const period = getPeriod(periodId);
                  if (!period) return;

                  const room = getClassRoom(period.room_code);
                  const building = room ? getBuilding(room.bldg_id) : undefined;

                  const startTime = period.time;
                  const endTime = period.time + lecture.hours;

                  renderableClasses.push({
                    id: `${lecture.id}-${period.id}`,
                    lectureId: lecture.id,
                    courseName: course?.name || '알 수 없음',
                    courseCode: course?.id || '----',
                    courseType: course?.course_type || 'major',
                    credit: lecture.credit,
                    profName: professor?.name || '미지정',
                    day: period.day,
                    start: startTime,
                    end: endTime,
                    location: `${building?.name || ''} ${room?.room || ''}`.trim(),
                    warning: course?.name === '인공지능'
                  });
                });
              });
            });

            return renderableClasses.map(cls => {
              const warningHoverText = cls.warning 
                ? `이전 수업 위치에서 ${cls.location}까지 도보 약 15분이 예상되어 지각 위험이 있습니다.` 
                : '';
              const isFlipped = flippedCards[cls.lectureId] || false;

              return (
                <div 
                  key={cls.id}
                  className={`${styles.classCard} ${isFlipped ? styles.flipped : ''}`}
                  style={{
                    gridColumn: getGridColumn(cls.day),
                    gridRowStart: getGridRowStart(cls.start),
                    gridRowEnd: `span ${getGridRowSpan(cls.start, cls.end)}`
                  }}
                  onClick={(e) => toggleCardFlip(cls.lectureId, e)}
                >
                  <div className={styles.cardInner}>
                    {/* 앞면 */}
                    <div className={styles.cardFront}>
                      <div className={styles.className}>{cls.courseName}</div>
                      <div className={styles.classLocation}>
                        <MapPin size={12} /> {cls.location}
                      </div>
                      
                      {cls.warning && (
                        <div className={styles.warningBadge}>
                          <AlertTriangle size={10} style={{ marginRight: '4px' }}/> 10분 내 이동 위험
                        </div>
                      )}
                    </div>
                    {/* 뒷면 */}
                    <div className={styles.cardBack}>
                      <div className={styles.backHeader}>
                        <span className={styles.courseType}>
                          {cls.courseType === 'major' ? '전공' : cls.courseType === 'general' ? '교양' : '융합'}
                        </span>
                        <span className={styles.credit}>{cls.credit}학점</span>
                      </div>
                      <div className={styles.backInfo}>
                        <div className={styles.profName}>{cls.profName} 교수님</div>
                        <div className={styles.courseCode}>{cls.courseCode}</div>
                      </div>
                    </div>
                  </div>

                  {/* 툴팁 */}
                  {cls.warning && !isFlipped && (
                    <div className={styles.tooltipContainer}>
                      <div className={styles.tooltipHeader}>
                        <AlertTriangle size={14} /> 건물 이동 경고
                      </div>
                      <div className={styles.tooltipBody}>
                        {warningHoverText}
                      </div>
                      <div className={styles.campusMapGraphic}>
                        <svg className={styles.campusSvgMap} viewBox="0 0 200 80">
                          <path d="M 30 40 Q 100 10 170 40" fill="transparent" stroke="#ef4444" strokeWidth="2" strokeDasharray="5,5" opacity="0.8"/>
                          <circle cx="30" cy="40" r="5" fill="#ef4444" />
                          <text x="30" y="60" textAnchor="middle" fontSize="11" fill="currentColor" className={styles.mapSVGText}>이전 수업</text>
                          <circle cx="170" cy="40" r="5" fill="#ef4444" />
                          <text x="170" y="60" textAnchor="middle" fontSize="11" fill="currentColor" className={styles.mapSVGText}>{cls.location}</text>
                          <text x="100" y="22" textAnchor="middle" fontSize="11" fill="#ef4444" fontWeight="bold">도보 약 15분</text>
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>
      </div>
    </div>
  );
};

export default CenterPanel;
