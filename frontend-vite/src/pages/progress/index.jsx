import { useEffect, useState, useCallback } from 'react';
import { Card, Row, Col, Progress, Table, Tag, Button, message, Empty, Statistic, Badge } from 'antd';
import {
  BookOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  HistoryOutlined,
  TrophyOutlined,
  FireOutlined,
  CalendarOutlined,
  CrownOutlined,
  DownloadOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getLearningStats, getCourseProgress, getLearningHistory, markLessonCompleted, getAchievements, getAchievementStats, exportProgress } from '../../services/api';
import { safeGetItem } from '../../utils/storage';

export default function ProgressPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [courses, setCourses] = useState([]);
  const [history, setHistory] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [achievementStats, setAchievementStats] = useState({ total: 0, unlocked: 0, locked: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [completingId, setCompletingId] = useState(null);
  const [exporting, setExporting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [statsRes, coursesRes, historyRes, achievementsRes, achievementStatsRes] = await Promise.all([
        getLearningStats(),
        getCourseProgress(),
        getLearningHistory(20),
        getAchievements(),
        getAchievementStats(),
      ]);

      if (statsRes.status === 200) setStats(statsRes.result);
      if (coursesRes.status === 200) setCourses(coursesRes.result || []);
      if (historyRes.status === 200) setHistory(historyRes.result || []);
      if (achievementsRes.status === 200) setAchievements(achievementsRes.result || []);
      if (achievementStatsRes.status === 200) setAchievementStats(achievementStatsRes.result || { total: 0, unlocked: 0, locked: 0 });
    } catch (e) {
      setError(true);
      message.error('加载学习进度失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = safeGetItem('accessToken');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    loadData();
  }, [loadData]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (minutes) => {
    if (minutes == null || isNaN(minutes)) return '-';
    if (minutes < 60) return `${minutes}分钟`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}小时${mins > 0 ? `${mins}分钟` : ''}`;
  };

  const formatVideoTime = (seconds) => {
    if (seconds == null || isNaN(seconds)) return '-';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}分钟`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}小时${mins > 0 ? `${mins}分钟` : ''}`;
  };

  const handleMarkComplete = async (record) => {
    setCompletingId(record.lessonId);
    try {
      const res = await markLessonCompleted(record.lessonId);
      if (res.status === 200) {
        message.success('已标记为完成');
        loadData();
      }
    } catch (e) {
      message.error('标记完成失败');
    } finally {
      setCompletingId(null);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await exportProgress();
      if (response.status === 200) {
        const dataStr = JSON.stringify(response.result, null, 2);
        const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', `learning-progress-${new Date().toISOString().split('T')[0]}.json`);
        linkElement.click();
        message.success('导出成功');
      }
    } catch (e) {
      message.error('导出失败');
    } finally {
      setExporting(false);
    }
  };

  const getAchievementIcon = (icon) => {
    const iconMap = {
      trophy: <TrophyOutlined />,
      book: <BookOutlined />,
      code: <PlayCircleOutlined />,
      share: <BookOutlined />,
      message: <BookOutlined />,
      team: <BookOutlined />,
      star: <CrownOutlined />,
      fire: <FireOutlined />,
      calendar: <CalendarOutlined />,
      crown: <CrownOutlined />,
    };
    return iconMap[icon] || <TrophyOutlined />;
  };

  const historyColumns = [
    {
      title: '课时名称',
      dataIndex: 'lessonName',
      key: 'lessonName',
    },
    {
      title: '所属课程',
      dataIndex: 'courseName',
      key: 'courseName',
    },
    {
      title: '完成时间',
      dataIndex: 'completedAt',
      key: 'completedAt',
      render: (text) => formatDate(text),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <>
          <Button
            type="link"
            size="small"
            onClick={() => navigate(`/courses/${record.courseId}/lessons/${record.lessonId}`)}
          >
            查看
          </Button>
          {record.isCompleted !== true && (
            <Button
              type="link"
              size="small"
              loading={completingId === record.lessonId}
              onClick={() => handleMarkComplete(record)}
            >
              标记完成
            </Button>
          )}
        </>
      ),
    },
  ];

  // Calculate overall completion percentage
  const overallCompletionPercent = stats?.averageProgressPercent || 0;

  return (
    <div style={{ padding: 24 }}>
      {/* Header with export */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>学习进度</h2>
        <Button
          icon={<ExportOutlined />}
          onClick={handleExport}
          loading={exporting}
        >
          导出学习报告
        </Button>
      </div>

      {/* Error state */}
      {error && !stats && courses.length === 0 && !loading && (
        <Card style={{ marginBottom: 16 }}>
          <Empty description="加载失败，请稍后重试">
            <Button type="primary" onClick={loadData}>重新加载</Button>
          </Empty>
        </Card>
      )}

      {/* Overall Progress */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={12}>
            <Statistic
              title="总体完成度"
              value={overallCompletionPercent}
              suffix="%"
              valueStyle={{ color: overallCompletionPercent >= 80 ? '#52c41a' : overallCompletionPercent >= 50 ? '#1890ff' : '#faad14' }}
            />
          </Col>
          <Col span={12}>
            <Progress
              percent={overallCompletionPercent}
              size="large"
              status={overallCompletionPercent >= 80 ? 'success' : 'active'}
              strokeColor={overallCompletionPercent >= 80 ? '#52c41a' : overallCompletionPercent >= 50 ? '#1890ff' : '#faad14'}
            />
          </Col>
        </Row>
      </Card>

      {/* Learning Stats Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <div style={{ textAlign: 'center' }}>
              <BookOutlined style={{ fontSize: 32, color: '#1890ff' }} />
              <div style={{ fontSize: 24, fontWeight: 'bold', marginTop: 8 }}>
                {stats?.totalEnrolledCourses || 0}
              </div>
              <div style={{ color: '#666' }}>在学课程</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <div style={{ textAlign: 'center' }}>
              <CheckCircleOutlined style={{ fontSize: 32, color: '#52c41a' }} />
              <div style={{ fontSize: 24, fontWeight: 'bold', marginTop: 8 }}>
                {stats?.completedCourses || 0}
              </div>
              <div style={{ color: '#666' }}>已完成课程</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <div style={{ textAlign: 'center' }}>
              <PlayCircleOutlined style={{ fontSize: 32, color: '#faad14' }} />
              <div style={{ fontSize: 24, fontWeight: 'bold', marginTop: 8 }}>
                {stats?.totalLessonsCompleted || 0}
              </div>
              <div style={{ color: '#666' }}>已完成课时</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <div style={{ textAlign: 'center' }}>
              <ClockCircleOutlined style={{ fontSize: 32, color: '#722ed1' }} />
              <div style={{ fontSize: 24, fontWeight: 'bold', marginTop: 8 }}>
                {formatTime(stats?.totalLearningMinutes || 0)}
              </div>
              <div style={{ color: '#666' }}>累计学习时长</div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Learning Duration Stats */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <div style={{ textAlign: 'center' }}>
              <ClockCircleOutlined style={{ fontSize: 32, color: '#13c2c2' }} />
              <div style={{ fontSize: 24, fontWeight: 'bold', marginTop: 8 }}>
                {formatVideoTime(stats?.totalVideoMinutes || 0)}
              </div>
              <div style={{ color: '#666' }}>视频观看时长</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <div style={{ textAlign: 'center' }}>
              <CalendarOutlined style={{ fontSize: 32, color: '#2f54eb' }} />
              <div style={{ fontSize: 24, fontWeight: 'bold', marginTop: 8 }}>
                {formatTime(stats?.weeklyStudyMinutes || 0)}
              </div>
              <div style={{ color: '#666' }}>本周学习时长</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <div style={{ textAlign: 'center' }}>
              <FireOutlined style={{ fontSize: 32, color: '#eb4b26' }} />
              <div style={{ fontSize: 24, fontWeight: 'bold', marginTop: 8 }}>
                {stats?.studyStreak || 0}
              </div>
              <div style={{ color: '#666' }}>连续学习天数</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <div style={{ textAlign: 'center' }}>
              <CrownOutlined style={{ fontSize: 32, color: '#faad14' }} />
              <div style={{ fontSize: 24, fontWeight: 'bold', marginTop: 8 }}>
                {stats?.longestStreak || 0}
              </div>
              <div style={{ color: '#666' }}>最长连续天数</div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Achievements Section */}
      <Card
        title={<><TrophyOutlined /> 我的成就</>}
        style={{ marginTop: 16 }}
        extra={
          <span style={{ color: '#999' }}>
            已解锁 {achievementStats.unlocked}/{achievementStats.total}
          </span>
        }
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>加载中...</div>
        ) : achievements.length === 0 ? (
          <Empty description="暂无成就数据" />
        ) : (
          <Row gutter={[16, 16]}>
            {achievements.slice(0, 8).map((achievement) => (
              <Col xs={12} sm={12} md={6} lg={3} key={achievement.id}>
                <Card
                  size="small"
                  style={{
                    textAlign: 'center',
                    background: achievement.unlocked ? 'linear-gradient(135deg, #fff9e6 0%, #ffffff 100%)' : '#f5f5f5',
                    border: achievement.unlocked ? '2px solid #faad14' : '1px solid #e8e8e8',
                  }}
                  bodyStyle={{ padding: 12 }}
                >
                  <Badge
                    status={achievement.unlocked ? 'success' : 'default'}
                    style={{ marginBottom: 8 }}
                  />
                  <div style={{ fontSize: 28, marginBottom: 4, color: achievement.unlocked ? '#faad14' : '#ccc' }}>
                    {getAchievementIcon(achievement.icon)}
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: 12, marginBottom: 4 }}>{achievement.name}</div>
                  <Progress
                    percent={achievement.target > 0 ? Math.round((achievement.progress / achievement.target) * 100) : 0}
                    size="small"
                    showInfo={false}
                    status={achievement.unlocked ? 'success' : 'active'}
                    strokeColor={achievement.unlocked ? '#52c41a' : '#1890ff'}
                  />
                  <div style={{ fontSize: 10, color: '#999', marginTop: 4 }}>
                    {achievement.progress}/{achievement.target}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>

      {/* Continue Learning */}
      {stats?.continueLearning && (
        <Card
          title="继续学习"
          style={{ marginTop: 16 }}
          extra={
            <Button
              type="primary"
              onClick={() =>
                navigate(
                  `/courses/${stats.continueLearning.courseId}/lessons/${stats.continueLearning.lessonId}`
                )
              }
            >
              继续
            </Button>
          }
        >
          <div>
            <strong>{stats.continueLearning.courseName}</strong>
            <span style={{ color: '#666', marginLeft: 8 }}>
              - {stats.continueLearning.lessonName}
            </span>
          </div>
        </Card>
      )}

      {/* Course Progress */}
      <Card title="课程进度" style={{ marginTop: 16 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>加载中...</div>
        ) : courses.length === 0 ? (
          <Empty description="暂未加入任何课程">
            <Button type="primary" onClick={() => navigate('/course')}>
              浏览课程
            </Button>
          </Empty>
        ) : (
          <Row gutter={[16, 16]}>
            {courses.map((course) => (
              <Col xs={24} sm={12} md={8} lg={6} key={course.courseId}>
                <Card
                  hoverable
                  onClick={() => navigate(`/course-detail/${course.courseId}`)}
                  cover={
                    <div
                      style={{
                        height: 100,
                        background: course.coverImage
                          ? `url(${course.coverImage}) center/cover no-repeat`
                          : '#f0f0f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {!course.coverImage && (
                        <BookOutlined style={{ fontSize: 36, color: '#ccc' }} />
                      )}
                    </div>
                  }
                >
                  <Card.Meta
                    title={<strong>{course.courseName}</strong>}
                    description={
                      <div style={{ marginTop: 8 }}>
                        <div style={{ fontSize: 12, color: '#666' }}>
                          教师: {course.teacher || '待定'}
                        </div>
                        <div style={{ marginTop: 8 }}>
                          <Progress
                            percent={course.progressPercent}
                            size="small"
                            status={course.progressPercent === 100 ? 'success' : 'active'}
                          />
                        </div>
                        <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                          {course.completedLessons}/{course.totalLessons}课时已完成
                        </div>
                        {course.lastStudyTime && (
                          <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                            最后学习: {formatDate(course.lastStudyTime)}
                          </div>
                        )}
                      </div>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>

      {/* Learning History */}
      <Card
        title={<><HistoryOutlined /> 学习历史</>}
        style={{ marginTop: 16 }}
        extra={<span style={{ color: '#999' }}>最近20条记录</span>}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>加载中...</div>
        ) : history.length === 0 ? (
          <Empty description="暂无学习记录" />
        ) : (
          <Table
            columns={historyColumns}
            dataSource={history}
            rowKey={(record, index) => `${record.lessonId || index}-${index}`}
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>
    </div>
  );
}
