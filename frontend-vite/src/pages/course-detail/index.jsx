import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Descriptions, Tag, Button, List, Progress, Spin, message } from 'antd';
import { BookOutlined, UserOutlined, ClockCircleOutlined, TeamOutlined, PlayCircleOutlined, CheckCircleOutlined, LeftOutlined } from '@ant-design/icons';
import { getCourseDetail, enrollCourse, isEnrolled } from '../../services/api';
import { safeGetItem, safeGetJSON, safeSetJSON } from '../../utils/storage';
import './index.less';

const difficultyText = ['', '入门', '简单', '中等', '困难', '专家'];
const difficultyColor = ['', 'green', 'cyan', 'blue', 'orange', 'red'];

export default function CourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const loadCourseDetail = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(false);
      const courseRes = await getCourseDetail(id);

      if (courseRes.status === 200 && courseRes.result) {
        setCourse(courseRes.result);
        setLessons(courseRes.result.lessons || []);

        // Check enrollment status
        try {
          const enrolledRes = await isEnrolled(id);
          setEnrolled(enrolledRes.result === true);
        } catch (e) {
          // If not logged in, check localStorage
          const enrolledCourses = safeGetJSON('enrolledCourses', []);
          setEnrolled(enrolledCourses.includes(Number(id)));
        }
      } else {
        message.error(courseRes.msg || '课程不存在');
      }
    } catch (e) {
      console.error('加载课程详情失败', e);
      setLoadError(true);
      message.error('加载课程详情失败，请检查网络后重试');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadCourseDetail();
    }
  }, [id, loadCourseDetail]);

  const handleEnroll = async () => {
    const token = safeGetItem('accessToken');
    if (!token) {
      message.info('请先登录');
      navigate('/login');
      return;
    }

    try {
      setEnrolling(true);
      const res = await enrollCourse(id);
      if (res.status === 200) {
        setEnrolled(true);
        message.success('加入课程成功');
      } else {
        message.error(res.msg || '加入课程失败');
      }
    } catch (e) {
      // Only fallback to localStorage for network errors (no server response)
      if (e.response) {
        const msg =
          e.response.data?.msg ||
          e.response.data?.message ||
          '加入课程失败，请稍后重试';
        message.error(msg);
      } else {
        // Network error — fallback to localStorage
        const enrolledCourses = safeGetJSON('enrolledCourses', []);
        if (!enrolledCourses.includes(Number(id))) {
          enrolledCourses.push(Number(id));
          safeSetJSON('enrolledCourses', enrolledCourses);
        }
        setEnrolled(true);
        message.success('加入课程成功（离线模式）');
      }
    } finally {
      setEnrolling(false);
    }
  };

  const handleStartLearning = () => {
    if (!lessons || lessons.length === 0) {
      message.info('暂无课时可学习');
      return;
    }
    const firstUncompleted = lessons.find(l => !l.isCompleted);
    const targetLesson = firstUncompleted || lessons[0];
    navigate(`/courses/${id}/lessons/${targetLesson.id}`);
  };

  if (loading) {
    return (
      <div className="course-detail-loading">
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="course-detail-page">
        <Card>
          <div style={{ textAlign: 'center', padding: 50 }}>
            <h2>加载失败</h2>
            <p style={{ color: '#999' }}>加载课程详情失败，请检查网络后重试</p>
            <Button type="primary" onClick={loadCourseDetail} style={{ marginRight: 8 }}>
              重新加载
            </Button>
            <Button onClick={() => navigate('/course')}>
              返回课程中心
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="course-detail-page">
        <Card>
          <div style={{ textAlign: 'center', padding: 50 }}>
            <h2>课程不存在</h2>
            <Button type="primary" onClick={() => navigate('/course')}>
              返回课程中心
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const progress = course.totalLessons > 0
    ? Math.round((course.completedLessons / course.totalLessons) * 100)
    : 0;

  return (
    <div className="course-detail-page">
      <Button icon={<LeftOutlined />} onClick={() => navigate('/course')} style={{ marginBottom: 16 }}>
        返回课程中心
      </Button>

      <Row gutter={[24, 24]}>
        {/* Left column - Course info */}
        <Col xs={24} lg={16}>
          <Card
            title={course.courseName}
            extra={
              <Tag color={course.status === 1 ? 'green' : 'red'}>
                {course.status === 1 ? '可学习' : '已下架'}
              </Tag>
            }
          >
            {/* Course cover */}
            <div className="course-cover">
              {course.coverImage ? (
                <img src={course.coverImage} alt={course.courseName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <BookOutlined style={{ fontSize: 64, color: '#fff' }} />
              )}
            </div>

            {/* Course descriptions */}
            <Descriptions column={2} style={{ marginTop: 24 }}>
              <Descriptions.Item label="授课教师">
                <UserOutlined /> {course.teacher || '未设置'}
              </Descriptions.Item>
              <Descriptions.Item label="学习人数">
                <TeamOutlined /> {course.studentCount || 0} 人
              </Descriptions.Item>
              <Descriptions.Item label="课程时长">
                <ClockCircleOutlined /> {course.duration || 0} 分钟
              </Descriptions.Item>
              <Descriptions.Item label="难度等级">
                <Tag color={difficultyColor[course.difficulty] || 'blue'}>
                  {difficultyText[course.difficulty] || '中等'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="价格" span={2}>
                {course.price === 0 ? '免费' : `¥${course.price}`}
              </Descriptions.Item>
              <Descriptions.Item label="课程介绍" span={2}>
                {course.description || '暂无课程介绍'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Chapter/Lesson list */}
          <Card title="课程章节" style={{ marginTop: 24 }}>
            <List
              dataSource={lessons}
              renderItem={(lesson, index) => (
                <List.Item
                  className={`lesson-item ${lesson.isCompleted ? 'completed' : ''}`}
                  extra={
                    lesson.isCompleted ? (
                      <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
                    ) : (
                      <PlayCircleOutlined style={{ color: '#1890ff', fontSize: 20 }} />
                    )
                  }
                  onClick={() => navigate(`/courses/${id}/lessons/${lesson.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <List.Item.Meta
                    title={lesson.lessonName}
                    description={`课时 ${index + 1} · ${lesson.duration || 0} 分钟`}
                  />
                </List.Item>
              )}
            />
            {lessons.length === 0 && (
              <div style={{ textAlign: 'center', padding: 24, color: '#999' }}>
                暂无课时信息
              </div>
            )}
          </Card>
        </Col>

        {/* Right column - Action card */}
        <Col xs={24} lg={8}>
          <Card className="action-card">
            {/* Progress */}
            {enrolled && (
              <div className="progress-section">
                <Progress
                  type="circle"
                  percent={progress}
                  format={() => `${course.completedLessons || 0}/${course.totalLessons || 0}`}
                  size={120}
                />
                <div className="progress-text">学习进度</div>
              </div>
            )}

            {/* Action buttons */}
            <div className="action-buttons">
              {!enrolled ? (
                <Button
                  type="primary"
                  size="large"
                  block
                  onClick={handleEnroll}
                  loading={enrolling}
                >
                  加入课程
                </Button>
              ) : course.completedLessons === 0 ? (
                <Button type="primary" size="large" block onClick={handleStartLearning}>
                  开始学习
                </Button>
              ) : (
                <Button type="primary" size="large" block onClick={handleStartLearning}>
                  继续学习
                </Button>
              )}
              <Button size="large" block onClick={() => navigate('/course')}>
                返回课程中心
              </Button>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}