import { useEffect, useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Card, Row, Col } from 'antd';
import { UserOutlined, LogoutOutlined, BookOutlined, TeamOutlined, BellOutlined } from '@ant-design/icons';
import { history } from '@umijs/max';
import type { MenuProps } from 'antd';
import { getUserDetail, getNotices, getClasses } from '@/services/api';
import type { User, Notice, ClassEntity } from '@/services/types';
import './index.less';

const { Header, Content, Footer } = Layout;

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [classes, setClasses] = useState<ClassEntity[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        history.push('/login');
        return;
      }

      const [userRes, noticesRes, classesRes] = await Promise.all([
        getUserDetail(),
        getNotices(),
        getClasses(),
      ]);

      if (userRes.status === 200) setUser(userRes.result);
      if (noticesRes.status === 200) setNotices(noticesRes.result?.records || []);
      if (classesRes.status === 200) setClasses(classesRes.result?.records || []);
    } catch (e) {
      console.error('加载数据失败', e);
    }
  };

  const userMenuItems: MenuProps['items'] = [
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录' },
  ];

  const handleUserMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      history.push('/login');
    }
  };

  return (
    <Layout className="home-page">
      <Header className="header">
        <div className="logo">奇码科技学习平台</div>
        <Menu mode="horizontal" className="nav-menu">
          <Menu.Item key="home" onClick={() => history.push('/')}>首页</Menu.Item>
          <Menu.Item key="class" onClick={() => history.push('/class')}>班级管理</Menu.Item>
          <Menu.Item key="courses" onClick={() => history.push('/courses')}>课程</Menu.Item>
          <Menu.Item key="admin" onClick={() => history.push('/admin')}>管理后台</Menu.Item>
        </Menu>
        <div className="user-info">
          <BellOutlined className="bell-icon" />
          <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }}>
            <Avatar src={user?.avatar} icon={<UserOutlined />} />
          </Dropdown>
          <span className="username">{user?.name || user?.username}</span>
        </div>
      </Header>

      <Content className="content">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Card title="我的班级" extra={<TeamOutlined />}>
              <div className="stat-number">{classes.length}</div>
              <div className="stat-desc">个班级</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card title="Scratch项目" extra={<BookOutlined />}>
              <div className="stat-number">0</div>
              <div className="stat-desc">个作品</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card title="通知" extra={<BellOutlined />}>
              <div className="stat-number">{notices.length}</div>
              <div className="stat-desc">条新通知</div>
            </Card>
          </Col>
        </Row>
      </Content>

      <Footer className="footer">
        © 2024 奇码科技学习平台
      </Footer>
    </Layout>
  );
}