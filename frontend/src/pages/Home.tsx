import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Map as MapIcon, MessageSquare, Users, Sparkles, ArrowRight } from 'lucide-react';
import Matter from 'matter-js';
import styles from './Home.module.css';

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

const SUBJECTS = [
  "알고리즘", "운영체제", "자료구조", "데이터베이스", "인공지능", "컴퓨터네트워크", "소프트웨어공학", "이산수학"
];

const PhysicsTags: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const tagDOMRefs = useRef<Record<number, HTMLDivElement>>({});

  useEffect(() => {
    if (!containerRef.current) return;
    const height = window.innerHeight;
    
    const engine = Matter.Engine.create();
    const world = engine.world;

    const mouseBody = Matter.Bodies.circle(-1000, -1000, 40, {
      isStatic: true,
      render: { visible: false }
    });
    Matter.World.add(world, mouseBody);

    const onMouseMove = (e: MouseEvent) => {
      Matter.Body.setPosition(mouseBody, { x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', onMouseMove);

    const bodiesInfo: { body: Matter.Body, id: number, text: string, color: any }[] = [];
    let nextId = 0;

    const spawnTag = (startY = -50) => {
      const text = SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)];
      const color = PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)];
      const w = text.length * 16 + 40; 
      const h = 40;
      
      const currentWidth = window.innerWidth;
      const spawnLeft = Math.random() > 0.5;
      const minX = spawnLeft ? currentWidth * 0.05 : currentWidth * 0.7;
      const maxX = spawnLeft ? currentWidth * 0.3 : currentWidth * 0.95;
      const x = Math.random() * (maxX - minX) + minX;

      const body = Matter.Bodies.rectangle(x, startY, w, h, {
        restitution: 0.6,
        frictionAir: 0.02,
        angle: (Math.random() - 0.5) * 0.5,
        collisionFilter: {
          category: 0x0002,
          mask: 0x0001,
        }
      });
      
      const id = nextId++;
      bodiesInfo.push({ body, id, text, color });
      Matter.World.add(world, body);

      const el = document.createElement('div');
      el.className = styles.physicsTag;
      el.textContent = text;
      el.style.backgroundColor = color.bg;
      el.style.color = color.text;
      
      //초기 생성 로직
      el.style.transform = `translate(${x - w/2}px, ${startY - h/2}px) rotate(0rad)`;
      
      containerRef.current?.appendChild(el);
      tagDOMRefs.current[id] = el;
    };

    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);

    //생성 로직
    let lastSpawnTime = performance.now() - 600;
    const SPAWN_INTERVAL = 600;

    let rafId: number;
    const updateLoop = (time: number) => {
      try {
        if (time - lastSpawnTime > SPAWN_INTERVAL && bodiesInfo.length < 25) {
          spawnTag();
          lastSpawnTime = time;
        }
        const featuresEl = document.getElementById('features-section');
        const cutoffY = featuresEl ? featuresEl.getBoundingClientRect().top + window.scrollY : height;

        if (containerRef.current) {
          containerRef.current.style.height = `${cutoffY}px`;
        }

        for (let i = bodiesInfo.length - 1; i >= 0; i--) {
          const info = bodiesInfo[i];
          const el = tagDOMRefs.current[info.id];

          //오류 방지
          if (isNaN(info.body.position.x) || isNaN(info.body.position.y)) {
            Matter.World.remove(world, info.body);
            if (el) el.remove();
            delete tagDOMRefs.current[info.id];
            bodiesInfo.splice(i, 1);
            continue;
          }

          if (el) {
            el.style.transform = `translate(${info.body.position.x - el.offsetWidth/2}px, ${info.body.position.y - el.offsetHeight/2}px) rotate(${info.body.angle}rad)`;
          }
          //생성 구역
          const tagTopY = el ? info.body.position.y - el.offsetHeight / 2 : info.body.position.y - 20;
          
          //삭제 로직
          if (tagTopY > cutoffY + 50) {
            Matter.World.remove(world, info.body);
            if (el) el.remove();
            delete tagDOMRefs.current[info.id];
            bodiesInfo.splice(i, 1);
          }
        }
      } catch (e) {
        console.error("Physics loop error:", e);
      }
      rafId = requestAnimationFrame(updateLoop);
    };
    rafId = requestAnimationFrame(updateLoop);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(rafId);
      Matter.Runner.stop(runner);
      Matter.Engine.clear(engine);
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      //샤갈!!!!!!!! 드디어 고쳤다
      document.querySelectorAll(`.${styles.physicsTag}`).forEach(el => el.remove());
      tagDOMRefs.current = {};
    };
  }, []);

  return <div ref={containerRef} className={styles.physicsContainer} />;
};

