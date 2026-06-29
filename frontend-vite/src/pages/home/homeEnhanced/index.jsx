import { useEffect, useState, useRef } from 'react';
import { Row, Col, Card, Button, Tag, Avatar, Progress, Input, Dropdown, Badge } from 'antd';
import {
  TeamOutlined, TrophyOutlined, RocketOutlined, PlayCircleOutlined,
  BellOutlined, ClockCircleOutlined, FireOutlined, RightOutlined,
  SearchOutlined, MenuOutlined, UserOutlined, SettingOutlined, LogoutOutlined,
  GlobalOutlined, TrophyTwoTone, FireTwoTone, RocketTwoTone
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getUserDetail, getNotices, getClasses } from '../../services/api';
import './homeEnhanced.css';

// 骨架屏组件
const SkeletonBox = ({ width = '100%', height = 20, radius = 8, style = {} }) => (
  <div
    className="skeleton-box"
    style={{
      width,
      height,
      borderRadius: radius,
      ...style
    }}
  />
);

const SkeletonCard = () => (
  <div className="skeleton-card">
    <SkeletonBox height={140} radius={0} />
    <div className="skeleton-card-content">
      <SkeletonBox width={64} height={64} radius={16} />
      <SkeletonBox width="60%" height={20} />
      <SkeletonBox width="40%" height={14} />
      <div className="skeleton-card-footer">
        <SkeletonBox width="30%" height={14} />
        <SkeletonBox width={20} height={20} radius="50%" />
      </div>
    </div>
  </div>
);

const SkeletonClassItem = () => (
  <div className="skeleton-class-item">
    <SkeletonBox width={48} height={48} radius={12} />
    <div className="skeleton-class-info">
      <SkeletonBox width="50%" height={16} />
      <SkeletonBox width="70%" height={12} style={{ marginTop: 6 }} />
    </div>
    <SkeletonBox width={120} height={8} radius={4} />
  </div>
);

const SkeletonNoticeItem = () => (
  <div className="skeleton-notice-item">
    <SkeletonBox width={50} height={22} radius={6} />
    <div className="skeleton-notice-content">
      <SkeletonBox width="80%" height={14} />
      <SkeletonBox width="40%" height={12} style={{ marginTop: 4 }} />
    </div>
  </div>
);

