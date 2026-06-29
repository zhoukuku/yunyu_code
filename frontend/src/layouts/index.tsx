import { Outlet } from '@umijs/max';
import './index.less';

export default function Layout() {
  return (
    <div className="app-layout">
      <Outlet />
    </div>
  );
}