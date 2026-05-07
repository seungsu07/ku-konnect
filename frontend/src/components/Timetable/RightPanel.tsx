import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Target, Info } from 'lucide-react';
import styles from './RightPanel.module.css';
export interface GraduationCreditData {
  name: string;
  value: number;
  color: string;
}

export interface GraduationProgressData {
  id: string;
  name: string;
  current: number;
  target: number;
  color: string;
}
const DATA: GraduationCreditData[] = [
  { name: '이수 (핵심교양)', value: 12, color: '#ff3131' },
  { name: '이수 (전공필수)', value: 24, color: '#ff914d' },
  { name: '이수 (전공선택)', value: 18, color: '#ffc6b4' },
  { name: '잔여 학점', value: 76, color: '#3b1e1eff' }
];

const TOTAL_CREDITS = 130;
const EARNED_CREDITS = DATA[0].value + DATA[1].value + DATA[2].value;

const PROGRESS_DATA: GraduationProgressData[] = [
  { id: 'core', name: '핵심교양', current: 12, target: 18, color: '#ff3131' },
  { id: 'major-req', name: '전공필수', current: 24, target: 30, color: '#ff914d' },
  { id: 'major-elec', name: '전공선택', current: 18, target: 45, color: '#ffc6b4' },
];

const RightPanel: React.FC = () => {
  return (
    <div className={styles.container}>
      <h2 className={styles.header}>
        <Target size={24} color="#ff3131" /> 졸업 요건 트래커
      </h2>

      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={DATA}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {DATA.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ background: 'var(--tooltip-bg, #3b1e1eff)', border: 'var(--tooltip-border, 1px solid #553333ff)', borderRadius: '8px', color: 'var(--tooltip-text, #fff)' }}
              itemStyle={{ color: 'var(--tooltip-text, #fff)' }}
              wrapperStyle={{ zIndex: 9999 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className={styles.chartCenterText}>
          <div className={styles.totalStr}>{EARNED_CREDITS} / {TOTAL_CREDITS}</div>
          <div className={styles.totalLabel}>총 이수 학점</div>
        </div>
      </div>

      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ background: '#ff3131' }}></div>
          핵심교양
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ background: '#ff914d' }}></div>
          전필
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ background: '#ffc6b4' }}></div>
          전선
        </div>
      </div>

      <div className={styles.progressSection}>
        {PROGRESS_DATA.map(item => (
          <div key={item.id} className={styles.progressItem}>
            <div className={styles.progressHeader}>
              <span className={styles.progressName}>{item.name}</span>
              <span className={styles.progressValue}>{item.current} / {item.target}학점</span>
            </div>
            <div className={styles.progressBarBg}>
              <div 
                className={styles.progressBarFill} 
                style={{ 
                  width: `${Math.min(100, (item.current / item.target) * 100)}%`,
                  background: item.color
                }} 
              />
            </div>
          </div>
        ))}
      </div>

      <div className={styles.feedbackBox}>
        <Info className={styles.feedbackIcon} size={20} />
        <div className={styles.feedbackText}>
          목표 졸업을 위해 <strong>전공필수 6학점</strong>이 더 필요합니다. 이번 추천 시간표에서 전필 과목을 우선 배정해보세요!
        </div>
      </div>
    </div>
  );
};

export default RightPanel;
