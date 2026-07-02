import { useEffect, useState, useCallback } from 'react';
import { Row, Col, Card, Tag, Tabs, Button, message, Carousel, Spin, Empty, Space, Badge } from 'antd';
import {
  StarOutlined,
  FireOutlined,
  BookOutlined,
  CrownOutlined,
  RobotOutlined,
  PlayCircleOutlined,
  UserOutlined,
  TeamOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  getFeaturedContents,
  getFeaturedCategories,
  getAllExploreCourses,
  getHierarchy,
  getCoursesByCategory,
} from '../../services/api';
import { safeGetItem } from '../../utils/storage';

const { Meta } = Card;

const categoryIcons = {
  programming: <BookOutlined />,
  game: <CrownOutlined />,
  ai: <RobotOutlined />,
  design: <StarOutlined />,
  default: <FireOutlined />,
};

const categoryColors = {
  programming: 'blue',
  game: 'purple',
  ai: 'cyan',
  design: 'orange',
  default: 'red',
};

const categoryNames = {
  programming: '编程',
  game: '游戏',
  ai: '人工智能',
  design: '设计',
  default: '综合',
};

export default function ExplorePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [featuredList, setFeaturedList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [courses, setCourses] = useState([]);
  const [hierarchies, setHierarchies] = useState([]);

  const loadFeatured = useCallback(async () => {
    try {
      const res = await getFeaturedContents();
      if (res && res.status === 200 && res.result) {
        setFeaturedList(res.result?.records || []);
      }
    } catch (e) {
      console.error('Failed to load featured', e);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const res = await getFeaturedCategories();
      if (res && res.status === 200 && res.result) {
        setCategories(res.result || []);
      }
    } catch (e) {
      console.error('Failed to load categories', e);
    }
  }, []);

  const loadCourses = useCallback(async () => {
    try {
      const res = await getAllExploreCourses();
      if (res && res.status === 200 && res.result) {
        setCourses(res.result?.records || []);
      }
    } catch (e) {
      console.error('Failed to load courses', e);
    }
  }, []);

  const loadHierarchy = useCallback(async () => {
    try {
      const res = await getHierarchy();
      if (res && res.status === 200 && res.result) {
        setHierarchies(res.result);
      }
    } catch (e) {
      console.error('Failed to load hierarchy', e);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const token = safeGetItem('accessToken');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      await Promise.all([
        loadFeatured(),
        loadCategories(),
        loadCourses(),
        loadHierarchy(),
      ]);
    } catch (e) {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  }, [loadFeatured, loadCategories, loadCourses, loadHierarchy]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCategoryChange = (key) => {
    setActiveCategory(key);
    if (key === 'all') {
      loadCourses();
    } else {
      loadCoursesByCategory(key);
    }
  };

  const loadCoursesByCategory = async (category) => {
    setCategoryLoading(true);
    try {
      const res = await getCoursesByCategory(category);
      if (res && res.status === 200 && res.result) {
        setCourses(res.result?.records || []);
      }
    } catch (e) {
      message.error('加载分类课程失败');
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleCourseClick = (course) => {
    navigate(`/course-detail/${course.id}`);
  };

  const getDifficultyLabel = (level) => {
    const labels = ['', '入门', '基础', '进阶', '高级', '专家'];
    return labels[level] || '入门';
  };

  const getDifficultyColor = (level) => {
    const colors = ['', 'green', 'cyan', 'blue', 'orange', 'red'];
    return colors[level] || 'green';
  };

  const getGradient = (index) => {
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    ];
    return gradients[index % gradients.length];
  };

  const getCategoryIcon = (category) => categoryIcons[category] || categoryIcons.default;
  const getCategoryColor = (category) => categoryColors[category] || categoryColors.default;
  const getCategoryName = (category) => categoryNames[category] || category;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      {/* Featured Banner Carousel */}
      {featuredList.length > 0 && (
        <Card
          title={
            <Space>
              <CrownOutlined style={{ color: '#faad14' }} />
              <span>精选推荐</span>
            </Space>
          }
          extra={<Tag color="gold">精选</Tag>}
          style={{ marginBottom: 24 }}
        >
          <Carousel autoplay dotPosition="bottom">
            {featuredList.map((item, index) => (
              <div key={item.id}>
                <div
                  style={{
                    height: 280,
                    background: item.coverImage
                      ? `url(${item.coverImage}) center/cover no-repeat`
                      : getGradient(index),
                    borderRadius: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    padding: 24,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(transparent 40%, rgba(0,0,0,0.7))',
                    }}
                  />
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <Tag
                      color={getCategoryColor(item.category)}
                      icon={getCategoryIcon(item.category)}
                      style={{ marginBottom: 8 }}
                    >
                      {getCategoryName(item.category)}
                    </Tag>
                    <h2 style={{ color: '#fff', margin: '8px 0', fontSize: 24 }}>
                      {item.title || (item.course?.courseName || '精选内容')}
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.85)', margin: 0, fontSize: 14 }}>
                      {item.description || item.course?.description || '发现更多精彩内容'}
                    </p>
                    {item.course && (
                      <Button
                        type="primary"
                        icon={<PlayCircleOutlined />}
                        style={{ marginTop: 16 }}
                        onClick={() => handleCourseClick(item.course)}
                      >
                        开始学习
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </Carousel>
        </Card>
      )}

      {/* Category Tabs */}
      <Card
        title={
          <Space>
            <FireOutlined style={{ color: '#ff4d4f' }} />
            <span>分类浏览</span>
            <Badge count={courses.length} style={{ backgroundColor: '#1890ff' }} />
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Tabs
          activeKey={activeCategory}
          onChange={handleCategoryChange}
          type="card"
          tabBarStyle={{ marginBottom: 0 }}
          items={[
            { key: 'all', label: <span><StarOutlined />全部</span> },
            ...categories.map((cat) => ({
              key: cat,
              label: <span>{getCategoryIcon(cat)}{getCategoryName(cat)}</span>,
            })),
            ...hierarchies.map((h) => ({
              key: `hierarchy_${h.hierarchyId}`,
              label: <span><BookOutlined />{h.hierarchyName}</span>,
            })),
          ]}
        />

        {/* Course Grid */}
        <div style={{ marginTop: 24 }}>
          {categoryLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
              <Spin size="large" />
            </div>
          ) : courses.length === 0 ? (
            <Empty description="暂无课程" style={{ padding: 40 }} />
          ) : (
            <Row gutter={[16, 16]}>
              {courses.map((course, index) => (
                <Col xs={24} sm={12} md={8} lg={6} key={course.id}>
                  <Card
                    hoverable
                    onClick={() => handleCourseClick(course)}
                    cover={
                      <div
                        style={{
                          height: 160,
                          background: course.coverImage
                            ? `url(${course.coverImage}) center/cover no-repeat`
                            : getGradient(index),
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          position: 'relative',
                        }}
                      >
                        {!course.coverImage && (
                          <BookOutlined style={{ fontSize: 48, color: '#fff' }} />
                        )}
                        {course.status === 0 && (
                          <Tag
                            color="red"
                            style={{ position: 'absolute', top: 8, right: 8 }}
                          >
                            已下架
                          </Tag>
                        )}
                        {course.price === 0 && course.status === 1 && (
                          <Tag
                            color="green"
                            style={{ position: 'absolute', top: 8, left: 8 }}
                          >
                            免费
                          </Tag>
                        )}
                      </div>
                    }
                  >
                    <Meta
                      title={<strong style={{ fontSize: 14 }}>{course.courseName}</strong>}
                      description={
                        <div style={{ marginTop: 8 }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              marginBottom: 4,
                            }}
                          >
                            <UserOutlined style={{ color: '#666', marginRight: 4 }} />
                            <span style={{ fontSize: 12, color: '#666' }}>
                              {course.teacher || '待定'}
                            </span>
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              marginBottom: 4,
                            }}
                          >
                            <TeamOutlined style={{ color: '#666', marginRight: 4 }} />
                            <span style={{ fontSize: 12, color: '#666' }}>
                              {course.studentCount || 0}人学习
                            </span>
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              marginBottom: 4,
                            }}
                          >
                            <ClockCircleOutlined
                              style={{ color: '#666', marginRight: 4 }}
                            />
                            <span style={{ fontSize: 12, color: '#666' }}>
                              {course.duration || 0}分钟
                            </span>
                          </div>
                          <div style={{ marginTop: 8 }}>
                            <Tag color={getDifficultyColor(course.difficulty)}>
                              {getDifficultyLabel(course.difficulty)}
                            </Tag>
                          </div>
                        </div>
                      }
                    />
                    <Button
                      type="primary"
                      icon={<PlayCircleOutlined />}
                      block
                      style={{ marginTop: 12 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCourseClick(course);
                      }}
                    >
                      开始学习
                    </Button>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>
      </Card>
    </div>
  );
}