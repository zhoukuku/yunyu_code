import { useEffect, useState } from 'react';
import { Card, Row, Col, Progress, Tag, Button, Select, Spin, Empty, Tabs, Radio, Space, message, Modal, Input, List, Badge } from 'antd';
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
  UserOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import {
  getParentalReports,
  generateParentalReport,
  getLinkedStudents,
  approveParentalReport,
  rejectParentalReport,
  deleteParentalReport,
} from '../../services/api';

const { TextArea } = Input;
const { confirm } = Modal;

export default function ParentalReportPage() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [linkedStudents, setLinkedStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [reportType, setReportType] = useState('weekly');
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('list');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reportsRes, studentsRes] = await Promise.all([
        getParentalReports(),
        getLinkedStudents(),
      ]);

      if (reportsRes.status === 200) {
        setReports(reportsRes.result || []);
      }
      if (studentsRes.status === 200) {
        setLinkedStudents(studentsRes.result || []);
        if (studentsRes.result && studentsRes.result.length > 0) {
          setSelectedStudent(studentsRes.result[0].studentId);
        }
      }
    } catch (e) {
      message.error('加载监管报告失败');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedStudent) {
      message.warning('请选择学生');
      return;
    }
    setGenerating(true);
    try {
      const res = await generateParentalReport(selectedStudent, reportType);
      if (res.status === 200) {
        message.success('报告生成成功');
        loadData();
        setActiveTab('list');
      }
    } catch (e) {
      message.error('生成报告失败');
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      const res = await approveParentalReport(id);
      if (res.status === 200) {
        message.success('报告已批准');
        loadData();
      }
    } catch (e) {
      message.error('操作失败');
    }
  };

  const handleReject = async (id) => {
    try {
      const res = await rejectParentalReport(id);
      if (res.status === 200) {
        message.success('报告已拒绝');
        loadData();
      }
    } catch (e) {
      message.error('操作失败');
    }
  };

  const handleDelete = (id) => {
    confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: '确定要删除这条监管报告吗？',
      onOk: async () => {
        try {
          const res = await deleteParentalReport(id);
          if (res.status === 200) {
            message.success('报告已删除');
            loadData();
          }
        } catch (e) {
          message.error('删除失败');
        }
      },
    });
  };

  const formatTime = (minutes) => {
    if (!minutes) return '0分钟';
    if (minutes < 60) return `${minutes}分钟`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}小时${mins > 0 ? `${mins}分钟` : ''}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'warning';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved': return '已批准';
      case 'rejected': return '已拒绝';
      default: return '待审核';
    }
  };

  const getMasteryColor = (level) => {
    if (level >= 80) return '#52c41a';
    if (level >= 60) return '#1890ff';
    if (level >= 40) return '#faad14';
    if (level >= 20) return '#fa8c16';
    return '#ff4d4f';
  };

  const parseReportSummary = (summaryStr) => {
    if (!summaryStr) return { topSkills: [], weakSkills: [], recentAchievements: [] };
    try {
      return JSON.parse(summaryStr);
    } catch (e) {
      return { topSkills: [], weakSkills: [], recentAchievements: [] };
    }
  };

  const renderReportDetail = (report) => {
    const summaryData = parseReportSummary(report.summary);

    return (
      <Card
        size="small"
        title={`${report.reportType === 'weekly' ? '周' : report.reportType === 'monthly' ? '月' : '总'}报告`}
        extra={
          <Space>
            <Tag color={getStatusColor(report.status)}>{getStatusText(report.status)}</Tag>
            <Button size="small" type="link" danger onClick={() => handleDelete(report.id)}>
              <DeleteOutlined />
            </Button>
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <div style={{ textAlign: 'center' }}>
              <BookOutlined style={{ fontSize: 24, color: '#1890ff' }} />
              <div style={{ fontSize: 18, fontWeight: 'bold' }}>{report.coursesEnrolled}</div>
              <div style={{ color: '#666', fontSize: 12 }}>在学课程</div>
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div style={{ textAlign: 'center' }}>
              <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />
              <div style={{ fontSize: 18, fontWeight: 'bold' }}>{report.coursesCompleted}</div>
              <div style={{ color: '#666', fontSize: 12 }}>已完成课程</div>
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div style={{ textAlign: 'center' }}>
              <ThunderboltOutlined style={{ fontSize: 24, color: '#722ed1' }} />
              <div style={{ fontSize: 18, fontWeight: 'bold' }}>{report.lessonsCompleted}</div>
              <div style={{ color: '#666', fontSize: 12 }}>已完成课时</div>
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div style={{ textAlign: 'center' }}>
              <ClockCircleOutlined style={{ fontSize: 24, color: '#faad14' }} />
              <div style={{ fontSize: 18, fontWeight: 'bold' }}>{formatTime(report.totalStudyMinutes)}</div>
              <div style={{ color: '#666', fontSize: 12 }}>学习时长</div>
            </div>
          </Col>
        </Row>

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Progress
            percent={report.averageProgress}
            strokeColor={getMasteryColor(report.averageProgress)}
            format={(p) => <span style={{ fontSize: 16 }}>综合进度 {p}%</span>}
          />
        </div>

        {summaryData.topSkills && summaryData.topSkills.length > 0 && (
          <Card size="small" title={<><RiseOutlined /> 擅长技能</>} style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {summaryData.topSkills.map((skill, index) => (
                <Tag key={index} color="green" style={{ padding: '4px 12px' }}>
                  {skill.skillName} ({skill.masteryLevel}%)
                </Tag>
              ))}
            </div>
          </Card>
        )}

        {summaryData.weakSkills && summaryData.weakSkills.length > 0 && (
          <Card size="small" title="待提升技能" style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {summaryData.weakSkills.map((skill, index) => (
                <Tag key={index} color="orange" style={{ padding: '4px 12px' }}>
                  {skill.skillName} ({skill.masteryLevel}%)
                </Tag>
              ))}
            </div>
          </Card>
        )}

        {summaryData.recentAchievements && summaryData.recentAchievements.length > 0 && (
          <Card size="small" title={<><TrophyOutlined /> 近期成就</>} style={{ marginTop: 16 }}>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {summaryData.recentAchievements.map((achievement, index) => (
                <li key={index} style={{ marginBottom: 8 }}>{achievement}</li>
              ))}
            </ul>
          </Card>
        )}

        {report.reviewComment && (
          <Card size="small" title="审核备注" style={{ marginTop: 16 }}>
            <p>{report.reviewComment}</p>
          </Card>
        )}
      </Card>
    );
  };

  const listTab = {
    key: 'list',
    label: <><BarChartOutlined /> 报告列表</>,
    children: (
      <div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
        ) : reports.length === 0 ? (
          <Empty description="暂无监管报告" />
        ) : (
          <div>
            {reports.map((report) => (
              <div key={report.id}>
                <div style={{ marginBottom: 8, color: '#666' }}>
                  <UserOutlined /> {report.studentName || `学生${report.studentId}`} -
                  {new Date(report.createdAt).toLocaleDateString()}
                </div>
                {renderReportDetail(report)}
              </div>
            ))}
          </div>
        )}
      </div>
    ),
  };

  const generateTab = {
    key: 'generate',
    label: <><RadarChartOutlined /> 生成报告</>,
    children: (
      <div>
        <Card title="生成新的监管报告">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8 }}>选择学生：</label>
                <Select
                  style={{ width: '100%' }}
                  placeholder="请选择学生"
                  value={selectedStudent}
                  onChange={setSelectedStudent}
                >
                  {linkedStudents.map((s) => (
                    <Select.Option key={s.studentId} value={s.studentId}>
                      {s.studentName || `学生${s.studentId}`}
                    </Select.Option>
                  ))}
                </Select>
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8 }}>报告类型：</label>
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
            </Col>
          </Row>
          <div style={{ marginTop: 16 }}>
            <Button
              type="primary"
              onClick={handleGenerateReport}
              loading={generating}
              disabled={!selectedStudent}
            >
              生成报告
            </Button>
          </div>
        </Card>
      </div>
    ),
  };

  return (
    <div style={{ padding: 24 }}>
      <Card
        title="家长监管报告"
        extra={
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            size="small"
            items={[{ key: 'list', label: '报告列表' }, { key: 'generate', label: '生成报告' }]}
            style={{ marginBottom: 0 }}
          />
        }
      >
        <Tabs activeKey={activeTab} items={[listTab, generateTab]} />
      </Card>
    </div>
  );
}