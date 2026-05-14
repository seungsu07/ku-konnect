import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, MapPin, AlertTriangle, ChevronDown, Plus } from 'lucide-react';
import styles from './CenterPanel.module.css';
import type { TimeTable } from '../../../../common/models';
import { DAY_MAPPING } from '../../../../common/models';

const DISPLAY_DAYS = DAY_MAPPING.filter(d => !['sun', 'sat'].includes(d.id));

interface CenterPanelProps {
  timeTable: TimeTable & { renderableClasses?: any[] };
  mode?: 'view' | 'create';
  
  // For Create Mode
  currentIndex?: number;
  totalAlternatives?: number;
  onPrev?: () => void;
  onNext?: () => void;
  onSave?: (timeTable: TimeTable) => void;
  
  // For View Mode
  savedTimetables?: TimeTable[];
  onSelectTimetable?: (id: string) => void;
  onCreateNew?: () => void;
}


const START_HOUR = 9;
const END_HOUR = 18;

const CenterPanel: React.FC<CenterPanelProps> = ({
  timeTable,
  mode = 'create',
  currentIndex = 0,
  totalAlternatives = 0,
  onPrev,
  onNext,
  savedTimetables = [],
  onSelectTimetable,
  onCreateNew,
  onSave
}) => {
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const renderableClasses = timeTable.renderableClasses || [];

  useEffect(() => {
    // Update current time every minute
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const toggleCardFlip = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFlippedCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getGridColumn = (dayId: string) => {
    const index = DISPLAY_DAYS.findIndex(d => d.id === dayId);
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
        {mode === 'view' ? (
          <div className={styles.dropdownContainer}>
            <button 
              className={styles.dropdownTrigger} 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <div className={styles.title}>{timeTable.name}</div>
              <ChevronDown size={24} className={`${styles.dropdownIcon} ${isDropdownOpen ? styles.open : ''}`} />
            </button>
            
            {isDropdownOpen && (
              <div className={styles.dropdownMenu}>
                {savedTimetables.map(tt => (
                  <button 
                    key={tt.id} 
                    className={`${styles.dropdownItem} ${tt.id === timeTable.id ? styles.activeItem : ''}`}
                    onClick={() => {
                      onSelectTimetable?.(tt.id);
                      setIsDropdownOpen(false);
                    }}
                  >
                    {tt.name}
                  </button>
                ))}
                <div className={styles.dropdownDivider} />
                <button 
                  className={styles.dropdownItemNew}
                  onClick={() => {
                    onCreateNew?.();
                    setIsDropdownOpen(false);
                  }}
                >
                  <Plus size={18} style={{ marginRight: '8px' }} />
                  새 시간표 만들기
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className={styles.title}>{timeTable.name}</div>
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
              <button 
                className={styles.saveBtn} 
                onClick={() => onSave?.(timeTable)}
                style={{ marginLeft: '12px', display: 'flex', alignItems: 'center', gap: '6px', background: '#ef4444', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px', boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)' }}
              >
                💾 저장하기
              </button>
            </div>
          </>
        )}
      </div>

      {/* 시간표 */}
      <div className={styles.timetableWrapper}>
        <div className={styles.gridDays}>
          <div className={styles.dayCell}></div>
          {DISPLAY_DAYS.map(day => (
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
              {DISPLAY_DAYS.map((_, dayIdx) => (
                <div 
                  key={`line-${i}-${dayIdx}`} 
                  className={styles.gridSlot} 
                  style={{ gridRow: `${i * 2 + 1} / span 2`, gridColumn: dayIdx + 2 }}
                />
              ))}
            </React.Fragment>
          ))}

          {/* 현재 시간 표시선 */}
          {(() => {
            const currentDayId = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][currentTime.getDay()];
            const timeInHours = currentTime.getHours() + currentTime.getMinutes() / 60;
            const isVisible = DISPLAY_DAYS.some(d => d.id === currentDayId) && 
                              timeInHours >= START_HOUR && 
                              timeInHours <= END_HOUR;
            
            if (!isVisible) return null;

            return (
              <div 
                style={{
                  gridColumn: getGridColumn(currentDayId),
                  gridRow: `1 / span ${(END_HOUR - START_HOUR) * 2}`,
                  position: 'relative',
                  pointerEvents: 'none',
                  zIndex: 50
                }}
              >
                <div 
                  className={styles.timeIndicatorLine}
                  style={{
                    top: `${((timeInHours - START_HOUR) / (END_HOUR - START_HOUR)) * 100}%`,
                  }}
                >
                  <div className={styles.timeIndicatorDot} />
                </div>
              </div>
            );
          })()}

          {/* 시간표 카드 */}
          {renderableClasses.map(cls => {
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
          })}
        </div>
      </div>
    </div>
  );
};

export default CenterPanel;
