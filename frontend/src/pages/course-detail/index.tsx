import { useEffect, useState } from 'react';
import { useParams, history } from '@umijs/max';
import { Card, Row, Col, Descriptions, Tag, Button, List, Progress, Spin, message } from 'antd';
import { BookOutlined, UserOutlined, ClockCircleOutlined, TeamOutlined, PlayCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { getCourseDetail, getCourseLessons } from '@/services/api';
import type { CourseDetail, Lesson } from '@/services/types';
import './index.less';

const difficultyText = ['', '入门', '简单', '中等', '困难', '专家'];
const difficultyColor = ['', 'green', 'cyan', 'blue', 'orange', 'red'];

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);

  useEffect(() => {
    if (id) {
      loadCourseDetail();
    }
  }, [id]);

  const loadCourseDetail = async () => {
    try {
      setLoading(true);
      const [courseRes, lessonsRes] = await Promise.all([
        getCourseDetail(Number(id)),
        getCourseLessons(Number(id)),
      ]);

      if (courseRes.status === 200 && courseRes.result) {
        setCourse(courseRes.result);
        setLessons(courseRes.result.lessons || []);
        // Check if user is already enrolled (has completed lessons > 0 or enrolled in localStorage)
        const enrolledCourses = JSON.parse(localStorage.getItem('enrolledCourses') || '[]');
        setEnrolled(enrolledCourses.includes(Number(id)) || courseRes.result.completedLessons > 0);
      } else {
        message.error('课程不存在');
      }
    } catch (e) {
      console.error('加载课程详情失败', e);
      message.error('加载课程详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = () => {
    // Add to enrolled courses in localStorage
    const enrolledCourses = JSON.parse(localStorage.getItem('enrolledCourses') || '[]');
    if (!enrolledCourses.includes(Number(id))) {
      enrolledCourses.push(Number(id));
      localStorage.setItem('enrolledCourses', JSON.stringify(enrolledCourses));
    }
    setEnrolled(true);
    message.success('加入课程成功');
  };

  const handleStartLearning = () => {
    // Find the first uncompleted lesson or the first lesson
    const firstUncompleted = lessons.find(l => !l.isCompleted);
    const targetLesson = firstUncompleted || lessons[0];
    if (targetLesson) {
      // Navigate to IDE with the lesson/course id
      history.push(`/ide/${id}?lessonId=${targetLesson.id}`);
    } else {
      message.info('暂无课时可学习');
    }
  };

  const handleContinueLearning = () => {
    // Find the first uncompleted lesson
    const firstUncompleted = lessons.find(l => !l.isCompleted);
    if (firstUncompleted) {
      history.push(`/ide/${id}?lessonId=${firstUncompleted.id}`);
    } else {
      // All completed, restart or go to IDE
      history.push(`/ide/${id}`);
    }
  };

  if (loading) {
    return (
      <div className="course-detail-loading">
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="course-detail-page">
        <Card>
          <div style={{ textAlign: 'center', padding: 50 }}>
            <h2>课程不存在</h2>
            <Button type="primary" onClick={() => history.push('/courses')}>
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
              <BookOutlined style={{ fontSize: 64, color: '#fff' }} />
            </div>

            {/* Course descriptions */}
            <Descriptions column={2} style={{ marginTop: 24 }}>
              <Descriptions.Item label="授课教师">
                <UserOutlined /> {course.teacher || '未设置'}
              </Descriptions.Item>
              <Descriptions.Item label="学习人数">
                <TeamOutlined /> {course.studentCount}
              </Descriptions.Item>
              <Descriptions.Item label="课程时长">
                <ClockCircleOutlined /> {course.duration} 分钟
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
                  actions={[
                    lesson.isCompleted ? (
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    ) : (
                      <PlayCircleOutlined style={{ color: '#1890ff' }} />
                    )
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <div className="lesson-number">
                        {lesson.isCompleted ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : index + 1}
                      </div>
                    }
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
                  format={() => `${course.completedLessons}/${course.totalLessons}`}
                  size={120}
                />
                <div className="progress-text">学习进度</div>
              </div>
            )}

            {/* Action buttons */}
            <div className="action-buttons">
              {!enrolled ? (
                <Button type="primary" size="large" block onClick={handleEnroll}>
                  加入课程
                </Button>
              ) : course.completedLessons === 0 ? (
                <Button type="primary" size="large" block onClick={handleStartLearning}>
                  开始学习
                </Button>
              ) : (
                <Button type="primary" size="large" block onClick={handleContinueLearning}>
                  继续学习
                </Button>
              )}
              <Button size="large" block onClick={() => history.push('/courses')}>
                返回课程中心
              </Button>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}