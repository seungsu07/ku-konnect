import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Plus, ChevronLeft, ChevronRight, Send, Users, MessageCircle,
  FolderOpen, Lock, Sparkles, BookOpen, FileText, Image as ImageIcon,
  Download, Upload, Hash, Filter, UserPlus, TrendingUp, BarChart3
} from 'lucide-react';
import styles from './Study.module.css';

/* ===== Color Helpers ===== */
const PASTEL_COLORS = [
  { bg: '#dbeafe', text: '#1e40af' },
  { bg: '#dcfce7', text: '#166534' },
  { bg: '#fce7f3', text: '#9d174d' },
  { bg: '#fef9c3', text: '#854d0e' },
  { bg: '#ede9fe', text: '#4c1d95' },
  { bg: '#ffedd5', text: '#9a3412' },
  { bg: '#d1f8fa', text: '#255759' },
  { bg: '#e0e7ff', text: '#3730a3' },
];

const getColor = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return PASTEL_COLORS[Math.abs(hash) % PASTEL_COLORS.length];
};

/* ===== Mock Data ===== */
interface StudyGroup {
  id: string;
  name: string;
  subject: string;
  subjectCode: string;
  desc: string;
  members: { name: string; avatar: string }[];
  maxMembers: number;
  status: 'recruiting' | 'full' | 'private';
  category: string;
  unread?: number;
  isMine?: boolean;
}

interface ChatMessage {
  id: string;
  sender: string;
  avatar: string;
  content: string;
  time: string;
  isMine: boolean;
}

interface SharedFile {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'doc';
  uploader: string;
  date: string;
  size: string;
}

const MY_STUDIES: StudyGroup[] = [
  { id: 's1', name: '알고리즘 마스터', subject: '알고리즘', subjectCode: 'COSE214', desc: '매주 금요일 백준 5문제 풀이', members: [{ name: '김민수', avatar: '민' }, { name: '이지은', avatar: '지' }, { name: '박서준', avatar: '서' }], maxMembers: 6, status: 'recruiting', category: '코딩', unread: 3, isMine: true },
  { id: 's2', name: 'OS 스터디', subject: '운영체제', subjectCode: 'COSE341', desc: '공룡책 같이 읽기 + 퀴즈', members: [{ name: '최유진', avatar: '유' }, { name: '정한솔', avatar: '한' }], maxMembers: 4, status: 'full', category: '전공', unread: 0, isMine: true },
  { id: 's3', name: 'TOEIC 900+ 목표반', subject: 'TOEIC', subjectCode: 'ENG001', desc: '주 3회 모의고사 + 오답 분석', members: [{ name: '한지민', avatar: '지' }, { name: '김태리', avatar: '태' }, { name: '송중기', avatar: '중' }, { name: '전지현', avatar: '지' }], maxMembers: 5, status: 'recruiting', category: '어학', unread: 7, isMine: true },
  { id: 's4', name: '데이터베이스 프로젝트팀', subject: '데이터베이스', subjectCode: 'COSE371', desc: 'PostgreSQL 기반 미니 프로젝트', members: [{ name: '이수현', avatar: '수' }, { name: '박보검', avatar: '보' }], maxMembers: 4, status: 'recruiting', category: '전공', unread: 0, isMine: true },
];

