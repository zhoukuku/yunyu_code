import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Card, Space, Button } from 'antd';
import { UserOutlined, BookOutlined, BellOutlined, DashboardOutlined } from '@ant-design/icons';

export default function AdminPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const isDashboard = location.pathname === '/admin';

  return (
    <div style={{ padding: '24px 50px', maxWidth: 1400, margin: '0 auto', minHeight: '100vh' }}>
      <Card
        title="管理后台"
        extra={
          <Space>
            <Button
              type={isDashboard ? 'primary' : 'default'}
              icon={<DashboardOutlined />}
              onClick={() => navigate('/admin')}
            >
              仪表盘
            </Button>
            <Button
              type={location.pathname.startsWith('/admin/users') ? 'primary' : 'default'}
              icon={<UserOutlined />}
              onClick={() => navigate('/admin/users')}
            >
              用户管理
            </Button>
            <Button
              type={location.pathname.startsWith('/admin/courses') ? 'primary' : 'default'}
              icon={<BookOutlined />}
              onClick={() => navigate('/admin/courses')}
            >
              课程管理
            </Button>
            <Button
              type={location.pathname.startsWith('/admin/notices') ? 'primary' : 'default'}
              icon={<BellOutlined />}
              onClick={() => navigate('/admin/notices')}
            >
              通知管理
            </Button>
          </Space>
        }
      >
        <Outlet />
      </Card>
    </div>
  );
}