export default function HomeEnhanced() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [notices, setNotices] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [skeletonLoading, setSkeletonLoading] = useState(true);
  const pageRef = useRef(null);

  // 视差滚动状态
  const [scrollY, setScrollY] = useState(0);
  const [welcomeOpacity, setWelcomeOpacity] = useState(1);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    // 骨架屏预加载
    setTimeout(() => {
      setSkeletonLoading(false);
    }, 800);

    Promise.all([getUserDetail(), getNotices(), getClasses()])
      .then(([u, n, c]) => {
        if (u.status === 200) setUser(u.result);
        if (n.status === 200) setNotices(n.result?.records || []);
        if (c.status === 200) setClasses(c.result?.records || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // 视差滚动效果
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setScrollY(scrollTop);

      // 欢迎区域透明度随滚动变化
      const welcomeSection = document.querySelector('.welcome-section');
      if (welcomeSection) {
        const rect = welcomeSection.getBoundingClientRect();
        const opacity = Math.max(0, 1 - Math.abs(rect.bottom) / 500);
        setWelcomeOpacity(opacity);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 入口卡片数据
  const entryCards = [
    {
      key: 'scratch',
      icon: <RocketTwoTone twoToneColor="#667eea" />,
      title: '图形化编程',
      subtitle: 'Scratch创意编程',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      glowGradient: 'radial-gradient(circle at 50% 0%, rgba(102, 126, 234, 0.3) 0%, transparent 70%)',
      path: '/create/scratch',
      color: '#667eea',
    },
    {
      key: 'competition',
      icon: <TrophyTwoTone twoToneColor="#11998e" />,
      title: '评测练习',
      subtitle: 'Python/C++评测',
      gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      glowGradient: 'radial-gradient(circle at 50% 0%, rgba(17, 153, 142, 0.3) 0%, transparent 70%)',
      path: '/competition',
      color: '#11998e',
    },
    {
      key: 'typing',
      icon: <FireTwoTone twoToneColor="#fc4a1a" />,
      title: '打字练习',
      subtitle: '提升打字速度',
      gradient: 'linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%)',
      glowGradient: 'radial-gradient(circle at 50% 0%, rgba(252, 74, 26, 0.3) 0%, transparent 70%)',
      path: '/',
      color: '#fc4a1a',
    },
  ];

  // 用户菜单
  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: '个人中心' },
    { key: 'settings', icon: <SettingOutlined />, label: '设置' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
  ];

  // 统计数据
  const statsData = [
    { label: '我的班级', value: classes.length, color: '#667eea' },
    { label: '通知', value: notices.length, color: '#ff7a45' },
    { label: '学习中', value: classes.filter(c => c.hadCourseNum > 0 && c.hadCourseNum < c.totalCourseNum).length || 0, color: '#52c41a' },
  ];

  return (
    <div className="home-page-enhanced" ref={pageRef}>
      {/* 动态渐变背景 */}
      <div className="animated-gradient-bg">
        <div className="gradient-orb gradient-orb-1" style={{ transform: `translateY(${scrollY * 0.3}px)` }} />
        <div className="gradient-orb gradient-orb-2" style={{ transform: `translateY(${scrollY * 0.15}px)` }} />
        <div className="gradient-orb gradient-orb-3" style={{ transform: `translateY(${scrollY * 0.2}px)` }} />
      </div>

      {/* 顶部导航栏 */}
      <header className="home-navbar-enhanced">
        <div className="navbar-content">
          <div className="navbar-left">
            <div className="logo">
              <GlobalOutlined className="logo-icon" />
              <span className="logo-text">编程学堂</span>
            </div>
            <nav className="nav-links">
              <a className="nav-link active" onClick={() => navigate('/')}>首页</a>
              <a className="nav-link" onClick={() => navigate('/create/scratch')}>课程</a>
              <a className="nav-link" onClick={() => navigate('/competition')}>评测</a>
            </nav>
          </div>
          <div className="navbar-right">
            <Input
              className="nav-search"
              placeholder="搜索课程..."
              prefix={<SearchOutlined style={{ color: '#999' }} />}
              style={{ borderRadius: 20 }}
            />
            <Badge count={notices.length} size="small" offset={[-2, 2]}>
              <Button
                type="text"
                className="nav-icon-btn"
                icon={<BellOutlined style={{ fontSize: 20 }} />}
              />
            </Badge>
            <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
              <div className="user-menu">
                {skeletonLoading ? (
                  <div className="skeleton-avatar" />
                ) : (
                  <Avatar
                    size={36}
                    src={user?.avatar}
                    icon={<UserOutlined />}
                    className="user-avatar"
                  />
                )}
                <div className="user-info">
                  <span className="user-name">{user?.name || user?.username || '同学'}</span>
                  <span className="user-role">学生</span>
                </div>
              </div>
            </Dropdown>
          </div>
        </div>
      </header>

      {/* 视差滚动欢迎区域 */}
      <section className="welcome-section-parallax" style={{ opacity: welcomeOpacity }}>
        <div className="parallax-layer layer-bg" style={{ transform: `translateY(${scrollY * 0.1}px)` }} />
        <div className="parallax-layer layer-orb1" style={{ transform: `translateY(${scrollY * 0.2}px)` }} />
        <div className="parallax-layer layer-orb2" style={{ transform: `translateY(${scrollY * 0.25}px)` }} />
        <div className="parallax-layer layer-orb3" style={{ transform: `translateY(${scrollY * 0.15}px)` }} />

        <div className="welcome-content">
          <Row gutter={24} align="middle">
            <Col xs={24} md={16}>
              <div className="welcome-info fade-in">
                {skeletonLoading ? (
                  <div className="skeleton-welcome">
                    <SkeletonBox width={80} height={80} radius="50%" />
                    <div className="skeleton-welcome-text">
                      <SkeletonBox width={280} height={32} style={{ marginBottom: 12 }} />
                      <SkeletonBox width={200} height={18} style={{ marginBottom: 16 }} />
                      <div className="skeleton-tags">
                        <SkeletonBox width={80} height={26} radius={13} />
                        <SkeletonBox width={100} height={26} radius={13} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <Avatar
                      size={80}
                      src={user?.avatar}
                      icon={<UserOutlined />}
                      className="welcome-avatar"
                    />
                    <div className="welcome-text">
                      <h1 className="welcome-title">
                        你好，<span className="highlight">{user?.name || user?.username || '同学'}</span>！
                      </h1>
                      <p className="welcome-subtitle">继续保持好奇心，探索编程的无限可能</p>
                      <div className="welcome-tags">
                        <Tag className="welcome-tag" color="purple">
                          <RocketOutlined /> 学习中
                        </Tag>
                        <Tag className="welcome-tag" color="cyan">
                          <FireOutlined /> 持续进步
                        </Tag>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div className="stats-container fade-in" style={{ animationDelay: '0.1s' }}>
                {skeletonLoading ? (
                  <div className="skeleton-stats">
                    <SkeletonBox width={100} height={80} radius={16} />
                    <SkeletonBox width={100} height={80} radius={16} />
                    <SkeletonBox width={100} height={80} radius={16} />
                  </div>
                ) : (
                  statsData.map((stat, index) => (
                    <div key={index} className="stat-card" style={{ '--accent-color': stat.color }}>
                      <span className="stat-value">{stat.value}</span>
                      <span className="stat-label">{stat.label}</span>
                    </div>
                  ))
                )}
              </div>
            </Col>
          </Row>
        </div>
      </section>

      {/* 内容区域 */}
      <main className="main-content-enhanced">
        {/* 快速入口卡片 - 悬浮动画 */}
        <section className="section fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="section-header">
            <h2 className="section-title">快速入口</h2>
            <p className="section-desc">选择你感兴趣的学习方向</p>
          </div>
          <Row gutter={[24, 24]}>
            {skeletonLoading ? (
              <>
                <Col xs={24} sm={8}>
                  <SkeletonCard />
                </Col>
                <Col xs={24} sm={8}>
                  <SkeletonCard />
                </Col>
                <Col xs={24} sm={8}>
                  <SkeletonCard />
                </Col>
              </>
            ) : (
              entryCards.map((card, index) => (
                <Col xs={24} sm={8} key={card.key}>
                  <Card
                    hoverable
                    onClick={() => navigate(card.path)}
                    className="entry-card-enhanced"
                    style={{
                      '--card-color': card.color,
                      '--card-glow': card.glowGradient,
                      animationDelay: `${0.1 * index}s`
                    }}
                  >
                    <div className="entry-card-glow" />
                    <div className="entry-card-bg" style={{ background: card.gradient }} />
                    <div className="entry-card-content">
                      <div className="entry-icon" style={{ background: `${card.color}15` }}>
                        <span style={{ fontSize: 32, color: card.color }}>{card.icon}</span>
                      </div>
                      <h3 className="entry-title">{card.title}</h3>
                      <p className="entry-subtitle">{card.subtitle}</p>
                      <div className="entry-footer">
                        <span>点击进入</span>
                        <RightOutlined />
                      </div>
                    </div>
                  </Card>
                </Col>
              ))
            )}
          </Row>
        </section>

        {/* 班级列表与通知 */}
        <section className="section fade-in" style={{ animationDelay: '0.3s' }}>
          <Row gutter={[24, 24]}>
            {/* 班级列表 */}
            <Col xs={24} lg={16}>
              <Card className="content-card class-card">
                <div className="card-header">
                  <div className="card-title">
                    <TeamOutlined className="card-icon" style={{ color: '#667eea' }} />
                    <span>我的班级</span>
                  </div>
                  <Button
                    type="link"
                    onClick={() => navigate('/teaching')}
                    className="card-more"
                  >
                    查看全部 <RightOutlined style={{ fontSize: 10 }} />
                  </Button>
                </div>
                <div className="card-body">
                  {skeletonLoading ? (
                    <div className="skeleton-list">
                      <SkeletonClassItem />
                      <SkeletonClassItem />
                      <SkeletonClassItem />
                    </div>
                  ) : loading ? (
                    <div className="empty-state">
                      <div className="loading-spinner" />
                      <span>加载中...</span>
                    </div>
                  ) : classes.length === 0 ? (
                    <div className="empty-state">
                      <TeamOutlined className="empty-icon" />
                      <p>暂无班级</p>
                    </div>
                  ) : (
                    <div className="class-list">
                      {classes.slice(0, 4).map((c, index) => {
                        const progress = c.totalCourseNum > 0 ? Math.round((c.hadCourseNum / c.totalCourseNum) * 100) : 0;
                        return (
                          <div
                            key={c.id}
                            className="class-item-enhanced slide-in"
                            style={{ animationDelay: `${0.1 * index}s` }}
                            onClick={() => navigate('/teaching')}
                          >
                            <div className="class-avatar" style={{ background: entryCards[index % 3].gradient }}>
                              {c.className?.charAt(0) || '班'}
                            </div>
                            <div className="class-info">
                              <h4 className="class-name">{c.className}</h4>
                              <p className="class-course">
                                <ClockCircleOutlined /> {c.lastCourseName || '暂无课程'}
                              </p>
                            </div>
                            <div className="class-progress">
                              <Progress
                                percent={progress}
                                size="small"
                                strokeColor={{ '0%': '#667eea', '100%': '#764ba2' }}
                                trailColor="#f0f0f0"
                                format={() => `${c.hadCourseNum || 0}/${c.totalCourseNum || 0}`}
                              />
                            </div>
                            <Button
                              type="primary"
                              shape="round"
                              icon={<PlayCircleOutlined />}
                              className="enter-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate('/create/scratch');
                              }}
                            >
                              进入
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </Card>
            </Col>

            {/* 通知公告 */}
            <Col xs={24} lg={8}>
              <Card className="content-card notice-card">
                <div className="card-header">
                  <div className="card-title">
                    <BellOutlined className="card-icon" style={{ color: '#ff7a45' }} />
                    <span>通知公告</span>
                  </div>
                  <Badge count={notices.length} />
                </div>
                <div className="card-body">
                  {skeletonLoading ? (
                    <div className="skeleton-list">
                      <SkeletonNoticeItem />
                      <SkeletonNoticeItem />
                      <SkeletonNoticeItem />
                      <SkeletonNoticeItem />
                    </div>
                  ) : notices.length === 0 ? (
                    <div className="empty-state">
                      <BellOutlined className="empty-icon" />
                      <p>暂无通知</p>
                    </div>
                  ) : (
                    <div className="notice-list">
                      {notices.slice(0, 5).map((n, index) => (
                        <div
                          key={n.id}
                          className="notice-item-enhanced slide-in"
                          style={{ animationDelay: `${0.1 * index}s` }}
                        >
                          <Tag
                            className="notice-tag"
                            color={n.noticeType === '课程' ? 'blue' : n.noticeType === '紧急' ? 'red' : 'green'}
                          >
                            {n.noticeType || '公告'}
                          </Tag>
                          <div className="notice-content">
                            <span className="notice-title">{n.title}</span>
                            <span className="notice-time">{n.createTime?.slice(0, 10) || ''}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </Col>
          </Row>
        </section>
      </main>

      {/* 响应式移动端菜单按钮 */}
      <Button
        className="mobile-menu-btn"
        type="text"
        icon={<MenuOutlined style={{ fontSize: 24 }} />}
      />
    </div>
  );
}