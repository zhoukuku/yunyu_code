import { Outlet } from 'react-router-dom';
import { Layout as AntLayout } from 'antd';
import Header from './Header';
import { PageTransition } from './PageTransition';

const { Content, Footer } = AntLayout;

export default function Layout() {
  return (
    <AntLayout className="app-layout">
      <Header />
      <Content
        style={{
          padding: '24px 50px',
          maxWidth: 1400,
          margin: '0 auto',
          width: '100%',
          minHeight: 'calc(100vh - 130px)',
        }}
        className="main-content"
      >
        <PageTransition>
          <Outlet />
        </PageTransition>
      </Content>
      <Footer
        style={{
          textAlign: 'center',
          background: 'transparent',
          padding: '24px 50px',
          color: '#8c8c8c',
          fontSize: 13,
        }}
      >
        <div style={{ marginBottom: 8 }}>
          <span style={{ color: '#667eea', fontWeight: 600 }}>云屿学习平台</span>
          <span style={{ margin: '0 12px', color: '#ddd' }}>|</span>
          让学习更有趣
        </div>
        <div style={{ fontSize: 12 }}>
          © {new Date().getFullYear()} Cloud Island Learning Platform. All rights reserved.
        </div>
      </Footer>

      <style>{`
        @media (max-width: 768px) {
          .main-content {
            padding: 16px !important;
          }
        }
      `}</style>
    </AntLayout>
  );
}
