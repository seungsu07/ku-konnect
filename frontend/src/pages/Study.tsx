import { useState, useEffect, useRef, useContext } from 'react';
import type { FC } from 'react';
import {
  Search, Plus, ChevronLeft, ChevronRight, Send, MessageCircle,
  FolderOpen, Lock, Sparkles, BookOpen, FileText, Image as ImageIcon,
  Download, Upload, Hash, UserPlus, TrendingUp, BarChart3,
  ShieldCheck, Copy
} from 'lucide-react';
import styles from './Study.module.css';
import { dataApi } from '../api/data';
import { AppDataContext } from '../api/DataContext';
import type { StudyGroup, Post, UserProfile } from '../../../common/models';

interface SharedFile {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'doc';
  uploader: string;
  date: string;
  size: string;
}

const MOCK_FILES: SharedFile[] = [
  { id: 'f1', name: '알고리즘_중간고사_정리노트.pdf', type: 'pdf', uploader: '김민수', date: '5월 10일', size: '2.4 MB' },
  { id: 'f2', name: 'DP_패턴_총정리.pdf', type: 'pdf', uploader: '이지은', date: '5월 8일', size: '1.8 MB' },
  { id: 'f3', name: '그래프_알고리즘_마인드맵.png', type: 'image', uploader: '박서준', date: '5월 5일', size: '890 KB' },
];



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

const CATEGORIES = ['전체', '전공', '코딩', '어학', '취업', '기초'];

