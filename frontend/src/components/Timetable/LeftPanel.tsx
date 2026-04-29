import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { GripVertical, Sparkles, ShoppingCart, Plus, X, ChevronRight, Lock, Unlock, Zap, Home, GraduationCap, CalendarDays, Maximize2, Map as MapIcon, Coffee, HelpCircle } from 'lucide-react';
import styles from './LeftPanel.module.css';
import type { Lecture, Preferences, HardConstraints } from '../../../../common/models';
import { DAY_MAPPING } from '../../../../common/models';
import { INITIAL_CART_LECTURES, getCourse, getProfessor } from '../../data/mockData';

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

const LeftPanel: React.FC<{ onGenerate: () => void }> = ({ onGenerate }) => {
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
    daysOff: [],
    lunchTimeLock: false,
    maxConsecutive: 3,
    compactnessWeight: 50,
    campusDistanceWeight: 50,
    avoidMorningWeight: 50,
  });

  const [hardConstraints, setHardConstraints] = useState<HardConstraints>({
    lunchTimeLock: false,
    maxConsecutive: false,
    compactnessWeight: false,
    campusDistanceWeight: false,
    avoidMorningWeight: false,
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
      id: newId, course_code: '------', ay: 2026, sem: 'first', prof_id: 'prof-unknown', dept_code: 'UNKN', classes: [], hours: 3, lab_hours: 0, credit: 3
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
      setPrefs({
        daysOff: [], lunchTimeLock: false, maxConsecutive: 4, 
        compactnessWeight: 100, campusDistanceWeight: 80, avoidMorningWeight: 100,
      });
      setHardConstraints(prev => ({ ...prev, avoidMorningWeight: true, compactnessWeight: true }));
    } else if (type === 'dorm') {
      setPrefs({
        daysOff: ['fri'], lunchTimeLock: true, maxConsecutive: 3, 
        compactnessWeight: 20, campusDistanceWeight: 50, avoidMorningWeight: 0,
      });
      setHardConstraints(prev => ({ ...prev, lunchTimeLock: true, avoidMorningWeight: false }));
    } else if (type === 'credits') {
      setPrefs({
        daysOff: [], lunchTimeLock: false, maxConsecutive: 5, 
        compactnessWeight: 90, campusDistanceWeight: 0, avoidMorningWeight: 0,
      });
      setHardConstraints({
        lunchTimeLock: false, maxConsecutive: false, compactnessWeight: false, campusDistanceWeight: false, avoidMorningWeight: false,
      });
    }
  };

  const updatePrefs = (changes: Partial<Preferences>) => {
    setPrefs(prev => ({ ...prev, ...changes }));
    setActivePreset(null);
  };

  const updateHardConstraints = (key: keyof HardConstraints) => {
    setHardConstraints(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const previewSubjects = subjects.slice(0, 6);
  const remaining = subjects.length - previewSubjects.length;

  const renderSlider = (
    title: string,
    icon: React.ReactNode,
    value: number,
    onChange: (val: number) => void,
    leftLabel: string,
    rightLabel: string,
    hardKey: keyof HardConstraints
  ) => (
    <div className={styles.sliderBlock}>
      <div className={styles.sliderHeader}>
        <span className={styles.sliderTitle}>{icon} {title}</span>
        <button
          className={`${styles.lockBtn} ${hardConstraints[hardKey] ? styles.locked : ''}`}
          onClick={() => updateHardConstraints(hardKey)}
          title={hardConstraints[hardKey] ? "절대 엄수 🔒" : "필수는 아님"}
        >
          {hardConstraints[hardKey] ? <Lock size={14} /> : <Unlock size={14} />}
        </button>
      </div>
      <div className={styles.sliderLabels}>
        <span className={styles.sliderLabelLeft}>{leftLabel}</span>
        <span className={styles.sliderLabelRight}>{rightLabel}</span>
      </div>
      <input
        type="range" min="0" max="100"
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
            <div className={styles.numberColumn}>
              {subjects.map((_, idx) => (
                <div key={idx} className={styles.numberColumnWrapper}>
                  <div className={`${styles.rankBadge} ${idx === 0 ? styles.topRank : ''}`}>
                    {idx + 1}
                  </div>
                </div>
              ))}
            </div>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="subjects-modal">
                {(provided) => (
                  <div
                    className={styles.modalDndList}
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {subjects.map((item, index) => {
                      const color = getColor(item.course_code);
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
                              <GripVertical size={14} className={styles.gripIcon} />
                              <span
                                className={styles.modalPill}
                                style={{ background: color.bg, color: color.text }}
                              >
                                {getCourse(item.course_code)?.name || '새로운 과목'}
                              </span>
                              <div className={styles.modalItemDetails}>
                                <span className={styles.modalItemProf}>{getProfessor(item.prof_id)?.name || '미지정'} 교수</span>
                                <span className={styles.modalItemCode}>{item.course_code} · {item.credit}학점</span>
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
              const color = getColor(s.course_code);
              return (
                <span
                  key={s.id}
                  className={styles.pillBadge}
                  style={{ background: color.bg, color: color.text }}
                >
                  {getCourse(s.course_code)?.name || '새로운 과목'}
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
          prefs.compactnessWeight,
          (v) => updatePrefs({ compactnessWeight: v }),
          "여유롭게",
          "빡세게",
          "compactnessWeight"
        )}

        {renderSlider(
          "캠퍼스 이동 (동선 최소화)",
          <MapIcon size={14} style={{ marginRight: 6, opacity: 0.8 }} />,
          prefs.campusDistanceWeight,
          (v) => updatePrefs({ campusDistanceWeight: v }),
          "상관없음",
          "이동 최소화",
          "campusDistanceWeight"
        )}

        {renderSlider(
          "아침 잠 사수 (1교시 회피력)",
          <Coffee size={14} style={{ marginRight: 6, opacity: 0.8 }} />,
          prefs.avoidMorningWeight,
          (v) => updatePrefs({ avoidMorningWeight: v }),
          "오전 수업 허용",
          "오전 수업 기피",
          "avoidMorningWeight"
        )}
      </div>

      {/* 세부 조건 설정 */}
      <div className={`${styles.section} ${tutorialStep === 4 ? styles.highlighted : ''}`} style={{ borderRadius: 12 }}>
        <div className={styles.sectionTitle}>상세 선호 조건</div>
        
        <div className={styles.preferenceBox}>
          <div className={styles.prefTitle}><CalendarDays size={14} /> 공강 요일 만들기</div>
          <div className={styles.daysSelector}>
            {DAY_MAPPING.map(dayObj => (
              <button
                key={dayObj.id}
                className={`${styles.dayBtn} ${prefs.daysOff.includes(dayObj.id) ? styles.dayActive : ''}`}
                onClick={() => {
                  const newDays = prefs.daysOff.includes(dayObj.id)
                    ? prefs.daysOff.filter(d => d !== dayObj.id)
                    : [...prefs.daysOff, dayObj.id];
                  updatePrefs({ daysOff: newDays });
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
              <input type="checkbox" checked={prefs.lunchTimeLock} onChange={() => updatePrefs({ lunchTimeLock: !prefs.lunchTimeLock })} />
              <span className={styles.slider}></span>
            </label>
            <span className={styles.prefLabel}>점심시간 (11:30~14:00) 필수 보장</span>
          </div>
          <button
            className={`${styles.lockBtn} ${hardConstraints.lunchTimeLock ? styles.locked : ''}`}
            onClick={() => updateHardConstraints("lunchTimeLock")}
            title={hardConstraints.lunchTimeLock ? "절대 엄수 🔒" : "필수는 아님"}
          >
            {hardConstraints.lunchTimeLock ? <Lock size={14} /> : <Unlock size={14} />}
          </button>
        </div>

        <div className={styles.preferenceBox} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px' }}>
          <div className={styles.prefLeft} style={{ flex: 1 }}>
            <span className={styles.prefLabel}>최대 연속 수업 제한</span>
            <select
              className={styles.selectBox}
              value={prefs.maxConsecutive}
              onChange={e => updatePrefs({ maxConsecutive: parseInt(e.target.value) })}
            >
              <option value="2">2연강까지만 (약 3시간)</option>
              <option value="3">3연강까지만 (약 4.5시간)</option>
              <option value="4">4연강까지만 (약 6시간)</option>
              <option value="5">제한 없음</option>
            </select>
          </div>
          <button
            className={`${styles.lockBtn} ${hardConstraints.maxConsecutive ? styles.locked : ''}`}
            onClick={() => updateHardConstraints("maxConsecutive")}
            title={hardConstraints.maxConsecutive ? "절대 엄수 🔒" : "필수는 아님"}
            style={{ marginLeft: '12px' }}
          >
            {hardConstraints.maxConsecutive ? <Lock size={14} /> : <Unlock size={14} />}
          </button>
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
          {DAY_MAPPING.map(dayObj => <div key={dayObj.id} className={styles.gridHeader}>{dayObj.label}</div>)}
          {TIMES.map(time => (
            <React.Fragment key={time}>
              <div className={styles.timeLabel}>{time}</div>
              {DAY_MAPPING.map((_, dayIdx) => {
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
      <button className={styles.generateBtn} onClick={onGenerate}>
        <Sparkles size={20} /> AI 최적 시간표 생성하기
      </button>

      {/* 모달 및 최종 렌더링 */}
      {typeof document !== 'undefined' && ReactDOM.createPortal(modal, document.body)}
      {typeof document !== 'undefined' && ReactDOM.createPortal(tutorialPortal, document.body)}
    </div>
  );
};

export default LeftPanel;
