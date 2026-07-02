import { useEffect, useState, useCallback } from 'react';
import { Card, Row, Col, Tabs, Avatar, Button, Modal, Form, Input, message, Empty, Select, Space, DatePicker } from 'antd';
import { HeartOutlined, HeartFilled, EyeOutlined, UserOutlined, PlusOutlined, CommentOutlined, SearchOutlined, DeleteOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { getCommunityPostsFiltered, createCommunityPost, deleteCommunityPost, toggleLike, getUserLikedPosts, getCommunityPost } from '../../services/api';
import { safeGetJSON } from '../../utils/storage';

const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

export default function CommunityPage() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(tab || 'school');
  const [posts, setPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    sortBy: 'createdAt',
    sortOrder: 'DESC',
    search: '',
    startDate: null,
    endDate: null,
  });
  const [form] = Form.useForm();

  const currentUser = safeGetJSON('user', {});
  const currentUserId = currentUser.id;

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCommunityPostsFiltered(activeTab, {
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        startDate: filters.startDate,
        endDate: filters.endDate,
        search: filters.search || undefined,
      });
      setPosts(res?.result || []);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, filters.sortBy, filters.sortOrder, filters.startDate, filters.endDate, filters.search]);

  const fetchLikedPosts = useCallback(async () => {
    if (currentUserId) {
      try {
        const res = await getUserLikedPosts(currentUserId);
        const liked = Array.isArray(res) ? res : res?.result;
        setLikedPosts(liked || []);
      } catch (error) {
        console.error('Failed to fetch liked posts:', error);
      }
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    fetchLikedPosts();
  }, [fetchLikedPosts]);

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleDateChange = (dates, dateStrings) => {
    setFilters(prev => ({
      ...prev,
      startDate: dates && dates[0] ? dates[0].toISOString() : null,
      endDate: dates && dates[1] ? dates[1].toISOString() : null,
    }));
  };

  const handleLike = async (postId) => {
    if (!currentUserId) {
      message.warning('请先登录');
      return;
    }
    try {
      const result = await toggleLike(postId);
      const data = result?.result;
      setPosts(posts.map(post => {
        if (post.id === postId) {
          return { ...post, likesCount: data?.likesCount ?? post.likesCount };
        }
        return post;
      }));
      if (data?.liked) {
        setLikedPosts([...likedPosts, postId]);
      } else {
        setLikedPosts(likedPosts.filter(id => id !== postId));
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
      message.error('点赞操作失败');
    }
  };

  const handleComment = (postId) => {
    navigate(`/community/work/${postId}`);
  };

  const handleCardClick = (postId) => {
    // Fire-and-forget: register a view on the server without blocking navigation
    getCommunityPost(postId).catch((error) => {
      console.error('Failed to record view:', error);
    });
    navigate(`/community/work/${postId}`);
  };

  const handleCreatePost = async (values) => {
    if (!currentUserId) {
      message.warning('请先登录');
      return;
    }
    try {
      await createCommunityPost({
        title: values.title,
        description: values.description,
        thumbnail: values.thumbnail || 'https://scratch.mit.edu/static/preview-f66a8e3c0f1d3b9c.png',
        projectUrl: values.projectUrl,
        userId: currentUserId,
        scope: activeTab,
      });
      message.success('作品分享成功！');
      setModalVisible(false);
      form.resetFields();
      fetchPosts();
    } catch (error) {
      console.error('Failed to create post:', error);
      message.error('分享作品失败');
    }
  };

  const handleDeletePost = (postId) => {
    Modal.confirm({
      title: '删除作品',
      content: '确定要删除此作品吗？此操作不可撤销。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteCommunityPost(postId);
          message.success('作品已删除');
          fetchPosts();
        } catch (error) {
          console.error('Failed to delete post:', error);
          message.error('删除作品失败');
        }
      },
    });
  };

  return (
    <div style={{ padding: 24 }}>
      <Card
        title="创意社区"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
            分享作品
          </Button>
        }
      >
        <Space wrap style={{ marginBottom: 16 }}>
          <Input.Search
            placeholder="搜索作品..."
            allowClear
            style={{ width: 200 }}
            onSearch={(value) => handleFilterChange('search', value)}
          />
          <Select
            value={filters.sortBy}
            onChange={(value) => handleFilterChange('sortBy', value)}
            style={{ width: 140 }}
          >
            <Option value="createdAt">最新</Option>
            <Option value="likesCount">最多点赞</Option>
            <Option value="viewsCount">最多浏览</Option>
          </Select>
          <RangePicker onChange={handleDateChange} />
        </Space>

        <Tabs activeKey={activeTab} onChange={handleTabChange} items={[
          { key: 'school', label: '校园作品' },
          { key: 'national', label: '全国作品' },
        ]} />

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>加载中...</div>
        ) : posts.length === 0 ? (
          <Empty description="暂无作品，快来分享第一个吧！" />
        ) : (
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            {posts.map(post => (
              <Col xs={24} sm={12} md={8} lg={6} key={post.id}>
                <Card
                  hoverable
                  cover={
                    <div onClick={() => handleCardClick(post.id)} style={{ height: 150, overflow: 'hidden', cursor: 'pointer' }}>
                      <img
                        alt={post.title}
                        src={post.thumbnail || 'https://scratch.mit.edu/static/preview-f66a8e3c0f1d3b9c.png'}
                        style={{ height: '100%', width: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  }
                  actions={[
                    <Button
                      type="text"
                      icon={likedPosts.includes(post.id) ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(post.id);
                      }}
                    >
                      {post.likesCount || 0}
                    </Button>,
                    <Button
                      type="text"
                      icon={<CommentOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleComment(post.id);
                      }}
                    >
                      {post.commentsCount || 0}
                    </Button>,
                    <Button type="text" icon={<EyeOutlined />}>
                      {post.viewsCount || 0}
                    </Button>,
                    currentUserId === post.userId && (
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePost(post.id);
                        }}
                      />
                    ),
                  ].filter(Boolean)}
                >
                  <Card.Meta
                    title={<span onClick={() => handleCardClick(post.id)} style={{ cursor: 'pointer' }}>{post.title}</span>}
                    description={
                      <span>
                        <Avatar size="small" icon={<UserOutlined />} /> {post.userId ? `用户 ${post.userId}` : '匿名'}
                      </span>
                    }
                  />
                  {post.description && (
                    <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
                      {post.description.length > 50 ? `${post.description.substring(0, 50)}...` : post.description}
                    </div>
                  )}
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>

      <Modal
        title="分享你的作品"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} onFinish={handleCreatePost} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="请输入作品标题" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="描述你的作品（选填）" />
          </Form.Item>
          <Form.Item name="thumbnail" label="缩略图链接">
            <Input placeholder="图片链接（选填，将使用默认图）" />
          </Form.Item>
          <Form.Item name="projectUrl" label="项目链接">
            <Input placeholder="项目链接（选填）" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              分享
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}