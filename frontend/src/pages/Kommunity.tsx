import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  PenSquare, 
  MessageCircle, 
  ThumbsUp, 
  Eye, 
  TrendingUp, 
  Clock, 
  MoreHorizontal,
  Flame,
  ChevronLeft,
  BookOpen,
  MessageSquare
} from 'lucide-react';
import styles from './Kommunity.module.css';

// Using the same colors as LeftPanel.tsx
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
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PASTEL_COLORS[Math.abs(hash) % PASTEL_COLORS.length];
};

const MOCK_SUBJECT_BOARDS = [
  { id: '1', name: '알고리즘', prof: '김민수 교수님', code: 'COSE214', newPosts: 5 },
  { id: '2', name: '운영체제', prof: '박철호 교수님', code: 'COSE341', newPosts: 12 },
  { id: '3', name: '데이터베이스', prof: '이영희 교수님', code: 'COSE371', newPosts: 3 },
  { id: '4', name: '인공지능', prof: '최준영 교수님', code: 'COSE361', newPosts: 8 },
  { id: '5', name: '컴퓨터네트워크', prof: '정대리 교수님', code: 'COSE342', newPosts: 0 },
  { id: '6', name: '소프트웨어공학', prof: '한지민 교수님', code: 'COSE242', newPosts: 2 },
];

const MOCK_POSTS = [
  {
    id: '1',
    board: '알고리즘',
    title: '다이나믹 프로그래밍 점화식 질문드려요',
    excerpt: '백준 12865번 평범한 배낭 문제 풀고 있는데, 2차원 배열 말고 1차원 배열로 최적화하는 부분이 잘 이해가 안 됩니다...',
    author: '안암동불주먹',
    createdAt: '10분 전',
    likes: 24,
    comments: 8,
    views: 156,
    isHot: true
  },
  {
    id: '2',
    board: '운영체제',
    title: '이번 중간고사 범위 어디까지인가요?',
    excerpt: '지난번 수업 때 말씀해주셨던 것 같은데 필기를 못 했네요. 세마포어까지인가요 아니면 데드락 전까지인가요?',
    author: '학사요정',
    createdAt: '1시간 전',
    likes: 5,
    comments: 12,
    views: 342,
    isHot: false
  },
  {
    id: '3',
    board: '인공지능',
    title: '과제 2번 오차 역전파 구현 팁',
    excerpt: '수식으로 볼 때는 쉬웠는데 코드로 옮기려니까 차원이 자꾸 꼬이네요. 넘파이 브로드캐스팅 활용하면 훨씬 깔끔하게 풀립니다.',
    author: '호랑이꿈나무',
    createdAt: '3시간 전',
    likes: 56,
    comments: 15,
    views: 890,
    isHot: true
  }
];

const MOCK_TRENDING = [
  { id: '1', title: '이번 학기 꿀교양 추천 리스트', views: '2.5k' },
  { id: '2', title: '고연전 티켓팅 성공 후기', views: '1.8k' },
  { id: '3', title: '컴공과 취업 현황 (2025 기준)', views: '1.2k' },
  { id: '4', title: '안암역 근처 새로 생긴 마라탕집', views: '980' },
  { id: '5', title: '중간고사 기간 백기 개방 시간', views: '850' },
];

