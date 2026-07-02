import { useEffect, useState, useCallback } from 'react';
import { Card, Row, Col, Progress, Tag, Empty, Tabs, message, Skeleton } from 'antd';
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
import { getAchievements, getAchievementStats } from '../../services/api';

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

  const fetchAchievements = useCallback(async () => {
    setLoading(true);
    try {
      const [achievementsRes, statsRes] = await Promise.all([
        getAchievements(),
        getAchievementStats(),
      ]);

      setAchievements(achievementsRes?.result || []);
      setStats(statsRes?.result || { total: 0, unlocked: 0, locked: 0 });
    } catch (error) {
      console.error('Failed to fetch achievements:', error);
      message.error('加载成就失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

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
      <div style={{ padding: 24 }}>
        <Card
          title="成就徽章"
          extra={
            <div style={{ textAlign: 'right' }}>
              <Skeleton.Input active size="small" style={{ width: 80 }} />
              <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>已解锁徽章</div>
            </div>
          }
        >
          <Skeleton.Input active block style={{ marginBottom: 24, height: 8 }} />

          <Tabs
            activeKey="all"
            items={[
              { key: 'all', label: '全部', disabled: true },
              { key: 'unlocked', label: '已解锁', disabled: true },
              { key: 'locked', label: '未解锁', disabled: true },
            ]}
          />

          <Row gutter={[16, 16]}>
            {[1, 2, 3, 4].map((i) => (
              <Col xs={24} sm={12} md={8} lg={6} key={i}>
                <Card style={{ textAlign: 'center', background: '#fafafa', border: '1px solid #d9d9d9' }}>
                  <Skeleton.Avatar
                    active
                    size={48}
                    shape="circle"
                    style={{ display: 'block', margin: '0 auto 16px auto' }}
                  />
                  <Skeleton.Input active size="small" style={{ display: 'block', margin: '0 auto 8px auto', width: 80 }} />
                  <Skeleton.Input active size="small" style={{ display: 'block', margin: '0 auto 16px auto', width: '90%' }} />
                  <Skeleton active paragraph={{ rows: 1 }} title={false} />
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Card
        title="成就徽章"
        extra={
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
              {unlockedCount} / {totalCount}
            </div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>已解锁徽章</div>
          </div>
        }
      >
        <Progress
          percent={progressPercent}
          status="active"
          strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
          format={(percent) => `${percent}% 完成`}
          style={{ marginBottom: 24 }}
        />

        <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
          { key: 'all', label: `全部 (${totalCount})` },
          { key: 'unlocked', label: `已解锁 (${unlockedCount})` },
          { key: 'locked', label: `未解锁 (${totalCount - unlockedCount})` },
        ]} />

        {filteredAchievements.length === 0 ? (
          <Empty description="此分类暂无成就" style={{ padding: 40 }} />
        ) : (
          <Row gutter={[16, 16]}>
            {filteredAchievements.map((achievement) => {
              const icon = iconMap[achievement.icon] || <StarOutlined />;
              const color = achievement.unlocked ? colorMap[achievement.icon] || '#1890ff' : '#d9d9d9';
              const target = achievement.target || 1;
              const progress = Math.min((achievement.progress / target) * 100, 100);

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
                    styles={{ body: { padding: 24 } }}
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
                          <LockOutlined /> 未解锁
                        </div>
                      </div>
                    ) : (
                      <div>
                        <Tag color={color} icon={<UnlockOutlined />} style={{ marginBottom: 8 }}>
                          已解锁
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