import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Avatar, Button, Alert, Skeleton, Empty } from 'antd';
import { UserOutlined, TeamOutlined, BookOutlined, BellOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getClasses, getNotices, getAdminUsers, getAdminCourses } from '../../services/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [notices, setNotices] = useState([]);
  const [classCount, setClassCount] = useState(0);
  const [noticeCount, setNoticeCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [courseCount, setCourseCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([
      getClasses().catch(() => ({ status: 400, result: { records: [], total: 0 } })),
      getNotices().catch(() => ({ status: 400, result: { records: [], total: 0 } })),
      getAdminUsers(1, 1).catch(() => ({ status: 400, result: { total: 0 } })),
      getAdminCourses(null, {}).catch(() => ({ status: 400, result: { records: [], total: 0 } })),
    ]).then(([c, n, u, cs]) => {
      const hasError = [c, n, u, cs].every(r => r.status !== 200);
      if (hasError) {
        setError('数据加载失败，请检查网络连接后刷新重试');
      } else {
        if (c.status === 200) {
          setClasses((c.result?.records || []).slice(0, 5));
          setClassCount(c.result?.total || 0);
        }
        if (n.status === 200) {
          setNotices((n.result?.records || []).slice(0, 5));
          setNoticeCount(n.result?.total || 0);
        }
        if (u.status === 200) setUserCount(u.result?.total || 0);
        if (cs.status === 200) setCourseCount(cs.result?.total || 0);
      }
    }).catch((e) => {
      console.error(e);
      setError('数据加载异常，请刷新重试');
    }).finally(() => setLoading(false));
  }, []);

  const classColumns = [
    { title: '班级名称', dataIndex: 'className' },
    { title: '学生数', dataIndex: 'studentNum', render: n => `${n || 0}人` },
    { title: '状态', dataIndex: 'isEnd', render: v => <Tag color={v ? 'red' : 'green'}>{v ? '已结束' : '进行中'}</Tag> },
  ];

  if (loading) {
    return (
      <>
        <Row gutter={[16, 16]}>
          {[1, 2, 3, 4].map(i => (
            <Col xs={24} sm={12} md={6} key={i}>
              <Card><Skeleton active paragraph={{ rows: 1 }} /></Card>
            </Col>
          ))}
        </Row>
        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          <Col xs={24} md={12}><Card title="班级管理"><Skeleton active paragraph={{ rows: 5 }} /></Card></Col>
          <Col xs={24} md={12}><Card title="最新通知"><Skeleton active paragraph={{ rows: 5 }} /></Card></Col>
        </Row>
      </>
    );
  }

  if (error) {
    return <Alert type="error" message="加载失败" description={error} showIcon style={{ marginBottom: 16 }} />;
  }

  return (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}><Card><Statistic title="用户总数" value={userCount} prefix={<UserOutlined />} /></Card></Col>
        <Col xs={24} sm={12} md={6}><Card><Statistic title="班级总数" value={classCount} prefix={<TeamOutlined />} /></Card></Col>
        <Col xs={24} sm={12} md={6}><Card><Statistic title="课程总数" value={courseCount} prefix={<BookOutlined />} /></Card></Col>
        <Col xs={24} sm={12} md={6}><Card><Statistic title="通知总数" value={noticeCount} prefix={<BellOutlined />} /></Card></Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} md={12}>
          <Card
            title="班级管理"
            extra={<Button type="link" onClick={() => navigate('/class')}>更多</Button>}
          >
            {classes.length > 0 ? (
              <Table columns={classColumns} dataSource={classes} rowKey="id" size="small" pagination={false} />
            ) : (
              <Empty description="暂无班级数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card
            title="最新通知"
            extra={<Button type="link" onClick={() => navigate('/admin/notices')}>更多</Button>}
          >
            {notices.length > 0 ? (
              notices.map(n => (
                <div key={n.id} style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar size="small" icon={<BellOutlined />} />
                  <span style={{ flex: 1 }}>{n.title}</span>
                  <Tag color="blue">{n.noticeType}</Tag>
                </div>
              ))
            ) : (
              <Empty description="暂无通知" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>
      </Row>
    </>
  );
}
