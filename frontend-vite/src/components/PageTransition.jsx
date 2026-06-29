import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * 页面过渡动画组件
 * 使用 key 属性在路由变化时触发动画
 */
export function PageTransition({ children }) {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState('fadeIn');

  useEffect(() => {
    if (displayLocation.pathname !== location.pathname) {
      setTransitionStage('fadeOut');
      const timer = setTimeout(() => {
        setDisplayLocation(location);
        setTransitionStage('fadeIn');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [location, displayLocation]);

  return (
    <div
      className={`page-transition-container ${transitionStage}`}
      key={displayLocation.pathname}
    >
      {children}
    </div>
  );
}

/**
 * 滑动过渡动画组件（上下滑动）
 */
export function SlideTransition({ children }) {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState('slideIn');

  useEffect(() => {
    if (displayLocation.pathname !== location.pathname) {
      setTransitionStage('slideOut');
      const timer = setTimeout(() => {
        setDisplayLocation(location);
        setTransitionStage('slideIn');
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [location, displayLocation]);

  return (
    <div
      className={`slide-transition-container ${transitionStage}`}
      key={displayLocation.pathname}
    >
      {children}
    </div>
  );
}

/**
 * 缩放过渡动画组件
 */
export function ScaleTransition({ children }) {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState('scaleIn');

  useEffect(() => {
    if (displayLocation.pathname !== location.pathname) {
      setTransitionStage('scaleOut');
      const timer = setTimeout(() => {
        setDisplayLocation(location);
        setTransitionStage('scaleIn');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [location, displayLocation]);

  return (
    <div
      className={`scale-transition-container ${transitionStage}`}
      key={displayLocation.pathname}
    >
      {children}
    </div>
  );
}