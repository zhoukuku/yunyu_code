import { useEffect, useState } from 'react';
import { Card, Row, Col, Progress, Tag, Button, Select, Spin, Empty, Tabs, Radio, Space, message } from 'antd';
import {
  BarChartOutlined,
  RadarChartOutlined,
  TrophyOutlined,
  RiseOutlined,
  BookOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { getSkillAtlas, getLearningReport, getLearningStats, getCourseProgress } from '../../services/api';

export default function LearningReportPage() {
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('overall');
  const [report, setReport] = useState(null);
  const [skillAtlas, setSkillAtlas] = useState([]);
  const [stats, setStats] = useState(null);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    loadData();
  }, [reportType]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [atlasRes, reportRes, statsRes, coursesRes] = await Promise.all([
        getSkillAtlas(),
        getLearningReport(reportType),
        getLearningStats(),
        getCourseProgress(),
      ]);

      if (atlasRes.status === 200) setSkillAtlas(atlasRes.result || []);
      if (reportRes.status === 200) setReport(reportRes.result);
      if (statsRes.status === 200) setStats(statsRes.result);
      if (coursesRes.status === 200) setCourses(coursesRes.result || []);
    } catch (e) {
      message.error('加载学习报告失败');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes) => {
    if (!minutes) return '0分钟';
    if (minutes < 60) return `${minutes}分钟`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}小时${mins > 0 ? `${mins}分钟` : ''}`;
  };

  const getMasteryColor = (level) => {
    if (level >= 80) return '#52c41a';
    if (level >= 60) return '#1890ff';
    if (level >= 40) return '#faad14';
    if (level >= 20) return '#fa8c16';
    return '#ff4d4f';
  };

  const getMasteryText = (level) => {
    if (level >= 80) return '精通';
    if (level >= 60) return '熟练';
    if (level >= 40) return '进阶';
    if (level >= 20) return '入门';
    return '初学';
  };

  const tabItems = [
    {
      key: 'overview',
      label: <><BarChartOutlined /> 学习概览</>,
      children: (
        <div>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Card loading={loading}>
                <div style={{ textAlign: 'center' }}>
                  <BookOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                  <div style={{ fontSize: 24, fontWeight: 'bold', marginTop: 8 }}>
                    {report?.coursesEnrolled || 0}
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
                    {report?.coursesCompleted || 0}
                  </div>
                  <div style={{ color: '#666' }}>已完成课程</div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card loading={loading}>
                <div style={{ textAlign: 'center' }}>
                  <ThunderboltOutlined style={{ fontSize: 32, color: '#722ed1' }} />
                  <div style={{ fontSize: 24, fontWeight: 'bold', marginTop: 8 }}>
                    {report?.lessonsCompleted || 0}
                  </div>
                  <div style={{ color: '#666' }}>已完成课时</div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card loading={loading}>
                <div style={{ textAlign: 'center' }}>
                  <ClockCircleOutlined style={{ fontSize: 32, color: '#faad14' }} />
                  <div style={{ fontSize: 24, fontWeight: 'bold', marginTop: 8 }}>
                    {formatTime(report?.totalStudyMinutes || 0)}
                  </div>
                  <div style={{ color: '#666' }}>累计学习时长</div>
                </div>
              </Card>
            </Col>
          </Row>

          <Card title="学习进度" style={{ marginTop: 16 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
            ) : courses.length === 0 ? (
              <Empty description="暂无课程数据" />
            ) : (
              <Row gutter={[16, 16]}>
                {courses.map((course) => (
                  <Col xs={24} sm={12} md={8} lg={6} key={course.courseId}>
                    <Card size="small" hoverable>
                      <div style={{ fontWeight: 'bold', marginBottom: 8 }}>{course.courseName}</div>
                      <Progress
                        percent={course.progressPercent}
                        size="small"
                        status={course.progressPercent === 100 ? 'success' : 'active'}
                        strokeColor={getMasteryColor(course.progressPercent)}
                      />
                      <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                        {course.completedLessons}/{course.totalLessons} 课时
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Card>
        </div>
      ),
    },
    {
      key: 'skills',
      label: <><RadarChartOutlined /> 技能图谱</>,
      children: (
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
          ) : skillAtlas.length === 0 ? (
            <Empty description="暂无技能数据">
              <Button type="primary">添加技能分类</Button>
            </Empty>
          ) : (
            <Row gutter={[16, 16]}>
              {skillAtlas.map((category) => (
                <Col xs={24} md={12} lg={8} key={category.categoryId}>
                  <Card
                    title={
                      <span>
                        <TeamOutlined style={{ marginRight: 8 }} />
                        {category.categoryName}
                      </span>
                    }
                    extra={
                      <Tag color={getMasteryColor(category.averageMastery)}>
                        平均 {category.averageMastery}%
                      </Tag>
                    }
                  >
                    <div style={{ marginBottom: 16 }}>
                      <Progress
                        percent={category.averageMastery}
                        strokeColor={getMasteryColor(category.averageMastery)}
                        showInfo={false}
                      />
                    </div>
                    {category.skills && category.skills.length > 0 ? (
                      <div>
                        {category.skills.map((skill, index) => (
                          <div
                            key={index}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 0',
                              borderBottom: index < category.skills.length - 1 ? '1px solid #f0f0f0' : 'none',
                            }}
                          >
                            <span style={{ fontWeight: 500 }}>{skill.skillName}</span>
                            <Space>
                              <Tag color={getMasteryColor(skill.masteryLevel)}>
                                {getMasteryText(skill.masteryLevel)}
                              </Tag>
                              <Progress
                                percent={skill.masteryLevel}
                                size="small"
                                style={{ width: 80 }}
                                strokeColor={getMasteryColor(skill.masteryLevel)}
                              />
                            </Space>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Empty description="暂无技能" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    )}
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>
      ),
    },
    {
      key: 'report',
      label: <><TrophyOutlined /> 学习报告</>,
      children: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Radio.Group
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              buttonStyle="solid"
            >
              <Radio.Button value="weekly">本周</Radio.Button>
              <Radio.Button value="monthly">本月</Radio.Button>
              <Radio.Button value="overall">全部</Radio.Button>
            </Radio.Group>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
          ) : report ? (
            <Card>
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <div style={{ fontSize: 48, fontWeight: 'bold', color: '#1890ff' }}>
                      {report.averageProgress}%
                    </div>
                    <div style={{ color: '#666' }}>综合学习进度</div>
                  </div>
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                  <Card size="small">
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 'bold' }}>{report.coursesEnrolled}</div>
                      <div style={{ color: '#666', fontSize: 12 }}>在学课程</div>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card size="small">
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 'bold' }}>{report.coursesCompleted}</div>
                      <div style={{ color: '#666', fontSize: 12 }}>已完成课程</div>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card size="small">
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 'bold' }}>{report.lessonsCompleted}</div>
                      <div style={{ color: '#666', fontSize: 12 }}>已完成课时</div>
                    </div>
                  </Card>
                </Col>
              </Row>

              {report.topSkills && report.topSkills.length > 0 && (
                <Card title={<><RiseOutlined /> 擅长技能</>} style={{ marginTop: 16 }} size="small">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {report.topSkills.map((skill, index) => (
                      <Tag key={index} color="green" style={{ padding: '4px 12px' }}>
                        {skill.skillName} ({skill.masteryLevel}%)
                      </Tag>
                    ))}
                  </div>
                </Card>
              )}

              {report.weakSkills && report.weakSkills.length > 0 && (
                <Card title="待提升技能" style={{ marginTop: 16 }} size="small">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {report.weakSkills.map((skill, index) => (
                      <Tag key={index} color="orange" style={{ padding: '4px 12px' }}>
                        {skill.skillName} ({skill.masteryLevel}%)
                      </Tag>
                    ))}
                  </div>
                </Card>
              )}

              {report.recentAchievements && report.recentAchievements.length > 0 && (
                <Card title={<><TrophyOutlined /> 近期成就</>} style={{ marginTop: 16 }} size="small">
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {report.recentAchievements.map((achievement, index) => (
                      <li key={index} style={{ marginBottom: 8 }}>{achievement}</li>
                    ))}
                  </ul>
                </Card>
              )}
            </Card>
          ) : (
            <Empty description="暂无报告数据" />
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        title="学习报告 / 技能图谱"
        extra={
          <Select
            value={reportType}
            onChange={(value) => setReportType(value)}
            style={{ width: 120 }}
          >
            <Select.Option value="weekly">本周报告</Select.Option>
            <Select.Option value="monthly">本月报告</Select.Option>
            <Select.Option value="overall">总报告</Select.Option>
          </Select>
        }
      >
        <Tabs items={tabItems} />
      </Card>
    </div>
  );
}
