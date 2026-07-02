import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

/**
 * 加载动画指示器组件
 */
export function LoadingOverlay({ spinning = true, tip = '加载中...', fullscreen = false }) {
  const antIcon = <LoadingOutlined style={{ fontSize: 24, color: 'var(--color-primary)' }} spin />;

  if (fullscreen) {
    return (
      <div className="loading-overlay-fullscreen">
        <Spin indicator={antIcon} tip={tip} />
      </div>
    );
  }

  return (
    <div className="loading-overlay" style={{ display: spinning ? 'flex' : 'none' }}>
      <Spin indicator={antIcon} tip={tip} />
    </div>
  );
}

/**
 * 页面加载状态包装器
 */
export function PageLoadingWrapper({ isLoading, children, tip = '页面加载中...' }) {
  return (
    <div className="page-loading-wrapper">
      {isLoading ? (
        <div className="page-loading-content">
          <LoadingOverlay spinning={true} tip={tip} />
        </div>
      ) : (
        children
      )}
    </div>
  );
}

/**
 * 骨架屏加载效果
 */
export function SkeletonLoader({ rows = 3 }) {
  return (
    <div className="skeleton-loader">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="skeleton-line"
          style={{
            width: `${100 - index * 15}%`,
            animationDelay: `${index * 0.1}s`
          }}
        />
      ))}
    </div>
  );
}