import { useState, useEffect, useRef } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, message, Input, Drawer, Button, Breadcrumb } from 'antd';
import {
  BellOutlined, UserOutlined, LogoutOutlined, HomeOutlined, BookOutlined,
  TeamOutlined, CompassOutlined, TrophyOutlined, RocketOutlined,
  SearchOutlined, FileTextOutlined, FolderOutlined, MenuOutlined, CloseOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUnreadNoticeCount } from '../services/api';
import { safeClear, safeGetJSON } from '../utils/storage';

const { Header: AntHeader } = Layout;

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [searchValue, setSearchValue] = useState('');
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  const [fetchStatus, setFetchStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const lastKnownCount = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    const parsedUser = safeGetJSON('user');
    if (parsedUser) {
      setUser(parsedUser);
      if (parsedUser.id) {
        setFetchStatus('loading');
        const fetchUnreadCount = async (userId, signal) => {
          if (!userId) return;
          try {
            const res = await getUnreadNoticeCount({ signal });
            if (signal?.aborted) return;
            if (res && res.status === 200 && res.result != null) {
              const count = typeof res.result === 'object' ? (res.result.count ?? 0) : (Number.isFinite(res.result) ? res.result : 0);
              setNotificationCount(count);
              lastKnownCount.current = count;
              setFetchStatus('success');
            }
          } catch (error) {
            if (error?.name === 'AbortError' || error?.code === 'ERR_CANCELED') return;
            console.error('Failed to fetch unread count:', error);
            setFetchStatus('error');
            // Keep last known count instead of resetting to 0
            setNotificationCount(lastKnownCount.current);
          }
        };
        fetchUnreadCount(parsedUser.id, controller.signal);
      }
    }
    return () => controller.abort();
  }, [location.pathname]);

  const handleLogout = () => {
    safeClear();
    setMobileMenuVisible(false);
    message.success('已退出登录');
    navigate('/login');
  };

  const handleSearch = (value) => {
    if (value.trim()) {
      navigate(`/search?keyword=${encodeURIComponent(value.trim())}`);
      setSearchValue('');
    }
  };

  const userMenuItems = [
    { key: 'projects/my', icon: <RocketOutlined />, label: '我的作品', onClick: () => navigate('/projects/my') },
    { key: 'favorites', icon: <CompassOutlined />, label: '收藏作品', onClick: () => navigate('/favorites') },
    { key: 'notifications', icon: <BellOutlined />, label: '我的反馈', onClick: () => navigate('/notifications') },
    { key: 'settings', icon: <UserOutlined />, label: '个人资料', onClick: () => navigate('/settings') },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout },
  ];

  const mainMenuItems = [
    { key: '/', icon: <HomeOutlined />, label: '首页' },
    { key: '/course', icon: <BookOutlined />, label: '课程中心' },
    { key: '/teaching', icon: <TeamOutlined />, label: '教学中心' },
    { key: '/community', icon: <CompassOutlined />, label: '创意中心' },
    { key: '/competition', icon: <TrophyOutlined />, label: '考级赛事' },
    { key: '/homework', icon: <FileTextOutlined />, label: '作业' },
    { key: '/materials', icon: <FolderOutlined />, label: '素材中心' },
    { key: '/create', icon: <RocketOutlined />, label: '去创作' },
  ];

  // 计算当前选中的菜单key —— 将路由首段映射到菜单key
  // 例如 /course-detail/123 和 /courses/123/lessons/456 都应高亮 "课程中心" (/course)
  const PATH_TO_MENU_KEY = {
    course: '/course',
    'course-detail': '/course',
    courses: '/course',
    teaching: '/teaching',
    community: '/community',
    competition: '/competition',
    homework: '/homework',
    materials: '/materials',
    create: '/create',
  };
  const firstSegment = location.pathname.split('/')[1] || '';
  const selectedKey = firstSegment ? (PATH_TO_MENU_KEY[firstSegment] || `/${firstSegment}`) : '/';

  // Breadcrumb route mapping
  const getBreadcrumbItems = (pathname) => {
    const items = [{ title: '首页', path: '/' }];
    const segments = pathname.split('/').filter(Boolean);

    if (segments.length === 0) return items;

    const first = segments[0];

    switch (first) {
      case 'course':
        items.push({ title: '课程中心', path: '/course' });
        break;
      case 'course-detail':
        items.push({ title: '课程中心', path: '/course' });
        items.push({ title: '课程详情' });
        break;
      case 'create': {
        const sub = segments[1];
        if (sub === 'scratch') {
          items.push({ title: 'Scratch IDE' });
        } else if (sub === 'python') {
          items.push({ title: 'Python编辑器' });
        } else {
          items.push({ title: '去创作', path: '/create' });
        }
        break;
      }
      case 'settings':
        items.push({ title: '个人设置' });
        break;
      case 'admin':
        items.push({ title: '管理后台' });
        break;
      default:
        break;
    }

    return items;
  };

  const breadcrumbRoute = getBreadcrumbItems(location.pathname);
  const breadcrumbItems = breadcrumbRoute.map((item) => ({
    title: item.path ? <a onClick={() => navigate(item.path)}>{item.title}</a> : item.title,
  }));

  return (
    <>
      <AntHeader
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          background: '#fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          height: 64,
        }}
      >
        {/* Logo区域 */}
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginRight: 24,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
          onClick={() => navigate('/')}
        >
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
            </svg>
          </div>
          云屿学习
        </div>

        {/* 桌面端主导航菜单 */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
          }}
          className="desktop-nav"
        >
          <Menu
            mode="horizontal"
            selectedKeys={[selectedKey]}
            onClick={({ key }) => navigate(key)}
            items={mainMenuItems}
            style={{
              border: 'none',
              background: 'transparent',
              minWidth: 600,
            }}
          />
        </div>

        {/* 桌面端搜索和用户区域 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
          className="desktop-actions"
        >
          <Input.Search
            placeholder="搜索..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onSearch={handleSearch}
            style={{ width: 180 }}
            allowClear
          />

          <a
            href="https://www.yuque.com/yindengfeng/raac0v"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#666', fontSize: 14, whiteSpace: 'nowrap' }}
          >
            帮助
          </a>

          {fetchStatus === 'error' && lastKnownCount.current === 0 ? (
            <Badge dot color="orange" offset={[-2, 2]}>
              <BellOutlined
                style={{ fontSize: 18, cursor: 'pointer', color: '#666' }}
                onClick={() => navigate('/notifications')}
              />
            </Badge>
          ) : (
            <Badge count={notificationCount} size="small" offset={[-2, 2]}>
              <BellOutlined
                style={{ fontSize: 18, cursor: 'pointer', color: '#666' }}
                onClick={() => navigate('/notifications')}
              />
            </Badge>
          )}

          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: 8,
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <Avatar
                size={36}
                src={user?.avatar}
                icon={<UserOutlined />}
                style={{ border: '2px solid #e8e8e8' }}
              />
              <span style={{ fontSize: 14, fontWeight: 500 }}>{user?.name || user?.username || '用户'}</span>
            </div>
          </Dropdown>
        </div>

        {/* 移动端菜单按钮 */}
        <div
          style={{
            display: 'none',
            cursor: 'pointer',
            padding: 8,
          }}
          className="mobile-menu-btn"
          onClick={() => setMobileMenuVisible(true)}
        >
          <MenuOutlined style={{ fontSize: 20 }} />
        </div>
      </AntHeader>

      {/* Breadcrumb导航 - 仅登录后显示 */}
      {user && (
        <div
          style={{
            background: '#fafafa',
            padding: '10px 24px',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Breadcrumb items={breadcrumbItems} />
        </div>
      )}

      {/* 移动端抽屉菜单 */}
      <Drawer
        title={
          <div style={{
            fontSize: 18,
            fontWeight: 600,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            云屿学习
          </div>
        }
        placement="right"
        onClose={() => setMobileMenuVisible(false)}
        open={mobileMenuVisible}
        closeIcon={<CloseOutlined />}
        width={300}
        styles={{
          header: { borderBottom: '1px solid #f0f0f0', padding: '16px 20px' },
          body: { padding: 0, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' },
        }}
      >
        {/* 用户信息 */}
        <div style={{
          padding: 20,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <Avatar
            size={48}
            src={user?.avatar}
            icon={<UserOutlined />}
            style={{ border: '2px solid rgba(255,255,255,0.3)' }}
          />
          <div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>
              {user?.name || user?.username || '用户'}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
              点击查看个人资料
            </div>
          </div>
        </div>

        {/* 移动端搜索 */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #f0f0f0' }}>
          <Input.Search
            placeholder="搜索课程、作品..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onSearch={handleSearch}
            allowClear
          />
        </div>

        {/* 导航菜单 */}
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          onClick={({ key }) => {
            navigate(key);
            setMobileMenuVisible(false);
          }}
          items={mainMenuItems}
          style={{ border: 'none', flex: 1, overflowY: 'auto' }}
        />

        {/* 底部操作 */}
        <div style={{
          padding: 16,
          borderTop: '1px solid #f0f0f0',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <Button
              icon={<BellOutlined />}
              onClick={() => { navigate('/notifications'); setMobileMenuVisible(false); }}
              style={{ flex: 1 }}
            >
              {notificationCount > 0 ? `通知(${notificationCount})` : '通知'}
            </Button>
            <Button
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              danger
              style={{ flex: 1 }}
            >
              退出
            </Button>
          </div>
        </div>
      </Drawer>

      {/* 响应式样式 */}
      <style>{`
        @media (max-width: 992px) {
          .desktop-nav { display: none !important; }
          .desktop-actions { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
        @media (min-width: 993px) {
          .mobile-menu-btn { display: none !important; }
        }
      `}</style>
    </>
  );
}
