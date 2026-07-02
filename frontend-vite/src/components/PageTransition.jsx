import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * 页面过渡动画组件
 * 先淡出旧页面内容，再淡入新页面内容
 */
export function PageTransition({ children }) {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState('fadeIn');
  const exitingChildrenRef = useRef(null);

  // 检测路径是否已变化（在 render 阶段判定，避免先闪现新内容再淡出）
  const isExiting = displayLocation.pathname !== location.pathname;

  useEffect(() => {
    if (isExiting) {
      setTransitionStage('fadeOut');
      const timer = setTimeout(() => {
        setDisplayLocation(location);
        setTransitionStage('fadeIn');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [location, displayLocation]);

  useEffect(() => {
    // 仅在稳定状态（非过渡中）缓存当前页面内容，供退出动画使用
    if (transitionStage === 'fadeIn' && !isExiting) {
      exitingChildrenRef.current = children;
    }
  }, [transitionStage, isExiting, children]);

  // 退出阶段显示旧内容，进入阶段显示新内容
  const showChildren =
    transitionStage === 'fadeIn' && !isExiting
      ? children
      : exitingChildrenRef.current;

  return (
    <div
      className={`page-transition-container ${transitionStage}`}
      key={displayLocation.pathname}
    >
      {showChildren}
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
  const exitingChildrenRef = useRef(null);

  const isExiting = displayLocation.pathname !== location.pathname;

  useEffect(() => {
    if (isExiting) {
      setTransitionStage('slideOut');
      const timer = setTimeout(() => {
        setDisplayLocation(location);
        setTransitionStage('slideIn');
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [location, displayLocation]);

  useEffect(() => {
    if (transitionStage === 'slideIn' && !isExiting) {
      exitingChildrenRef.current = children;
    }
  }, [transitionStage, isExiting, children]);

  const showChildren =
    transitionStage === 'slideIn' && !isExiting
      ? children
      : exitingChildrenRef.current;

  return (
    <div
      className={`slide-transition-container ${transitionStage}`}
      key={displayLocation.pathname}
    >
      {showChildren}
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
  const exitingChildrenRef = useRef(null);

  const isExiting = displayLocation.pathname !== location.pathname;

  useEffect(() => {
    if (isExiting) {
      setTransitionStage('scaleOut');
      const timer = setTimeout(() => {
        setDisplayLocation(location);
        setTransitionStage('scaleIn');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [location, displayLocation]);

  useEffect(() => {
    if (transitionStage === 'scaleIn' && !isExiting) {
      exitingChildrenRef.current = children;
    }
  }, [transitionStage, isExiting, children]);

  const showChildren =
    transitionStage === 'scaleIn' && !isExiting
      ? children
      : exitingChildrenRef.current;

  return (
    <div
      className={`scale-transition-container ${transitionStage}`}
      key={displayLocation.pathname}
    >
      {showChildren}
    </div>
  );
}