import { useEffect, useState } from 'react';
import { Card, Form, Input, Button, Avatar, Upload, message, Table, Tag, Space } from 'antd';
import { UserOutlined, UploadOutlined, TeamOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { getMyClasses } from '../../services/api';

export default function SettingsPage() {
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  useEffect(() => {
    fetchMyClasses();
  }, []);

  const fetchMyClasses = async () => {
    setLoadingClasses(true);
    try {
      const res = await getMyClasses();
      if (res.status === 200) {
        setClasses(res.result || []);
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    } finally {
      setLoadingClasses(false);
    }
  };

  const classColumns = [
    { title: 'Class Name', dataIndex: 'className' },
    {
      title: 'Teacher ID',
      dataIndex: 'teacherId',
      render: (id) => id || '-',
    },
    { title: 'Students', dataIndex: 'studentNum', render: (n) => `${n}` },
    {
      title: 'Status',
      dataIndex: 'isEnd',
      render: (v) => <Tag color={v ? 'red' : 'green'}>{v ? 'Ended' : 'Active'}</Tag>,
    },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 800 }}>
      <Card title="个人资料">
        <Form layout="vertical">
          <Form.Item label="头像">
            <Avatar size={64} icon={<UserOutlined />} />
            <Upload><Button icon={<UploadOutlined />} style={{ marginLeft: 16 }}>更换头像</Button></Upload>
          </Form.Item>
          <Form.Item label="用户名">
            <Input placeholder="用户名" />
          </Form.Item>
          <Form.Item label="昵称">
            <Input placeholder="昵称" />
          </Form.Item>
          <Form.Item label="手机号">
            <Input placeholder="手机号" disabled />
          </Form.Item>
          <Button type="primary">保存修改</Button>
        </Form>
      </Card>

      <Card
        title={
          <Space>
            <TeamOutlined />
            My Classes
          </Space>
        }
        extra={
          <Button type="primary" size="small">
            <Link to="/class/join">Join Class</Link>
          </Button>
        }
        style={{ marginTop: 16 }}
      >
        <Table
          columns={classColumns}
          dataSource={classes}
          rowKey="id"
          loading={loadingClasses}
          pagination={false}
          locale={{ emptyText: 'No classes joined yet. Click "Join Class" to add one.' }}
        />
      </Card>
    </div>
  );
}