const PUBLIC_STUDIES: StudyGroup[] = [
  { id: 'p1', name: 'AI/ML 논문 리딩', subject: '인공지능', subjectCode: 'COSE361', desc: 'NeurIPS/ICML 주요 논문 주 1회 발표 및 토론. 딥러닝 기초 이상 필수', members: [{ name: '김철수', avatar: '철' }, { name: '이영희', avatar: '영' }, { name: '박민지', avatar: '민' }], maxMembers: 8, status: 'recruiting', category: '코딩' },
  { id: 'p2', name: '네트워크 시험 대비반', subject: '컴퓨터네트워크', subjectCode: 'COSE342', desc: 'TCP/IP 프로토콜 스택 완벽 정리. 기말고사 대비 집중 스터디', members: [{ name: '홍길동', avatar: '홍' }, { name: '김갑수', avatar: '갑' }, { name: '이을순', avatar: '을' }, { name: '박병호', avatar: '병' }], maxMembers: 4, status: 'full', category: '전공' },
  { id: 'p3', name: '코딩테스트 실전반', subject: '코딩테스트', subjectCode: 'CS000', desc: '삼성/카카오/네이버 기출 매주 4문제 풀이 + 코드 리뷰', members: [{ name: '정우성', avatar: '우' }, { name: '손예진', avatar: '예' }], maxMembers: 6, status: 'recruiting', category: '취업' },
  { id: 'p4', name: '소공 팀프로젝트 A조', subject: '소프트웨어공학', subjectCode: 'COSE242', desc: '애자일 방법론 실습. 주 2회 스프린트 미팅', members: [{ name: '강다니엘', avatar: '다' }], maxMembers: 5, status: 'private', category: '전공' },
  { id: 'p5', name: '일본어 JLPT N2', subject: 'JLPT', subjectCode: 'JPN002', desc: '12월 시험 목표 주 2회 문법/독해 스터디', members: [{ name: '다나카', avatar: '田' }, { name: '김나연', avatar: '나' }, { name: '이준호', avatar: '준' }], maxMembers: 6, status: 'recruiting', category: '어학' },
  { id: 'p6', name: '수학 기초 다지기', subject: '선형대수', subjectCode: 'MATH201', desc: '선형대수, 미적분 기초부터 탄탄히. 매주 토요일 오전', members: [{ name: '오일러', avatar: '오' }, { name: '가우스', avatar: '가' }], maxMembers: 4, status: 'recruiting', category: '기초' },
];

const MOCK_CHAT: ChatMessage[] = [
  { id: 'c1', sender: '김민수', avatar: '민', content: '오늘 백준 1629번 풀어봤는데 분할정복으로 풀면 되더라', time: '오후 2:30', isMine: false },
  { id: 'c2', sender: '이지은', avatar: '지', content: '아 그거 모듈러 연산 부분에서 오버플로 조심해야 해!', time: '오후 2:32', isMine: false },
  { id: 'c3', sender: '나', avatar: '나', content: '맞아 long long 안 쓰면 바로 틀림 ㅋㅋ', time: '오후 2:33', isMine: true },
  { id: 'c4', sender: '박서준', avatar: '서', content: '근데 이번 주 금요일 스터디 카페 어디로 할까요?', time: '오후 2:45', isMine: false },
  { id: 'c5', sender: '나', avatar: '나', content: '안암역 근처 탐앤탐스 어때요? 콘센트도 많고 넓더라', time: '오후 2:46', isMine: true },
  { id: 'c6', sender: '김민수', avatar: '민', content: '좋아요 👍 그럼 금요일 3시에 거기서 봐요!', time: '오후 2:48', isMine: false },
  { id: 'c7', sender: '이지은', avatar: '지', content: '저 이번 주 과제 범위가 DP까지인데 혹시 좋은 문제 추천 있나요?', time: '오후 3:10', isMine: false },
  { id: 'c8', sender: '나', avatar: '나', content: 'BOJ 12865 평범한 배낭이랑 11053 가장 긴 증가하는 부분 수열 추천!', time: '오후 3:12', isMine: true },
];

const MOCK_FILES: SharedFile[] = [
  { id: 'f1', name: '알고리즘_중간고사_정리노트.pdf', type: 'pdf', uploader: '김민수', date: '5월 10일', size: '2.4 MB' },
  { id: 'f2', name: 'DP_패턴_총정리.pdf', type: 'pdf', uploader: '이지은', date: '5월 8일', size: '1.8 MB' },
  { id: 'f3', name: '그래프_알고리즘_마인드맵.png', type: 'image', uploader: '박서준', date: '5월 5일', size: '890 KB' },
  { id: 'f4', name: '분할정복_예제코드.docx', type: 'doc', uploader: '나', date: '5월 3일', size: '156 KB' },
  { id: 'f5', name: '시간복잡도_치트시트.pdf', type: 'pdf', uploader: '김민수', date: '4월 28일', size: '540 KB' },
];

const RECOMMENDED = [
  { id: 'r1', name: 'React 심화 스터디', members: 5, category: '코딩' },
  { id: 'r2', name: '경제학원론 시험대비', members: 3, category: '교양' },
  { id: 'r3', name: '고시반 행정법', members: 7, category: '고시' },
  { id: 'r4', name: '포트폴리오 피드백', members: 4, category: '취업' },
];