const Study: FC = () => {
  const { userProfile } = useContext(AppDataContext);
  
  const [view, setView] = useState<'explore' | 'room'>('explore');
  const [activeStudyId, setActiveStudyId] = useState<string | null>(null);
  const [activeStudy, setActiveStudy] = useState<StudyGroup | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('전체');
  const [activeTab, setActiveTab] = useState<'chat' | 'files'>('chat');
  
  const [myStudies, setMyStudies] = useState<StudyGroup[]>([]);
  const [publicStudies, setPublicStudies] = useState<StudyGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [entryCode, setEntryCode] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Post[]>([]);
  const [authorMap, setAuthorMap] = useState<Record<string, UserProfile>>({});
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Create Mode States
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [newStudyName, setNewStudyName] = useState('');
  const [newStudyDesc, setNewStudyDesc] = useState('');
  const [newStudyCategory, setNewStudyCategory] = useState('전공');
  const [newStudyIsPrivate, setNewStudyIsPrivate] = useState(false);
  const [newStudyUserVisible, setNewStudyUserVisible] = useState(true);

  useEffect(() => {
    fetchStudies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile]);

  const fetchStudies = async () => {
    try {
      const all = await dataApi.getStudyGroups({ inviting: true });
      setPublicStudies(all as StudyGroup[]);

      if (userProfile) {
        const my = (all as StudyGroup[]).filter(s => 
          s.users.includes(userProfile.id as any) || s.host === userProfile.id
        );
        setMyStudies(my);
      }
    } catch (err) {
      console.error('Failed to fetch studies:', err);
    }
  };

  useEffect(() => {
    if (view === 'room' && activeStudy?.chat) {
      fetchMessages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, activeStudy?.chat]);

  const fetchMessages = async () => {
    if (!activeStudy?.chat) return;
    try {
      const msgs = await dataApi.getPosts({ board: activeStudy.chat as any });
      setMessages(msgs);

      const authorIds = Array.from(new Set(msgs.map((m: Post) => m.author)));
      const profilePromises = authorIds.map(id => dataApi.getUserProfiles({ id: id as any }));
      const profiles = (await Promise.all(profilePromises)).flat();
      
      const newMap = { ...authorMap };
      profiles.forEach(p => { if(p) newMap[p.id] = p; });
      setAuthorMap(newMap);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  useEffect(() => {
    if (view === 'room' && activeStudy && userProfile && activeStudy.host === userProfile.id) {
      const interval = setInterval(() => rotateVerifyCode(), 1000 * 60 * 10);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, activeStudy?.id, userProfile?.id]);

  const rotateVerifyCode = async () => {
    if (!activeStudy || !userProfile || activeStudy.host !== userProfile.id) return;
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    try {
      await dataApi.updateStudyGroup({
        id: activeStudy.id,
        data: { verify_code: newCode } as any
      });
      setActiveStudy((prev: StudyGroup | null) => prev ? { ...prev, verify_code: newCode } : null);
    } catch (err) {
      console.warn('Failed to rotate code:', err);
    }
  };

  const handleCreateStudy = async () => {
    if (!userProfile) return;
    const studyName = newStudyName.trim();
    try {
      const res = await dataApi.createStudyGroup({
        name: studyName,
        user_visible: newStudyUserVisible,
        inviting: true, // Defaulting to true
        visible: !newStudyIsPrivate,
        description: newStudyDesc,
        profile: userProfile.id
      });

      if (res.success) {
        setIsCreateMode(false);
        setNewStudyName('');
        setNewStudyDesc('');
        alert('새 스터디가 성공적으로 생성되었습니다!');
        
        // Refresh list and find the new study
        await fetchStudies(true);
        
        // Wait a bit for state updates and fetch the fresh study object
        setTimeout(async () => {
          const res = await dataApi.getStudyGroups({ name: studyName });
          if (res && res.length > 0) {
            // Force ish: true for the creator in case backend detection fails
            enterStudy({ ...res[0], ish: true });
          }
        }, 500);
      } else {
        alert('생성 실패: ' + ((res as any).e || '알 수 없는 오류'));
      }
    } catch (err) {
      console.error('Failed to create study:', err);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !activeStudy?.chat || !userProfile) return;
    try {
      const res = await dataApi.createPost({
        board: activeStudy.chat as any,
        title: 'Chat',
        content: chatInput.trim(),
        visible: true,
        profile: userProfile.id
      });
      if (res.success) {
        setChatInput('');
        fetchMessages();
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleEntryCode = async () => {
    if (!activeStudy || entryCode.length !== 6) {
      alert('6자리 코드를 정확히 입력해주세요.');
      return;
    }
    
    if (!userProfile) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const res = await dataApi.joinStudyWithCode({
        group: activeStudy.id,
        code: entryCode,
        profile: userProfile.id
      } as any);
      
      if (res.success) {
        alert('스터디 가입이 완료되었습니다!');
        fetchStudies();
      } else {
        alert('코드가 일치하지 않거나 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('가입 처리 중 오류가 발생했습니다.');
    }
    setEntryCode('');
  };

  const handleRequestJoin = async (study: StudyGroup) => {
    if (!userProfile) return;
    try {
      const res = await dataApi.requestJoinStudy({
        group: study.id,
        profile: userProfile.id
      } as any);
      if (res.success) {
        alert('가입 신청이 완료되었습니다! 방장에게 받은 입장 코드를 입력해주세요.');
        fetchStudies();
      } else {
        alert('신청 실패: ' + (res.e || ''));
      }
    } catch (err) {
      console.error(err);
      alert('신청 중 오류가 발생했습니다.');
    }
  };

  const enterStudy = async (study: StudyGroup) => {
    // Client-side host verification to bypass backend mapping issues
    const isHost = study.host === userProfile?.id;
    const studyWithCorrectRole = { ...study, ish: study.ish || isHost };
    
    setActiveStudy(studyWithCorrectRole);
    setActiveStudyId(study.id);
    setView('room');
  };

  const filteredStudies = publicStudies.filter((s: StudyGroup) => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === '전체'; // Categories not yet implemented in backend
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    document.body.style.backgroundColor = '#f8fafc';
    return () => { document.body.style.backgroundColor = ''; };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
              {myStudies.map(study => {
                const color = getColor(study.id);
                return (
                  <div
                    key={study.id}
                    className={`${styles.studyItem} ${activeStudyId === study.id && view === 'room' ? styles.studyItemActive : ''}`}
                    onClick={() => enterStudy(study)}
                  >
                    <div className={styles.studyItemIcon} style={{ background: color.bg, color: color.text }}>
                      {study.name[0]}
                    </div>
                    <div className={styles.studyItemInfo}>
                      <span className={styles.studyItemName}>{study.name}</span>
                      <span className={styles.studyItemMeta}>{study.users.length}명</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <button className={styles.createStudyBtn} onClick={() => setIsCreateMode(true)}>
              <Plus size={18} /> 새 스터디 만들기
            </button>
          </div>
        </aside>

        {/* ===== Center Panel ===== */}
        <main className={styles.mainContent}>
          {view === 'explore' ? (
            <>
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
                  const color = getColor(study.id);
                  return (
                    <div key={study.id} className={styles.studyCard} onClick={() => enterStudy(study)}>
                      <div className={styles.studyCardHeader}>
                        <span
                          className={styles.studyCardSubject}
                          style={{ background: color.bg, color: color.text }}
                        >
                          스터디
                        </span>
                        <span className={`${styles.studyCardBadge} ${study.inviting ? styles.badgeRecruiting : styles.badgeFull}`}>
                          {study.inviting ? <><UserPlus size={10} /> 모집중</> : '마감'}
                          {!study.visible && <><Lock size={10} /> 비공개</>}
                        </span>
                      </div>
                      <h3 className={styles.studyCardTitle}>{study.name}</h3>
                      <p className={styles.studyCardDesc}>참여하여 함께 공부하세요!</p>
                      <div className={styles.studyCardFooter}>
                        <div className={styles.memberAvatars}>
                          {study.users.slice(0, 3).map((uid: string, i: number) => (
                            <div
                              key={i}
                              className={styles.memberAvatar}
                              style={{ background: getColor(uid).bg, color: getColor(uid).text }}
                            >
                              {uid[0]}
                            </div>
                          ))}
                          <span className={styles.memberCount}>
                            {study.users.length}명 참여중
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
                  {activeStudy?.users.slice(0, 4).map((uid: string, i: number) => (
                    <div
                      key={i}
                      className={styles.memberAvatar}
                      style={{ background: getColor(uid).bg, color: getColor(uid).text, marginLeft: i > 0 ? '-6px' : 0 }}
                    >
                      {uid[0]}
                    </div>
                  ))}
                  <span className={styles.memberCount} style={{ marginLeft: 6 }}>
                    {activeStudy?.users.length}명
                  </span>
                </div>
              </div>

              {/* Join Required View */}
              {!(activeStudy?.inu || activeStudy?.ish) ? (
                <div className={styles.joinRequiredContainer}>
                  <div className={styles.joinIcon}>
                    {activeStudy?.visible ? <UserPlus size={64} /> : <Lock size={64} />}
                  </div>
                  <h3 className={styles.joinTitle}>
                    {activeStudy?.inp ? '가입 승인 대기 중' : '스터디 참여 신청'}
                  </h3>
                  <p className={styles.joinDesc}>
                    {activeStudy?.inp 
                      ? '방장에게 받은 6자리 입장 코드를 아래에 입력하면 바로 참여할 수 있습니다.' 
                      : '이 스터디의 컨텐츠를 보려면 먼저 참여 신청을 해야 합니다.'}
                  </p>
                  
                  {activeStudy?.inp ? (
                    <div className={styles.joinActionBox}>
                      <div className={styles.codeInputGroup}>
                        <input
                          type="text"
                          className={styles.codeInput}
                          placeholder="000000"
                          maxLength={6}
                          value={entryCode}
                          onChange={e => setEntryCode(e.target.value.toUpperCase())}
                          style={{ marginBottom: '16px' }}
                        />
                        <button className={styles.codeSubmitBtn} onClick={handleEntryCode}>
                          코드 확인 및 입장
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      className={styles.primaryActionBtn} 
                      onClick={() => handleRequestJoin(activeStudy!)}
                      disabled={!activeStudy?.inviting}
                    >
                      {activeStudy?.inviting ? '참여 신청하기' : '현재 모집 중이 아닙니다'}
                    </button>
                  )}
                </div>
              ) : (
                <div className={styles.chatContainer}>
                  <div className={styles.chatMessages}>
                    {messages.map((msg: Post) => {
                      const author = authorMap[msg.author];
                      const isMine = msg.author === userProfile?.id;
                      return (
                        <div key={msg.id} className={`${styles.messageGroup} ${isMine ? styles.messageGroupMine : ''}`}>
                          {!isMine && (
                            <div className={styles.messageAvatar} style={{ background: getColor(msg.author).bg, color: getColor(msg.author).text }}>
                              {author?.nickname?.[0] || '?'}
                            </div>
                          )}
                          <div>
                            {!isMine && <div className={styles.messageSender}>{author?.nickname || '알 수 없음'}</div>}
                            <div className={`${styles.messageBubble} ${isMine ? styles.messageBubbleMine : styles.messageBubbleOther}`}>
                              {msg.content}
                            </div>
                            <div className={styles.messageTime}>{new Date(msg.created_at).toLocaleTimeString()}</div>
                          </div>
                        </div>
                      );
                    })}
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
            </>
          )}
        </main>


        {/* ===== Right Sidebar ===== */}
        <aside className={styles.rightSidebar}>
          {/* Host Management (Visible only to Host) */}
          {activeStudy?.ish && (
            <div className={`${styles.rightCard} ${styles.hostCard}`}>
              <h3 className={styles.rightCardTitle}>
                <ShieldCheck size={18} color="#ff3131" /> 방장 관리 도구
              </h3>
              <div className={styles.hostCodeBox}>
                <span className={styles.hostCodeLabel}>초대 코드</span>
                <div className={styles.hostCodeValue}>
                  {activeStudy.verify_code}
                  <button className={styles.copyBtn} onClick={() => {
                    navigator.clipboard.writeText(activeStudy.verify_code || '');
                    alert('복사되었습니다!');
                  }}>
                    <Copy size={14} />
                  </button>
                </div>
              </div>
              <p className={styles.codeHelper}>
                멤버들에게 이 코드를 공유하여 가입을 승인하세요.
              </p>
            </div>
          )}

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
            <div className={styles.statsGrid} style={{ gridTemplateColumns: '1fr' }}>
              <div className={styles.statBox}>
                <div className={styles.statNumber}>{myStudies.length}</div>
                <div className={styles.statLabel}>참여 중인 스터디</div>
              </div>
            </div>
          </div>

          {/* Recommended */}
          <div className={styles.rightCard}>
            <h3 className={styles.rightCardTitle}>
              <TrendingUp size={18} color="#ff3131" /> 인기 스터디
            </h3>
            <div className={styles.recList}>
              {publicStudies.slice(0, 4).map((rec: StudyGroup, idx: number) => (
                <div key={rec.id} className={styles.recItem} onClick={() => enterStudy(rec)}>
                  <span className={styles.recRank}>{idx + 1}</span>
                  <div className={styles.recContent}>
                    <span className={styles.recTitle}>{rec.name}</span>
                    <span className={styles.recMeta}>{rec.users.length}명 참여</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Card */}
          <div className={styles.ctaCard}>
            <h3 className={styles.ctaCardTitle}>
              <Sparkles size={18} /> 스터디 만들기
            </h3>
            <p className={styles.ctaCardDesc}>
              나만의 스터디 그룹을 만들고 함께 성장하세요! 비공개 입장 코드도 자동 생성됩니다.
            </p>
            <button className={styles.ctaCardBtn} onClick={() => setIsCreateMode(true)}>
              <Plus size={16} /> 스터디 개설하기
            </button>
          </div>
        </aside>

        {/* ===== Create Study Modal ===== */}
        {isCreateMode && (
          <div className={styles.modalBackdrop} onClick={() => setIsCreateMode(false)}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>📚 새 스터디 개설</h2>
                <button className={styles.modalCloseBtn} onClick={() => setIsCreateMode(false)}>&times;</button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>스터디 이름 <span className={styles.formRequired}>*</span></label>
                  <input type="text" className={styles.formInput} placeholder="예: 알고리즘 스터디 A반"
                    value={newStudyName} onChange={e => setNewStudyName(e.target.value)} />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>스터디 설명</label>
                  <textarea className={styles.formTextarea} placeholder="스터디 목표, 진행 방식 등을 적어주세요."
                    value={newStudyDesc} onChange={e => setNewStudyDesc(e.target.value)} />
                </div>

                <div className={styles.settingsRow}>
                  <div className={styles.settingItem}>
                    <span className={styles.settingLabel}>🔒 비공개</span>
                    <label className={styles.toggleSwitch}>
                      <input type="checkbox" checked={newStudyIsPrivate}
                        onChange={e => setNewStudyIsPrivate(e.target.checked)} />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>
                  <div className={styles.settingItem}>
                    <span className={styles.settingLabel}>👥 회원목록 공개</span>
                    <label className={styles.toggleSwitch}>
                      <input type="checkbox" checked={newStudyUserVisible}
                        onChange={e => setNewStudyUserVisible(e.target.checked)} />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button className={styles.formCancelBtn} onClick={() => setIsCreateMode(false)}>취소</button>
                <button className={styles.formSubmitBtn}
                  disabled={!newStudyName.trim()}
                  onClick={handleCreateStudy}>
                  <Sparkles size={14} /> 개설하기
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Study;
