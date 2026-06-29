import { useEffect, useState } from 'react';
import { Card, Row, Col, List, Avatar, Tag, Spin, Tabs, Badge } from 'antd';
import {
  CrownOutlined,
  FireOutlined,
  TrophyOutlined,
  StarOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const typeMap = {
  daily: { label: 'Daily', icon: <FireOutlined />, color: '#f5222d' },
  weekly: { label: 'Weekly', icon: <StarOutlined />, color: '#fa8c16' },
  all_time: { label: 'All Time', icon: <TrophyOutlined />, color: '#faad14' },
};

export default function ClassLeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [stats, setStats] = useState({ totalClasses: 0, topScore: 0 });
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState('all_time');
  const navigate = useNavigate();

  const fetchLeaderboard = async (type) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/class-leaderboard?type=${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json());

      setLeaderboard(res?.result || []);
      setStats(res?.stats || { totalClasses: 0, topScore: 0 });
    } catch (error) {
      console.error('Failed to fetch class leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard(activeType);
  }, [activeType]);

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
            Class Leaderboard
          </span>
        }
        extra={
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
              {stats.totalClasses}
            </div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>Total Classes</div>
          </div>
        }
      >
        <Tabs
          activeKey={activeType}
          onChange={setActiveType}
          style={{ marginBottom: 24 }}
        >
          {Object.entries(typeMap).map(([key, { label, icon, color }]) => (
            <Tabs.TabPane
              key={key}
              tab={<span style={{ color }}>{icon} {label}</span>}
            />
          ))}
        </Tabs>

        {leaderboard.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#8c8c8c' }}>
            No class leaderboard data available yet
          </div>
        ) : (
          <List
            dataSource={leaderboard}
            renderItem={(item, index) => {
              const rank = item.rank || (index + 1);
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
                        {item.class?.className?.[0] || 'C'}
                      </Avatar>
                    </Col>
                    <Col span={10}>
                      <div style={{ fontWeight: 'bold' }}>
                        {item.class?.className || 'Unknown Class'}
                      </div>
                      <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                        <TeamOutlined /> {item.class?.studentNum || 0} students
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
                      <div style={{ fontSize: 11, color: '#8c8c8c' }}>points</div>
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
