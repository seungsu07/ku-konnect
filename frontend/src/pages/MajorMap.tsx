import { useState, useRef, useEffect } from 'react';
import { Sparkles, Zap, RefreshCcw, BookOpen, Target, Clock, ArrowRight } from 'lucide-react';
import styles from './MajorMap.module.css';
import { dataApi } from '../api/data';

type RoadMapCourse = {
  name: string;
  code: string;
  score: number;
  reason: string;
  type: number;
  pre: string;
  freq: number;
};

type RoadMapSlot = {
  year: number;
  sem: number;
  courses: RoadMapCourse[];
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
  const [roadmap, setRoadmap] = useState<RoadMapSlot[] | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [prompt]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setSubmittedPrompt(prompt);
    setIsGenerating(true);
    setRoadmap(null);

    try {
      const res = await dataApi.generateRoadMap({ input: prompt });
      if (res.success) {
        setRoadmap(res.data);
      } else {
        alert('로드맵 생성 실패: ' + (res.e || '서버 오류'));
      }
    } catch (err) {
      console.error('Failed to generate roadmap:', err);
      alert('로드맵 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
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
            <span className={styles.highlight}>AI Roadmap</span> Designer
          </h1>
          <p className={styles.subtitle}>
            당신의 진로를 입력하면 컴퓨터학과 최적의 이수 체계를 설계해 드립니다.
          </p>
        </div>

        <div className={styles.promptContainer}>
          {!roadmap && !isGenerating ? (
            <div className={styles.promptBox}>
              <textarea
                ref={textareaRef}
                className={styles.input}
                placeholder="예: 실리콘밸리에서 활약하는 데이터 과학자가 되고 싶어!"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <button 
                className={styles.generateBtn}
                onClick={handleGenerate}
                disabled={!prompt.trim()}
              >
                <Zap size={20} />
                로드맵 설계 시작
              </button>
            </div>
          ) : (
            <div className={styles.staticPrompt}>
              <div className={styles.submittedPromptBox}>
                <span className={styles.quote}>"</span>
                {submittedPrompt}
                <span className={styles.quote}>"</span>
              </div>
              {roadmap && (
                <button onClick={handleReset} className={styles.resetBtn}>
                  <RefreshCcw size={14} /> 다른 진로로 설계하기
                </button>
              )}
            </div>
          )}
        </div>

        {isGenerating && (
          <div className={styles.loading}>
            <div className={styles.loader}></div>
            <p>AI가 전공 필수와 추천 과목을 조화롭게 배치하는 중입니다...</p>
          </div>
        )}

        {roadmap && !isGenerating && (
          <div className={styles.roadmapGrid}>
            {[1, 2, 3, 4].map(year => (
              <div key={year} className={styles.yearSection}>
                <h2 className={styles.yearTitle}>{year}학년</h2>
                <div className={styles.semestersContainer}>
                  {[1, 2].map(sem => {
                    const slot = roadmap.find(r => r.year === year && r.sem === sem);
                    return (
                      <div key={sem} className={styles.semesterBox}>
                        <div className={styles.semesterHeader}>
                          <span className={styles.semLabel}>{sem}학기</span>
                          <span className={styles.courseCount}>{slot?.courses.length || 0} 과목</span>
                        </div>
                        <div className={styles.courseList}>
                          {slot?.courses.map((course, idx) => {
                            const color = getColor(course.name);
                            const isMandatory = course.type === 0 || course.type === 3;
                            return (
                              <div key={idx} className={styles.courseCard} title={course.reason}>
                                <div className={styles.courseTop}>
                                  <span className={styles.courseCode}>{course.code}</span>
                                  {isMandatory && <span className={styles.mandatoryBadge}>필수</span>}
                                </div>
                                <div className={styles.courseName}>{course.name}</div>
                                {course.pre && (
                                  <div className={styles.coursePre}>
                                    <ArrowRight size={10} /> {course.pre}
                                  </div>
                                )}
                                <div className={styles.courseFreq}>
                                  <Clock size={10} /> 5개년 {course.freq}회 개설
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MajorMap;
