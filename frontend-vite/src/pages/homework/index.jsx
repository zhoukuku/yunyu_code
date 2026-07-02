import { useEffect, useState, useCallback } from 'react';
import { Table, Tag, Button, Card, Space, Modal, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { getHomeworks, deleteHomework } from '../../services/api';
import { safeGetJSON, safeGetItem } from '../../utils/storage';

export default function HomeworkPage() {
  const navigate = useNavigate();
  const [homeworks, setHomeworks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  const fetchHomeworks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getHomeworks({});
      if (res.status === 200) {
        setHomeworks(res.result?.records || []);
      }
    } catch (err) {
      console.error('加载作业列表异常:', err);
      message.error('加载作业列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = safeGetItem('accessToken');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }
    const parsedUser = safeGetJSON('user');
    if (parsedUser) setUser(parsedUser);
    fetchHomeworks();
  }, [navigate, fetchHomeworks]);

  const handleDelete = async (id) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个作业吗？',
      onOk: async () => {
        try {
          const res = await deleteHomework(id);
          if (res.status === 200) {
            message.success('删除成功');
            fetchHomeworks();
          } else {
            message.error(res.message || '删除失败');
          }
        } catch (err) {
          console.error('删除作业异常:', err);
          message.error('删除失败');
        }
      },
    });
  };

  const columns = [
    {
      title: '作业标题',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <Button type="link" onClick={() => navigate(`/homework/${record.id}`)}>
          {text}
        </Button>
      ),
    },
    {
      title: '课程',
      dataIndex: 'courseId',
      key: 'courseId',
      render: (id) => id || '-',
    },
    {
      title: '班级',
      dataIndex: 'classId',
      key: 'classId',
      render: (id) => id || '-',
    },
    {
      title: '教师',
      dataIndex: 'teacherName',
      key: 'teacherName',
      render: (name) => name || '-',
    },
    {
      title: '截止日期',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date) => date ? new Date(date).toLocaleDateString() : '未设置',
    },
    {
      title: '总分',
      dataIndex: 'totalScore',
      key: 'totalScore',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 1 ? 'green' : 'red'}>
          {status === 1 ? '进行中' : '已归档'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => navigate(`/homework/${record.id}`)}>
            查看
          </Button>
          {user?.role === 1 && (
            <>
              <Button type="link" onClick={() => navigate(`/homework/${record.id}/submissions`)}>
                查看提交
              </Button>
              <Button type="link" danger onClick={() => handleDelete(record.id)}>
                删除
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        title="作业列表"
        extra={
          user?.role === 1 && (
            <Button type="primary" onClick={() => navigate('/homework/create')}>
              创建作业
            </Button>
          )
        }
      >
        <Table
          columns={columns}
          dataSource={homeworks}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}
