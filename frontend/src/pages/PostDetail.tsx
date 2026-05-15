import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MessageSquare,
  ThumbsUp,
  Share2,
  MoreVertical,
  User,
  Clock,
  Send,
  Check,
  Loader2
} from 'lucide-react';
import styles from './PostDetail.module.css';

interface Comment {
  id: string;
  author: string;
  authorProfile?: string;
  content: string;
  timestamp: string;
  likes: number;
  replies?: Comment[];
}



import { dataApi } from '../api/data';
import { AppDataContext } from '../api/DataContext';

const PostDetail: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [commentInput, setCommentInput] = useState('');
  const { userProfile, subjectBoards } = React.useContext(AppDataContext);

  const [post, setPost] = useState<any | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [authorMap, setAuthorMap] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const fetchPostData = async () => {
    if (!postId) return;
    setIsLoading(true);
    try {
      // 1. Fetch Post
      const posts = await dataApi.getPosts({ id: postId as any });
      if (posts.length === 0) {
        setIsLoading(false);
        return;
      }
      const p = posts[0];
      setPost(p);

      // 2. Fetch Board Name (from subjectBoards or separate API if needed)
      // For now, try to find in subjectBoards or just use the ID
      const board = subjectBoards.find(b => b.realBoardId === p.board);
      p.boardName = board?.name || '자유게시판';

      // 3. Fetch Comments
      const fetchedComments = await dataApi.getComments({ post: p.id as any });
      setComments(fetchedComments);

      // 4. Fetch Authors
      const authorIds = Array.from(new Set([p.author, ...fetchedComments.map((c: any) => c.author)]));
      const profilePromises = authorIds.map(id => dataApi.getUserProfiles({ id: id as any }));
      const profiles = await Promise.all(profilePromises);

      const newAuthorMap: Record<string, any> = {};
      profiles.flat().forEach((profile: any) => {
        if (profile) newAuthorMap[profile.id] = profile;
      });
      setAuthorMap(newAuthorMap);
    } catch (err) {
      console.error('Failed to fetch post detail:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPostData();
  }, [postId, subjectBoards]);

  const handleSubmitComment = async () => {
    if (!postId || !commentInput.trim()) return;

    let profile = userProfile;

    // Handle missing profile (re-use logic from Kommunity.tsx)
    if (!profile) {
      const nickname = prompt('댓글을 작성하려면 닉네임이 필요합니다.\n사용할 닉네임을 입력해주세요:');
      if (!nickname || !nickname.trim()) return;

      try {
        const res = await dataApi.createUserProfile({
          nickname: nickname.trim(),
          image: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQABNjN9GQAAAABJREFUeJztwQEBAAAAgiD/r25IQAEAAABJ6AHxwBjqPAAAAABJRU5ErkJggg=='
        });
        if (res.success) {
          profile = res.data;
        } else {
          alert('프로필 생성 실패: ' + ((res as any).e || '알 수 없는 오류'));
          return;
        }
      } catch (err) {
        console.error('Failed to create profile:', err);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await dataApi.createComment({
        post: postId as any,
        content: commentInput,
        visible: true,
        profile: profile.id
      });

      if (res.success) {
        setCommentInput('');
        // Refresh comments
        const updatedComments = await dataApi.getComments({ post: postId as any });
        setComments(updatedComments);

        // Fetch new author if needed
        if (!authorMap[profile.id]) {
          const authorProfile = await dataApi.getUserProfiles({ id: profile.id as any });
          if (authorProfile.length > 0) {
            setAuthorMap(prev => ({ ...prev, [profile.id]: authorProfile[0] }));
          }
        }
      } else {
        alert('댓글 등록 실패: ' + (res.e || '알 수 없는 오류'));
      }
    } catch (err) {
      console.error('Failed to create comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
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

  if (isLoading) return <div className={styles.loading}>게시글을 불러오는 중...</div>;
  if (!post) return <div className={styles.loading}>게시글을 찾을 수 없습니다.</div>;

  const author = authorMap[post.author];

  return (
    <div className={styles.postDetailWrapper}>
      <header className={styles.postHeader}>
        <button onClick={() => navigate(-1)} className={styles.backButton}>
          <ArrowLeft size={18} />
          <span>목록으로 돌아가기</span>
        </button>
        <span className={styles.boardTag}>{post.boardName}</span>
      </header>

      <div className={styles.layoutContainer}>
        <main className={styles.mainContent}>
          <article className={styles.postArticle}>
            <h1 className={styles.title}>{post.title}</h1>

            <div className={styles.meta}>
              <div className={styles.authorSection}>
                <div className={styles.avatar}>
                  {author?.nickname?.[0] || <User size={18} />}
                </div>
                <div className={styles.authorText}>
                  <div className={styles.name}>{author?.nickname || '알 수 없음'}</div>
                  <div className={styles.info}>{author?.nickname ? 'KONNECT 회원' : '익명'} • <Clock size={12} /> {formatTime(post.created_at)}</div>
                </div>
              </div>
              <button className={styles.moreOptions}>
                <MoreVertical size={18} />
              </button>
            </div>

            <div className={styles.body}>
              {post.content.split('\n').map((line: string, i: number) => (
                <p key={i}>{line || '\u00A0'}</p>
              ))}
            </div>

            <div className={styles.postStats}>
              <span>조회 {post.view_count}</span>
              <span className={styles.dot}>•</span>
              <span>좋아요 {post.likes || 0}</span>
              <span className={styles.dot}>•</span>
              <span>댓글 {comments.length}</span>
            </div>

            <div className={styles.footerActions}>
              <button className={styles.actionBtn}>
                <ThumbsUp size={18} />
                <span>좋아요</span>
              </button>
              <button className={styles.actionBtn} onClick={handleShare}>
                <Share2 size={18} />
                <span>공유</span>
              </button>
            </div>
          </article>

          <section className={styles.commentSection}>
            <div className={styles.sectionHeader}>
              <MessageSquare size={18} />
              <h3>댓글 {comments.length}</h3>
            </div>

            <div className={styles.commentList}>
              {comments.length === 0 ? (
                <p className={styles.noComments}>첫 번째 댓글을 남겨보세요!</p>
              ) : (
                comments.map((comment) => {
                  const cAuthor = authorMap[comment.author];
                  return (
                    <div key={comment.id} className={styles.commentGroup}>
                      <div className={styles.commentItem}>
                        <div className={styles.commentHeader}>
                          <span className={styles.commentAuthor}>{cAuthor?.nickname || '익명'}</span>
                          <span className={styles.commentTime}>{formatTime(comment.created_at)}</span>
                        </div>
                        <p className={styles.commentText}>{comment.content}</p>
                        <div className={styles.commentActions}>
                          <button className={styles.commentActionBtn}>
                            <ThumbsUp size={12} /> {comment.likes || 0}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className={styles.commentInputContainer}>
              <textarea
                placeholder="댓글을 입력해 주세요"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                className={styles.commentTextArea}
              />
              <div className={styles.inputFooter}>
                <div className={styles.inputOptions}>
                  <label className={styles.anonymousLabel}>
                    <input type="checkbox" disabled /> 익명
                  </label>
                </div>
                <button
                  className={styles.submitBtn}
                  disabled={!commentInput.trim() || isSubmitting}
                  onClick={handleSubmitComment}
                >
                  {isSubmitting ? <Loader2 size={16} className={styles.spinning} /> : <Send size={16} />}
                  전송
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>

      {showToast && (
        <div className={styles.toast}>
          <Check size={16} />
          <span>링크가 복사되었습니다!</span>
        </div>
      )}
    </div>
  );
};

export default PostDetail;
