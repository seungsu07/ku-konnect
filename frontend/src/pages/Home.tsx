import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Map as MapIcon, MessageSquare, Users, Sparkles, ArrowRight } from 'lucide-react';
import styles from './Home.module.css';

const Home: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.bgGlow}></div>
      <div className={styles.bgGlowRight}></div>

      <div className={styles.content}>

        {/* Hero Section */}
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

        {/* Features Section */}
        <div className={styles.featuresWrapper}>
          <h2 className={styles.sectionTitle}>Konnect 핵심 기능</h2>
          <div className={styles.featuresGrid}>

            <Link to="/timetable" className={styles.featureCard}>
              <div className={styles.iconWrapper}>
                <CalendarDays size={28} />
              </div>
              <h3 className={styles.featureTitle}>AI 시간표 설계</h3>
              <p className={styles.featureDesc}>
                15,000개 이상의 조합을 탐색하여, 우주공강 방지부터 최소 동선 최적화까지 완벽한 시간표를 1초 만에 만들어냅니다.
              </p>
            </Link>

            <Link to="/majormap" className={styles.featureCard}>
              <div className={styles.iconWrapper}>
                <MapIcon size={28} />
              </div>
              <h3 className={styles.featureTitle}>맞춤형 전공 로드맵</h3>
              <p className={styles.featureDesc}>
                졸업 요건과 이수 체계를 한눈에 파악하세요. 선배들의 데이터와 AI 추천을 통해 나만의 전공 트리를 완성할 수 있습니다.
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