const Kommunity: React.FC = () => {
  const navigate = useNavigate();
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Unify background color and remove white strip
  React.useEffect(() => {
    const originalBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#f8fafc';
    return () => {
      document.body.style.backgroundColor = originalBg;
    };
  }, []);

  const activeBoard = MOCK_SUBJECT_BOARDS.find(b => b.id === selectedBoardId);

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        
        {/* Left Sidebar: Fixed Boards */}
        <aside className={styles.sidebar}>
          <div className={styles.boardCard}>
            <h3 className={styles.sidebarTitle}>전체 게시판</h3>
            <nav className={styles.boardList}>
              <a href="#all" className={`${styles.boardItem} ${!selectedBoardId ? styles.boardItemActive : ''}`} onClick={() => setSelectedBoardId(null)}>
                <div className={styles.boardIcon}><BookOpen size={18}/></div>
                내 과목 전체
              </a>
              <a href="#free" className={styles.boardItem}>
                <div className={styles.boardIcon}><MessageSquare size={18}/></div>
                자유게시판
              </a>
              <div className={styles.sidebarDivider} style={{ margin: '12px 0', borderBottom: '1px solid #f1f5f9' }} />
              <div style={{ padding: '0 12px 8px', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>수강 과목</div>
              {MOCK_SUBJECT_BOARDS.map(board => (
                <a 
                  key={board.id}
                  href={`#${board.id}`}
                  className={`${styles.boardItem} ${selectedBoardId === board.id ? styles.boardItemActive : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedBoardId(board.id);
                  }}
                >
                  <div className={styles.boardIcon} style={{ background: getColor(board.code).bg, color: getColor(board.code).text }}>
                    {board.name[0]}
                  </div>
                  {board.name}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Feed */}
        <main className={styles.mainFeed}>
          {selectedBoardId ? (
            /* Board Detail View */
            <>
              <div className={styles.backBtn} onClick={() => setSelectedBoardId(null)}>
                <ChevronLeft size={20} /> 전체 과목으로 돌아가기
              </div>
              <div className={styles.feedHeader}>
                <h2 className={styles.feedTitle}>
                  {activeBoard?.name} <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500, marginLeft: 8 }}>{activeBoard?.prof}</span>
                </h2>
                <button className={styles.writeBtn}>
                  <PenSquare size={18} /> 글쓰기
                </button>
              </div>

              <div className={styles.searchBar} style={{ marginBottom: 20 }}>
                <Search size={18} className={styles.searchIcon} />
                <input 
                  type="text" 
                  placeholder={`${activeBoard?.name} 게시판 내 검색`} 
                  className={styles.searchInput}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className={styles.postsList}>
                {MOCK_POSTS.filter(p => p.board === activeBoard?.name || !activeBoard).map(post => (
                  <article 
                    key={post.id} 
                    className={styles.postCard}
                    onClick={() => navigate(`/kommunity/post/${post.id}`)}
                  >
                    <div className={styles.postHeader}>
                      <span className={styles.postBadge}>{post.board}</span>
                      <button className={styles.moreBtn}><MoreHorizontal size={18} color="#94a3b8" /></button>
                    </div>
                    <h3 className={styles.postTitle}>
                      {post.isHot && <Flame size={18} color="#ff3131" style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />}
                      {post.title}
                    </h3>
                    <p className={styles.postExcerpt}>{post.excerpt}</p>
                    
                    <div className={styles.postMeta}>
                      <div className={styles.authorInfo}>
                        <div className={styles.authorAvatar}>{post.author[0]}</div>
                        <span style={{ color: '#475569', fontWeight: 600 }}>{post.author}</span>
                      </div>
                      <div className={styles.metaItem}>
                        <Clock size={14} /> {post.createdAt}
                      </div>
                      <div className={styles.metaItem}>
                        <ThumbsUp size={14} /> {post.likes}
                      </div>
                      <div className={styles.metaItem}>
                        <MessageCircle size={14} /> {post.comments}
                      </div>
                      <div className={styles.metaItem}>
                        <Eye size={14} /> {post.views}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            /* Main Subject Grid View */
            <>
              <div className={styles.feedHeader}>
                <h2 className={styles.feedTitle}>나의 수강 과목 게시판</h2>
                <div style={{ fontSize: '0.9rem', color: '#64748b' }}>2026학년도 1학기</div>
              </div>
              
              <div className={styles.subjectGrid}>
                {MOCK_SUBJECT_BOARDS.map(subject => {
                  const colors = getColor(subject.code);
                  return (
                    <div 
                      key={subject.id} 
                      className={styles.subjectCard}
                      style={{ backgroundColor: colors.bg, color: colors.text }}
                      onClick={() => setSelectedBoardId(subject.id)}
                    >
                      <div>
                        <div className={styles.subjectCardTitle}>{subject.name}</div>
                        <div className={styles.subjectCardInfo}>
                          <span className={styles.subjectCardProf}>{subject.prof}</span>
                          <span className={styles.subjectCardCode}>{subject.code}</span>
                        </div>
                      </div>
                      
                      <div className={styles.subjectCardStats}>
                        {subject.newPosts > 0 && (
                          <div className={styles.newCount} style={{ color: colors.text }}>
                            <Flame size={12} fill={colors.text} />
                            새 글 {subject.newPosts}
                          </div>
                        )}
                        {subject.newPosts === 0 && (
                          <div className={styles.newCount} style={{ opacity: 0.6, color: colors.text }}>
                            최근 게시글 없음
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className={styles.feedHeader} style={{ marginTop: 40 }}>
                <h2 className={styles.feedTitle}>실시간 전체 인기글</h2>
              </div>
              <div className={styles.postsList}>
                {MOCK_POSTS.map(post => (
                  <article 
                    key={post.id} 
                    className={styles.postCard}
                    onClick={() => navigate(`/kommunity/post/${post.id}`)}
                  >
                    <div className={styles.postHeader}>
                      <span className={styles.postBadge}>{post.board}</span>
                    </div>
                    <h3 className={styles.postTitle}>{post.title}</h3>
                    <p className={styles.postExcerpt}>{post.excerpt}</p>
                    <div className={styles.postMeta}>
                      <div className={styles.authorInfo}>
                        <div className={styles.authorAvatar}>{post.author[0]}</div>
                        <span>{post.author}</span>
                      </div>
                      <div className={styles.metaItem}><ThumbsUp size={14} /> {post.likes}</div>
                      <div className={styles.metaItem}><MessageCircle size={14} /> {post.comments}</div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </main>

        {/* Right Sidebar: Trending & Best Tiger */}
        <aside className={styles.rightSidebar}>
          <div className={styles.trendingCard}>
            <h3 className={styles.trendingTitle}>
              <TrendingUp size={20} color="#ff3131" />
              지금 뜨는 인기글
            </h3>
            <div className={styles.trendingList}>
              {MOCK_TRENDING.map((item, index) => (
                <div 
                  key={item.id} 
                  className={styles.trendingItem}
                  onClick={() => navigate(`/kommunity/post/${item.id}`)}
                >
                  <span className={styles.trendingRank}>{index + 1}</span>
                  <div className={styles.trendingContent}>
                    <span className={styles.trendingText}>{item.title}</span>
                    <span className={styles.trendingStats}>조회수 {item.views}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.trendingCard} style={{ background: 'linear-gradient(135deg, #ff3131 0%, #ff914d 100%)', color: 'white', border: 'none' }}>
            <h3 className={styles.trendingTitle} style={{ color: 'white' }}>
              <Flame size={20} />
              이번 주 베스트 호랑이
            </h3>
            <p style={{ fontSize: '0.85rem', opacity: 0.9, lineHeight: 1.5 }}>
              가장 많은 도움을 준 학우에게는 KONNECT 뱃지가 수여됩니다!
            </p>
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🐯</div>
              <div>
                <div style={{ fontWeight: 700 }}>학사요정</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>정보게시판 채택 12회</div>
              </div>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
};

export default Kommunity;
