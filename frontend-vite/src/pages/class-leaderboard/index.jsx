import { useCallback, useEffect, useRef, useState } from 'react';
import { Card, Row, Col, List, Avatar, Tag, Spin, Tabs, Badge, Button } from 'antd';
import {
  CrownOutlined,
  FireOutlined,
  TrophyOutlined,
  StarOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { safeGetItem } from '../../utils/storage';

const typeMap = {
  daily: { label: '每日', icon: <FireOutlined />, color: '#f5222d' },
  weekly: { label: '每周', icon: <StarOutlined />, color: '#fa8c16' },
  all_time: { label: '总榜', icon: <TrophyOutlined />, color: '#faad14' },
};

export default function ClassLeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [stats, setStats] = useState({ totalClasses: 0, topScore: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeType, setActiveType] = useState('all_time');
  const navigate = useNavigate();
  const abortRef = useRef(null);

  const fetchLeaderboard = useCallback(async (type) => {
    // Cancel any in-flight request to prevent race conditions when switching tabs
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const token = safeGetItem('accessToken');
      const res = await fetch(`/api/class-leaderboard?type=${type}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      }).then(r => r.json());

      if (controller.signal.aborted) return;

      setLeaderboard(res?.result || []);
      setStats(res?.stats || { totalClasses: 0, topScore: 0 });
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Failed to fetch class leaderboard:', err);
      setError(err.message || '加载班级排行榜失败，请重试。');
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard(activeType);
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [activeType, fetchLeaderboard]);

  const getRankBadge = (rank) => {
    if (rank === 1) return <Badge count={<CrownOutlined />} style={{ backgroundColor: '#faad14' }} />;
    if (rank === 2) return <Badge count="2" style={{ backgroundColor: '#c0c0c0' }} />;
    if (rank === 3) return <Badge count="3" style={{ backgroundColor: '#cd7f32' }} />;
    return <span style={{ color: '#8c8c8c', fontSize: 14 }}>#{rank}</span>;
  };

  const getRankStyle = (rank) => {
    if (rank === 1) return { background: 'linear-gradient(135deg, #fff9e6 0%, #fff 100%)', border: '2px solid #faad14' };
    if (rank === 2) return { background: 'linear-gradient(135deg, #f5f5f5 0%, #fff 100%)', border: '2px solid #c0c0c0' };
    if (rank === 3) return { background: 'linear-gradient(135deg, #fff2e6 0%, #fff 100%)', border: '2px solid #cd7f32' };
    return { background: '#fff' };
  };

  // --- Error state ---
  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <div style={{ color: '#ff4d4f', fontSize: 16, marginBottom: 24 }}>{error}</div>
        <Button type="primary" onClick={() => fetchLeaderboard(activeType)}>重试</Button>
      </div>
    );
  }

  // --- Loading state ---
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <span>
            <TeamOutlined style={{ color: '#1890ff', marginRight: 8 }} />
            班级排行榜
          </span>
        }
        extra={
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
              {stats.totalClasses}
            </div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>班级总数</div>
          </div>
        }
      >
        <Tabs
          activeKey={activeType}
          onChange={setActiveType}
          style={{ marginBottom: 24 }}
          items={Object.entries(typeMap).map(([key, { label, icon, color }]) => ({
            key,
            label: <span style={{ color }}>{icon} {label}</span>,
          }))}
        />

        {leaderboard.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#8c8c8c' }}>
            暂无班级排行榜数据
          </div>
        ) : (
          <List
            dataSource={leaderboard}
            renderItem={(item, index) => {
              const rank = item.rank ?? (index + 1);
              const typeConfig = typeMap[item.type] || typeMap.all_time;

              return (
                <List.Item
                  style={{
                    ...getRankStyle(rank),
                    borderRadius: 8,
                    marginBottom: 8,
                    padding: '12px 16px',
                  }}
                >
                  <Row gutter={16} align="middle" style={{ width: '100%' }}>
                    <Col span={2} style={{ textAlign: 'center' }}>
                      {getRankBadge(rank)}
                    </Col>
                    <Col span={4}>
                      <Avatar
                        style={{ backgroundColor: '#1890ff' }}
                        icon={<TeamOutlined />}
                      >
                        {item.class?.className?.[0] || '班'}
                      </Avatar>
                    </Col>
                    <Col span={10}>
                      <div style={{ fontWeight: 'bold' }}>
                        {item.class?.className || '未知班级'}
                      </div>
                      <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                        <TeamOutlined /> {item.class?.studentNum || 0} 名学生
                      </div>
                    </Col>
                    <Col span={4} style={{ textAlign: 'center' }}>
                      <Tag color={typeConfig.color} icon={typeConfig.icon}>
                        {item.period}
                      </Tag>
                    </Col>
                    <Col span={4} style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 20, fontWeight: 'bold', color: typeConfig.color }}>
                        {item.totalScore}
                      </div>
                      <div style={{ fontSize: 11, color: '#8c8c8c' }}>分</div>
                    </Col>
                  </Row>
                </List.Item>
              );
            }}
          />
        )}
      </Card>
    </div>
  );
}
