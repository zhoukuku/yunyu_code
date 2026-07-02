import { useEffect, useState, useRef } from 'react';
import { Row, Col, Card, Button, Tag, Avatar, Progress, Badge, Skeleton } from 'antd';
import {
  TeamOutlined, RocketOutlined, PlayCircleOutlined,
  BellOutlined, ClockCircleOutlined, FireOutlined, RightOutlined,
  UserOutlined, TrophyTwoTone, RocketTwoTone, CodeOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getUserDetail, getNotices, getClasses } from '../../services/api';
import { safeGetItem, safeGetJSON } from '../../utils/storage';
import './home.css';

export default function HomePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [notices, setNotices] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [partialErrors, setPartialErrors] = useState([]);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const token = safeGetItem('accessToken');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    // Use allSettled so one failing API doesn't block the others
    Promise.allSettled([
      getUserDetail(),
      getNotices(),
      getClasses(),
    ])
      .then((results) => {
        if (!mountedRef.current) return;

        const errors = [];

        // User detail
        if (results[0].status === 'fulfilled') {
          const u = results[0].value;
          if (u && u.status === 200 && u.result) setUser(u.result);
        } else {
          errors.push('用户信息');
          console.error('Failed to load user detail:', results[0].reason);
        }

        // Notices
        if (results[1].status === 'fulfilled') {
          const n = results[1].value;
          if (n && n.status === 200) setNotices(n.result?.records || []);
        } else {
          errors.push('通知');
          console.error('Failed to load notices:', results[1].reason);
        }

        // Classes
        if (results[2].status === 'fulfilled') {
          const c = results[2].value;
          if (c && c.status === 200) setClasses(c.result?.records || []);
        } else {
          errors.push('班级');
          console.error('Failed to load classes:', results[2].reason);
        }

        if (errors.length > 0 && errors.length < 3) {
          setPartialErrors(errors);
        } else if (errors.length === 3) {
          setError('数据加载失败，请刷新页面重试');
        }
      })
      .catch((err) => {
        if (!mountedRef.current) return;
        console.error('Failed to load home data:', err);
        setError('数据加载失败，请刷新页面重试');
      })
      .finally(() => {
        if (mountedRef.current) setLoading(false);
      });

    return () => { mountedRef.current = false; };
  }, [navigate]);

  // 入口卡片数据
  const entryCards = [
    {
      key: 'scratch',
      icon: <RocketTwoTone twoToneColor="#667eea" />,
      title: '图形化编程',
      subtitle: 'Scratch创意编程',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      path: '/create/scratch',
      color: '#667eea',
    },
    {
      key: 'competition',
      icon: <TrophyTwoTone twoToneColor="#11998e" />,
      title: '评测练习',
      subtitle: 'Python/C++评测',
      gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      path: '/competition',
      color: '#11998e',
    },
    {
      key: 'python',
      icon: <CodeOutlined style={{ fontSize: 32, color: '#11998e' }} />,
      title: 'Python编程',
      subtitle: '专业Python编程环境',
      gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      path: '/create/python',
      color: '#11998e',
    },
  ];

  // 统计数据
  const statsData = [
    { label: '我的班级', value: classes.length, color: '#667eea' },
    { label: '通知', value: notices.length, color: '#ff7a45' },
    {
      label: '学习中',
      value: classes.filter(c => {
        const had = Number(c?.hadCourseNum) || 0;
        const total = Number(c?.totalCourseNum) || 0;
        return had > 0 && had < total;
      }).length,
      color: '#52c41a',
    },
  ];

  return (
    <div className="home-page">
      {/* 顶部欢迎区域 */}
      <section className="welcome-section">
        <div className="welcome-bg">
          <div className="welcome-orb orb-1"></div>
          <div className="welcome-orb orb-2"></div>
          <div className="welcome-orb orb-3"></div>
        </div>
        <div className="welcome-content">
          {loading ? (
            <Row gutter={24} align="middle">
              <Col xs={24} md={16}>
                <div className="welcome-info">
                  <Skeleton.Avatar active size={80} shape="circle" />
                  <div style={{ flex: 1 }}>
                    <Skeleton active title={{ width: '60%' }} paragraph={{ rows: 1, width: '80%' }} />
                  </div>
                </div>
              </Col>
              <Col xs={24} md={8}>
                <div className="stats-container">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="stat-card" style={{ '--accent-color': '#667eea' }}>
                      <Skeleton.Button active size="small" style={{ width: 40, height: 28 }} />
                      <Skeleton.Button active size="small" style={{ width: 60, height: 18, marginTop: 8 }} />
                    </div>
                  ))}
                </div>
              </Col>
            </Row>
          ) : (
            <Row gutter={24} align="middle">
              <Col xs={24} md={16}>
                <div className="welcome-info fade-in">
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
                </div>
              </Col>
              <Col xs={24} md={8}>
                <div className="stats-container fade-in" style={{ animationDelay: '0.1s' }}>
                  {statsData.map((stat, index) => (
                    <div key={index} className="stat-card" style={{ '--accent-color': stat.color }}>
                      <span className="stat-value">{stat.value}</span>
                      <span className="stat-label">{stat.label}</span>
                    </div>
                  ))}
                </div>
              </Col>
            </Row>
          )}
        </div>
      </section>

      {/* 内容区域 */}
      <main className="main-content">
        {/* 错误提示 */}
        {error && (
          <div className="error-banner" style={{
            background: '#fff2f0',
            border: '1px solid #ffccc7',
            borderRadius: 8,
            padding: '12px 20px',
            marginBottom: 24,
            color: '#ff4d4f',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span>{error}</span>
            <Button type="link" size="small" onClick={() => window.location.reload()}>刷新页面</Button>
          </div>
        )}

        {/* 部分加载失败提示 */}
        {partialErrors.length > 0 && (
          <div className="warning-banner" style={{
            background: '#fffbe6',
            border: '1px solid #ffe58f',
            borderRadius: 8,
            padding: '10px 20px',
            marginBottom: 24,
            color: '#d48806',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span>{partialErrors.join('、')}加载失败，其余内容已正常展示</span>
          </div>
        )}

        {/* 快速入口卡片 */}
        <section className="section fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="section-header">
            <h2 className="section-title">快速入口</h2>
            <p className="section-desc">选择你感兴趣的学习方向</p>
          </div>
          <Row gutter={[20, 20]}>
            {entryCards.map((card, index) => (
              <Col xs={24} sm={8} key={card.key}>
                <Card
                  hoverable
                  onClick={() => navigate(card.path)}
                  className="entry-card"
                  style={{ '--card-color': card.color }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                    e.currentTarget.style.boxShadow = `0 20px 40px rgba(0,0,0,0.15)`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
                  }}
                >
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
            ))}
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
                  {loading ? (
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
                            className="class-item slide-in"
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
                  {loading ? (
                    <div className="empty-state">
                      <div className="loading-spinner" />
                      <span>加载中...</span>
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
                          className="notice-item slide-in"
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
    </div>
  );
}
