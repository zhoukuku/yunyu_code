import { useEffect, useState, useCallback } from 'react';
import { Card, Avatar, Button, Tabs, List, Spin, message, Empty } from 'antd';
import { UserOutlined, PlusOutlined, CheckOutlined } from '@ant-design/icons';
import { useParams, Link } from 'react-router-dom';
import { followUser, unfollowUser, getFollowers, getFollowing, getFollowStats, checkFollow, getUserByUsername } from '../../services/api';
import { safeGetJSON } from '../../utils/storage';

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

  const currentUser = safeGetJSON('user', {});
  const isOwnProfile = currentUser.username === username;

  const fetchUserData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch user by username from backend
      const userRes = await getUserByUsername(username);

      if (userRes.status === 200 && userRes.result) {
        setUser(userRes.result);

        // Fetch follow stats
        const statsRes = await getFollowStats(userRes.result.id);
        if (statsRes.status === 200) {
          setFollowStats(statsRes.result);
        }

        // Check if current user is following this user
        if (!isOwnProfile && currentUser.id) {
          try {
            const followRes = await checkFollow(userRes.result.id);
            if (followRes.status === 200) {
              setIsFollowing(followRes.result.isFollowing);
            }
          } catch (e) {
            console.error('Failed to check follow status:', e);
          }
        }
      } else {
        message.error('未找到用户');
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      message.error('加载用户资料失败');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [username, isOwnProfile, currentUser.id]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

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
      message.warning('请先登录');
      return;
    }

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(user.id);
        setIsFollowing(false);
        setFollowStats(prev => ({ ...prev, followersCount: prev.followersCount - 1 }));
        message.success('已取消关注');
      } else {
        await followUser(user.id);
        setIsFollowing(true);
        setFollowStats(prev => ({ ...prev, followersCount: prev.followersCount + 1 }));
        message.success('已关注');
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error);
      message.error(error.response?.data?.message || '关注操作失败');
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
        <Empty description="未找到用户" />
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
              <span><strong>{followStats.followersCount}</strong> 粉丝</span>
              <span><strong>{followStats.followingCount}</strong> 关注</span>
            </div>
          </div>
          {!isOwnProfile && (
            <Button
              type={isFollowing ? 'default' : 'primary'}
              icon={isFollowing ? <CheckOutlined /> : <PlusOutlined />}
              onClick={handleFollow}
              loading={followLoading}
            >
              {isFollowing ? '已关注' : '关注'}
            </Button>
          )}
          {isOwnProfile && (
            <Link to="/settings">
              <Button>编辑资料</Button>
            </Link>
          )}
        </div>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Tabs defaultActiveKey="followers" onChange={onTabChange} items={[
          { key: 'followers', label: `粉丝 (${followStats.followersCount})`, children: (
            <List
              loading={listLoading}
              dataSource={followers}
              renderItem={(item) => (
                <List.Item
                  key={item.id}
                  actions={[
                    !isOwnProfile && item.id !== currentUser.id && (
                      <Button size="small" key="follow">
                        {item.isFollowing ? '已关注' : '关注'}
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
              locale={{ emptyText: '暂无粉丝' }}
            />
          )},
          { key: 'following', label: `关注 (${followStats.followingCount})`, children: (
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
              locale={{ emptyText: '暂未关注任何人' }}
            />
          )},
        ]} />
      </Card>
    </div>
  );
}