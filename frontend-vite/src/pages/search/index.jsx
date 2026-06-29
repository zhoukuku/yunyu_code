import { useEffect, useState } from 'react';
import { Card, Row, Col, Tabs, Tag, Button, Empty, message, Spin } from 'antd';
import { BookOutlined, RocketOutlined, CompassOutlined } from '@ant-design/icons';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { globalSearch } from '../../services/api';

const { TabPane } = Tabs;

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const keyword = searchParams.get('keyword') || '';
  const [courses, setCourses] = useState([]);
  const [posts, setPosts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('courses');

  useEffect(() => {
    if (keyword) {
      fetchResults();
    }
  }, [keyword]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const res = await globalSearch(keyword, user.id);
      if (res.status === 200 && res.result) {
        setCourses(res.result.courses || []);
        setPosts(res.result.posts || []);
        setProjects(res.result.projects || []);
      }
    } catch (error) {
      console.error('Search failed:', error);
      message.error('搜索失败');
    } finally {
      setLoading(false);
    }
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

  return (
    <div style={{ padding: 24 }}>
      <Card title={<><BookOutlined /> 搜索结果: {keyword}</>}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>搜索中...</div>
          </div>
        ) : getTotalCount() === 0 ? (
          <Empty description={`未找到"${keyword}"相关结果`} />
        ) : (
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane tab={`课程 (${courses.length})`} key="courses">
              {courses.length === 0 ? (
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
              )}
            </TabPane>

            <TabPane tab={`作品 (${posts.length})`} key="posts">
              {posts.length === 0 ? (
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
                                ? post.description.substring(0, 40) + '...'
                                : post.description || '无描述'}
                            </div>
                          }
                        />
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </TabPane>

            <TabPane tab={`我的作品 (${projects.length})`} key="projects">
              {projects.length === 0 ? (
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
              )}
            </TabPane>
          </Tabs>
        )}
      </Card>
    </div>
  );
}