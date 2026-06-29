import { useEffect, useState } from 'react';
import { Card, List, Avatar, Tabs, Button, Spin, Empty, Tag } from 'antd';
import { UserOutlined, HeartOutlined, CommentOutlined, UserAddOutlined, FileImageOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getFollowingActivities, getGlobalActivities } from '../../services/api';

const { TabPane } = Tabs;

const activityTypeConfig = {
  post: { icon: <FileImageOutlined />, color: '#1890ff', text: 'posted' },
  comment: { icon: <CommentOutlined />, color: '#52c41a', text: 'commented' },
  like: { icon: <HeartOutlined />, color: '#ff4d4f', text: 'liked' },
  follow: { icon: <UserAddOutlined />, color: '#722ed1', text: 'followed' },
};

export default function ActivityPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('global');
  const [activities, setActivities] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isLoggedIn = !!currentUser.id;

  const fetchActivities = async (type, pageNum = 1) => {
    if (type === 'following' && !isLoggedIn) {
      setActivities([]);
      setTotal(0);
      return;
    }

    setLoading(pageNum === 1);
    if (pageNum > 1) setLoadingMore(true);

    try {
      let data;
      if (type === 'following') {
        data = await getFollowingActivities(pageNum, 20);
      } else {
        data = await getGlobalActivities(pageNum, 20);
      }

      const result = data?.result || data || { activities: [], total: 0 };

      if (pageNum === 1) {
        setActivities(result.activities || []);
      } else {
        setActivities(prev => [...prev, ...(result.activities || [])]);
      }
      setTotal(result.total || 0);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchActivities(activeTab, 1);
  }, [activeTab]);

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchActivities(activeTab, nextPage);
  };

  const handleUserClick = (userId) => {
    navigate(`/users/${userId}`);
  };

  const handleActivityClick = (activity) => {
    if (activity.type === 'post' || activity.type === 'like' || activity.type === 'comment') {
      if (activity.targetId) {
        navigate(`/community/work/${activity.targetId}`);
      }
    }
  };

  const renderActivityContent = (activity) => {
    const config = activityTypeConfig[activity.type] || { icon: null, color: '#000', text: activity.type };

    return (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <Avatar
          icon={<UserOutlined />}
          src={activity.user?.avatar}
          onClick={() => handleUserClick(activity.userId)}
          style={{ cursor: 'pointer', flexShrink: 0 }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span
              style={{ fontWeight: 500, cursor: 'pointer' }}
              onClick={() => handleUserClick(activity.userId)}
            >
              {activity.user?.name || activity.user?.username || `User ${activity.userId}`}
            </span>
            <Tag icon={config.icon} color={config.color} style={{ margin: 0 }}>
              {config.text}
            </Tag>
          </div>
          <div
            style={{
              marginTop: 4,
              color: '#595959',
              cursor: activity.type !== 'follow' ? 'pointer' : 'default',
            }}
            onClick={() => handleActivityClick(activity)}
          >
            {activity.content}
          </div>
          {activity.extra && activity.type === 'post' && (
            <div style={{ marginTop: 8 }}>
              <img
                src={activity.extra}
                alt="thumbnail"
                style={{
                  width: 80,
                  height: 60,
                  objectFit: 'cover',
                  borderRadius: 4,
                  border: '1px solid #f0f0f0',
                }}
              />
            </div>
          )}
          <div style={{ marginTop: 4, fontSize: 12, color: '#8c8c8c' }}>
            {activity.createdAt ? new Date(activity.createdAt).toLocaleString() : ''}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: 24 }}>
      <Card title="Activity Feed">
        <Tabs activeKey={activeTab} onChange={handleTabChange}>
          <TabPane tab="Global" key="global" />
          {isLoggedIn && <TabPane tab="Following" key="following" />}
        </Tabs>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : activities.length === 0 ? (
          <Empty
            description={
              activeTab === 'following'
                ? "You're not following anyone yet. Follow users to see their activities here!"
                : "No activities yet. Be the first to share something!"
            }
          />
        ) : (
          <List
            dataSource={activities}
            renderItem={(activity) => (
              <List.Item
                style={{
                  padding: '12px 0',
                  borderBottom: '1px solid #f0f0f0',
                  cursor: 'pointer',
                }}
                onClick={() => handleActivityClick(activity)}
              >
                {renderActivityContent(activity)}
              </List.Item>
            )}
          />
        )}

        {!loading && activities.length > 0 && activities.length < total && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Button onClick={handleLoadMore} loading={loadingMore}>
              Load More
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}