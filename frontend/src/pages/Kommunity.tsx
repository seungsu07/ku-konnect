import React, { useState, useEffect } from 'react';
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
  MessageSquare,
  Loader2,
  Image,
  Paperclip
} from 'lucide-react';
import styles from './Kommunity.module.css';
import { dataApi } from '../api/data';
import type { TimeTable } from '../../../common/models';
import { AppDataContext } from '../api/DataContext';

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

// SubjectBoard is imported from AppDataContext



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
  const { subjectBoards, userProfile, isDataLoading: isLoading } = React.useContext(AppDataContext);
  const [isWriteMode, setIsWriteMode] = useState(false);
  const [writeTitle, setWriteTitle] = useState('');
  const [writeContent, setWriteContent] = useState('');

  const [posts, setPosts] = useState<any[]>([]);
  const [isPostsLoading, setIsPostsLoading] = useState(false);
  const [authorMap, setAuthorMap] = useState<Record<string, any>>({});

  // Unify background color and remove white strip
  React.useEffect(() => {
    const originalBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#f8fafc';
    return () => {
      document.body.style.backgroundColor = originalBg;
    };
  }, []);

  const activeBoard = subjectBoards.find(b => b.id === selectedBoardId);

  // Fetch posts when board changes
  useEffect(() => {
    const fetchPosts = async () => {
      if (!selectedBoardId || !activeBoard?.realBoardId) {
        setPosts([]);
        return;
      }

      setIsPostsLoading(true);
      try {
        const fetchedPosts = await dataApi.getPosts({ board: activeBoard.realBoardId as any });
        setPosts(fetchedPosts);

        // Fetch authors for these posts
        const authorIds = Array.from(new Set(fetchedPosts.map((p: any) => p.author)));
        const profilePromises = authorIds.map(id => dataApi.getUserProfiles({ id: id as any }));
        const profiles = await Promise.all(profilePromises);

        const newAuthorMap: Record<string, any> = { ...authorMap };
        profiles.flat().forEach((profile: any) => {
          if (profile) newAuthorMap[profile.id] = profile;
        });
        setAuthorMap(newAuthorMap);
      } catch (err) {
        console.error('Failed to fetch posts:', err);
      } finally {
        setIsPostsLoading(false);
      }
    };

    fetchPosts();
  }, [selectedBoardId, activeBoard?.realBoardId]);

  const handleCreatePost = async () => {
    if (!activeBoard?.realBoardId) {
      alert(`이 과목의 게시판이 아직 연동되지 않았습니다. (${activeBoard?.name})`);
      return;
    }

    let profile = userProfile;

    // If no profile, prompt to create one
    if (!profile) {
      const nickname = prompt('게시글을 작성하려면 닉네임이 필요합니다.\n사용할 닉네임을 입력해주세요:');
      if (!nickname || !nickname.trim()) return;

      try {
        const res = await dataApi.createUserProfile({ nickname: nickname.trim(), image: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQABNjN9GQAAAABJREFUeJztwQEBAAAAgiD/r25IQAEAAABJ6AHxwBjqPAAAAABJRU5ErkJggg==' });
        if (res.success) {
          profile = res.data;
          // Note: This won't update the context, but works for this post
        } else {
          alert('프로필 생성 실패: ' + ((res as any).e || '알 수 없는 오류'));
          return;
        }
      } catch (err) {
        console.error('Failed to create profile:', err);
        alert('프로필 생성 중 오류가 발생했습니다.');
        return;
      }
    }

    try {
      const res = await dataApi.createPost({
        board: activeBoard.realBoardId as any,
        title: writeTitle,
        content: writeContent,
        visible: true,
        profile: profile.id
      });

      if (res.success) {
        alert('게시글이 성공적으로 등록되었습니다!');
        setIsWriteMode(false);
        setWriteTitle('');
        setWriteContent('');
        // Re-fetch posts
        const fetchedPosts = await dataApi.getPosts({ board: activeBoard.realBoardId as any });
        setPosts(fetchedPosts);
      } else {
        alert(`등록 실패: ${res.e || '알 수 없는 오류'}`);
      }
    } catch (err) {
      console.error('Failed to create post:', err);
      alert('등록 중 오류가 발생했습니다.');
    }
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '방금 전';
    if (mins < 60) return `${mins}분 전`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}시간 전`;
    return new Date(timestamp).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.wrapper}>
          {/* Skeleton Left Sidebar */}
          <aside className={styles.sidebar}>
            <div className={styles.boardCard}>
              <div className={`${styles.skeleton} ${styles.skeletonTitle}`} style={{ width: '50%', marginBottom: 24 }}></div>
              <div className={styles.boardList}>
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '10px 12px' }}>
                    <div className={styles.skeleton} style={{ width: 32, height: 32, borderRadius: 8, marginRight: 12 }}></div>
                    <div className={styles.skeleton} style={{ height: 16, width: '60%', borderRadius: 4 }}></div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Skeleton Main Feed */}
          <main className={styles.mainFeed}>
            <div className={styles.feedHeader} style={{ marginBottom: 20 }}>
              <div className={`${styles.skeleton} ${styles.skeletonTitle}`} style={{ width: '40%' }}></div>
            </div>
            <div className={styles.subjectGrid}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className={styles.skeletonCard}>
                  <div>
                    <div className={`${styles.skeleton} ${styles.skeletonTitle}`}></div>
                    <div className={`${styles.skeleton} ${styles.skeletonText}`}></div>
                    <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: '30%' }}></div>
                  </div>
                  <div className={`${styles.skeleton} ${styles.skeletonBadge}`}></div>
                </div>
              ))}
            </div>
          </main>

          {/* Skeleton Right Sidebar */}
          <aside className={styles.rightSidebar}>
            <div className={styles.trendingCard}>
              <div className={`${styles.skeleton} ${styles.skeletonTitle}`} style={{ width: '60%', marginBottom: 20 }}></div>
              <div className={styles.trendingList}>
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className={styles.trendingItem} style={{ border: 'none', background: 'transparent' }}>
                    <div className={styles.skeleton} style={{ width: 20, height: 20, borderRadius: 4, marginRight: 12 }}></div>
                    <div style={{ flex: 1 }}>
                      <div className={styles.skeleton} style={{ height: 14, width: '90%', marginBottom: 8, borderRadius: 4 }}></div>
                      <div className={styles.skeleton} style={{ height: 12, width: '40%', borderRadius: 4 }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>

        {/* Left Sidebar: Fixed Boards */}
        <aside className={styles.sidebar}>
          <div className={styles.boardCard}>
            <h3 className={styles.sidebarTitle}>전체 게시판</h3>
            <nav className={styles.boardList}>
              <a href="#all" className={`${styles.boardItem} ${!selectedBoardId ? styles.boardItemActive : ''}`} onClick={() => setSelectedBoardId(null)}>
                <div className={styles.boardIcon}><BookOpen size={18} /></div>
                내 과목 전체
              </a>
              <a href="#free" className={styles.boardItem}>
                <div className={styles.boardIcon}><MessageSquare size={18} /></div>
                자유게시판
              </a>
              <div className={styles.sidebarDivider} style={{ margin: '12px 0', borderBottom: '1px solid #f1f5f9' }} />
              <div style={{ padding: '0 12px 8px', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>수강 과목</div>
              {subjectBoards.map(board => (
                <a
                  key={board.id}
                  href={`#${board.id}`}
                  className={`${styles.boardItem} ${selectedBoardId === board.id ? styles.boardItemActive : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedBoardId(board.id);
                    setIsWriteMode(false);
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
              <div className={styles.backBtn} onClick={() => { setSelectedBoardId(null); setIsWriteMode(false); }}>
                <ChevronLeft size={20} /> 전체 과목으로 돌아가기
              </div>
              <div className={styles.feedHeader}>
                <h2 className={styles.feedTitle}>
                  {activeBoard?.name} <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500, marginLeft: 8 }}>{activeBoard?.prof}</span>
                </h2>
                <button className={styles.writeBtn} onClick={() => setIsWriteMode(true)}>
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

              {isWriteMode ? (
                <div className={styles.editorContainer}>
                  <div className={styles.editorHeader}>
                    <input
                      type="text"
                      className={styles.editorTitleInput}
                      placeholder="제목을 입력하세요"
                      value={writeTitle}
                      onChange={(e) => setWriteTitle(e.target.value)}
                    />
                  </div>
                  <textarea
                    className={styles.editorContent}
                    placeholder="내용을 작성하세요..."
                    value={writeContent}
                    onChange={(e) => setWriteContent(e.target.value)}
                  />
                  <div className={styles.editorActions}>
                    <div className={styles.editorTools}>
                      <button className={styles.toolBtn} title="이미지 첨부"><Image size={20} /></button>
                      <button className={styles.toolBtn} title="파일 첨부"><Paperclip size={20} /></button>
                    </div>
                    <div className={styles.submitGroup}>
                      <button className={styles.cancelBtn} onClick={() => setIsWriteMode(false)}>취소</button>
                      <button
                        className={styles.submitBtn}
                        disabled={!writeTitle.trim() || !writeContent.trim()}
                        onClick={handleCreatePost}
                      >
                        등록하기
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles.postsList}>
                  {isPostsLoading ? (
                    /* Post Loading Skeletons */
                    [1, 2, 3].map(i => (
                      <div key={i} className={styles.postCard} style={{ cursor: 'default' }}>
                        <div className={styles.skeleton} style={{ height: 20, width: 60, borderRadius: 12, marginBottom: 12 }}></div>
                        <div className={styles.skeleton} style={{ height: 24, width: '70%', marginBottom: 12 }}></div>
                        <div className={styles.skeleton} style={{ height: 16, width: '90%', marginBottom: 8 }}></div>
                        <div className={styles.skeleton} style={{ height: 16, width: '40%', marginBottom: 20 }}></div>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <div className={styles.skeleton} style={{ width: 60, height: 14 }}></div>
                          <div className={styles.skeleton} style={{ width: 60, height: 14 }}></div>
                        </div>
                      </div>
                    ))
                  ) : posts.length === 0 ? (
                    <div className={styles.noPosts}>
                      <MessageSquare size={48} color="#cbd5e1" />
                      <p>아직 게시글이 없습니다. 첫 번째 글을 작성해보세요!</p>
                    </div>
                  ) : (
                    posts.filter(p =>
                      (p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.content.toLowerCase().includes(searchQuery.toLowerCase())))
                      .map(post => {
                        const author = authorMap[post.author];
                        const isHot = post.view_count > 100 || post.comment_count > 10;

                        return (
                          <article
                            key={post.id}
                            className={styles.postCard}
                            onClick={() => navigate(`/komunity/post/${post.id}`)}
                          >
                            <div className={styles.postHeader}>
                              <span className={styles.postBadge}>{activeBoard?.name}</span>
                              <button className={styles.moreBtn}><MoreHorizontal size={18} color="#94a3b8" /></button>
                            </div>
                            <h3 className={isHot ? `${styles.postTitle} ${styles.postTitleHot}` : styles.postTitle}>
                              {isHot && <Flame size={18} color="#ff3131" style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />}
                              {post.title}
                            </h3>
                            <p className={styles.postExcerpt}>{post.content}</p>

                            <div className={styles.postMeta}>
                              <div className={styles.authorInfo}>
                                <div className={styles.authorAvatar} style={{ background: author ? getColor(author.id).bg : '#f1f5f9', color: author ? getColor(author.id).text : '#94a3b8' }}>
                                  {author?.nickname?.[0] || '?'}
                                </div>
                                <span style={{ color: '#475569', fontWeight: 600 }}>{author?.nickname || '알 수 없음'}</span>
                              </div>
                              <div className={styles.metaItem}>
                                <Clock size={14} /> {formatTime(post.created_at)}
                              </div>
                              <div className={styles.metaItem}>
                                <ThumbsUp size={14} /> {post.likes || 0}
                              </div>
                              <div className={styles.metaItem}>
                                <MessageCircle size={14} /> {post.comment_count}
                              </div>
                              <div className={styles.metaItem}>
                                <Eye size={14} /> {post.view_count}
                              </div>
                            </div>
                          </article>
                        );
                      })
                  )}
                </div>
              )}
            </>
          ) : (
            /* Main Subject Grid View */
            <>
              <div className={styles.searchBar} style={{ marginBottom: 24 }}>
                <Search size={18} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="전체 게시판 검색..."
                  className={styles.searchInput}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {searchQuery ? (
                <>
                  <div className={styles.feedHeader}>
                    <h2 className={styles.feedTitle}>'{searchQuery}' 검색 결과</h2>
                  </div>
                  <div className={styles.postsList}>
                    {posts.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.content.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 ? (
                      posts.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.content.toLowerCase().includes(searchQuery.toLowerCase())).map(post => (
                        <article
                          key={post.id}
                          className={styles.postCard}
                          onClick={() => navigate(`/komunity/post/${post.id}`)}
                        >
                          <div className={styles.postHeader}>
                            <span className={styles.postBadge}>{subjectBoards.find(b => b.realBoardId === post.board)?.name || '게시판'}</span>
                          </div>
                          <h3 className={styles.postTitle}>{post.title}</h3>
                          <p className={styles.postExcerpt}>{post.content}</p>
                          <div className={styles.postMeta}>
                            <div className={styles.authorInfo}>
                              <div className={styles.authorAvatar} style={{ background: authorMap[post.author] ? getColor(authorMap[post.author].id).bg : '#f1f5f9', color: authorMap[post.author] ? getColor(authorMap[post.author].id).text : '#94a3b8' }}>
                                {authorMap[post.author]?.nickname?.[0] || '?'}
                              </div>
                              <span>{authorMap[post.author]?.nickname || '알 수 없음'}</span>
                            </div>
                            <div className={styles.metaItem}><ThumbsUp size={14} /> {post.likes || 0}</div>
                            <div className={styles.metaItem}><MessageCircle size={14} /> {post.comment_count}</div>
                          </div>
                        </article>
                      ))
                    ) : (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>검색 결과가 없습니다.</div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.feedHeader}>
                    <h2 className={styles.feedTitle}>나의 수강 과목 게시판</h2>
                    <div style={{ fontSize: '0.9rem', color: '#64748b' }}>2026학년도 1학기</div>
                  </div>

                  <div className={styles.subjectGrid}>
                    {subjectBoards.length === 0 ? (
                      <div style={{ padding: '40px 20px', color: '#64748b', gridColumn: '1 / -1', textAlign: 'center', backgroundColor: 'white', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                        현재 활성화된 시간표에 수강 과목이 없습니다.
                      </div>
                    ) : (
                      subjectBoards.map(subject => {
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
                      })
                    )}
                  </div>

                  <div className={styles.feedHeader} style={{ marginTop: 40 }}>
                    <h2 className={styles.feedTitle}>실시간 전체 인기글</h2>
                  </div>
                  <div className={styles.postsList}>
                    {posts.length > 0 ? (
                      posts.slice(0, 5).map(post => (
                        <article
                          key={post.id}
                          className={styles.postCard}
                          onClick={() => navigate(`/kommunity/post/${post.id}`)}
                        >
                          <div className={styles.postHeader}>
                            <span className={styles.postBadge}>{subjectBoards.find(b => b.realBoardId === post.board)?.name || '게시판'}</span>
                          </div>
                          <h3 className={styles.postTitle}>{post.title}</h3>
                          <p className={styles.postExcerpt}>{post.content}</p>
                          <div className={styles.postMeta}>
                            <div className={styles.authorInfo}>
                              <div className={styles.authorAvatar} style={{ background: authorMap[post.author] ? getColor(authorMap[post.author].id).bg : '#f1f5f9', color: authorMap[post.author] ? getColor(authorMap[post.author].id).text : '#94a3b8' }}>
                                {authorMap[post.author]?.nickname?.[0] || '?'}
                              </div>
                              <span>{authorMap[post.author]?.nickname || '알 수 없음'}</span>
                            </div>
                            <div className={styles.metaItem}><ThumbsUp size={14} /> {post.likes || 0}</div>
                            <div className={styles.metaItem}><MessageCircle size={14} /> {post.comment_count}</div>
                          </div>
                        </article>
                      ))
                    ) : (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>표시할 인기글이 없습니다.</div>
                    )}
                  </div>
                </>
              )}
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