const Home: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.bgGlow}></div>
      <div className={styles.bgGlowRight}></div>

      <PhysicsTags />

      <div className={styles.content}>

        {/* 시작 페이지 */}
        <div className={styles.hero}>
          <div className={styles.badge}>
            <Sparkles size={14} style={{ marginRight: '6px', display: 'inline-block', verticalAlign: 'text-bottom' }} />
            고려대학교 학생들을 위한 차세대 플랫폼
          </div>
          <h1 className={styles.title}>
            대학 생활을 스마트하게<br />
            <span className={styles.highlight}>연결하다, Konnect</span>
          </h1>
          <p className={styles.subtitle}>
            AI 기반 시간표 설계부터 전공 로드맵, 그리고 학우들과의 네트워킹까지.<br />
            오직 고려대 학생들을 위해 설계된 올인원 캠퍼스 플랫폼입니다.
          </p>
          <div className={styles.ctaGroup}>
            <Link to="/timetable" className={styles.primaryBtn}>
              시간표 짜기 <ArrowRight size={20} />
            </Link>
            <Link to="/majormap" className={styles.secondaryBtn}>
              전공 맵 구경하기
            </Link>
          </div>
        </div>

        {/* 핵심 기능 */}
        <div className={styles.featuresWrapper} id="features-section">
          <h2 className={styles.sectionTitle}>Konnect 핵심 기능</h2>
          <div className={styles.featuresGrid}>

            <Link to="/timetable" className={styles.featureCard}>
              <div className={styles.iconWrapper}>
                <CalendarDays size={28} />
              </div>
              <h3 className={styles.featureTitle}>AI 시간표 설계</h3>
              <p className={styles.featureDesc}>
                가능한 모든 조합을 탐색하여, 우주공강 방지부터 1교시 방지까지 완벽한 시간표를 1초 만에 만들어냅니다.
              </p>
            </Link>

            <Link to="/majormap" className={styles.featureCard}>
              <div className={styles.iconWrapper}>
                <MapIcon size={28} />
              </div>
              <h3 className={styles.featureTitle}>맞춤형 전공 로드맵</h3>
              <p className={styles.featureDesc}>
                졸업 요건과 이수 체계를 한눈에 파악하세요. AI 추천을 통해 나만의 전공 트리를 완성할 수 있습니다.
              </p>
            </Link>

            <Link to="/kommunity" className={styles.featureCard}>
              <div className={styles.iconWrapper}>
                <MessageSquare size={28} />
              </div>
              <h3 className={styles.featureTitle}>실시간 익명 커뮤니티</h3>
              <p className={styles.featureDesc}>
                강의 후기, 족보 공유, 학교 생활 꿀팁까지. 철저하게 인증된 고대생들만의 프라이빗한 커뮤니티에서 소통하세요.
              </p>
            </Link>

            <Link to="/study" className={styles.featureCard}>
              <div className={styles.iconWrapper}>
                <Users size={28} />
              </div>
              <h3 className={styles.featureTitle}>맞춤형 스터디 매칭</h3>
              <p className={styles.featureDesc}>
                같은 과목을 듣는 학우들, 취업/고시를 준비하는 사람들을 쉽게 찾고 네트워킹하세요. 관심사가 맞는 팀을 찾아드립니다.
              </p>
            </Link>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Home;
