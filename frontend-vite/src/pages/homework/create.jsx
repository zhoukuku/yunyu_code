import { useState } from 'react';
import { Card, Form, Input, InputNumber, DatePicker, Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { createHomework } from '../../services/api';
import { safeGetJSON } from '../../utils/storage';

const { TextArea } = Input;

export default function CreateHomeworkPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const user = safeGetJSON('user', {});
      const data = {
        ...values,
        teacherId: user.id,
        teacherName: user.name || user.nickname || user.username,
        dueDate: values.dueDate ? values.dueDate.format('YYYY-MM-DD HH:mm:ss') : null,
        status: 1,
      };

      const res = await createHomework(data);
      if (res.status === 200) {
        message.success('创建成功');
        navigate('/homework');
      }
    } catch (err) {
      console.error(err);
      message.error('创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Card title="创建作业">
        <Form form={form} layout="vertical" initialValues={{ status: 1, totalScore: 100 }}>
          <Form.Item name="title" label="作业标题" rules={[{ required: true, message: '请输入作业标题' }]}>
            <Input placeholder="请输入作业标题" />
          </Form.Item>

          <Form.Item name="description" label="作业描述">
            <TextArea rows={4} placeholder="请输入作业描述" />
          </Form.Item>

          <Form.Item name="courseId" label="关联课程ID">
            <InputNumber style={{ width: '100%' }} placeholder="请输入课程ID" />
          </Form.Item>

          <Form.Item name="classId" label="关联班级ID">
            <InputNumber style={{ width: '100%' }} placeholder="请输入班级ID" />
          </Form.Item>

          <Form.Item name="dueDate" label="截止日期">
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="totalScore" label="总分">
            <InputNumber min={1} max={1000} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="status" label="状态">
            <InputNumber min={0} max={1} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" onClick={handleSubmit} loading={loading}>
                创建
              </Button>
              <Button onClick={() => navigate('/homework')}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
