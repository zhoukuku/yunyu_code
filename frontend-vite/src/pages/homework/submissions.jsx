import { useEffect, useState } from 'react';
import { Table, Tag, Button, Card, Space, Modal, Form, InputNumber, Input, message, Statistic, Row, Col } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { getHomework, getHomeworkSubmissions, gradeSubmission } from '../../services/api';

const { TextArea } = Input;

export default function HomeworkSubmissionsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [homework, setHomework] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState({ total: 0, submitted: 0, graded: 0, avgScore: 0 });
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [currentSubmission, setCurrentSubmission] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [hwRes, subRes] = await Promise.all([
        getHomework(id),
        getHomeworkSubmissions(id),
      ]);

      if (hwRes.status === 200) {
        setHomework(hwRes.result);
      }

      if (subRes.status === 200) {
        const records = subRes.result?.records || [];
        setSubmissions(records);
        const graded = records.filter(s => s.status === 2);
        setStats({
          total: records.length,
          submitted: records.filter(s => s.status >= 1).length,
          graded: graded.length,
          avgScore: graded.length > 0
            ? graded.reduce((sum, s) => sum + (s.score || 0), 0) / graded.length
            : 0,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGrade = (submission) => {
    setCurrentSubmission(submission);
    form.setFieldsValue({
      score: submission.score || 0,
      feedback: submission.feedback || '',
    });
    setShowGradeModal(true);
  };

  const handleSubmitGrade = async () => {
    try {
      const values = await form.validateFields();
      setGrading(true);
      const res = await gradeSubmission(currentSubmission.id, values);
      if (res.status === 200) {
        message.success('评分成功');
        setShowGradeModal(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
      message.error('评分失败');
    } finally {
      setGrading(false);
    }
  };

  const columns = [
    {
      title: '学生',
      dataIndex: 'studentName',
      key: 'studentName',
      render: (name, record) => name || `学生${record.studentId}`,
    },
    {
      title: '提交内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      render: (text) => text ? (
        <span title={text} style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}>
          {text}
        </span>
      ) : '-',
    },
    {
      title: '代码语言',
      dataIndex: 'codeLanguage',
      key: 'codeLanguage',
      render: (lang) => lang ? <Tag color="blue">{lang.toUpperCase()}</Tag> : '-',
    },
    {
      title: '提交时间',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (date) => date ? new Date(date).toLocaleString() : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const map = { 0: ['default', '未提交'], 1: ['blue', '已提交'], 2: ['green', '已评分'] };
        const [color, text] = map[status] || ['default', '未知'];
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '成绩',
      dataIndex: 'score',
      key: 'score',
      render: (score, record) => record.status === 2 ? (
        <Tag color={score >= 60 ? 'green' : 'red'}>{score}</Tag>
      ) : '-',
    },
    {
      title: '反馈',
      dataIndex: 'feedback',
      key: 'feedback',
      ellipsis: true,
      render: (text) => text || '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            onClick={() => handleGrade(record)}
            disabled={record.status === 2}
          >
            {record.status === 2 ? '已评分' : '评分'}
          </Button>
          {record.codeContent && (
            <Button
              type="link"
              size="small"
              onClick={() => {
                Modal.info({
                  title: '学生代码',
                  content: (
                    <pre style={{
                      background: '#1e1e1e',
                      color: '#d4d4d4',
                      padding: 12,
                      borderRadius: 4,
                      maxHeight: 400,
                      overflow: 'auto',
                      fontFamily: 'Consolas, Monaco, monospace',
                      fontSize: 12,
                    }}>
                      {record.codeContent}
                    </pre>
                  ),
                  width: 700,
                });
              }}
            >
              查看代码
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={`作业提交管理: ${homework?.title || ''}`}
        extra={<Button onClick={() => navigate('/homework')}>返回</Button>}
      >
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card size="small">
              <Statistic title="总提交数" value={stats.total} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="已提交" value={stats.submitted} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="已评分" value={stats.graded} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="平均分" value={stats.avgScore.toFixed(1)} suffix="/ 100" />
            </Card>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={submissions}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="评分"
        open={showGradeModal}
        onOk={handleSubmitGrade}
        onCancel={() => setShowGradeModal(false)}
        confirmLoading={grading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="score"
            label="成绩"
            rules={[{ required: true, message: '请输入成绩' }]}
          >
            <InputNumber min={0} max={homework?.totalScore || 100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="feedback" label="反馈">
            <TextArea rows={4} placeholder="请输入教师反馈" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