const CATEGORIES = ['전체', '전공', '코딩', '어학', '취업', '기초'];

/* ===== Component ===== */
const Study: React.FC = () => {
  const [view, setView] = useState<'explore' | 'room'>('explore');
  const [activeStudyId, setActiveStudyId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('전체');
  const [activeTab, setActiveTab] = useState<'chat' | 'files'>('chat');
  const [entryCode, setEntryCode] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState(MOCK_CHAT);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.backgroundColor = '#f8fafc';
    return () => { document.body.style.backgroundColor = ''; };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const enterStudy = (id: string) => {
    setActiveStudyId(id);
    setView('room');
    setActiveTab('chat');
  };

  const activeStudy = [...MY_STUDIES, ...PUBLIC_STUDIES].find(s => s.id === activeStudyId);

  const filteredStudies = PUBLIC_STUDIES.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === '전체' || s.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    setMessages(prev => [...prev, {
      id: `c${Date.now()}`,
      sender: '나',
      avatar: '나',
      content: chatInput.trim(),
      time: new Date().toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit', hour12: true }),
      isMine: true,
    }]);
    setChatInput('');
  };

  const handleEntryCode = () => {
    if (entryCode.length < 4) return;
    alert(`입장 코드 "${entryCode}"로 스터디를 검색합니다...`);
    setEntryCode('');
  };

  const getFileIcon = (type: string) => {
    if (type === 'pdf') return <FileText size={22} />;
    if (type === 'image') return <ImageIcon size={22} />;
    return <FileText size={22} />;
  };

  const getFileIconColor = (type: string) => {
    if (type === 'pdf') return { bg: '#fee2e2', color: '#ef4444' };
    if (type === 'image') return { bg: '#dbeafe', color: '#3b82f6' };
    return { bg: '#e0e7ff', color: '#6366f1' };
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>

        {/* ===== Left Sidebar ===== */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarCard}>
            <h3 className={styles.sidebarTitle}>
              <BookOpen size={18} color="#ff3131" /> 내 스터디
            </h3>
            <div className={styles.studyList}>
              {MY_STUDIES.map(study => {
                const color = getColor(study.subjectCode);
                return (
                  <div
                    key={study.id}
                    className={`${styles.studyItem} ${activeStudyId === study.id && view === 'room' ? styles.studyItemActive : ''}`}
                    onClick={() => enterStudy(study.id)}
                  >
                    <div className={styles.studyItemIcon} style={{ background: color.bg, color: color.text }}>
                      {study.name[0]}
                    </div>
                    <div className={styles.studyItemInfo}>
                      <span className={styles.studyItemName}>{study.name}</span>
                      <span className={styles.studyItemMeta}>{study.members.length}명 · {study.subject}</span>
                    </div>
                    {(study.unread ?? 0) > 0 && (
                      <span className={styles.unreadBadge}>{study.unread}</span>
                    )}
                  </div>
                );
              })}
            </div>
            <button className={styles.createStudyBtn}>
              <Plus size={18} /> 새 스터디 만들기
            </button>
          </div>
        </aside>

        {/* ===== Center Panel ===== */}
        <main className={styles.mainContent}>
          {view === 'explore' ? (
            <>
              {/* Explore Header */}
              <div className={styles.exploreHeader}>
                <h2 className={styles.exploreTitle}>스터디 탐색</h2>
              </div>

              {/* Search & Filters */}
              <div className={styles.filterRow}>
                <div className={styles.searchBar}>
                  <Search size={18} className={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="스터디 이름이나 과목으로 검색..."
                    className={styles.searchInput}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.filterRow}>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    className={`${styles.filterBtn} ${activeCategory === cat ? styles.filterBtnActive : ''}`}
                    onClick={() => setActiveCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Mobile Entry Code */}
              <div className={styles.mobileEntryCard}>
                <div className={styles.codeInputGroup}>
                  <input
                    type="text"
                    className={styles.codeInput}
                    placeholder="비공개 스터디 입장 코드..."
                    maxLength={6}
                    value={entryCode}
                    onChange={e => setEntryCode(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && handleEntryCode()}
                  />
                  <button className={styles.codeSubmitBtn} onClick={handleEntryCode}>
                    입장
                  </button>
                </div>
              </div>

              {/* Study Cards */}
              <div className={styles.studyGrid}>
                {filteredStudies.map(study => {
                  const color = getColor(study.subjectCode);
                  return (
                    <div key={study.id} className={styles.studyCard} onClick={() => enterStudy(study.id)}>
                      <div className={styles.studyCardHeader}>
                        <span
                          className={styles.studyCardSubject}
                          style={{ background: color.bg, color: color.text }}
                        >
                          {study.subject}
                        </span>
                        <span className={`${styles.studyCardBadge} ${
                          study.status === 'recruiting' ? styles.badgeRecruiting :
                          study.status === 'full' ? styles.badgeFull : styles.badgePrivate
                        }`}>
                          {study.status === 'recruiting' && <><UserPlus size={10} /> 모집중</>}
                          {study.status === 'full' && '마감'}
                          {study.status === 'private' && <><Lock size={10} /> 비공개</>}
                        </span>
                      </div>
                      <h3 className={styles.studyCardTitle}>{study.name}</h3>
                      <p className={styles.studyCardDesc}>{study.desc}</p>
                      <div className={styles.studyCardFooter}>
                        <div className={styles.memberAvatars}>
                          {study.members.slice(0, 3).map((m, i) => (
                            <div
                              key={i}
                              className={styles.memberAvatar}
                              style={{ background: getColor(m.name).bg, color: getColor(m.name).text }}
                            >
                              {m.avatar}
                            </div>
                          ))}
                          <span className={styles.memberCount}>
                            {study.members.length}/{study.maxMembers}
                          </span>
                        </div>
                        <span className={styles.studyCardAction}>
                          참여하기 <ChevronRight size={14} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* ===== Study Room ===== */
            <>
              <div className={styles.roomHeader}>
                <button className={styles.backBtn} onClick={() => { setView('explore'); setActiveStudyId(null); }}>
                  <ChevronLeft size={18} /> 탐색으로
                </button>
                <h2 className={styles.roomTitle}>{activeStudy?.name || '스터디'}</h2>
                <div className={styles.roomMembers}>
                  {activeStudy?.members.slice(0, 4).map((m, i) => (
                    <div
                      key={i}
                      className={styles.memberAvatar}
                      style={{ background: getColor(m.name).bg, color: getColor(m.name).text, marginLeft: i > 0 ? '-6px' : 0 }}
                    >
                      {m.avatar}
                    </div>
                  ))}
                  <span className={styles.memberCount} style={{ marginLeft: 6 }}>
                    {activeStudy?.members.length}명
                  </span>
                </div>
              </div>

              {/* Tabs */}
              <div className={styles.tabs}>
                <button className={`${styles.tab} ${activeTab === 'chat' ? styles.tabActive : ''}`} onClick={() => setActiveTab('chat')}>
                  <MessageCircle size={16} /> 채팅
                </button>
                <button className={`${styles.tab} ${activeTab === 'files' ? styles.tabActive : ''}`} onClick={() => setActiveTab('files')}>
                  <FolderOpen size={16} /> 자료실
                </button>
              </div>

              {/* Chat Tab */}
              {activeTab === 'chat' && (
                <div className={styles.chatContainer}>
                  <div className={styles.chatMessages}>
                    {messages.map(msg => (
                      <div key={msg.id} className={`${styles.messageGroup} ${msg.isMine ? styles.messageGroupMine : ''}`}>
                        {!msg.isMine && (
                          <div className={styles.messageAvatar} style={{ background: getColor(msg.sender).bg, color: getColor(msg.sender).text }}>
                            {msg.avatar}
                          </div>
                        )}
                        <div>
                          {!msg.isMine && <div className={styles.messageSender}>{msg.sender}</div>}
                          <div className={`${styles.messageBubble} ${msg.isMine ? styles.messageBubbleMine : styles.messageBubbleOther}`}>
                            {msg.content}
                          </div>
                          <div className={styles.messageTime}>{msg.time}</div>
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>

                  <div className={styles.chatInputBar}>
                    <input
                      type="text"
                      className={styles.chatInput}
                      placeholder="메시지를 입력하세요..."
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    />
                    <button className={styles.chatSendBtn} onClick={handleSendMessage}>
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              )}

              {/* Files Tab */}
              {activeTab === 'files' && (
                <div className={styles.filesGrid}>
                  <button className={styles.uploadBtn}>
                    <Upload size={18} /> 파일 업로드
                  </button>
                  {MOCK_FILES.map(file => {
                    const iconColor = getFileIconColor(file.type);
                    return (
                      <div key={file.id} className={styles.fileCard}>
                        <div className={styles.fileIcon} style={{ background: iconColor.bg, color: iconColor.color }}>
                          {getFileIcon(file.type)}
                        </div>
                        <div className={styles.fileInfo}>
                          <div className={styles.fileName}>{file.name}</div>
                          <div className={styles.fileMeta}>
                            <span>{file.uploader}</span>
                            <span>·</span>
                            <span>{file.date}</span>
                            <span>·</span>
                            <span>{file.size}</span>
                          </div>
                        </div>
                        <Download size={18} className={styles.fileDownload} />
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </main>

        {/* ===== Right Sidebar ===== */}
        <aside className={styles.rightSidebar}>
          {/* Entry Code */}
          <div className={styles.rightCard}>
            <h3 className={styles.rightCardTitle}>
              <Hash size={18} color="#ff3131" /> 입장 코드
            </h3>
            <div className={styles.codeInputGroup}>
              <input
                type="text"
                className={styles.codeInput}
                placeholder="코드 입력"
                maxLength={6}
                value={entryCode}
                onChange={e => setEntryCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleEntryCode()}
              />
              <button className={styles.codeSubmitBtn} onClick={handleEntryCode}>
                입장
              </button>
            </div>
            <p className={styles.codeHelper}>
              비공개 스터디의 고유 입장 코드를 입력하면 바로 참여할 수 있습니다.
            </p>
          </div>

          {/* My Stats */}
          <div className={styles.rightCard}>
            <h3 className={styles.rightCardTitle}>
              <BarChart3 size={18} color="#ff3131" /> 나의 스터디 활동
            </h3>
            <div className={styles.statsGrid}>
              <div className={styles.statBox}>
                <div className={styles.statNumber}>{MY_STUDIES.length}</div>
                <div className={styles.statLabel}>참여 중</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statNumber}>12</div>
                <div className={styles.statLabel}>이번 주 메시지</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statNumber}>3</div>
                <div className={styles.statLabel}>공유한 자료</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statNumber}>🔥</div>
                <div className={styles.statLabel}>연속 4주 참여</div>
              </div>
            </div>
          </div>

          {/* Recommended */}
          <div className={styles.rightCard}>
            <h3 className={styles.rightCardTitle}>
              <TrendingUp size={18} color="#ff3131" /> 추천 스터디
            </h3>
            <div className={styles.recList}>
              {RECOMMENDED.map((rec, idx) => (
                <div key={rec.id} className={styles.recItem}>
                  <span className={styles.recRank}>{idx + 1}</span>
                  <div className={styles.recContent}>
                    <span className={styles.recTitle}>{rec.name}</span>
                    <span className={styles.recMeta}>{rec.members}명 참여 · {rec.category}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Card */}
          <div className={styles.rightCard} style={{ background: 'linear-gradient(135deg, #ff3131 0%, #ff914d 100%)', color: 'white', border: 'none' }}>
            <h3 className={styles.rightCardTitle} style={{ color: 'white' }}>
              <Sparkles size={18} /> 스터디 만들기
            </h3>
            <p style={{ fontSize: '0.85rem', opacity: 0.9, lineHeight: 1.5 }}>
              나만의 스터디 그룹을 만들고 함께 성장하세요! 비공개 입장 코드도 자동 생성됩니다.
            </p>
            <button style={{
              marginTop: 14, padding: '10px 20px', borderRadius: 10,
              border: '2px solid rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.15)',
              color: 'white', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
              transition: 'all 0.2s', width: '100%',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
            >
              <Plus size={16} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />
              스터디 개설하기
            </button>
          </div>
        </aside>

      </div>
    </div>
  );
};

export default Study;
