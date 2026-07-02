import { useEffect, useState, useCallback } from 'react';
import { Card, Row, Col, Tabs, Tag, Button, Empty, message, Spin, Input, List, Space } from 'antd';
import { BookOutlined, SearchOutlined, DeleteOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { globalSearch, saveSearchHistory, getSearchHistory, clearSearchHistory } from '../../services/api';
import { safeGetJSON, safeSetJSON, safeGetItem } from '../../utils/storage';

const HISTORY_KEY = 'search_history_local';
const MAX_HISTORY = 10;

function loadLocalHistory() {
  return safeGetJSON(HISTORY_KEY, []);
}

function saveLocalHistory(history) {
  safeSetJSON(HISTORY_KEY, history);
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const keyword = searchParams.get('keyword') || '';

  const [inputValue, setInputValue] = useState(keyword);
  const [courses, setCourses] = useState([]);
  const [posts, setPosts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('courses');
  const [history, setHistory] = useState(loadLocalHistory);
  const [showHistory, setShowHistory] = useState(false);

  // Sync input when URL keyword changes externally
  useEffect(() => {
    setInputValue(keyword);
  }, [keyword]);

  // Sync history from server on mount
  useEffect(() => {
    const token = safeGetItem('accessToken');
    if (!token) return;
    const user = safeGetJSON('user', {});
    if (!user.id) return;
    getSearchHistory(MAX_HISTORY)
      .then((res) => {
        if (res?.status === 200 && Array.isArray(res.result)) {
          const serverHistory = res.result.map((item) =>
            typeof item === 'string' ? item : item.keyword || item.query || ''
          ).filter(Boolean);
          if (serverHistory.length > 0) {
            setHistory(serverHistory);
            saveLocalHistory(serverHistory);
          }
        }
      })
      .catch((e) => { console.error('获取搜索历史失败:', e); });
  }, []);

  const doSearch = useCallback((kw) => {
    if (!kw) return;
    setSearchParams({ keyword: kw });
  }, [setSearchParams]);

  const fetchResults = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const user = safeGetJSON('user', {});
      const res = await globalSearch(keyword, user.id);
      if (res && res.status === 200 && res.result) {
        setCourses(res.result.courses || []);
        setPosts(res.result.posts || []);
        setProjects(res.result.projects || []);
        // Save to history
        addToHistory(keyword);
      } else {
        setCourses([]);
        setPosts([]);
        setProjects([]);
      }
    } catch (err) {
      console.error('Search failed:', err);
      setError(err?.response?.data?.msg || err?.message || '搜索失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [keyword]);

  useEffect(() => {
    if (keyword) {
      fetchResults();
    }
  }, [keyword, fetchResults]);

  const addToHistory = (kw) => {
    if (!kw.trim()) return;
    const updated = [kw, ...history.filter((h) => h !== kw)].slice(0, MAX_HISTORY);
    setHistory(updated);
    saveLocalHistory(updated);
    // Also save to server
    const user = safeGetJSON('user', {});
    if (user.id) {
      saveSearchHistory(kw).catch((e) => { console.error('保存搜索历史失败:', e); });
    }
  };

  const removeHistoryItem = (kw) => {
    const updated = history.filter((h) => h !== kw);
    setHistory(updated);
    saveLocalHistory(updated);
  };

  const handleClearHistory = () => {
    setHistory([]);
    saveLocalHistory([]);
    const user = safeGetJSON('user', {});
    if (user.id) {
      clearSearchHistory().catch((e) => { console.error('清除搜索历史失败:', e); });
    }
    message.success('搜索历史已清除');
  };

  const handleSearch = (value) => {
    const trimmed = value.trim();
    setShowHistory(false);
    if (trimmed) {
      doSearch(trimmed);
    }
  };

  const handleHistoryClick = (kw) => {
    setInputValue(kw);
    setShowHistory(false);
    doSearch(kw);
  };

  const getTotalCount = () => {
    return courses.length + posts.length + projects.length;
  };

  const handleCourseClick = (courseId) => {
    navigate(`/course-detail/${courseId}`);
  };

  const handlePostClick = (postId) => {
    navigate(`/community/work/${postId}`);
  };

  const handleProjectClick = (project) => {
    if (!project?.type) return;
    navigate(`/create/${project.type}`, { state: { projectId: project.id } });
  };

  const getDifficultyLabel = (level) => {
    const labels = ['全部', '入门', '基础', '进阶', '高级', '专家'];
    return labels[level] || '入门';
  };

  const getDifficultyColor = (level) => {
    const colors = ['', 'green', 'cyan', 'blue', 'orange', 'red'];
    return colors[level] || 'green';
  };

  const renderContent = () => {
    // No keyword entered yet — prompt
    if (!keyword) {
      return (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <SearchOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />
          <div style={{ marginTop: 16, color: '#999' }}>请输入关键词开始搜索</div>
        </div>
      );
    }

    // Loading
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>搜索中...</div>
        </div>
      );
    }

    // Error
    if (error) {
      return (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Empty description={error} />
          <Button type="primary" onClick={fetchResults} style={{ marginTop: 16 }}>
            重试
          </Button>
        </div>
      );
    }

    // No results at all
    if (getTotalCount() === 0) {
      return <Empty description={`未找到"${keyword}"相关结果`} />;
    }

    // Results
    return (
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
        {
          key: 'courses',
          label: `课程 (${courses.length})`,
          children: courses.length === 0 ? (
            <Empty description="暂无相关课程" />
          ) : (
            <Row gutter={[16, 16]}>
              {courses.map(c => (
                <Col xs={24} sm={12} md={8} lg={6} key={c.id}>
                  <Card
                    hoverable
                    onClick={() => handleCourseClick(c.id)}
                    cover={
                      <div style={{
                        height: 120,
                        background: `url(${c.coverImage}) center/cover no-repeat`,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: '#f0f0f0'
                      }}>
                        {!c.coverImage && <BookOutlined style={{ fontSize: 48, color: '#999' }} />}
                      </div>
                    }
                  >
                    <Card.Meta
                      title={<strong>{c.courseName}</strong>}
                      description={
                        <div style={{ marginTop: 8 }}>
                          <div style={{ fontSize: 12, color: '#666' }}>
                            教师: {c.teacher || '待定'}
                          </div>
                          <Tag color={getDifficultyColor(c.difficulty)} style={{ marginTop: 4 }}>
                            {getDifficultyLabel(c.difficulty)}
                          </Tag>
                        </div>
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          ),
        },
        {
          key: 'posts',
          label: `作品 (${posts.length})`,
          children: posts.length === 0 ? (
            <Empty description="暂无相关作品" />
          ) : (
            <Row gutter={[16, 16]}>
              {posts.map(post => (
                <Col xs={24} sm={12} md={8} lg={6} key={post.id}>
                  <Card
                    hoverable
                    onClick={() => handlePostClick(post.id)}
                    cover={
                      <div style={{ height: 150, overflow: 'hidden' }}>
                        <img
                          alt={post.title}
                          src={post.thumbnail || 'https://scratch.mit.edu/static/preview-f66a8e3c0f1d3b9c.png'}
                          style={{ height: '100%', width: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    }
                  >
                    <Card.Meta
                      title={post.title}
                      description={
                        <div style={{ marginTop: 4, fontSize: 12, color: '#888' }}>
                          {post.description && post.description.length > 40
                            ? `${post.description.substring(0, 40)}...`
                            : post.description || '无描述'}
                        </div>
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          ),
        },
        {
          key: 'projects',
          label: `我的作品 (${projects.length})`,
          children: projects.length === 0 ? (
            <Empty description="暂无相关项目" />
          ) : (
            <Row gutter={[16, 16]}>
              {projects.map(p => (
                <Col xs={24} sm={12} md={8} lg={6} key={p.id}>
                  <Card
                    hoverable
                    onClick={() => handleProjectClick(p)}
                    cover={
                      <div style={{ height: 150, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 48 }}>🧩</span>
                      </div>
                    }
                  >
                    <Card.Meta
                      title={p.name}
                      description={`类型: ${p.type === 'scratch' ? '图形化编程' : p.type}`}
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          ),
        },
      ]} />
    );
  };

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={<><BookOutlined /> 全局搜索</>}
        extra={
          history.length > 0 && (
            <Button
              size="small"
              icon={<DeleteOutlined />}
              onClick={handleClearHistory}
              danger
            >
              清除历史
            </Button>
          )
        }
      >
        {/* Search input */}
        <div style={{ marginBottom: 24, position: 'relative' }}>
          <Input.Search
            placeholder="搜索课程、作品、项目..."
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (e.target.value.trim()) {
                setShowHistory(true);
              } else {
                setShowHistory(false);
              }
            }}
            onSearch={handleSearch}
            onFocus={() => {
              if (history.length > 0 && !keyword) {
                setShowHistory(true);
              }
            }}
            onBlur={() => {
              // Delay hiding so clicks on history items register
              setTimeout(() => setShowHistory(false), 150);
            }}
            enterButton={<><SearchOutlined /> 搜索</>}
            size="large"
            allowClear
          />

          {/* Search history dropdown */}
          {showHistory && history.length > 0 && (
            <Card
              size="small"
              style={{
                position: 'absolute',
                top: 42,
                left: 0,
                right: 0,
                zIndex: 100,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}
              bodyStyle={{ padding: '8px 0' }}
            >
              <List
                size="small"
                dataSource={history}
                rowKey={(item) => item}
                renderItem={(item) => (
                  <List.Item
                    style={{
                      padding: '8px 16px',
                      cursor: 'pointer',
                      borderBottom: 'none',
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleHistoryClick(item)}
                    actions={[
                      <DeleteOutlined
                        key="delete"
                        style={{ color: '#999' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeHistoryItem(item);
                        }}
                      />,
                    ]}
                  >
                    <Space>
                      <ClockCircleOutlined style={{ color: '#999' }} />
                      <span>{item}</span>
                    </Space>
                  </List.Item>
                )}
              />
            </Card>
          )}
        </div>

        {renderContent()}
      </Card>
    </div>
  );
}
