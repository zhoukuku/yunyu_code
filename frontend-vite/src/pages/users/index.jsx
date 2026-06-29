import { useEffect, useState } from 'react';
import { Card, Avatar, Button, Tabs, List, Spin, message, Empty } from 'antd';
import { UserOutlined, PlusOutlined, CheckOutlined } from '@ant-design/icons';
import { useParams, Link } from 'react-router-dom';
import { followUser, unfollowUser, getFollowers, getFollowing, getFollowStats, checkFollow } from '../../services/api';

const { TabPane } = Tabs;

export default function UsersPage() {
  const { username } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [followStats, setFollowStats] = useState({ followersCount: 0, followingCount: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [listLoading, setListLoading] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isOwnProfile = currentUser.username === username;

  useEffect(() => {
    fetchUserData();
  }, [username]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // Fetch user by username from backend
      const userRes = await fetch(`/api/users/username/${username}`);
      const userData = await userRes.json();

      if (userData.status === 200 && userData.result) {
        setUser(userData.result);

        // Fetch follow stats
        const statsRes = await getFollowStats(userData.result.id);
        if (statsRes.status === 200) {
          setFollowStats(statsRes.result);
        }

        // Check if current user is following this user
        if (!isOwnProfile && currentUser.id) {
          try {
            const followRes = await checkFollow(userData.result.id);
            if (followRes.status === 200) {
              setIsFollowing(followRes.result.isFollowing);
            }
          } catch (e) {
            console.error('Failed to check follow status:', e);
          }
        }
      } else {
        message.error('User not found');
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      message.error('Failed to load user profile');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowers = async () => {
    if (!user) return;
    setListLoading(true);
    try {
      const res = await getFollowers(user.id);
      if (res.status === 200) {
        setFollowers(res.result || []);
      }
    } catch (error) {
      console.error('Failed to fetch followers:', error);
    } finally {
      setListLoading(false);
    }
  };

  const fetchFollowing = async () => {
    if (!user) return;
    setListLoading(true);
    try {
      const res = await getFollowing(user.id);
      if (res.status === 200) {
        setFollowing(res.result || []);
      }
    } catch (error) {
      console.error('Failed to fetch following:', error);
    } finally {
      setListLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser.id) {
      message.warning('Please login first');
      return;
    }

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(user.id);
        setIsFollowing(false);
        setFollowStats(prev => ({ ...prev, followersCount: prev.followersCount - 1 }));
        message.success('Unfollowed successfully');
      } else {
        await followUser(user.id);
        setIsFollowing(true);
        setFollowStats(prev => ({ ...prev, followersCount: prev.followersCount + 1 }));
        message.success('Followed successfully');
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error);
      message.error(error.response?.data?.message || 'Failed to toggle follow');
    } finally {
      setFollowLoading(false);
    }
  };

  const onTabChange = (key) => {
    if (key === 'followers') {
      fetchFollowers();
    } else if (key === 'following') {
      fetchFollowing();
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: 24 }}>
        <Empty description="User not found" />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Avatar size={80} icon={<UserOutlined />} src={user.avatar} />
          <div style={{ flex: 1 }}>
            <h2 style={{ marginBottom: 8 }}>{user.nickname || user.name || user.username}</h2>
            <p style={{ color: '#888', marginBottom: 4 }}>@{user.username}</p>
            <div style={{ display: 'flex', gap: 24, marginTop: 12 }}>
              <span><strong>{followStats.followersCount}</strong> Followers</span>
              <span><strong>{followStats.followingCount}</strong> Following</span>
            </div>
          </div>
          {!isOwnProfile && (
            <Button
              type={isFollowing ? 'default' : 'primary'}
              icon={isFollowing ? <CheckOutlined /> : <PlusOutlined />}
              onClick={handleFollow}
              loading={followLoading}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </Button>
          )}
          {isOwnProfile && (
            <Link to="/settings">
              <Button>Edit Profile</Button>
            </Link>
          )}
        </div>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Tabs defaultActiveKey="followers" onChange={onTabChange}>
          <TabPane tab={`Followers (${followStats.followersCount})`} key="followers">
            <List
              loading={listLoading}
              dataSource={followers}
              renderItem={(item) => (
                <List.Item
                  key={item.id}
                  actions={[
                    !isOwnProfile && item.id !== currentUser.id && (
                      <Button size="small" key="follow">
                        {item.isFollowing ? 'Following' : 'Follow'}
                      </Button>
                    )
                  ].filter(Boolean)}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} src={item.avatar} />}
                    title={<Link to={`/users/${item.username}`}>{item.nickname || item.name || item.username}</Link>}
                    description={<span style={{ color: '#888' }}>@{item.username}</span>}
                  />
                </List.Item>
              )}
              locale={{ emptyText: 'No followers yet' }}
            />
          </TabPane>
          <TabPane tab={`Following (${followStats.followingCount})`} key="following">
            <List
              loading={listLoading}
              dataSource={following}
              renderItem={(item) => (
                <List.Item
                  key={item.id}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} src={item.avatar} />}
                    title={<Link to={`/users/${item.username}`}>{item.nickname || item.name || item.username}</Link>}
                    description={<span style={{ color: '#888' }}>@{item.username}</span>}
                  />
                </List.Item>
              )}
              locale={{ emptyText: 'Not following anyone yet' }}
            />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
}