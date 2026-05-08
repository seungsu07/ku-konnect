import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { GripVertical, Sparkles, ShoppingCart, Plus, X, ChevronRight, Zap, Home, GraduationCap, CalendarDays, Maximize2, Map as MapIcon, Coffee, HelpCircle } from 'lucide-react';
import styles from './LeftPanel.module.css';
import type { Lecture, Preferences } from '../../../../common/models';
import { DAY_MAPPING } from '../../../../common/models';
import { INITIAL_CART_LECTURES, getCourse } from '../../data/mockData';

const DISPLAY_DAYS = DAY_MAPPING.filter(d => !['sun', 'sat'].includes(d.id));

//파스텔 색깔

const PASTEL_COLORS = [
  { bg: '#dbeafe', text: '#1e40af' },
  { bg: '#dcfce7', text: '#166534' },
  { bg: '#fce7f3', text: '#9d174d' },
  { bg: '#fef9c3', text: '#854d0e' },
  { bg: '#ede9fe', text: '#4c1d95' },
  { bg: '#ffedd5', text: '#9a3412' },
  { bg: '#d1fae5', text: '#065f46' },
  { bg: '#e0e7ff', text: '#3730a3' },
];

const getColor = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PASTEL_COLORS[Math.abs(hash) % PASTEL_COLORS.length];
};

const TIMES = [9, 10, 11, 12, 13, 14, 15, 16, 17];

const TUTORIAL_STEPS = [
  {
    title: "1. 과목 장바구니",
    content: "가장 먼저 들을 과목들을 담고, 과목들을 드래그하여 담고 싶은 우선순위를 정해보세요!",
  },
  {
    title: "2. 1-Click 라이프스타일",
    content: "버튼 한 번 클릭으로 내 라이프스타일에 맞게 모든 복잡한 옵션들이 자동으로 설정됩니다.",
  },
  {
    title: "3. AI 가중치 세부 조절",
    content: "시간표가 빽빽한 게 좋은지, 오전 공강이 좋은지 원하시는 핵심 가중치를 직접 미세 조정할 수 있습니다.",
  },
  {
    title: "4. 상세 선호 조건",
    content: "자물쇠(🔒) 버튼을 채우면 무슨 일이 있어도 다른 요소를 희생하더라도 AI가 그 조건을 100% 지켜서 짭니다.",
  },
  {
    title: "5. 개인 일정 블록",
    content: "알바나 동아리 시간 등 절대 수업이 잡히면 안 되는 시간을 파레트처럼 마우스로 슥 드래그해 색칠해 주세요!",
  }
];

