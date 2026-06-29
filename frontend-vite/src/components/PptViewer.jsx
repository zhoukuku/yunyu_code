import { useState, useEffect, useRef } from 'react';
import { Card, Carousel, Button, Space, Spin, message, InputNumber } from 'antd';
import { LeftOutlined, RightOutlined, ExpandOutlined, CompressOutlined } from '@ant-design/icons';
import './PptViewer.less';

/**
 * PPT查看器组件
 * 支持两种模式：
 * 1. iframe嵌入模式：用于Office Online、Google Slides等在线PPT
 * 2. 图片轮播模式：用于展示导出为图片的PPT页面
 */
export default function PptViewer({ pptUrl, lessonName }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageMode, setImageMode] = useState(false);
  const carouselRef = useRef(null);

  // 判断是否为在线PPT链接（Office Online、Google Slides等）
  const isOnlinePpt = (url) => {
    if (!url) return false;
    return url.includes('office.com') ||
           url.includes('google.com') ||
           url.includes('slideshare.net') ||
           url.includes('canva.com') ||
           url.includes('officeapps.live.com');
  };

  // 判断是否为图片URL模式
  const isImageMode = (url) => {
    if (!url) return false;
    return url.match(/\.(jpg|jpeg|png|gif|webp)$/i) !== null ||
           url.includes('/slides/') ||
           url.includes('/pages/') ||
           url.includes('/ppt/') ||
           url.includes('[page]') ||
           url.includes('{page}') ||
           url.match(/page\d+/i);
  };

  // 初始化模式检测
  useEffect(() => {
    if (pptUrl) {
      setImageMode(isImageMode(pptUrl));
    }
  }, [pptUrl]);

  // 全屏状态变化监听
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // 键盘导航
  useEffect(() => {
    if (!imageMode) return;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        goToPrev();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        goToNext();
      } else if (e.key === 'Escape' && isFullscreen) {
        exitFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [imageMode, isFullscreen, currentPage, totalPages]);

  // 生成PPT页面图片URL数组
  const generatePageUrls = (baseUrl, pageCount = 10) => {
    const urls = [];
    for (let i = 1; i <= pageCount; i++) {
      let url = baseUrl;
      // 替换常见占位符模式
      url = url.replace(/\[page\]/gi, i);
      url = url.replace(/\{page\}/gi, i);
      url = url.replace(/page(\d+)/gi, (match, p1) => {
        const num = parseInt(p1, 10);
        const padLen = p1.length;
        return String(num + i - 1).padStart(padLen, '0');
      });
      // 替换URL末尾的数字页码
      url = url.replace(/(\d+)(\.[^.]+$)/, (match, num, ext) => {
        return String(i).padStart(num.length, '0') + ext;
      });
      urls.push(url);
    }
    return urls;
  };

  // 检测PPT页面总数
  const detectPageCount = (url) => {
    if (url.includes('[page]') || url.includes('{page}')) {
      return 10;
    }
    const pageMatch = url.match(/page(\d+)/i);
    if (pageMatch) {
      return 10; // 假设有10页
    }
    return 1;
  };

  // 翻页函数
  const goToNext = () => {
    if (carouselRef.current && currentPage < totalPages) {
      carouselRef.current.next();
    }
  };

  const goToPrev = () => {
    if (carouselRef.current && currentPage > 1) {
      carouselRef.current.prev();
    }
  };

  // 跳转到指定页
  const goToPage = (page) => {
    if (carouselRef.current && page >= 1 && page <= totalPages) {
      carouselRef.current.goTo(page - 1);
    }
  };

  // 全屏切换
  const toggleFullscreen = () => {
    const card = document.querySelector('.ppt-card-container');
    if (!card) return;

    if (!document.fullscreenElement) {
      card.requestFullscreen?.() || card.webkitRequestFullscreen?.() || card.mozRequestFullScreen?.();
    } else {
      document.exitFullscreen?.() || document.webkitExitFullscreen?.() || document.mozCancelFullScreen?.();
    }
  };

  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.() || document.webkitExitFullscreen?.() || document.mozCancelFullScreen?.();
    }
  };

  if (!pptUrl) {
    return (
      <Card>
        <div className="ppt-placeholder">
          <div className="ppt-placeholder-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <p>暂无课件内容</p>
        </div>
      </Card>
    );
  }

  // iframe嵌入模式（在线PPT）
  if (isOnlinePpt(pptUrl)) {
    return (
      <div className={`ppt-card-container ${isFullscreen ? 'fullscreen' : ''}`}>
        <Card
          className="ppt-card"
          title={lessonName ? `${lessonName} - 课件` : '课件'}
          extra={
            <Button
              type="text"
              icon={isFullscreen ? <CompressOutlined /> : <ExpandOutlined />}
              onClick={toggleFullscreen}
            />
          }
        >
          <div className="ppt-iframe-wrapper">
            <iframe
              src={pptUrl}
              title="PPT课件"
              frameBorder="0"
              allowFullScreen
              className="ppt-iframe"
            />
          </div>
        </Card>
      </div>
    );
  }

  // 图片轮播模式
  const pageCount = detectPageCount(pptUrl);
  const pageUrls = generatePageUrls(pptUrl, pageCount);

  return (
    <div className={`ppt-card-container ${isFullscreen ? 'fullscreen' : ''}`}>
      <Card
        className="ppt-card"
        title={lessonName ? `${lessonName} - 课件` : '课件'}
        extra={
          <Space>
            <span className="page-indicator">
              第
              <InputNumber
                size="small"
                min={1}
                max={totalPages}
                value={currentPage}
                onChange={(val) => goToPage(val || 1)}
                style={{ width: '50px', margin: '0 4px' }}
              />
              / {totalPages} 页
            </span>
            <Button
              type="text"
              icon={isFullscreen ? <CompressOutlined /> : <ExpandOutlined />}
              onClick={toggleFullscreen}
            />
          </Space>
        }
      >
        <Carousel
          ref={carouselRef}
          afterChange={(current) => {
            setCurrentPage(current + 1);
            setTotalPages(pageCount);
          }}
          dots
          className="ppt-carousel"
        >
          {pageUrls.map((url, index) => (
            <div key={index} className="ppt-slide">
              <Spin spinning={loading && index === 0}>
                <div className="ppt-image-wrapper">
                  <img
                    src={url}
                    alt={`PPT第${index + 1}页`}
                    onLoad={() => {
                      if (index === 0) {
                        setLoading(false);
                        setTotalPages(pageCount);
                      }
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.classList.add('error');
                    }}
                  />
                </div>
              </Spin>
            </div>
          ))}
        </Carousel>

        <div className="ppt-controls">
          <Button
            icon={<LeftOutlined />}
            onClick={goToPrev}
            disabled={currentPage <= 1}
          >
            上一页
          </Button>
          <Space>
            <Button onClick={() => goToPage(1)} disabled={currentPage === 1}>首页</Button>
            <Button
              type="primary"
              onClick={goToNext}
              disabled={currentPage >= totalPages}
            >
              下一页
              <RightOutlined />
            </Button>
            <Button onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages}>末页</Button>
          </Space>
        </div>

        <div className="ppt-keyboard-hint">
          使用方向键 ← → 或 ↑ ↓ 翻页，ESC 退出全屏
        </div>
      </Card>
    </div>
  );
}
