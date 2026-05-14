import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.content}>
        <div className={styles.top}>
          <div className={styles.brandSection}>
            <Link to="/" className={styles.logo}>
              KU-Konnect<span className={styles.logoDot}>.</span>
            </Link>
            <p className={styles.description}>
              고려대학교 학생들을 위한 AI 기반 스마트 캠퍼스 라이프 플랫폼. 
            </p>
          </div>

          <div className={styles.linkGroup}>
            <h3 className={styles.groupTitle}>서비스</h3>
            <div className={styles.links}>
              <Link to="/majormap" className={styles.link}>전공설계 AI</Link>
              <Link to="/timetable" className={styles.link}>시간표 생성</Link>
              <Link to="/kommunity" className={styles.link}>커뮤니티</Link>
            </div>
          </div>

          <div className={styles.linkGroup}>
            <h3 className={styles.groupTitle}>정보</h3>
            <div className={styles.links}>
              <Link to="/terms" className={styles.link}>이용약관</Link>
              <Link to="/privacy" className={styles.link}>개인정보처리방침</Link>
              <Link to="/contact" className={styles.link}>문의하기</Link>
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <div className={styles.copyright}>
            &copy; 2026 KU-Konnect. All rights reserved.
          </div>
          <div className={styles.copyright}>
            Made by Team KU-Konnect
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
