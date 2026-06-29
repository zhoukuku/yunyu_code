import { useEffect, useState } from 'react';
import { Card, Tabs, List, Tag, Button, Table, Modal, Form, Input, Select, message, Space, Statistic, Row, Col } from 'antd';
import { BookOutlined, FileTextOutlined, TrophyOutlined, CodeOutlined, DeleteOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import {
  getCompetitionEvaluations,
  getCompetitionSubmissions,
  submitCompetitionCode,
  deleteCompetitionSubmission,
  getCompetitionStats,
  getCompetitionEvaluationStats,
  getProblems,
} from '../../services/api';

const { TabPane } = Tabs;
const { TextArea } = Input;
const { Option } = Select;

const STATUS_MAP = {
  0: { text: '待评测', color: 'default' },
  1: { text: '评测中', color: 'processing' },
  2: { text: '通过', color: 'success' },
  3: { text: '答案错误', color: 'error' },
  4: { text: '超时', color: 'warning' },
  5: { text: '内存超限', color: 'warning' },
  6: { text: '编译错误', color: 'error' },
  7: { text: '运行时错误', color: 'error' },
  8: { text: '系统错误', color: 'error' },
};

const SUBMISSION_STATUS_MAP = {
  0: { text: '待评测', color: 'default' },
  1: { text: '通过', color: 'success' },
  2: { text: '未通过', color: 'error' },
};

export default function CompetitionPage() {
  const { tab } = useParams();
  const [activeTab, setActiveTab] = useState(tab || 'info');
  const [user, setUser] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState({ total: 0, accepted: 0, pending: 0, rejectRate: 0 });
  const [loading, setLoading] = useState(false);
  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [submitForm] = Form.useForm();
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [problems, setProblems] = useState([]);
  const [codeViewModalVisible, setCodeViewModalVisible] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  // Mock data for news
  const news = [
    { id: 1, title: '2026年青少年编程能力竞赛报名开启', date: '2026-06-01', summary: '为培养青少年创新思维...' },
    { id: 2, title: 'Scratch等级考试报名通知', date: '2026-05-15', summary: 'Scratch等级考试即将开始...' },
  ];

  // Mock problems for OJ - now fetched from API

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) setUser(JSON.parse(userStr));
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchSubmissions();
      fetchStats();
    }
  }, [user]);

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    setLoading(true);
    try {
      const res = await getProblems({ competitionId: 1 });
      if (res.status === 200) {
        setProblems(res.result?.records || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewCode = (record) => {
    setSelectedSubmission(record);
    setCodeViewModalVisible(true);
  };

  const fetchEvaluations = async (competitionId) => {
    setLoading(true);
    try {
      const res = await getCompetitionEvaluations({ competitionId });
      if (res.status === 200) {
        setEvaluations(res.result?.records || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await getCompetitionSubmissions({ userId: user.id });
      if (res.status === 200) {
        setSubmissions(res.result?.records || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    // Using competitionId 1 as default
    try {
      const res = await getCompetitionStats(1);
      if (res.status === 200 && res.result) {
        setStats({
          total: res.result.total || 0,
          accepted: res.result.accepted || 0,
          pending: res.result.pending || 0,
          rejectRate: 100 - (res.result.acceptRate || 0),
        });
      }
    } catch (err) {
      // Use mock data on error
      setStats({ total: 10, accepted: 6, pending: 2, rejectRate: 20 });
    }
  };

  const handleSubmit = async (values) => {
    if (!user?.id) {
      message.error('请先登录');
      return;
    }
    try {
      const res = await submitCompetitionCode({
        competitionId: 1,
        userId: user.id,
        userName: user.name || user.username || 'Anonymous',
        problemId: selectedProblem.id,
        problemTitle: selectedProblem.title,
        submittedCode: values.code,
        language: values.language,
      });
      if (res.status === 200) {
        message.success('提交成功');
        setSubmitModalVisible(false);
        submitForm.resetFields();
        fetchSubmissions();
      }
    } catch (err) {
      message.error('提交失败');
    }
  };

  const handleDelete = async (id) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条提交记录吗？',
      onOk: async () => {
        try {
          const res = await deleteCompetitionSubmission(id);
          if (res.status === 200) {
            message.success('删除成功');
            fetchSubmissions();
          }
        } catch (err) {
          message.error('删除失败');
        }
      },
    });
  };

  const submissionColumns = [
    {
      title: '题目',
      dataIndex: 'problemTitle',
      key: 'problemTitle',
      render: (text) => text || '-',
    },
    {
      title: '语言',
      dataIndex: 'language',
      key: 'language',
    },
    {
      title: '得分',
      dataIndex: 'score',
      key: 'score',
      render: (score, record) => `${score || 0} / ${record.maxScore || 100}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const info = SUBMISSION_STATUS_MAP[status] || { text: '未知', color: 'default' };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '提交时间',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (date) => date ? new Date(date).toLocaleString() : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => handleViewCode(record)}>
            查看
          </Button>
          <Button type="link" danger onClick={() => handleDelete(record.id)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* Stats Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="总提交数" value={stats.total} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="通过数" value={stats.accepted} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="待评测" value={stats.pending} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="未通过率" value={stats.rejectRate} suffix="%" valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab={<span><BookOutlined /> 资讯&集训课</span>} key="info">
            <List
              dataSource={news}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    title={<a href="#">{item.title}</a>}
                    description={<><span>{item.date}</span> - <span>{item.summary}</span></>}
                  />
                </List.Item>
              )}
            />
          </TabPane>
          <TabPane tab={<span><FileTextOutlined /> 模考测评</span>} key="exam">
            <List
              dataSource={problems}
              renderItem={item => (
                <List.Item actions={[
                  <Tag color="green">可参加</Tag>,
                  <Button onClick={() => {
                    setSelectedProblem(item);
                    setSubmitModalVisible(true);
                  }}>进入考试</Button>
                ]}>
                  <List.Item.Meta title={item.title} description={<Tag>{item.difficulty}</Tag>} />
                </List.Item>
              )}
            />
          </TabPane>
          <TabPane tab={<span><TrophyOutlined /> OJ评测</span>} key="oj">
            <List
              dataSource={problems}
              renderItem={item => (
                <List.Item actions={[
                  <Button type="primary" icon={<CodeOutlined />} onClick={() => {
                    setSelectedProblem(item);
                    setSubmitModalVisible(true);
                  }}>开始答题</Button>
                ]}>
                  <List.Item.Meta title={item.title} description={<Tag>{item.difficulty}</Tag>} />
                </List.Item>
              )}
            />
          </TabPane>
          <TabPane tab={<span><CodeOutlined /> 我的提交</span>} key="submissions">
            <Table
              columns={submissionColumns}
              dataSource={submissions}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* Submit Modal */}
      <Modal
        title={`提交代码 - ${selectedProblem?.title || ''}`}
        open={submitModalVisible}
        onCancel={() => {
          setSubmitModalVisible(false);
          submitForm.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form form={submitForm} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="language"
            label="编程语言"
            rules={[{ required: true, message: '请选择编程语言' }]}
            initialValue="javascript"
          >
            <Select>
              <Option value="javascript">JavaScript</Option>
              <Option value="python">Python</Option>
              <Option value="java">Java</Option>
              <Option value="cpp">C++</Option>
              <Option value="c">C</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="code"
            label="代码"
            rules={[{ required: true, message: '请输入代码' }]}
          >
            <TextArea rows={15} placeholder="请输入您的代码..." />
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setSubmitModalVisible(false);
                submitForm.resetFields();
              }}>取消</Button>
              <Button type="primary" htmlType="submit">提交</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Code View Modal */}
      <Modal
        title="代码详情"
        open={codeViewModalVisible}
        onCancel={() => {
          setCodeViewModalVisible(false);
          setSelectedSubmission(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setCodeViewModalVisible(false);
            setSelectedSubmission(null);
          }}>
            关闭
          </Button>
        ]}
        width={900}
      >
        {selectedSubmission && (
          <div>
            <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
              <Space>
                <Tag color="blue">{selectedSubmission.language}</Tag>
                <Tag color={SUBMISSION_STATUS_MAP[selectedSubmission.status]?.color || 'default'}>
                  {SUBMISSION_STATUS_MAP[selectedSubmission.status]?.text || '未知'}
                </Tag>
                <span>得分: {selectedSubmission.score || 0} / {selectedSubmission.maxScore || 100}</span>
              </Space>
              <div style={{ color: '#666' }}>
                提交时间: {selectedSubmission.submittedAt ? new Date(selectedSubmission.submittedAt).toLocaleString() : '-'}
              </div>
            </Space>
            <div style={{
              background: '#f5f5f5',
              padding: 16,
              borderRadius: 4,
              fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace',
              fontSize: 13,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              maxHeight: 400,
              overflow: 'auto'
            }}>
              {selectedSubmission.submittedCode || '无代码内容'}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}