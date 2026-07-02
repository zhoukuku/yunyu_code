import { useEffect, useState, useMemo } from 'react';
import { Row, Col, Card, Tag, Tabs, Button, message, Select, Input, Form, Space, Progress, Badge, Modal, Empty, Radio, Divider, Avatar, Tooltip } from 'antd';
import { BookOutlined, PlayCircleOutlined, UserOutlined, TeamOutlined, SearchOutlined, ClockCircleOutlined, StarOutlined, FireOutlined, FilterOutlined, AppstoreOutlined, BarsOutlined, SortAscendingOutlined, CloseOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getHierarchy, getCourses } from '../../services/api';
import { safeGetItem } from '../../utils/storage';
import './courses.css';

const { Option } = Select;

export default function CoursesPage() {
  const navigate = useNavigate();
  const [hierarchies, setHierarchies] = useState([]);
  const [activeKey, setActiveKey] = useState('');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    difficulty: undefined,
    status: undefined,
    teacher: '',
    category: undefined,
  });
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('default');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const token = safeGetItem('accessToken');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    loadHierarchy();
  }, []);

  const loadHierarchy = async () => {
    try {
      const res = await getHierarchy();
      if (res.status === 200 && res.result) {
        setHierarchies(res.result);
        if (res.result.length > 0) {
          setActiveKey(res.result[0].hierarchyId);
          loadCourses(res.result[0].hierarchyId);
        }
      }
    } catch (e) {
      message.error('加载失败');
    }
  };

  const loadCourses = async (hierarchyId, filterValues = filters) => {
    setLoading(true);
    try {
      const res = await getCourses(hierarchyId, {
        difficulty: filterValues.difficulty,
        status: filterValues.status,
        teacher: filterValues.teacher || undefined,
      });
      if (res.status === 200) {
        setCourses(res.result?.records || []);
      }
    } catch (e) {
      message.error('加载课程失败');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (key) => {
    setActiveKey(key);
    setFilters({ difficulty: undefined, status: undefined, teacher: '', category: undefined });
    form.resetFields();
    loadCourses(key);
  };

  const handleFilterChange = (changedValues, allValues) => {
    setFilters(allValues);
  };

  const handleReset = () => {
    form.resetFields();
    setFilters({ difficulty: undefined, status: undefined, teacher: '', category: undefined });
    setSearchText('');
    loadCourses(activeKey, { difficulty: undefined, status: undefined, teacher: '' });
  };

  const handleSearch = () => {
    loadCourses(activeKey, filters);
  };

  const handleCourseClick = (course) => {
    setSelectedCourse(course);
    setDetailModalVisible(true);
  };

  const getDifficultyLabel = (level) => {
    const labels = ['全部', '入门', '基础', '进阶', '高级', '专家'];
    return labels[level] || '入门';
  };

  const getDifficultyColor = (level) => {
    const colors = ['', 'green', 'cyan', 'blue', 'orange', 'red'];
    return colors[level] || 'green';
  };

  const getDifficultyBg = (level) => {
    const colors = ['', 'rgba(16, 185, 129, 0.1)', 'rgba(34, 211, 238, 0.1)', 'rgba(59, 130, 246, 0.1)', 'rgba(249, 115, 22, 0.1)', 'rgba(239, 68, 68, 0.1)'];
    return colors[level] || 'rgba(16, 185, 129, 0.1)';
  };

  const getGradient = (hierarchyId) => {
    const gradients = {
      '21': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      '22': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      '32': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      '35': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    };
    return gradients[hierarchyId] || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  };

  // Filter and sort courses
  const filteredCourses = useMemo(() => {
    let result = [...courses];

    // Apply search filter
    if (searchText) {
      const lowerSearch = searchText.toLowerCase();
      result = result.filter(c =>
        (c.courseName && c.courseName.toLowerCase().includes(lowerSearch)) ||
        (c.teacher && c.teacher.toLowerCase().includes(lowerSearch)) ||
        (c.description && c.description.toLowerCase().includes(lowerSearch))
      );
    }

    // Apply local difficulty filter
    if (filters.category) {
      result = result.filter(c => c.hierarchyId === filters.category);
    }

    // Sort courses
    switch (sortBy) {
      case 'popular':
        result.sort((a, b) => (b.studentCount || 0) - (a.studentCount || 0));
        break;
      case 'recent':
        result.reverse();
        break;
      case 'price':
        result.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'duration':
        result.sort((a, b) => (a.duration || 0) - (b.duration || 0));
        break;
      default:
        break;
    }

    return result;
  }, [courses, searchText, filters.category, sortBy]);

  const currentHierarchy = hierarchies.find(h => h.hierarchyId === activeKey);
  const activeFiltersCount = [
    filters.difficulty,
    filters.status,
    filters.teacher,
    filters.category
  ].filter(Boolean).length;

  return (
    <div className="courses-page">
      {/* Page Header */}
      <div className="courses-header">
        <div className="courses-header-content">
          <div className="courses-title-section">
            <div className="courses-icon">
              <BookOutlined />
            </div>
            <div>
              <h1 className="courses-title">课程中心</h1>
              <p className="courses-subtitle">
                发现 {currentHierarchy?.hierarchyName || '全部'} 课程，开启学习之旅
              </p>
            </div>
          </div>
          <div className="courses-stats">
            <div className="stat-item">
              <span className="stat-value">{filteredCourses.length}</span>
              <span className="stat-label">课程</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{filteredCourses.reduce((sum, c) => sum + (c.studentCount || 0), 0)}</span>
              <span className="stat-label">学习人次</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="courses-content">
        {/* Hierarchy Tabs */}
        <div className="hierarchy-tabs-wrapper">
          <Tabs
            activeKey={activeKey}
            onChange={handleTabChange}
            type="line"
            className="hierarchy-tabs"
            tabBarExtraContent={{
              right: (
                <div className="tabs-extra">
                  <Badge count={courses.length} style={{ backgroundColor: '#667eea' }}>
                    <span className="courses-count-label">当前课程数</span>
                  </Badge>
                </div>
              ),
            }}
            items={hierarchies.map(h => ({
              key: h.hierarchyId,
              label: (
                <span className="hierarchy-tab">
                  <BookOutlined />
                  {h.hierarchyName}
                </span>
              ),
            }))}
          />
                {loading ? (
                  <div className="courses-loading">
                    <div className="loading-spinner"></div>
                    <span>课程加载中...</span>
                  </div>
                ) : (
                  <>
                    {/* Toolbar */}
                    <div className="courses-toolbar">
                      <div className="toolbar-left">
                        <div className="search-wrapper">
                          <Input
                            prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
                            placeholder="搜索课程名称、教师..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            allowClear
                            className="search-input"
                          />
                        </div>
                        <Button
                          icon={<FilterOutlined />}
                          onClick={() => setShowFilters(!showFilters)}
                          className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
                        >
                          筛选
                          {activeFiltersCount > 0 && (
                            <Badge count={activeFiltersCount} style={{ backgroundColor: '#667eea' }} />
                          )}
                        </Button>
                      </div>
                      <div className="toolbar-right">
                        <div className="sort-wrapper">
                          <SortAscendingOutlined />
                          <Select
                            value={sortBy}
                            onChange={setSortBy}
                            className="sort-select"
                            placeholder="排序"
                          >
                            <Option value="default">默认排序</Option>
                            <Option value="popular">最热门</Option>
                            <Option value="recent">最新</Option>
                            <Option value="price">价格最低</Option>
                            <Option value="duration">时长最短</Option>
                          </Select>
                        </div>
                        <div className="view-mode-toggle">
                          <Button
                            icon={<AppstoreOutlined />}
                            type={viewMode === 'grid' ? 'primary' : 'default'}
                            onClick={() => setViewMode('grid')}
                            className="view-btn"
                          />
                          <Button
                            icon={<BarsOutlined />}
                            type={viewMode === 'list' ? 'primary' : 'default'}
                            onClick={() => setViewMode('list')}
                            className="view-btn"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Filter Panel */}
                    {showFilters && (
                      <div className="filter-panel">
                        <div className="filter-section">
                          <span className="filter-label">难度：</span>
                          <Radio.Group
                            value={filters.difficulty}
                            onChange={(e) => {
                              form.setFieldsValue({ difficulty: e.target.value });
                              setFilters({ ...filters, difficulty: e.target.value });
                            }}
                            className="filter-radio-group"
                          >
                            <Radio.Button value={undefined}>全部</Radio.Button>
                            <Radio.Button value={1}>入门</Radio.Button>
                            <Radio.Button value={2}>基础</Radio.Button>
                            <Radio.Button value={3}>进阶</Radio.Button>
                            <Radio.Button value={4}>高级</Radio.Button>
                            <Radio.Button value={5}>专家</Radio.Button>
                          </Radio.Group>
                        </div>
                        <Divider className="filter-divider" />
                        <div className="filter-section">
                          <span className="filter-label">状态：</span>
                          <Radio.Group
                            value={filters.status}
                            onChange={(e) => {
                              form.setFieldsValue({ status: e.target.value });
                              setFilters({ ...filters, status: e.target.value });
                            }}
                            className="filter-radio-group"
                          >
                            <Radio.Button value={undefined}>全部</Radio.Button>
                            <Radio.Button value={1}>已发布</Radio.Button>
                            <Radio.Button value={0}>已下架</Radio.Button>
                          </Radio.Group>
                        </div>
                        <Divider className="filter-divider" />
                        <div className="filter-section">
                          <span className="filter-label">教师：</span>
                          <Input
                            placeholder="输入教师名称"
                            value={filters.teacher}
                            onChange={(e) => setFilters({ ...filters, teacher: e.target.value })}
                            className="filter-teacher-input"
                            allowClear
                          />
                        </div>
                        <div className="filter-actions">
                          <Button onClick={handleReset} icon={<CloseOutlined />}>
                            清除筛选
                          </Button>
                          <Button type="primary" onClick={handleSearch} icon={<SearchOutlined />}>
                            应用筛选
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Course List */}
                    {filteredCourses.length === 0 ? (
                      <div className="courses-empty">
                        <Empty
                          description={
                            <span className="empty-text">
                              {searchText ? `未找到"${searchText}"相关课程` : '暂无课程'}
                            </span>
                          }
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                        >
                          {searchText && (
                            <Button type="primary" onClick={() => setSearchText('')}>
                              清除搜索
                            </Button>
                          )}
                        </Empty>
                      </div>
                    ) : viewMode === 'grid' ? (
                      <Row gutter={[24, 24]} className="courses-grid">
                        {filteredCourses.map(c => (
                          <Col xs={24} sm={12} md={8} lg={6} key={c.id}>
                            <Card
                              hoverable
                              onClick={() => handleCourseClick(c)}
                              className="course-card"
                              cover={
                                <div className="course-cover">
                                  <div
                                    className="course-cover-bg"
                                    style={{
                                      backgroundImage: c.coverImage ? `url(${c.coverImage})` : getGradient(c.hierarchyId)
                                    }}
                                  >
                                    {!c.coverImage && (
                                      <BookOutlined className="course-cover-icon" />
                                    )}
                                  </div>
                                  <div className="course-cover-overlay">
                                    <div className="course-price-badge">
                                      {c.price === 0 ? (
                                        <span className="price-free">免费</span>
                                      ) : (
                                        <span className="price-value">¥{c.price}</span>
                                      )}
                                    </div>
                                    {c.status === 0 && (
                                      <div className="course-status-badge">
                                        <LockOutlined /> 已下架
                                      </div>
                                    )}
                                    <div className="course-play-btn">
                                      <PlayCircleOutlined />
                                    </div>
                                  </div>
                                </div>
                              }
                            >
                              <div className="course-card-content">
                                <h3 className="course-name">{c.courseName || currentHierarchy?.hierarchyName}</h3>
                                <div className="course-info-row">
                                  <div className="course-teacher">
                                    <Avatar size="small" icon={<UserOutlined />} />
                                    <span>{c.teacher || '待定'}</span>
                                  </div>
                                  <div className="course-meta">
                                    <Tooltip title="学习人数">
                                      <span><TeamOutlined /> {c.studentCount || 0}</span>
                                    </Tooltip>
                                    <Tooltip title="课程时长">
                                      <span><ClockCircleOutlined /> {c.duration || 0}分钟</span>
                                    </Tooltip>
                                  </div>
                                </div>
                                <div className="course-tags">
                                  <Tag className="difficulty-tag" style={{ backgroundColor: getDifficultyBg(c.difficulty), color: getDifficultyColor(c.difficulty), border: 'none' }}>
                                    <StarOutlined /> {getDifficultyLabel(c.difficulty)}
                                  </Tag>
                                </div>
                                {c.completedLessons > 0 && (
                                  <div className="course-progress">
                                    <div className="progress-header">
                                      <span>学习进度</span>
                                      <span>{Math.round((c.completedLessons / c.totalLessons) * 100)}%</span>
                                    </div>
                                    <Progress
                                      percent={Math.round((c.completedLessons / c.totalLessons) * 100)}
                                      size="small"
                                      showInfo={false}
                                      strokeColor="var(--gradient-primary)"
                                    />
                                    <span className="progress-text">{c.completedLessons}/{c.totalLessons}课时</span>
                                  </div>
                                )}
                              </div>
                              <div className="course-card-footer">
                                <Button
                                  type={c.completedLessons > 0 ? 'default' : 'primary'}
                                  icon={c.completedLessons > 0 ? <PlayCircleOutlined /> : <PlayCircleOutlined />}
                                  block
                                  className={c.completedLessons > 0 ? 'continue-btn' : 'start-btn'}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/course-detail/${c.id}`);
                                  }}
                                >
                                  {c.completedLessons > 0 ? '继续学习' : '开始学习'}
                                </Button>
                              </div>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    ) : (
                      <div className="courses-list">
                        {filteredCourses.map(c => (
                          <Card key={c.id} className="course-list-item" onClick={() => handleCourseClick(c)}>
                            <div className="course-list-content">
                              <div className="course-list-cover">
                                <div
                                  className="course-list-cover-bg"
                                  style={{
                                    backgroundImage: c.coverImage ? `url(${c.coverImage})` : getGradient(c.hierarchyId)
                                  }}
                                >
                                  {!c.coverImage && <BookOutlined className="course-cover-icon" />}
                                </div>
                                {c.status === 0 && <div className="course-list-status">已下架</div>}
                              </div>
                              <div className="course-list-info">
                                <h3 className="course-list-name">{c.courseName || currentHierarchy?.hierarchyName}</h3>
                                <p className="course-list-desc">{c.description || '暂无课程描述'}</p>
                                <div className="course-list-meta">
                                  <span><UserOutlined /> {c.teacher || '待定'}</span>
                                  <span><TeamOutlined /> {c.studentCount || 0}人学习</span>
                                  <span><ClockCircleOutlined /> {c.duration || 0}分钟</span>
                                  <Tag style={{ backgroundColor: getDifficultyBg(c.difficulty), color: getDifficultyColor(c.difficulty), border: 'none' }}>
                                    {getDifficultyLabel(c.difficulty)}
                                  </Tag>
                                  {c.price === 0 ? (
                                    <Tag color="green">免费</Tag>
                                  ) : (
                                    <Tag color="blue">¥{c.price}</Tag>
                                  )}
                                </div>
                                {c.completedLessons > 0 && (
                                  <div className="course-list-progress">
                                    <Progress
                                      percent={Math.round((c.completedLessons / c.totalLessons) * 100)}
                                      size="small"
                                      showInfo={false}
                                    />
                                    <span>已学习 {c.completedLessons}/{c.totalLessons} 课时</span>
                                  </div>
                                )}
                              </div>
                              <div className="course-list-action">
                                <Button
                                  type={c.completedLessons > 0 ? 'default' : 'primary'}
                                  icon={<PlayCircleOutlined />}
                                  size="large"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/course-detail/${c.id}`);
                                  }}
                                >
                                  {c.completedLessons > 0 ? '继续学习' : '开始学习'}
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </>
                )}
        </div>
      </div>

      {/* Course Detail Modal */}
      <Modal
        title={null}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={700}
        className="course-detail-modal"
      >
        {selectedCourse && (
          <div className="modal-content">
            <div
              className="modal-cover"
              style={{
                backgroundImage: selectedCourse.coverImage ? `url(${selectedCourse.coverImage})` : getGradient(selectedCourse.hierarchyId)
              }}
            >
              <div className="modal-cover-content">
                <h2 className="modal-title">{selectedCourse.courseName}</h2>
                <div className="modal-badges">
                  <Tag style={{ backgroundColor: getDifficultyBg(selectedCourse.difficulty), color: getDifficultyColor(selectedCourse.difficulty), border: 'none' }}>
                    <StarOutlined /> {getDifficultyLabel(selectedCourse.difficulty)}
                  </Tag>
                  <Tag color={selectedCourse.price === 0 ? 'green' : 'blue'}>
                    {selectedCourse.price === 0 ? '免费' : `¥${selectedCourse.price}`}
                  </Tag>
                  {selectedCourse.status === 0 && <Tag color="red">已下架</Tag>}
                </div>
              </div>
            </div>
            <div className="modal-body">
              <p className="modal-desc">{selectedCourse.description || '暂无课程描述'}</p>
              <Row gutter={16} className="modal-stats">
                <Col span={8}>
                  <div className="modal-stat-item">
                    <UserOutlined className="stat-icon" />
                    <div>
                      <span className="stat-value">{selectedCourse.teacher || '待定'}</span>
                      <span className="stat-label">授课教师</span>
                    </div>
                  </div>
                </Col>
                <Col span={8}>
                  <div className="modal-stat-item">
                    <TeamOutlined className="stat-icon" />
                    <div>
                      <span className="stat-value">{selectedCourse.studentCount || 0}</span>
                      <span className="stat-label">学习人数</span>
                    </div>
                  </div>
                </Col>
                <Col span={8}>
                  <div className="modal-stat-item">
                    <ClockCircleOutlined className="stat-icon" />
                    <div>
                      <span className="stat-value">{selectedCourse.duration || 0}</span>
                      <span className="stat-label">课程时长(分钟)</span>
                    </div>
                  </div>
                </Col>
              </Row>
              {selectedCourse.completedLessons > 0 && (
                <div className="modal-progress">
                  <div className="progress-label">
                    <span>学习进度</span>
                    <span>{selectedCourse.completedLessons}/{selectedCourse.totalLessons}课时</span>
                  </div>
                  <Progress
                    percent={Math.round((selectedCourse.completedLessons / selectedCourse.totalLessons) * 100)}
                    strokeColor="var(--gradient-primary)"
                  />
                </div>
              )}
              <div className="modal-actions">
                <Button onClick={() => setDetailModalVisible(false)} size="large">
                  返回
                </Button>
                <Button
                  type="primary"
                  size="large"
                  icon={<PlayCircleOutlined />}
                  className="start-learning-btn"
                  onClick={() => {
                    setDetailModalVisible(false);
                    navigate(`/course-detail/${selectedCourse?.id}`);
                  }}
                >
                  {selectedCourse.completedLessons > 0 ? '继续学习' : '开始学习'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
