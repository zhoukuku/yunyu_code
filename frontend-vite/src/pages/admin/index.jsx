import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Avatar, Button, Space } from 'antd';
import { UserOutlined, TeamOutlined, BookOutlined, BellOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getClasses, getNotices, getAdminUsers, getAdminCourses } from '../../services/api';

export default function AdminPage() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [notices, setNotices] = useState([]);
  const [userCount, setUserCount] = useState(0);
  const [courseCount, setCourseCount] = useState(0);

  useEffect(() => {
    Promise.all([
      getClasses().catch(() => ({ status: 400, result: { records: [] } })),
      getNotices().catch(() => ({ status: 400, result: { records: [] } })),
      getAdminUsers(1, 1).catch(() => ({ status: 400, result: { total: 0 } })),
      getAdminCourses(null, {}).catch(() => ({ status: 400, result: { records: [] } })),
    ]).then(([c, n, u, cs]) => {
      if (c.status === 200) setClasses((c.result?.records || []).slice(0, 5));
      if (n.status === 200) setNotices((n.result?.records || []).slice(0, 5));
      if (u.status === 200) setUserCount(u.result?.total || 0);
      if (cs.status === 200) setCourseCount(cs.result?.records?.length || 0);
    }).catch(console.error);
  }, []);

  const classColumns = [
    { title: '班级名称', dataIndex: 'className' },
    { title: '学生数', dataIndex: 'studentNum', render: n => `${n || 0}人` },
    { title: '状态', dataIndex: 'isEnd', render: v => <Tag color={v ? 'red' : 'green'}>{v ? '已结束' : '进行中'}</Tag> },
  ];

  return (
    <Card
      title="管理后台"
      extra={
        <Space>
          <Button onClick={() => navigate('/admin/users')}>用户管理</Button>
          <Button onClick={() => navigate('/admin/courses')}>课程管理</Button>
          <Button onClick={() => navigate('/admin/notices')}>通知管理</Button>
        </Space>
      }
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}><Card><Statistic title="用户总数" value={userCount} prefix={<UserOutlined />} /></Card></Col>
        <Col xs={24} sm={12} md={6}><Card><Statistic title="班级总数" value={classes.length} prefix={<TeamOutlined />} /></Card></Col>
        <Col xs={24} sm={12} md={6}><Card><Statistic title="课程总数" value={courseCount} prefix={<BookOutlined />} /></Card></Col>
        <Col xs={24} sm={12} md={6}><Card><Statistic title="通知总数" value={notices.length} prefix={<BellOutlined />} /></Card></Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} md={12}>
          <Card
            title="班级管理"
            extra={<Button type="link" onClick={() => navigate('/class')}>更多</Button>}
          >
            <Table columns={classColumns} dataSource={classes} rowKey="id" size="small" pagination={false} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card
            title="最新通知"
            extra={<Button type="link" onClick={() => navigate('/admin/notices')}>更多</Button>}
          >
            {notices.map(n => (
              <div key={n.id} style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar size="small" icon={<BellOutlined />} />
                <span style={{ flex: 1 }}>{n.title}</span>
                <Tag color="blue">{n.noticeType}</Tag>
              </div>
            ))}
            {notices.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>暂无通知</div>}
          </Card>
        </Col>
      </Row>
    </Card>
  );
}