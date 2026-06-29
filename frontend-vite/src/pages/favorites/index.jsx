import { useEffect, useState } from 'react';
import { Card, Row, Col, Button, message, Popconfirm } from 'antd';
import { HeartOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getFavorites, removeFavorite } from '../../services/api';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const res = await getFavorites();
      const favList = res?.result || res?.records || (Array.isArray(res) ? res : []);
      setFavorites(favList);
    } catch (error) {
      console.error('获取收藏列表失败:', error);
      message.error('获取收藏列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (projectId, e) => {
    e.stopPropagation();
    try {
      await removeFavorite(projectId);
      message.success('已取消收藏');
      setFavorites(prev => prev.filter(f => f.projectId !== projectId));
    } catch (error) {
      console.error('取消收藏失败:', error);
      message.error('取消收藏失败');
    }
  };

  const handleCardClick = (favorite) => {
    if (favorite.project) {
      navigate(`/ide/${favorite.project.type}`, { state: { projectId: favorite.projectId } });
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Card title="收藏作品">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>加载中...</div>
        ) : favorites.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <HeartOutlined style={{ fontSize: 48, color: '#ccc' }} />
            <p style={{ color: '#999', marginTop: 16 }}>暂无收藏作品</p>
          </div>
        ) : (
          <Row gutter={[16, 16]}>
            {favorites.map(f => (
              <Col xs={24} sm={12} md={8} lg={6} key={f.id}>
                <Card
                  hoverable
                  cover={
                    f.project?.thumbnail ? (
                      <img alt={f.project.name} src={f.project.thumbnail} style={{ height: 150, objectFit: 'cover' }} />
                    ) : (
                      <div style={{ height: 150, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 48 }}>🧩</span>
                      </div>
                    )
                  }
                  actions={[
                    <Button type="text" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); if (f.project) navigate(`/create/${f.project.type}`, { state: { projectId: f.projectId } }); }}>编辑</Button>,
                    <Popconfirm
                      title="确定要取消收藏吗？"
                      onConfirm={(e) => handleRemoveFavorite(f.projectId, e)}
                      onCancel={(e) => e.stopPropagation()}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button type="text" danger icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()}>取消收藏</Button>
                    </Popconfirm>
                  ]}
                  onClick={() => handleCardClick(f)}
                >
                  <Card.Meta
                    title={f.project?.name || '未命名作品'}
                    description={
                      <div>
                        <span>作者: {f.project?.userId || '未知'}</span>
                        <br />
                        <span>收藏时间: {new Date(f.createdAt).toLocaleDateString()}</span>
                      </div>
                    }
                  />
                  <div style={{ marginTop: 8 }}>
                    <HeartOutlined /> {f.project?.likesCount || 0} 点赞
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>
    </div>
  );
}