const LeftPanel: React.FC<{ onGenerate: (basket: Lecture[], prefs: Preferences, banned: Record<string, boolean>) => void }> = ({ onGenerate }) => {
  const [subjects, setSubjects] = useState<Lecture[]>(INITIAL_CART_LECTURES);
  const [bannedCells, setBannedCells] = useState<Record<string, boolean>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nextId, setNextId] = useState(INITIAL_CART_LECTURES.length + 1);

  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [tutorialStep, setTutorialStep] = useState(0);

  const svgMaskHoleRef = useRef<SVGRectElement>(null);
  const glowOutlineRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const [prefs, setPrefs] = useState<Preferences>({
    days_off: { value: {}, priority: { value: 1, lock: false } },
    lunch_time_preserve: { value: false, priority: { value: 1, lock: false } },
    max_consecutive: { value: 3, priority: { value: 1, lock: false } },
    compactness: { value: 3, priority: { value: 1, lock: false } },
    campus_closeness: { value: 3, priority: { value: 1, lock: false } },
    avoid_morning: { value: 3, priority: { value: 1, lock: false } },
  });

  const [isPainting, setIsPainting] = useState(false);
  const [paintMode, setPaintMode] = useState(true);

  // 튜토리얼 로직
  useEffect(() => {
    if (tutorialStep === 0) return;

    let rafId: number;
    const updateDOM = () => {
      const el = document.querySelector(`.${styles.highlighted}`) as HTMLElement;
      if (el && svgMaskHoleRef.current && glowOutlineRef.current && popupRef.current) {
        const r = el.getBoundingClientRect();
        
        svgMaskHoleRef.current.setAttribute('x', String(r.left));
        svgMaskHoleRef.current.setAttribute('y', String(r.top));
        svgMaskHoleRef.current.setAttribute('width', String(Math.max(0, r.width)));
        svgMaskHoleRef.current.setAttribute('height', String(Math.max(0, r.height)));

        glowOutlineRef.current.style.left = `${r.left - 4}px`;
        glowOutlineRef.current.style.top = `${r.top - 4}px`;
        glowOutlineRef.current.style.width = `${r.width + 8}px`;
        glowOutlineRef.current.style.height = `${r.height + 8}px`;

        const spaceRight = window.innerWidth - (r.right + 8);
        if (spaceRight > 320) {
          popupRef.current.style.left = `${r.right + 24}px`;
          popupRef.current.style.top = `${Math.max(20, r.top)}px`;
          popupRef.current.style.transform = 'translateY(0)';
        } else {
          popupRef.current.style.left = '50%';
          popupRef.current.style.top = '50%';
          popupRef.current.style.transform = 'translate(-50%, -50%)';
        }
      }
    };

    const scheduleUpdate = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateDOM);
    };

    const el = document.querySelector(`.${styles.highlighted}`) as HTMLElement;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      let loopCount = 0;
      const initialLoop = () => {
        updateDOM();
        loopCount++;
        if (loopCount < 45) { 
          rafId = requestAnimationFrame(initialLoop);
        }
      };
      initialLoop();
    }

    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('scroll', scheduleUpdate, true); 
    
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', scheduleUpdate);
      window.removeEventListener('scroll', scheduleUpdate, true);
    };
  }, [tutorialStep]);

  useEffect(() => {
    const handleMouseUp = () => setIsPainting(false);
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const handleAddSubject = () => {
    const newId = `lect-${nextId + 100}`;
    setNextId(n => n + 1);
    const mockLecture: Lecture = {
      id: newId as any, type: 'lecture', course: 'UNKNOWN' as any, ay: 2026, sem: 'first', professor: 'prof-unknown' as any, classes: [], hours: 3, lab_hours: 0, credit: 3
    };
    setSubjects([...subjects, mockLecture]);
  };

  const handleDeleteSubject = (id: string) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(subjects);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setSubjects(items);
  };

  const handleCellMouseDown = (dayIndex: number, time: number) => {
    setIsPainting(true);
    const key = `${dayIndex}-${time}`;
    const currentValue = !!bannedCells[key];
    setPaintMode(!currentValue);
    setBannedCells(prev => ({ ...prev, [key]: !currentValue }));
  };

  const handleCellMouseEnter = (dayIndex: number, time: number) => {
    if (isPainting) {
      const key = `${dayIndex}-${time}`;
      setBannedCells(prev => ({ ...prev, [key]: paintMode }));
    }
  };

  const applyPreset = (type: 'commuter' | 'dorm' | 'credits') => {
    setActivePreset(type);
    if (type === 'commuter') {
      setPrefs(prev => ({
        ...prev,
        days_off: { ...prev.days_off, value: {} },
        lunch_time_preserve: { value: false, priority: { value: 1, lock: false } },
        compactness: { value: 5, priority: { value: 1, lock: false } },
        campus_closeness: { value: 4, priority: { value: 1, lock: false } },
        avoid_morning: { value: 5, priority: { value: 1, lock: false } },
      }));
    } else if (type === 'dorm') {
      setPrefs(prev => ({
        ...prev,
        days_off: { ...prev.days_off, value: { fri: true } },
        lunch_time_preserve: { value: true, priority: { value: 1, lock: true } },
        compactness: { value: 1, priority: { value: 1, lock: false } },
        campus_closeness: { value: 3, priority: { value: 1, lock: false } },
        avoid_morning: { value: 1, priority: { value: 1, lock: false } },
      }));
    } else if (type === 'credits') {
      setPrefs(prev => ({
        ...prev,
        days_off: { ...prev.days_off, value: {} },
        lunch_time_preserve: { value: false, priority: { value: 1, lock: false } },
        compactness: { value: 4, priority: { value: 1, lock: false } },
        campus_closeness: { value: 1, priority: { value: 1, lock: false } },
        avoid_morning: { value: 1, priority: { value: 1, lock: false } },
      }));
    }
  };

  const updatePrefValue = <K extends keyof Preferences>(key: K, value: Preferences[K]['value']) => {
    setPrefs(prev => ({
      ...prev,
      [key]: { ...prev[key], value }
    }));
    setActivePreset(null);
  };



  const previewSubjects = subjects.slice(0, 6);
  const remaining = subjects.length - previewSubjects.length;

  const renderSlider = (
    title: string,
    icon: React.ReactNode,
    value: number,
    onChange: (val: number) => void,
    leftLabel: string,
    rightLabel: string
  ) => (
    <div className={styles.sliderBlock}>
      <div className={styles.sliderHeader}>
        <span className={styles.sliderTitle}>{icon} {title}</span>
      </div>
      <div className={styles.sliderLabels}>
        <span className={styles.sliderLabelLeft}>{leftLabel}</span>
        <span className={styles.sliderLabelRight}>{rightLabel}</span>
      </div>
      <input
        type="range" min="1" max="5" step="1"
        value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        className={styles.rangeSlider}
      />
    </div>
  );

  const modal = isModalOpen ? (
    <div className={styles.overlay} onClick={() => setIsModalOpen(false)}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <ShoppingCart size={20} />
            과목 장바구니
          </div>
          <button className={styles.modalCloseBtn} onClick={() => setIsModalOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.modalSectionHeader}>
            <span className={styles.modalSectionTitle}>우선순위 순서 (드래그로 변경)</span>
            <button className={styles.addBtn} onClick={handleAddSubject}>
              <Plus size={14} /> 과목 추가
            </button>
          </div>
          <div className={styles.dndWithNumbers}>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="subjects-modal">
                {(provided) => (
                  <div
                    className={styles.modalDndList}
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {subjects.map((item, index) => {
                      const course = getCourse(item.course);
                      const color = getColor(course?.code || 'unknown');
                      return (
                        <Draggable key={item.id} draggableId={`modal-${item.id}`} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={provided.draggableProps.style}
                              className={`${styles.modalDndItem} ${snapshot.isDragging ? styles.dragging : ''}`}
                            >
                              <div className={`${styles.rankBadge} ${index === 0 ? styles.topRank : ''}`}>
                                {index + 1}
                              </div>
                              <GripVertical size={14} className={styles.gripIcon} />
                              <span
                                className={styles.modalPill}
                                style={{ background: color.bg, color: color.text }}
                              >
                                {course?.name || '새로운 과목'}
                              </span>
                              <div className={styles.modalItemDetails}>
                                <span className={styles.modalItemCode}>{course?.code || '----'} · {item.credit}학점</span>
                              </div>
                              <button
                                className={styles.deleteBtn}
                                onClick={(e) => { e.stopPropagation(); handleDeleteSubject(item.id); }}
                                title="과목 삭제"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
          {subjects.length === 0 && (
            <div className={styles.emptyBasket}>
              <ShoppingCart size={36} opacity={0.3} />
              <p>장바구니가 비어있습니다</p>
              <button className={styles.addBtnLarge} onClick={handleAddSubject}>
                <Plus size={16} /> 과목 추가하기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  ) : null;
  const tutorialPortal = tutorialStep > 0 ? (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100000, pointerEvents: 'none' }}>
      <svg width="100%" height="100%" style={{ position: 'absolute' }}>
        <defs>
          <mask id="tutorial-mask-hole">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect ref={svgMaskHoleRef} rx="12" ry="12" fill="black" />
          </mask>
        </defs>
      </svg>
      
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        maskImage: 'url(#tutorial-mask-hole)',
        WebkitMaskImage: 'url(#tutorial-mask-hole)',
        pointerEvents: 'auto'
      }} onClick={(e) => e.stopPropagation()} />

      <div ref={glowOutlineRef} style={{
        position: 'absolute',
        border: '3px solid #ff3131',
        borderRadius: '16px',
        boxShadow: '0 0 30px rgba(255, 49, 49, 0.4)',
        pointerEvents: 'none',
        transition: 'none'
      }} />

      {/* 튜토리얼 팝업 */}
      <div ref={popupRef} className={styles.tutorialPopup} style={{ pointerEvents: 'auto' }}>
        <div className={styles.tutorialHeader}>
          <h4>{TUTORIAL_STEPS[tutorialStep - 1].title}</h4>
          <button onClick={() => setTutorialStep(0)}><X size={16}/></button>
        </div>
        <p>{TUTORIAL_STEPS[tutorialStep - 1].content}</p>
        <div className={styles.tutorialFooter}>
          <span className={styles.tutorialProgress}>{tutorialStep} / {TUTORIAL_STEPS.length}</span>
          <div className={styles.tutorialNav}>
            {tutorialStep > 1 && (
              <button className={styles.tutorialBtnSecondary} onClick={() => setTutorialStep(s => s - 1)}>이전</button>
            )}
            {tutorialStep < TUTORIAL_STEPS.length ? (
              <button className={styles.tutorialBtnPrimary} onClick={() => setTutorialStep(s => s + 1)}>다음</button>
            ) : (
              <button className={styles.tutorialBtnPrimary} onClick={() => setTutorialStep(0)}>시작하기 🚀</button>
            )}
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className={styles.container}>
      <h2 className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={20} color="#f59e0b" /> 조건 설정
        </div>
        <button className={styles.helpBtn} onClick={() => setTutorialStep(1)} title="사용 가이드 튜토리얼 보기">
          <HelpCircle size={18} />
        </button>
      </h2>

      {/* 과목 장바구니 */}
      <div className={`${styles.section} ${tutorialStep === 1 ? styles.highlighted : ''}`} style={{ borderRadius: 12 }}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle} style={{ marginBottom: 0 }}>과목 장바구니</div>
          <span className={styles.subjectCount}>{subjects.length}개</span>
        </div>
        <div className={styles.basketPreview} onClick={() => setIsModalOpen(true)}>
          <div className={styles.pillRow}>
            {previewSubjects.map(s => {
              const course = getCourse(s.course);
              const color = getColor(course?.code || 'unknown');
              return (
                <span
                  key={s.id}
                  className={styles.pillBadge}
                  style={{ background: color.bg, color: color.text }}
                >
                  {course?.name || '새로운 과목'}
                </span>
              );
            })}
            {subjects.length === 0 && <span className={styles.pillEmpty}>과목을 추가해 주세요</span>}
          </div>
          <div className={styles.basketFooter}>
            <div>{remaining > 0 ? <span className={styles.pillMore}>+{remaining}개</span> : null}</div>
            <div className={styles.basketCta}>
              <span>우선순위 수정</span>
              <ChevronRight size={14} />
            </div>
          </div>
        </div>
      </div>

      {/* 페르소나 프리셋 */}
      <div className={`${styles.section} ${tutorialStep === 2 ? styles.highlighted : ''}`} style={{ borderRadius: 12 }}>
        <div className={styles.sectionTitle}>1-Click 페르소나</div>
        <div className={styles.presetGroup}>
          <button className={`${styles.presetBtn} ${activePreset === 'commuter' ? styles.active : ''}`} onClick={() => applyPreset('commuter')}>
            <div className={styles.presetIconWrapper}><Zap size={18} /></div>
            <div className={styles.presetText}>
              <span className={styles.presetTitle}>프로 통학러</span>
              <span className={styles.presetDesc}>9시 무조건 패스 · 연강 감수하고 압축</span>
            </div>
          </button>
          <button className={`${styles.presetBtn} ${activePreset === 'dorm' ? styles.active : ''}`} onClick={() => applyPreset('dorm')}>
            <div className={styles.presetIconWrapper}><Home size={18} /></div>
            <div className={styles.presetText}>
              <span className={styles.presetTitle}>기숙사/자취생</span>
              <span className={styles.presetDesc}>오전 수업 가능 · 점심시간/금공강 사수</span>
            </div>
          </button>
          <button className={`${styles.presetBtn} ${activePreset === 'credits' ? styles.active : ''}`} onClick={() => applyPreset('credits')}>
            <div className={styles.presetIconWrapper}><GraduationCap size={18} /></div>
            <div className={styles.presetText}>
              <span className={styles.presetTitle}>학점 자판기</span>
              <span className={styles.presetDesc}>무조건 우선순위 과목 많이 담기 (동선 무관)</span>
            </div>
          </button>
        </div>
      </div>

      {/* AI 가중치 조절 슬라이더 */}
      <div className={`${styles.section} ${tutorialStep === 3 ? styles.highlighted : ''}`} style={{ borderRadius: 12 }}>
        <div className={styles.sectionTitleFlex}>
          <span>AI 가중치 조절</span>
        </div>
        
        {renderSlider(
          "시간표 압축도 (연강 vs 우주공강)",
          <Maximize2 size={14} style={{ marginRight: 6, opacity: 0.8 }} />,
          prefs.compactness.value,
          (v) => updatePrefValue('compactness', v),
          "여유롭게",
          "빡세게"
        )}

        {renderSlider(
          "캠퍼스 이동 (동선 최소화)",
          <MapIcon size={14} style={{ marginRight: 6, opacity: 0.8 }} />,
          prefs.campus_closeness.value,
          (v) => updatePrefValue('campus_closeness', v),
          "상관없음",
          "이동 최소화"
        )}

        {renderSlider(
          "아침 잠 사수 (1교시 회피력)",
          <Coffee size={14} style={{ marginRight: 6, opacity: 0.8 }} />,
          prefs.avoid_morning.value,
          (v) => updatePrefValue('avoid_morning', v),
          "오전 수업 허용",
          "오전 수업 기피"
        )}
      </div>

      {/* 세부 조건 설정 */}
      <div className={`${styles.section} ${tutorialStep === 4 ? styles.highlighted : ''}`} style={{ borderRadius: 12 }}>
        <div className={styles.sectionTitle}>상세 선호 조건</div>
        
        <div className={styles.preferenceBox}>
          <div className={styles.prefTitle}><CalendarDays size={14} /> 공강 요일 만들기</div>
          <div className={styles.daysSelector}>
            {DISPLAY_DAYS.map(dayObj => (
              <button
                key={dayObj.id}
                className={`${styles.dayBtn} ${prefs.days_off.value[dayObj.id] ? styles.dayActive : ''}`}
                onClick={() => {
                  const currentVal = !!prefs.days_off.value[dayObj.id];
                  updatePrefValue('days_off', { ...prefs.days_off.value, [dayObj.id]: !currentVal });
                }}
              >
                {dayObj.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.preferenceRow}>
          <div className={styles.prefLeft}>
            <label className={styles.switch}>
              <input 
                type="checkbox" 
                checked={prefs.lunch_time_preserve.value} 
                onChange={(e) => {
                  const val = e.target.checked;
                  setPrefs(prev => ({
                    ...prev,
                    lunch_time_preserve: { value: val, priority: { value: 1, lock: val } }
                  }));
                }} 
              />
              <span className={styles.slider}></span>
            </label>
            <span className={styles.prefLabel}>점심시간 (11:30~14:00) 필수 보장</span>
          </div>
        </div>

      </div>

      {/* 개인 시간 배제 그리드 */}
      <div className={`${styles.section} ${tutorialStep === 5 ? styles.highlighted : ''}`} style={{ borderRadius: 12 }}>
        <div className={styles.sectionTitleFlex}>
          <span>개인 일정 (알바/과외)</span>
          <span className={styles.helperText}>마우스로 드래그하여 불가 영역 표시</span>
        </div>
        <div className={styles.miniGrid}>
          <div className={styles.gridHeader}></div>
          {DISPLAY_DAYS.map(dayObj => <div key={dayObj.id} className={styles.gridHeader}>{dayObj.label}</div>)}
          {TIMES.map(time => (
            <React.Fragment key={time}>
              <div className={styles.timeLabel}>{time}</div>
              {DISPLAY_DAYS.map((_, dayIdx) => {
                const key = `${dayIdx}-${time}`;
                return (
                  <div
                    key={key}
                    className={`${styles.gridCell} ${bannedCells[key] ? styles.banned : ''}`}
                    onMouseDown={() => handleCellMouseDown(dayIdx, time)}
                    onMouseEnter={() => handleCellMouseEnter(dayIdx, time)}
                    title="드래그하여 배제 시간 설정"
                  />
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 생성 버튼 */}
      <button className={styles.generateBtn} onClick={() => onGenerate(subjects, prefs, bannedCells)}>
        <Sparkles size={20} /> AI 최적 시간표 생성하기
      </button>

      {/* 모달 및 최종 렌더링 */}
      {typeof document !== 'undefined' && ReactDOM.createPortal(modal, document.body)}
      {typeof document !== 'undefined' && ReactDOM.createPortal(tutorialPortal, document.body)}
    </div>
  );
};

export default LeftPanel;
