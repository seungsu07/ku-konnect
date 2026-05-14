import { useState, useRef, useEffect } from 'react';
import { Sparkles, Cpu, Target, Rocket, Compass, Zap, ArrowRight, RefreshCcw } from 'lucide-react';
import styles from './MajorMap.module.css';

type Subject = {
  name: string;
  dept: string;
  credit: number;
};

type Semester = {
  semesterId: string;
  subjects: Subject[];
};

type AnalysisResult = {
  graduationType: string;
  majorType: string;
  reasoning: string;
  badgeShape: 'circle' | 'hexagon' | 'diamond';
  badgeColors: string[];
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
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
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
    setAnalysis(null);

    setTimeout(() => {
      // Mock Analysis Result
      setAnalysis({
        graduationType: "일반졸업",
        majorType: "융합전공 컴퓨터학과 / 수학과",
        reasoning: "컴퓨터공학의 기술적 전문성과 수학의 논리적 사고력을 결합하여, 미래 지향적인 AI 엔지니어로 성장할 수 있는 최적의 융합형 경로를 추천합니다.",
        badgeShape: 'hexagon',
        badgeColors: ['#dcfce7', '#fef9c3'] // IT(Green) + Science(Yellow)
      });
      const mockData: Semester[] = [
        { semesterId: "1-1", subjects: [
          { name: "컴퓨터학개론", dept: "컴퓨터학과", credit: 3 }, 
          { name: "미적분학", dept: "수학과", credit: 3 }, 
          { name: "글쓰기", dept: "일반교양", credit: 3 }
        ] },
        { semesterId: "1-2", subjects: [
          { name: "프로그래밍기초", dept: "컴퓨터학과", credit: 3 }, 
          { name: "이산수학", dept: "수학과", credit: 3 }, 
          { name: "대학영어", dept: "일반교양", credit: 3 }
        ] },
        { semesterId: "2-1", subjects: [
          { name: "자료구조", dept: "컴퓨터학과", credit: 3 }, 
          { name: "객체지향프로그래밍", dept: "컴퓨터학과", credit: 3 }, 
          { name: "확률과통계", dept: "수학과", credit: 3 }
        ] },
        { semesterId: "2-2", subjects: [
          { name: "알고리즘", dept: "컴퓨터학과", credit: 3 }, 
          { name: "컴퓨터구조", dept: "컴퓨터학과", credit: 3 }, 
          { name: "선형대수학", dept: "수학과", credit: 3 }
        ] },
        { semesterId: "3-1", subjects: [
          { name: "운영체제", dept: "컴퓨터학과", credit: 3 }, 
          { name: "데이터베이스", dept: "컴퓨터학과", credit: 3 }, 
          { name: "수치해석", dept: "수학과", credit: 3 }
        ] },
        { semesterId: "3-2", subjects: [
          { name: "기계학습개론", dept: "컴퓨터학과", credit: 3 }, 
          { name: "인공지능", dept: "컴퓨터학과", credit: 3 }, 
          { name: "최적화이론", dept: "수학과", credit: 3 }
        ] },
        { semesterId: "4-1", subjects: [
          { name: "딥러닝실습", dept: "컴퓨터학과", credit: 3 }, 
          { name: "데이터마이닝", dept: "컴퓨터학과", credit: 3 }, 
          { name: "그래프이론", dept: "수학과", credit: 3 }
        ] },
        { semesterId: "4-2", subjects: [
          { name: "졸업프로젝트", dept: "컴퓨터학과", credit: 3 }, 
          { name: "자연어처리", dept: "컴퓨터학과", credit: 3 }, 
          { name: "현대대수학", dept: "수학과", credit: 3 }
        ] },
      ];
      setRoadmap(mockData);
      setIsGenerating(false);
    }, 2000);
  };

  const handleReset = () => {
    setRoadmap(null);
    setAnalysis(null);
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

        {analysis && !isGenerating && (
          <div className={styles.analysisSection}>
            <div className={styles.analysisHeader}>
              <div 
                className={`${styles.badge} ${
                  analysis.badgeShape === 'circle' ? styles.badgeCircle : 
                  analysis.badgeShape === 'hexagon' ? styles.badgeHexagon : styles.badgeDiamond
                }`}
                style={{ 
                  background: analysis.badgeColors.length > 1 
                    ? `linear-gradient(135deg, ${analysis.badgeColors[0]}, ${analysis.badgeColors[1]})`
                    : analysis.badgeColors[0]
                }}
              />
              <div className={styles.analysisTitleContainer}>
                <span className={styles.analysisLabel}>AI 추천 경로 분석</span>
                <h2 className={styles.analysisTypeTitle}>
                  {analysis.graduationType} | {analysis.majorType}
                </h2>
              </div>
            </div>
            <p className={styles.analysisReason}>
              {analysis.reasoning}
            </p>
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

        {roadmap && !isGenerating && (
          <div className={styles.dashboard}>
            <h2 className={styles.dashboardTitle}>
              <Zap size={24} color="#ff3131" />
              전공 로드맵 분석 대시보드
            </h2>
            <div className={styles.dashboardContent}>
              <div className={styles.statsSection}>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>전공 총 이수 학점</span>
                  <div className={styles.statValue}>
                    {roadmap.reduce((acc, sem) => acc + sem.subjects.filter(s => s.dept !== "일반교양").reduce((sAcc, sub) => sAcc + sub.credit, 0), 0)}
                    <span className={styles.statUnit}>학점</span>
                  </div>
                </div>
                <div className={styles.statCard} style={{ background: 'rgba(118, 75, 162, 0.1)', borderColor: 'rgba(118, 75, 162, 0.2)' }}>
                  <span className={styles.statLabel} style={{ color: '#764ba2' }}>총 전공 과목 수</span>
                  <div className={styles.statValue}>
                    {roadmap.reduce((acc, sem) => acc + sem.subjects.filter(s => s.dept !== "일반교양").length, 0)}
                    <span className={styles.statUnit}>개</span>
                  </div>
                </div>
              </div>

              <div className={styles.distributionSection}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 10 }}>학과별 전공 비중</h3>
                {(() => {
                  const distribution: Record<string, number> = {};
                  roadmap.forEach(sem => sem.subjects.forEach(sub => {
                    if (sub.dept !== "일반교양") {
                      distribution[sub.dept] = (distribution[sub.dept] || 0) + 1;
                    }
                  }));
                  const total = Object.values(distribution).reduce((a, b) => a + b, 0);
                  
                  return Object.entries(distribution)
                    .sort((a, b) => b[1] - a[1])
                    .map(([dept, count]) => {
                      const percentage = (count / total) * 100;
                      const color = getColor(dept);
                      return (
                        <div key={dept} className={styles.distItem}>
                          <div className={styles.distHeader}>
                            <span className={styles.distDept}>{dept}</span>
                            <span className={styles.distCount}>{count}과목 ({Math.round(percentage)}%)</span>
                          </div>
                          <div className={styles.distBarWrapper}>
                            <div 
                              className={styles.distBar} 
                              style={{ width: `${percentage}%`, background: color.bg }}
                            />
                          </div>
                        </div>
                      );
                    });
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MajorMap;
