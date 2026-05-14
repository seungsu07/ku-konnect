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
  CornerDownRight
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

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  authorProfile: string;
  boardName: string;
  timestamp: string;
  views: number;
  likes: number;
  comments: Comment[];
}

const PostDetail: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [commentInput, setCommentInput] = useState('');

  // Mock data (Will replace with API call)
  const [post, setPost] = useState<Post | null>(null);

  useEffect(() => {
    const mockPost: Post = {
      id: postId || '1',
      title: '이번 학기 컴구 족보 공유해주실 분 계신가요?',
      content: `안녕하세요, 이번 학기에 컴퓨터구조 수업 듣고 있는 3학년 학생입니다. 
시험 범위가 생각보다 너무 넓어서 공부 방향 잡기가 힘드네요... 

혹시 작년이나 재작년 족보 가지고 계신 분 계시면 공유 부탁드려도 될까요? 
감사의 의미로 스타벅스 기프티콘 보내드리겠습니다!`,
      author: '고대호랭이',
      authorProfile: '컴퓨터학과 22학번',
      boardName: '전공 자유게시판',
      timestamp: '2026.05.14 14:20',
      views: 128,
      likes: 12,
      comments: [
        {
          id: 'c1',
          author: '안암지킴이',
          content: '저 작년 자료 있는데 쪽지 드릴게요! 확인 부탁드려요.',
          timestamp: '20분 전',
          likes: 2,
          replies: [
            {
              id: 'c1-1',
              author: '고대호랭이',
              content: '헉 정말 감사합니다! 지금 바로 쪽지함 확인할게요!!',
              timestamp: '15분 전',
              likes: 0
            }
          ]
        },
        {
          id: 'c2',
          author: '흑당라떼',
          content: '컴구는 교수님 수업 자료 위주로 보는 게 제일 정확해요 ㅎㅎ 이번에 퀴즈도 거기서 많이 나왔더라고요. 화이팅하세요!',
          timestamp: '1시간 전',
          likes: 5
        }
      ]
    };
    setPost(mockPost);
  }, [postId]);

  if (!post) return <div className={styles.loading}>게시글을 불러오는 중...</div>;

  return (
    <div className={styles.postDetailWrapper}>
      <header className={styles.postHeader}>
        <button onClick={() => navigate(-1)} className={styles.backButton}>
          <ArrowLeft size={18} />
          <span>목록</span>
        </button>
        <span className={styles.boardTag}>{post.boardName}</span>
      </header>

      <article className={styles.postArticle}>
        <h1 className={styles.title}>{post.title}</h1>

        <div className={styles.meta}>
          <div className={styles.authorSection}>
            <div className={styles.avatar}>
              <User size={18} />
            </div>
            <div className={styles.authorText}>
              <div className={styles.name}>{post.author}</div>
              <div className={styles.info}>{post.authorProfile} • <Clock size={12} /> {post.timestamp}</div>
            </div>
          </div>
          <button className={styles.moreOptions}>
            <MoreVertical size={18} />
          </button>
        </div>

        <div className={styles.body}>
          {post.content.split('\n').map((line, i) => (
            <p key={i}>{line || '\u00A0'}</p>
          ))}
        </div>

        <div className={styles.postStats}>
          <span>조회 {post.views}</span>
          <span className={styles.dot}>•</span>
          <span>좋아요 {post.likes}</span>
          <span className={styles.dot}>•</span>
          <span>댓글 {post.comments.length}</span>
        </div>

        <div className={styles.footerActions}>
          <button className={styles.actionBtn}>
            <ThumbsUp size={18} />
            <span>좋아요</span>
          </button>
          <button className={styles.actionBtn}>
            <Share2 size={18} />
            <span>공공유</span>
          </button>
        </div>
      </article>

      <section className={styles.commentSection}>
        <div className={styles.sectionHeader}>
          <MessageSquare size={18} />
          <h3>댓글 {post.comments.length}</h3>
        </div>

        <div className={styles.commentList}>
          {post.comments.map((comment) => (
            <div key={comment.id} className={styles.commentGroup}>
              <div className={styles.commentItem}>
                <div className={styles.commentHeader}>
                  <span className={styles.commentAuthor}>{comment.author}</span>
                  <span className={styles.commentTime}>{comment.timestamp}</span>
                </div>
                <p className={styles.commentText}>{comment.content}</p>
                <div className={styles.commentActions}>
                  <button className={styles.commentActionBtn}>
                    <ThumbsUp size={12} /> {comment.likes || '좋아요'}
                  </button>
                  <button className={styles.commentActionBtn}>답글</button>
                </div>
              </div>

              {/* Replies */}
              {comment.replies?.map(reply => (
                <div key={reply.id} className={styles.replyItem}>
                  <CornerDownRight size={14} className={styles.replyIcon} />
                  <div className={styles.replyContent}>
                    <div className={styles.commentHeader}>
                      <span className={styles.commentAuthor}>{reply.author}</span>
                      <span className={styles.commentTime}>{reply.timestamp}</span>
                    </div>
                    <p className={styles.commentText}>{reply.content}</p>
                    <div className={styles.commentActions}>
                      <button className={styles.commentActionBtn}>
                        <ThumbsUp size={12} /> {reply.likes || '좋아요'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
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
                <input type="checkbox" /> 익명
              </label>
            </div>
            <button className={styles.submitBtn} disabled={!commentInput.trim()}>
              <Send size={16} />
              전송
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PostDetail;
