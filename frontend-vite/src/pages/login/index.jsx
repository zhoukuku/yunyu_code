import { useState, useEffect, useRef, useCallback } from 'react';
import { Form, Input, Button, message, Card } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { login as loginApi } from '../../services/api';

/* ============================================================
   loginEnhanced — 全面改进登录页
   特性：粒子动画背景 | 3D渐变效果 | 加载动画 | 反馈动画 | 移动端适配
   ============================================================ */

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [loginStatus, setLoginStatus] = useState('idle'); // idle | loading | success | error
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [focusedField, setFocusedField] = useState(null);
  const [errorFields, setErrorFields] = useState({});
  const containerRef = useRef(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const particlesRef = useRef([]);
  const rafRef = useRef(null);

  /* ---- 粒子系统 ---- */
  const initParticles = useCallback(() => {
    const count = 60;
    particlesRef.current = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random(),
      y: Math.random(),
      size: Math.random() * 4 + 2,
      speedX: (Math.random() - 0.5) * 0.003,
      speedY: (Math.random() - 0.5) * 0.003,
      opacity: Math.random() * 0.5 + 0.2,
      hue: Math.random() * 60 + 230, // blue-purple range
    }));
  }, []);

  const animateParticles = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const W = container.offsetWidth;
    const H = container.offsetHeight;

    particlesRef.current.forEach((p) => {
      p.x += p.speedX;
      p.y += p.speedY;
      // Wrap around edges
      if (p.x < 0) p.x = 1;
      if (p.x > 1) p.x = 0;
      if (p.y < 0) p.y = 1;
      if (p.y > 1) p.y = 0;

      const el = document.getElementById(`particle-${p.id}`);
      if (el) {
        el.style.transform = `translate(${p.x * W}px, ${p.y * H}px)`;
        el.style.opacity = p.opacity;
      }
    });

    rafRef.current = requestAnimationFrame(animateParticles);
  }, []);

  useEffect(() => {
    initParticles();
    rafRef.current = requestAnimationFrame(animateParticles);

    const handleMouseMove = (e) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        mouseRef.current = {
          x: (e.clientX - rect.left) / rect.width,
          y: (e.clientY - rect.top) / rect.height,
        };
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [initParticles, animateParticles]);

  /* ---- 动态样式注入 ---- */
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes gradientShift {
        0%   { background-position: 0% 50%; }
        50%  { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      @keyframes float {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        33%       { transform: translateY(-18px) rotate(1deg); }
        66%       { transform: translateY(-8px) rotate(-1deg); }
      }
      @keyframes pulse {
        0%, 100% { opacity: 0.3; transform: scale(1); }
        50%       { opacity: 0.7; transform: scale(1.15); }
      }
      @keyframes cardEntrance {
        0%   { opacity: 0; transform: translateY(40px) scale(0.94) rotateX(8deg); }
        100% { opacity: 1; transform: translateY(0) scale(1) rotateX(0deg); }
      }
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        15%  { transform: translateX(-8px) rotate(-1deg); }
        30%  { transform: translateX(8px) rotate(1deg); }
        45%  { transform: translateX(-6px) rotate(-0.5deg); }
        60%  { transform: translateX(6px) rotate(0.5deg); }
        75%  { transform: translateX(-3px); }
        90%  { transform: translateX(3px); }
      }
      @keyframes successPulse {
        0%   { box-shadow: 0 0 0 0 rgba(82,196,26,0.5); }
        50%  { box-shadow: 0 0 0 16px rgba(82,196,26,0); }
        100% { box-shadow: 0 0 0 0 rgba(82,196,26,0); }
      }
      @keyframes errorShake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
        20%, 40%, 60%, 80%      { transform: translateX(6px); }
      }
      @keyframes spinnerRing {
        0%   { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes dotBounce {
        0%, 80%, 100% { transform: scale(0); }
        40%           { transform: scale(1); }
      }
      @keyframes logoFloat {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        25%       { transform: translateY(-6px) rotate(2deg); }
        75%       { transform: translateY(-3px) rotate(-2deg); }
      }
      @keyframes glowPulse {
        0%, 100% { opacity: 0.5; }
        50%       { opacity: 1; }
      }
      @keyframes slideUp {
        0%   { opacity: 0; transform: translateY(20px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      @keyframes checkDraw {
        0%   { stroke-dashoffset: 100; }
        100% { stroke-dashoffset: 0; }
      }

      /* ---- 全局 ---- */
      .login-root {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background: linear-gradient(-45deg, #1a1a2e 0%, #16213e 20%, #0f3460 40%, #533483 60%, #e94560 80%, #1a1a2e 100%);
        background-size: 500% 500%;
        animation: gradientShift 14s ease infinite;
        position: relative;
        overflow: hidden;
      }

      /* ---- 粒子层 ---- */
      .particle-canvas {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 0;
      }
      .particle {
        position: absolute;
        border-radius: 50%;
        pointer-events: none;
        transition: opacity 0.3s;
      }

      /* ---- 鼠标跟随光晕 ---- */
      .mouse-glow {
        position: absolute;
        width: 600px;
        height: 600px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(82,196,26,0.08) 0%, rgba(82,196,26,0) 70%);
        transform: translate(-50%, -50%);
        pointer-events: none;
        z-index: 0;
        transition: left 0.8s cubic-bezier(0.4,0,0.2,1), top 0.8s cubic-bezier(0.4,0,0.2,1);
      }

      /* ---- 装饰性背景球 ---- */
      .bg-sphere {
        position: absolute;
        border-radius: 50%;
        filter: blur(80px);
        pointer-events: none;
        z-index: 0;
      }
      .bg-sphere-1 {
        width: 500px; height: 500px;
        background: radial-gradient(circle, rgba(82,196,26,0.15), transparent 70%);
        top: -150px; left: -100px;
        animation: float 10s ease-in-out infinite;
      }
      .bg-sphere-2 {
        width: 400px; height: 400px;
        background: radial-gradient(circle, rgba(233,69,96,0.12), transparent 70%);
        bottom: -100px; right: -80px;
        animation: float 12s ease-in-out infinite;
        animation-delay: -4s;
      }
      .bg-sphere-3 {
        width: 300px; height: 300px;
        background: radial-gradient(circle, rgba(83,52,131,0.2), transparent 70%);
        top: 40%; left: 60%;
        animation: float 8s ease-in-out infinite;
        animation-delay: -2s;
      }

      /* ---- 登录卡片 ---- */
      .login-card-3d {
        position: relative;
        z-index: 10;
        perspective: 1200px;
        transform-style: preserve-3d;
      }
      .login-card-inner {
        animation: cardEntrance 0.8s cubic-bezier(0.16,1,0.3,1) forwards;
        transform-style: preserve-3d;
        transition: transform 0.15s ease;
      }
      .login-card-inner:hover {
        transform: rotateY(0deg) rotateX(2deg) translateZ(10px);
      }
      .login-card {
        border-radius: 28px !important;
        box-shadow:
          0 25px 60px rgba(0,0,0,0.35),
          0 0 0 1px rgba(255,255,255,0.1),
          inset 0 1px 0 rgba(255,255,255,0.2) !important;
        background: rgba(255,255,255,0.06) !important;
        backdrop-filter: blur(30px) saturate(180%);
        -webkit-backdrop-filter: blur(30px) saturate(180%);
        border: 1px solid rgba(255,255,255,0.12) !important;
        overflow: hidden;
        position: relative;
      }
      .login-card::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(82,196,26,0.05) 100%);
        pointer-events: none;
        border-radius: inherit;
      }
      .login-card .ant-card-body { padding: 52px 44px !important; }

      /* ---- Logo ---- */
      .login-logo-wrap {
        animation: logoFloat 5s ease-in-out infinite;
        transform-style: preserve-3d;
      }
      .login-logo {
        width: 80px; height: 80px;
        border-radius: 22px;
        background: linear-gradient(135deg, #52c41a 0%, #237804 50%, #389e0d 100%);
        display: flex; align-items: center; justify-content: center;
        margin: 0 auto 24px;
        box-shadow: 0 12px 32px rgba(82,196,26,0.45), 0 0 60px rgba(82,196,26,0.2);
        position: relative;
        transform: translateZ(20px);
      }
      .login-logo::after {
        content: '';
        position: absolute;
        inset: -4px;
        border-radius: 26px;
        background: linear-gradient(135deg, rgba(82,196,26,0.4), transparent);
        z-index: -1;
        animation: glowPulse 2.5s ease-in-out infinite;
      }

      /* ---- 标题 ---- */
      .login-title {
        font-size: 30px;
        font-weight: 800;
        background: linear-gradient(135deg, #52c41a 0%, #b7eb8f 40%, #389e0d 70%, #d9f7be 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        text-align: center;
        margin-bottom: 8px;
        letter-spacing: -0.5px;
        animation: slideUp 0.6s ease forwards;
        animation-delay: 0.2s;
        opacity: 0;
      }
      .login-subtitle {
        text-align: center;
        color: rgba(255,255,255,0.55);
        font-size: 14px;
        margin-bottom: 40px;
        animation: slideUp 0.6s ease forwards;
        animation-delay: 0.3s;
        opacity: 0;
      }

      /* ---- 输入框组 ---- */
      .login-form-item { margin-bottom: 0 !important; animation: slideUp 0.5s ease forwards; opacity: 0; }
      .login-form-item:nth-child(1) { animation-delay: 0.35s; }
      .login-form-item:nth-child(2) { animation-delay: 0.45s; }
      .login-input-wrapper {
        position: relative;
        border-radius: 14px;
        transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
        background: rgba(255,255,255,0.05);
        border: 2px solid rgba(255,255,255,0.1);
        padding: 4px 12px;
      }
      .login-input-wrapper:hover {
        border-color: rgba(82,196,26,0.4);
        background: rgba(255,255,255,0.08);
      }
      .login-input-wrapper:focus-within {
        border-color: #52c41a;
        background: rgba(82,196,26,0.06);
        box-shadow: 0 0 0 4px rgba(82,196,26,0.12), 0 4px 20px rgba(82,196,26,0.15);
        transform: translateY(-1px);
      }
      .login-input-wrapper.error {
        border-color: #ff4d4f;
        background: rgba(255,77,79,0.06);
        box-shadow: 0 0 0 4px rgba(255,77,79,0.1);
        animation: errorShake 0.5s ease-in-out;
      }
      .floating-label {
        position: absolute;
        left: 44px;
        top: 50%;
        transform: translateY(-50%);
        pointer-events: none;
        transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
        color: rgba(255,255,255,0.4);
        font-size: 15px;
        z-index: 1;
        background: transparent;
        padding: 0;
      }
      .floating-label.active {
        top: 6px;
        transform: translateY(0);
        font-size: 11px;
        color: #52c41a;
        font-weight: 600;
        left: 12px;
        background: rgba(26,26,46,0.9);
        padding: 0 6px;
        border-radius: 4px;
      }
      .floating-label.error { color: #ff4d4f !important; }
      .login-input-wrapper .input-icon {
        transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
        color: rgba(255,255,255,0.35);
        font-size: 18px !important;
      }
      .login-input-wrapper:focus-within .input-icon {
        color: #52c41a;
        transform: scale(1.2);
      }
      .login-input-wrapper .ant-input {
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
        color: rgba(255,255,255,0.9);
        font-size: 15px;
        padding-left: 8px;
        height: 46px;
      }
      .login-input-wrapper .ant-input::placeholder { color: transparent; }
      .login-input-wrapper .ant-input-affix-wrapper {
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
        padding-left: 8px;
      }
      .login-input-wrapper .ant-input-password-icon {
        color: rgba(255,255,255,0.35) !important;
      }
      .error-tip {
        display: flex; align-items: center; gap: 5px;
        font-size: 12px; color: #ff7875;
        margin-top: 6px; padding-left: 12px;
        animation: slideUp 0.3s ease forwards;
      }

      /* ---- 提交按钮 ---- */
      .login-btn-wrap { margin-top: 36px !important; margin-bottom: 16px !important; animation: slideUp 0.5s ease forwards; animation-delay: 0.55s; opacity: 0; }
      .login-btn {
        position: relative;
        height: 54px !important;
        border-radius: 14px !important;
        font-size: 17px !important;
        font-weight: 700 !important;
        letter-spacing: 4px;
        background: linear-gradient(135deg, #52c41a 0%, #237804 100%) !important;
        border: none !important;
        box-shadow: 0 6px 24px rgba(82,196,26,0.4) !important;
        overflow: hidden;
        transition: all 0.3s cubic-bezier(0.4,0,0.2,1) !important;
        transform-style: preserve-3d;
      }
      .login-btn::before {
        content: '';
        position: absolute;
        top: 0; left: -100%;
        width: 100%; height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent);
        transition: left 0.6s;
      }
      .login-btn:hover::before { left: 100%; }
      .login-btn:hover {
        transform: translateY(-3px) translateZ(5px) !important;
        box-shadow: 0 12px 36px rgba(82,196,26,0.55) !important;
      }
      .login-btn:active {
        transform: translateY(0) translateZ(0) scale(0.98) !important;
      }
      .login-btn.loading {
        pointer-events: none;
        background: linear-gradient(135deg, #389e0d 0%, #237804 100%) !important;
      }
      .login-btn.success {
        animation: successPulse 0.8s ease forwards !important;
        background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%) !important;
      }

      /* ---- 加载指示器 ---- */
      .login-spinner {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }
      .spinner-ring {
        width: 20px; height: 20px;
        border: 2.5px solid rgba(255,255,255,0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spinnerRing 0.8s linear infinite;
      }
      .spinner-dots { display: flex; gap: 4px; }
      .spinner-dot {
        width: 6px; height: 6px;
        background: white;
        border-radius: 50%;
        animation: dotBounce 1.2s ease-in-out infinite;
      }
      .spinner-dot:nth-child(1) { animation-delay: 0s; }
      .spinner-dot:nth-child(2) { animation-delay: 0.2s; }
      .spinner-dot:nth-child(3) { animation-delay: 0.4s; }

      /* ---- 成功反馈 ---- */
      .success-overlay {
        position: absolute;
        inset: 0;
        background: rgba(82,196,26,0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: inherit;
        animation: slideUp 0.4s ease forwards;
        backdrop-filter: blur(4px);
      }
      .success-checkmark {
        width: 80px; height: 80px;
        animation: successPulse 1s ease infinite;
      }
      .success-checkmark circle {
        fill: rgba(82,196,26,0.2);
        stroke: #52c41a;
        stroke-width: 2;
      }
      .success-checkmark path {
        stroke: #52c41a;
        stroke-width: 3;
        stroke-linecap: round;
        stroke-linejoin: round;
        stroke-dasharray: 100;
        stroke-dashoffset: 100;
        animation: checkDraw 0.6s ease forwards 0.2s;
      }

      /* ---- 底部装饰 ---- */
      .login-footer-deco {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 14px;
        margin-top: 28px;
        animation: slideUp 0.5s ease forwards;
        animation-delay: 0.65s;
        opacity: 0;
      }
      .deco-bar {
        height: 3px;
        border-radius: 2px;
        background: linear-gradient(90deg, transparent, #52c41a, transparent);
        animation: glowPulse 2.5s ease-in-out infinite;
      }
      .deco-dot {
        width: 5px; height: 5px;
        border-radius: 50%;
        background: rgba(255,255,255,0.3);
      }

      /* ---- 移动端适配 ---- */
      @media (max-width: 520px) {
        .login-card .ant-card-body { padding: 36px 24px !important; }
        .login-logo { width: 64px; height: 64px; border-radius: 18px; }
        .login-logo svg { width: 32px; height: 32px; }
        .login-title { font-size: 24px; }
        .login-subtitle { font-size: 13px; }
        .login-btn { height: 50px !important; letter-spacing: 2px; }
        .bg-sphere-1 { width: 280px; height: 280px; }
        .bg-sphere-2 { width: 220px; height: 220px; }
        .bg-sphere-3 { width: 160px; height: 160px; }
        .mouse-glow { width: 320px; height: 320px; }
        .login-form-item { animation-duration: 0.4s; }
      }
      @media (max-width: 360px) {
        .login-card .ant-card-body { padding: 28px 18px !important; }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  /* ---- 登录提交 ---- */
  const onFinish = async (values) => {
    setLoginStatus('loading');
    setErrorFields({});
    setLoading(true);
    try {
      const res = await loginApi(values.account, values.password);
      if (res.status === 200 && res.result?.accessToken) {
        setLoginStatus('success');
        localStorage.setItem('accessToken', res.result.accessToken);
        localStorage.setItem('user', JSON.stringify(res.result.user));
        message.success({ content: '登录成功，正在跳转…', style: { marginTop: 80 } });
        setTimeout(() => navigate('/'), 1000);
      } else {
        setLoginStatus('error');
        message.error(res.result?.msg || '登录失败');
        setTimeout(() => setLoginStatus('idle'), 2000);
      }
    } catch (e) {
      setLoginStatus('error');
      message.error(e.message || '登录失败');
      setTimeout(() => setLoginStatus('idle'), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldsChange = (_, allFields) => {
    const errors = {};
    allFields.forEach(field => {
      if (field.errors && field.errors.length > 0) {
        errors[field.name] = field.errors[0];
      }
    });
    setErrorFields(errors);
  };

  const glowStyle = {
    left: `${mouseRef.current.x * 100}%`,
    top:  `${mouseRef.current.y * 100}%`,
  };

  return (
    <div ref={containerRef} className="login-root">
      {/* 粒子 */}
      <div className="particle-canvas">
        {particlesRef.current.map((p) => (
          <div
            key={p.id}
            id={`particle-${p.id}`}
            className="particle"
            style={{
              width: p.size,
              height: p.size,
              background: `hsla(${p.hue}, 80%, 65%, ${p.opacity})`,
              left: 0,
              top: 0,
            }}
          />
        ))}
      </div>

      {/* 鼠标光晕 */}
      <div className="mouse-glow" style={glowStyle} />

      {/* 装饰球 */}
      <div className="bg-sphere bg-sphere-1" />
      <div className="bg-sphere bg-sphere-2" />
      <div className="bg-sphere bg-sphere-3" />

      {/* 3D 卡片 */}
      <div className="login-card-3d">
        <div className="login-card-inner">
          <Card
            className="login-card"
            styles={{ body: { padding: '52px 44px' } }}
          >
            {loginStatus === 'success' && (
              <div className="success-overlay">
                <svg className="success-checkmark" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="36" />
                  <path fill="none" d="M24 40l12 12 20-24" />
                </svg>
              </div>
            )}

            {/* Logo */}
            <div style={{ textAlign: 'center' }}>
              <div className="login-logo-wrap">
                <div className="login-logo">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
                    <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
                  </svg>
                </div>
              </div>

              <h1 className="login-title">云屿学习平台</h1>
              <p className="login-subtitle">开启创意编程之旅</p>
            </div>

            {/* 表单 */}
            <Form
              form={form}
              onFinish={onFinish}
              size="large"
              layout="vertical"
              onFieldsChange={handleFieldsChange}
            >
              {/* 账号 */}
              <Form.Item
                name="account"
                rules={[{ required: true, message: ' ' }]}
                style={{ marginBottom: errorFields.account ? 30 : 24 }}
                className="login-form-item"
              >
                <div className={`login-input-wrapper ${errorFields.account ? 'error' : ''}`}>
                  <span className={`floating-label ${focusedField === 'account' || form.getFieldValue('account') ? 'active' : ''} ${errorFields.account ? 'error' : ''}`}>
                    账号
                  </span>
                  <Input
                    prefix={<UserOutlined className="input-icon" />}
                    style={{ borderRadius: 14 }}
                    onFocus={() => setFocusedField('account')}
                    onBlur={() => setFocusedField(null)}
                  />
                  {errorFields.account && (
                    <div className="error-tip">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="#ff4d4f">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                      </svg>
                      {errorFields.account}
                    </div>
                  )}
                </div>
              </Form.Item>

              {/* 密码 */}
              <Form.Item
                name="password"
                rules={[{ required: true, message: ' ' }]}
                style={{ marginBottom: errorFields.password ? 30 : 24 }}
                className="login-form-item"
              >
                <div className={`login-input-wrapper ${errorFields.password ? 'error' : ''}`}>
                  <span className={`floating-label ${focusedField === 'password' || form.getFieldValue('password') ? 'active' : ''} ${errorFields.password ? 'error' : ''}`}>
                    密码
                  </span>
                  <Input.Password
                    prefix={<LockOutlined className="input-icon" />}
                    placeholder=""
                    style={{ borderRadius: 14 }}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                  />
                  {errorFields.password && (
                    <div className="error-tip">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="#ff4d4f">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                      </svg>
                      {errorFields.password}
                    </div>
                  )}
                </div>
              </Form.Item>

              {/* 提交按钮 */}
              <Form.Item className="login-btn-wrap">
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={loading}
                  className={`login-btn ${loginStatus === 'loading' ? 'loading' : ''} ${loginStatus === 'success' ? 'success' : ''}`}
                >
                  {loading ? (
                    <span className="login-spinner">
                      <div className="spinner-ring" />
                      <span>登录中</span>
                    </span>
                  ) : loginStatus === 'success' ? (
                    <span className="login-spinner">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span>登录成功</span>
                    </span>
                  ) : (
                    '登 录'
                  )}
                </Button>
              </Form.Item>
            </Form>

            {/* 底部装饰 */}
            <div className="login-footer-deco">
              <div className="deco-bar" style={{ width: 48 }} />
              <div className="deco-dot" />
              <div className="deco-bar" style={{ width: 48 }} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}