import { useState, useRef, useEffect } from 'react';
import { Sparkles, Cpu, Target, Rocket, Compass, Zap, ArrowRight, RefreshCcw } from 'lucide-react';
import styles from './MajorMap.module.css';

type Subject = {
  name: string;
};

type Semester = {
  semesterId: string;
  subjects: Subject[];
};

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

const getColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PASTEL_COLORS[Math.abs(hash) % PASTEL_COLORS.length];
};

const MajorMap = () => {
  const [prompt, setPrompt] = useState('');
  const [submittedPrompt, setSubmittedPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [roadmap, setRoadmap] = useState<Semester[] | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [prompt]);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setSubmittedPrompt(prompt);
    setIsGenerating(true);
    setRoadmap(null);

    setTimeout(() => {
      const mockData: Semester[] = [
        { semesterId: "1-1", subjects: [{ name: "컴퓨터학개론" }, { name: "미적분학" }, { name: "글쓰기" }] },
        { semesterId: "1-2", subjects: [{ name: "프로그래밍기초" }, { name: "이산수학" }, { name: "대학영어" }] },
        { semesterId: "2-1", subjects: [{ name: "자료구조" }, { name: "객체지향프로그래밍" }, { name: "확률과통계" }] },
        { semesterId: "2-2", subjects: [{ name: "알고리즘" }, { name: "컴퓨터구조" }, { name: "선형대수학" }] },
        { semesterId: "3-1", subjects: [{ name: "운영체제" }, { name: "데이터베이스" }, { name: "시스템프로그래밍" }] },
        { semesterId: "3-2", subjects: [{ name: "기계학습개론" }, { name: "인공지능" }, { name: "네트워크" }] },
        { semesterId: "4-1", subjects: [{ name: "딥러닝실습" }, { name: "데이터마이닝" }, { name: "컴퓨터보안" }] },
        { semesterId: "4-2", subjects: [{ name: "졸업프로젝트" }, { name: "자연어처리" }, { name: "소프트웨어공학" }] },
      ];
      setRoadmap(mockData);
      setIsGenerating(false);
    }, 2000);
  };

  const handleReset = () => {
    setRoadmap(null);
    setSubmittedPrompt('');
    setPrompt('');
  };

  return (
    <div className={styles.container}>
      <div className={styles.bgGlow}></div>
      <div className={styles.bgGlowRight}></div>

      <div className={styles.content}>
        <div className={styles.hero}>
          <h1 className={styles.title}>
            <span className={styles.highlight}>Major Map</span> Designer AI
          </h1>
          <p className={styles.subtitle}>
            당신의 꿈을 위한 최적의 학과 로드맵을 설계합니다.
          </p>
        </div>

        <div className={styles.promptContainer}>
          {!roadmap && !isGenerating ? (
            <div className={styles.promptBox}>
              <textarea
                ref={textareaRef}
                className={styles.input}
                placeholder="예: 구글에서 일하는 최고의 머신러닝 엔지니어가 되고 싶어!"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <button 
                className={styles.generateBtn}
                onClick={handleGenerate}
                disabled={!prompt.trim()}
              >
                <Zap size={20} />
                경로 생성
              </button>
            </div>
          ) : (
            <div className={styles.staticPrompt}>
              {submittedPrompt}
              {roadmap && (
                <button 
                  onClick={handleReset} 
                  style={{ 
                    position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: '#ff3131', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: 700
                  }}
                >
                  <RefreshCcw size={14} /> 다시 입력
                </button>
              )}
            </div>
          )}
        </div>

        {isGenerating && (
          <div className={styles.loading}>
            <div className={styles.loader}></div>
            <p>AI가 최적의 커리큘럼 트리를 탐색하고 있습니다...</p>
          </div>
        )}

        {roadmap && !isGenerating && (
          <div className={styles.roadmapWrapper}>
            {/* First Row: ALL CARDS UP */}
            <div className={styles.row}>
              <div className={styles.beam}></div>
              <ArrowRight className={styles.beamArrow} size={24} />
              {roadmap.slice(0, 4).map((sem, idx) => (
                <div key={idx} className={styles.node}>
                  <div className={`${styles.card} ${styles.cardUp}`}>
                    <span className={styles.semesterTag}>{sem.semesterId}</span>
                    <div className={styles.semesterTitle}>
                      {idx < 2 ? <Compass size={18} /> : <Target size={18} />}
                      {idx < 2 ? 'Discovery' : 'Core'}
                    </div>
                    <div className={styles.subjects}>
                      {sem.subjects.map((sub, sIdx) => {
                        const color = getColor(sub.name);
                        return (
                          <span 
                            key={sIdx} 
                            className={styles.pastelTag}
                            style={{ background: color.bg, color: color.text }}
                          >
                            {sub.name}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div className={styles.dot}></div>
                </div>
              ))}
            </div>

            {/* Second Row: ALL CARDS DOWN */}
            <div className={styles.row}>
              <div className={styles.beam}></div>
              <ArrowRight className={styles.beamArrow} size={24} />
              {roadmap.slice(4, 8).map((sem, idx) => (
                <div key={idx} className={styles.node}>
                  <div className={`${styles.card} ${styles.cardDown}`}>
                    <span className={styles.semesterTag}>{sem.semesterId}</span>
                    <div className={styles.semesterTitle}>
                      {idx < 2 ? <Rocket size={18} /> : <Sparkles size={18} />}
                      {idx < 2 ? 'Advanced' : 'Expert'}
                    </div>
                    <div className={styles.subjects}>
                      {sem.subjects.map((sub, sIdx) => {
                        const color = getColor(sub.name);
                        return (
                          <span 
                            key={sIdx} 
                            className={styles.pastelTag}
                            style={{ background: color.bg, color: color.text }}
                          >
                            {sub.name}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div className={styles.dot}></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MajorMap;
