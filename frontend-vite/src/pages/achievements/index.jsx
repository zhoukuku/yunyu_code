import { useEffect, useState } from 'react';
import { Card, Row, Col, Progress, Tag, Empty, Spin, Tabs, Button } from 'antd';
import {
  TrophyOutlined,
  BookOutlined,
  CodeOutlined,
  ShareAltOutlined,
  MessageOutlined,
  TeamOutlined,
  StarOutlined,
  FireOutlined,
  CalendarOutlined,
  CrownOutlined,
  UnlockOutlined,
  LockOutlined,
} from '@ant-design/icons';

const iconMap = {
  trophy: <TrophyOutlined />,
  book: <BookOutlined />,
  code: <CodeOutlined />,
  share: <ShareAltOutlined />,
  message: <MessageOutlined />,
  team: <TeamOutlined />,
  star: <StarOutlined />,
  fire: <FireOutlined />,
  calendar: <CalendarOutlined />,
  crown: <CrownOutlined />,
};

const colorMap = {
  trophy: '#faad14',
  book: '#1890ff',
  code: '#52c41a',
  share: '#722ed1',
  message: '#13c2c2',
  team: '#eb2f96',
  star: '#fa8c16',
  fire: '#f5222d',
  calendar: '#2f54eb',
  crown: '#d4af37',
};

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState([]);
  const [stats, setStats] = useState({ total: 0, unlocked: 0, locked: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const fetchAchievements = async () => {
    setLoading(true);
    try {
      const [achievementsRes, statsRes] = await Promise.all([
        fetch('/api/achievements', {
          headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        }).then(r => r.json()),
        fetch('/api/achievements/stats', {
          headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        }).then(r => r.json()),
      ]);

      setAchievements(achievementsRes?.result || []);
      setStats(statsRes?.result || { total: 0, unlocked: 0, locked: 0 });
    } catch (error) {
      console.error('Failed to fetch achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  const filteredAchievements = achievements.filter(a => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unlocked') return a.unlocked;
    if (activeTab === 'locked') return !a.unlocked;
    return true;
  });

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const progressPercent = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

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
        title="Achievement Badges"
        extra={
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
              {unlockedCount} / {totalCount}
            </div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>Badges Unlocked</div>
          </div>
        }
      >
        <Progress
          percent={progressPercent}
          status="active"
          strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
          format={(percent) => `${percent}% Complete`}
          style={{ marginBottom: 24 }}
        />

        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <Tabs.TabPane tab={`All (${totalCount})`} key="all" />
          <Tabs.TabPane tab={`Unlocked (${unlockedCount})`} key="unlocked" />
          <Tabs.TabPane tab={`Locked (${totalCount - unlockedCount})`} key="locked" />
        </Tabs>

        {filteredAchievements.length === 0 ? (
          <Empty description="No achievements in this category" style={{ padding: 40 }} />
        ) : (
          <Row gutter={[16, 16]}>
            {filteredAchievements.map((achievement) => {
              const icon = iconMap[achievement.icon] || <StarOutlined />;
              const color = achievement.unlocked ? colorMap[achievement.icon] || '#1890ff' : '#d9d9d9';
              const progress = Math.min((achievement.progress / achievement.target) * 100, 100);

              return (
                <Col xs={24} sm={12} md={8} lg={6} key={achievement.id}>
                  <Card
                    hoverable
                    style={{
                      textAlign: 'center',
                      background: achievement.unlocked
                        ? 'linear-gradient(135deg, #f0f5ff 0%, #fff 100%)'
                        : '#fafafa',
                      border: achievement.unlocked ? `2px solid ${color}` : '1px solid #d9d9d9',
                    }}
                    bodyStyle={{ padding: 24 }}
                  >
                    <div
                      style={{
                        fontSize: 48,
                        color,
                        marginBottom: 16,
                        filter: achievement.unlocked ? 'none' : 'grayscale(100%)',
                      }}
                    >
                      {icon}
                    </div>

                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 'bold',
                        marginBottom: 8,
                        color: achievement.unlocked ? '#262626' : '#8c8c8c',
                      }}
                    >
                      {achievement.name}
                    </div>

                    <div
                      style={{
                        fontSize: 12,
                        color: '#8c8c8c',
                        marginBottom: 16,
                        minHeight: 36,
                      }}
                    >
                      {achievement.description}
                    </div>

                    {!achievement.unlocked ? (
                      <div>
                        <Progress
                          type="circle"
                          percent={Math.round(progress)}
                          size={80}
                          strokeColor={color}
                          format={() => (
                            <span style={{ fontSize: 12 }}>
                              {achievement.progress}/{achievement.target}
                            </span>
                          )}
                        />
                        <div style={{ marginTop: 8, fontSize: 11, color: '#8c8c8c' }}>
                          <LockOutlined /> Locked
                        </div>
                      </div>
                    ) : (
                      <div>
                        <Tag color={color} icon={<UnlockOutlined />} style={{ marginBottom: 8 }}>
                          Unlocked
                        </Tag>
                        {achievement.unlockedAt && (
                          <div style={{ fontSize: 11, color: '#8c8c8c' }}>
                            {new Date(achievement.unlockedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </Card>
    </div>
  );
}