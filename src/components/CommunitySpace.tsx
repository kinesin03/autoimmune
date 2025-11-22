import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, Search, Heart, MessageCircle, Users, ArrowUp } from 'lucide-react';
import './CommunitySpace.css';

interface Post {
  id: string;
  author: string;
  disease: string;
  category: string;
  content: string;
  likes: number;
  comments: Comment[];
  timestamp: string;
  topic?: string;
}

interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
}

const CommunitySpace: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([
    {
      id: '1',
      author: '건강지킴이',
      disease: '류마티스 관절염',
      category: '운동',
      content: '오늘 아침 스트레칭 루틴 시작했어요! 관절이 한결 부드러워진 느낌이에요 💪',
      likes: 24,
      comments: [
        { id: 'c1', author: '희망나무', content: '화이팅! 저도 시작해볼게요', timestamp: '25분 전' }
      ],
      timestamp: '30분 전',
      topic: '류마티스 관절염'
    },
    {
      id: '2',
      author: '희망나무',
      disease: '크론병',
      category: '식단',
      content: '저염 식단 3주차 후기 공유합니다. 증상이 많이 좋아졌어요!',
      likes: 42,
      comments: [
        { id: 'c2', author: '건강지킴이', content: '축하해요! 계속 응원할게요', timestamp: '50분 전' }
      ],
      timestamp: '1시간 전',
      topic: '크론병'
    },
    {
      id: '3',
      author: '행복찾기',
      disease: '루푸스',
      category: '스트레스',
      content: '명상 앱 추천 받고 싶어요. 스트레스 관리에 도움이 될까요?',
      likes: 18,
      comments: [],
      timestamp: '3시간 전',
      topic: '루푸스'
    },
    {
      id: '4',
      author: '건강지킴이',
      disease: '류마티스 관절염',
      category: '일상',
      content: '연속 30일 기록 달성! 여러분도 할 수 있어요 🎉',
      likes: 67,
      comments: [
        { id: 'c3', author: '희망나무', content: '대단해요!', timestamp: '4시간 전' },
        { id: 'c4', author: '행복찾기', content: '저도 도전해볼게요', timestamp: '4시간 전' }
      ],
      timestamp: '5시간 전',
      topic: '류마티스 관절염'
    }
  ]);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});
  const [todaySupport, setTodaySupport] = useState('작은 진전도 큰 승리입니다. 오늘도 최선을 다한 당신을 응원합니다! 💪');
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [newPost, setNewPost] = useState({ disease: '', category: '', content: '' });

  const topics = [
    { name: '류마티스 관절염', count: 1234, color: '#ede9fe' },
    { name: '건선', count: 856, color: '#fce7f3' },
    { name: '크론병', count: 645, color: '#e0f2fe' },
    { name: '제1형 당뇨병', count: 923, color: '#d1fae5' },
    { name: '다발성 경화증', count: 512, color: '#ede9fe' },
    { name: '루푸스', count: 789, color: '#fce7f3' }
  ];

  const categories = ['운동', '식단', '스트레스', '일상', '치료', '기타'];

  // 로컬 스토리지에서 데이터 로드
  useEffect(() => {
    const savedPosts = localStorage.getItem('communityPosts');
    const savedSupport = localStorage.getItem('todaySupport');
    if (savedPosts) {
      try {
        setPosts(JSON.parse(savedPosts));
      } catch (e) {
        console.error('Failed to load posts:', e);
      }
    }
    if (savedSupport) {
      setTodaySupport(savedSupport);
    }
  }, []);

  // 데이터 저장
  useEffect(() => {
    localStorage.setItem('communityPosts', JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    localStorage.setItem('todaySupport', todaySupport);
  }, [todaySupport]);

  const filteredPosts = selectedTopic
    ? posts.filter(post => post.topic === selectedTopic)
    : posts.filter(post =>
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.author.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const handleLike = (postId: string) => {
    setPosts(prev => prev.map(post =>
      post.id === postId ? { ...post, likes: post.likes + 1 } : post
    ));
  };

  const handleAddComment = (postId: string) => {
    if (!newComment[postId]?.trim()) return;
    
    const comment: Comment = {
      id: `c${Date.now()}`,
      author: '나',
      content: newComment[postId],
      timestamp: '방금 전'
    };

    setPosts(prev => prev.map(post =>
      post.id === postId
        ? { ...post, comments: [...post.comments, comment] }
        : post
    ));

    setNewComment(prev => ({ ...prev, [postId]: '' }));
  };

  const handleWritePost = () => {
    if (!newPost.content.trim() || !newPost.disease || !newPost.category) return;

    const post: Post = {
      id: `p${Date.now()}`,
      author: '나',
      disease: newPost.disease,
      category: newPost.category,
      content: newPost.content,
      likes: 0,
      comments: [],
      timestamp: '방금 전',
      topic: newPost.disease
    };

    setPosts(prev => [post, ...prev]);
    setNewPost({ disease: '', category: '', content: '' });
    setShowWriteModal(false);
  };

  const today = new Date().toISOString().split('T')[0];
  const todayFormatted = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  });

  return (
    <div className="community-space">
      {/* 헤더 */}
      <div className="community-header">
        <div className="header-text-wrapper">
          <h1 className="community-title">커뮤니티</h1>
          <p className="community-subtitle">함께 나누고 성장해요</p>
        </div>
      </div>

      {/* 콘텐츠 영역 - 흰색 박스 */}
      <div className="community-content-wrapper">
        {/* 검색란 */}
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="게시글 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        {/* 글쓰기 & 인기글 버튼 */}
        <div className="action-buttons">
          <button className="write-btn" onClick={() => setShowWriteModal(true)}>
            <Plus size={18} />
            글쓰기
          </button>
          <button className="popular-btn">
            <TrendingUp size={18} />
            인기글
          </button>
        </div>

        {/* 질환별 토픽 */}
        <div className="topics-section">
          <h3 className="section-title">질환별 토픽</h3>
          <div className="topics-list">
            {topics.map((topic, idx) => (
              <button
                key={idx}
                className={`topic-tag ${selectedTopic === topic.name ? 'active' : ''}`}
                style={{ background: selectedTopic === topic.name ? '#7c3aed' : topic.color }}
                onClick={() => setSelectedTopic(selectedTopic === topic.name ? null : topic.name)}
              >
                {topic.name} ({topic.count})
              </button>
            ))}
          </div>
        </div>

        {/* 커뮤니티 통계 */}
        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-label">전체 회원</div>
            <div className="stat-value">12,450</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">오늘 활동</div>
            <div className="stat-value">1,234</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">새 게시글</div>
            <div className="stat-value">89</div>
          </div>
        </div>

        {/* 최근 게시글 */}
        <div className="posts-section">
          <h3 className="section-title">최근 게시글</h3>
          <div className="posts-list">
            {filteredPosts.map(post => (
              <div key={post.id} className="post-card">
                <div className="post-header-info">
                  <div className="post-author-info">
                    <div className="author-avatar">{post.author[0]}</div>
                    <div className="author-details">
                      <div className="author-name">{post.author}</div>
                      <div className="post-meta">
                        <span className="disease-tag">{post.disease}</span>
                        <span className="category-tag">{post.category}</span>
                      </div>
                    </div>
                  </div>
                  <div className="post-time">{post.timestamp}</div>
                </div>
                <div className="post-content-text">{post.content}</div>
                <div className="post-actions">
                  <button
                    className="action-btn like-btn"
                    onClick={() => handleLike(post.id)}
                  >
                    <ArrowUp size={16} />
                    {post.likes}
                  </button>
                  <button
                    className="action-btn comment-btn"
                    onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                  >
                    <MessageCircle size={16} />
                    {post.comments.length}
                  </button>
                </div>

                {/* 댓글 섹션 */}
                {expandedPost === post.id && (
                  <div className="comments-section">
                    <div className="comments-list">
                      {post.comments.map(comment => (
                        <div key={comment.id} className="comment-item">
                          <div className="comment-author">{comment.author}</div>
                          <div className="comment-content">{comment.content}</div>
                          <div className="comment-time">{comment.timestamp}</div>
                        </div>
                      ))}
                    </div>
                    <div className="comment-input-box">
                      <input
                        type="text"
                        placeholder="댓글을 입력하세요..."
                        value={newComment[post.id] || ''}
                        onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                        className="comment-input"
                      />
                      <button
                        className="comment-submit-btn"
                        onClick={() => handleAddComment(post.id)}
                      >
                        등록
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 오늘의 응원 */}
        <div className="support-section">
          <div className="support-header">
            <Heart size={18} className="support-icon" />
            <h3 className="section-title">오늘의 응원</h3>
          </div>
          <div className="support-content">
            <p className="support-text">"{todaySupport}"</p>
            <div className="support-reactions">
              <div className="reaction-emojis">
                {['😊', '💪', '🌟', '❤️', '🎉'].map((emoji, idx) => (
                  <span key={idx} className="reaction-emoji">{emoji}</span>
                ))}
              </div>
              <span className="reaction-count">+234명이 공감했어요</span>
            </div>
          </div>
        </div>

        {/* 커뮤니티 가이드 */}
        <div className="guide-section">
          <h3 className="section-title">커뮤니티 가이드</h3>
          <ul className="guide-list">
            <li>서로를 존중하고 배려해주세요</li>
            <li>개인정보는 공유하지 말아주세요</li>
            <li>의학적 조언은 전문의와 상담하세요</li>
            <li>긍정적인 경험을 나눠주세요</li>
          </ul>
        </div>
      </div>

      {/* 글쓰기 모달 */}
      {showWriteModal && (
        <div className="modal-overlay" onClick={() => setShowWriteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>글쓰기</h3>
              <button className="modal-close" onClick={() => setShowWriteModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>자가면역질환</label>
                <select
                  value={newPost.disease}
                  onChange={(e) => setNewPost(prev => ({ ...prev, disease: e.target.value }))}
                  className="form-input"
                >
                  <option value="">선택하세요</option>
                  {topics.map(topic => (
                    <option key={topic.name} value={topic.name}>{topic.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>카테고리</label>
                <select
                  value={newPost.category}
                  onChange={(e) => setNewPost(prev => ({ ...prev, category: e.target.value }))}
                  className="form-input"
                >
                  <option value="">선택하세요</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>내용</label>
                <textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="게시글 내용을 입력하세요..."
                  className="form-textarea"
                  rows={5}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-save" onClick={handleWritePost}>
                등록
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunitySpace;
