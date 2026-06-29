import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Avatar } from 'antd';
import { UserOutlined, TeamOutlined, BookOutlined, BellOutlined } from '@ant-design/icons';
import { getUserDetail, getClasses, getNotices } from '@/services/api';
import type { User, ClassEntity, Notice } from '@/services/types';
import './index.less';

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [userRes, classesRes, noticesRes] = await Promise.all([getUserDetail(), getClasses(), getNotices()]);
      if (userRes.status === 200) setUser(userRes.result);
      if (classesRes.status === 200) setClasses(classesRes.result?.records || []);
      if (noticesRes.status === 200) setNotices(noticesRes.result?.records || []);
    } catch (e) { console.error('加载失败', e); }
  };

  const classColumns = [
    { title: '班级名称', dataIndex: 'className', key: 'className' },
    { title: '最近课程', dataIndex: 'lastCourseName', key: 'lastCourseName' },
    { title: '学生数', dataIndex: 'studentNum', key: 'studentNum', render: (n: number) => `${n}人` },
    { title: '状态', dataIndex: 'isEnd', key: 'isEnd', render: (v: number) => <Tag color={v?'red':'green'}>{v?'已结束':'进行中'}</Tag> },
  ];

  return (
    <div className="admin-page">
      <Card title="管理后台">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}><Card><Statistic title="用户总数" value={1} prefix={<UserOutlined />} /></Card></Col>
          <Col xs={24} sm={12} md={6}><Card><Statistic title="班级总数" value={classes.length} prefix={<TeamOutlined />} /></Card></Col>
          <Col xs={24} sm={12} md={6}><Card><Statistic title="课程总数" value={4} prefix={<BookOutlined />} /></Card></Col>
          <Col xs={24} sm={12} md={6}><Card><Statistic title="通知总数" value={notices.length} prefix={<BellOutlined />} /></Card></Col>
        </Row>
        <Row gutter={[16, 16]} style={{marginTop:24}}>
          <Col xs={24} md={12}><Card title="班级管理"><Table columns={classColumns} dataSource={classes} rowKey="id" size="small" pagination={{pageSize:5}} /></Card></Col>
          <Col xs={24} md={12}><Card title="最新通知">{notices.map(n => <div key={n.id} className="notice-item"><Avatar size="small" icon={<BellOutlined />} /><span className="notice-title">{n.title}</span><Tag color="blue">{n.noticeType}</Tag></div>)}</Card></Col>
        </Row>
      </Card>
    </div>
  );
}