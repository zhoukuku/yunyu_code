import { useEffect, useState, useCallback } from 'react';
import { Card, Descriptions, Button, Space, Tag, Modal, Form, Input, message, Spin, Select, Tabs, Divider } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { getHomework, submitHomework, getMySubmissions } from '../../services/api';
import { safeGetJSON } from '../../utils/storage';

const { TextArea } = Input;

export default function HomeworkDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [homework, setHomework] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState('python');
  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [hwRes, subRes] = await Promise.all([
        getHomework(id),
        getMySubmissions({ studentId: safeGetJSON('user', {})?.id || 0 }),
      ]);

      if (hwRes.status === 200) {
        setHomework(hwRes.result);
      }

      if (subRes.status === 200) {
        const mySub = (subRes.result?.records || []).find(s => s.homeworkId === parseInt(id));
        setSubmission(mySub);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const res = await submitHomework(id, {
        content: values.content,
        studentId: safeGetJSON('user', {})?.id,
      });
      if (res.status === 200) {
        message.success('提交成功');
        setShowSubmitModal(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
      message.error('提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}><Spin size="large" /></div>;
  }

  if (!homework) {
    return <div style={{ padding: 24 }}>作业不存在</div>;
  }

  const isOverdue = homework.dueDate && new Date(homework.dueDate) < new Date();
  const isSubmitted = submission?.status >= 1;

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={homework.title}
        extra={
          <Space>
            <Tag color={homework.status === 1 ? 'green' : 'red'}>
              {homework.status === 1 ? '进行中' : '已归档'}
            </Tag>
            {isOverdue && <Tag color="red">已截止</Tag>}
          </Space>
        }
      >
        <Descriptions column={2}>
          <Descriptions.Item label="课程">{homework.courseId || '-'}</Descriptions.Item>
          <Descriptions.Item label="班级">{homework.classId || '-'}</Descriptions.Item>
          <Descriptions.Item label="教师">{homework.teacherName || '-'}</Descriptions.Item>
          <Descriptions.Item label="总分">{homework.totalScore}</Descriptions.Item>
          <Descriptions.Item label="截止日期">
            {homework.dueDate ? new Date(homework.dueDate).toLocaleString() : '未设置'}
          </Descriptions.Item>
          <Descriptions.Item label="提交状态">
            {isSubmitted ? (
              <Tag color="green">已提交</Tag>
            ) : (
              <Tag color="orange">未提交</Tag>
            )}
          </Descriptions.Item>
        </Descriptions>

        <div style={{ marginTop: 24 }}>
          <h4>作业描述</h4>
          <div style={{ padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
            {homework.description || '暂无描述'}
          </div>
        </div>

        {submission && (
          <div style={{ marginTop: 24 }}>
            <h4>我的提交</h4>
            <Card size="small">
              <Tabs defaultActiveKey="content" items={[
                { key: 'content', label: '提交内容', children: (
                  <div>
                    <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, maxHeight: 300, overflow: 'auto' }}>
                      {submission.content || '暂无内容'}
                    </pre>
                    {submission.codeLanguage && (
                      <Tag color="blue" style={{ marginTop: 8 }}>语言: {submission.codeLanguage}</Tag>
                    )}
                  </div>
                )},
                ...(submission.codeContent ? [{ key: 'code', label: '代码', children: (
                  <div style={{ background: '#1e1e1e', color: '#d4d4d4', padding: 12, borderRadius: 4, fontFamily: 'Consolas, Monaco, monospace', fontSize: 12, maxHeight: 300, overflow: 'auto' }}>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{submission.codeContent}</pre>
                  </div>
                )}] : []),
              ]} />
              <Divider style={{ margin: '12px 0' }} />
              <Descriptions column={2} size="small">
                <Descriptions.Item label="提交时间">
                  {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={submission.status === 2 ? 'green' : submission.status === 1 ? 'blue' : 'default'}>
                    {submission.status === 2 ? '已评分' : submission.status === 1 ? '已提交' : '未提交'}
                  </Tag>
                </Descriptions.Item>
                {submission.status === 2 && (
                  <>
                    <Descriptions.Item label="成绩">{submission.score}</Descriptions.Item>
                    <Descriptions.Item label="教师反馈">{submission.feedback || '-'}</Descriptions.Item>
                  </>
                )}
              </Descriptions>
            </Card>
          </div>
        )}

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          {!isOverdue && !isSubmitted && (
            <Button type="primary" onClick={() => setShowSubmitModal(true)}>
              提交作业
            </Button>
          )}
          {!isOverdue && isSubmitted && (
            <Button type="primary" onClick={() => setShowSubmitModal(true)}>
              重新提交
            </Button>
          )}
          <Button style={{ marginLeft: 8 }} onClick={() => navigate('/homework')}>
            返回
          </Button>
        </div>
      </Card>

      <Modal
        title="提交作业"
        open={showSubmitModal}
        onOk={handleSubmit}
        onCancel={() => setShowSubmitModal(false)}
        confirmLoading={submitting}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="代码语言" name="codeLanguage" initialValue="python">
            <Select
              options={[
                { value: 'python', label: 'Python' },
                { value: 'cpp', label: 'C++' },
                { value: 'scratch', label: 'Scratch' },
                { value: 'text', label: '纯文本' },
              ]}
              onChange={(value) => setCodeLanguage(value)}
              style={{ width: 150 }}
            />
          </Form.Item>
          <Form.Item
            name="content"
            label="作业内容/答案"
            rules={[{ required: true, message: '请输入作业内容' }]}
          >
            <TextArea rows={4} placeholder="请输入作业内容或答案说明" />
          </Form.Item>
          {codeLanguage !== 'text' && (
            <Form.Item
              name="codeContent"
              label={`${codeLanguage === 'python' ? 'Python' : codeLanguage === 'cpp' ? 'C++' : 'Scratch'} 代码`}
            >
              <Input.TextArea
                rows={10}
                placeholder={`请输入 ${codeLanguage === 'python' ? 'Python' : codeLanguage === 'cpp' ? 'C++' : 'Scratch'} 代码`}
                style={{
                  fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                  background: '#1e1e1e',
                  color: '#d4d4d4',
                }}
              />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
}
