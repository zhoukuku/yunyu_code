import { useEffect, useState } from 'react';
import { Card, Row, Col, Tabs, Avatar, Button, Modal, Form, Input, message, Empty, Select, Space, DatePicker } from 'antd';
import { HeartOutlined, HeartFilled, EyeOutlined, UserOutlined, PlusOutlined, CommentOutlined, SearchOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { getCommunityPostsFiltered, createCommunityPost, toggleLike, getUserLikedPosts, getCommunityPost } from '../../services/api';

const { TabPane } = Tabs;
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

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = currentUser.id;

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const data = await getCommunityPostsFiltered(activeTab, {
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        startDate: filters.startDate,
        endDate: filters.endDate,
        search: filters.search || undefined,
      });
      setPosts(data || []);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLikedPosts = async () => {
    if (currentUserId) {
      try {
        const liked = await getUserLikedPosts(currentUserId);
        setLikedPosts(liked || []);
      } catch (error) {
        console.error('Failed to fetch liked posts:', error);
      }
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchLikedPosts();
  }, [activeTab]);

  useEffect(() => {
    fetchPosts();
  }, [filters]);

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
      message.warning('Please login first');
      return;
    }
    try {
      const result = await toggleLike(postId, currentUserId);
      setPosts(posts.map(post => {
        if (post.id === postId) {
          return { ...post, likesCount: result.likesCount };
        }
        return post;
      }));
      if (result.liked) {
        setLikedPosts([...likedPosts, postId]);
      } else {
        setLikedPosts(likedPosts.filter(id => id !== postId));
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
      message.error('Failed to toggle like');
    }
  };

  const handleComment = (postId) => {
    navigate(`/community/work/${postId}`);
  };

  const handleCardClick = async (postId) => {
    try {
      await getCommunityPost(postId);
    } catch (error) {
      console.error('Failed to view post:', error);
    }
    navigate(`/community/work/${postId}`);
  };

  const handleCreatePost = async (values) => {
    if (!currentUserId) {
      message.warning('Please login first');
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
      message.success('Work shared successfully!');
      setModalVisible(false);
      form.resetFields();
      fetchPosts();
    } catch (error) {
      console.error('Failed to create post:', error);
      message.error('Failed to share work');
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Card
        title="Creative Community"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
            Share Work
          </Button>
        }
      >
        <Space wrap style={{ marginBottom: 16 }}>
          <Input.Search
            placeholder="Search works..."
            allowClear
            style={{ width: 200 }}
            onSearch={(value) => handleFilterChange('search', value)}
          />
          <Select
            value={filters.sortBy}
            onChange={(value) => handleFilterChange('sortBy', value)}
            style={{ width: 140 }}
          >
            <Option value="createdAt">Latest</Option>
            <Option value="likesCount">Most Liked</Option>
            <Option value="viewsCount">Most Viewed</Option>
          </Select>
          <RangePicker onChange={handleDateChange} />
        </Space>

        <Tabs activeKey={activeTab} onChange={handleTabChange}>
          <TabPane tab="School Works" key="school" />
          <TabPane tab="National Works" key="national" />
        </Tabs>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div>
        ) : posts.length === 0 ? (
          <Empty description="No works yet. Be the first to share!" />
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
                  ]}
                >
                  <Card.Meta
                    title={<span onClick={() => handleCardClick(post.id)} style={{ cursor: 'pointer' }}>{post.title}</span>}
                    description={
                      <span>
                        <Avatar size="small" icon={<UserOutlined />} /> {post.userId ? `User ${post.userId}` : 'Anonymous'}
                      </span>
                    }
                  />
                  {post.description && (
                    <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
                      {post.description.length > 50 ? post.description.substring(0, 50) + '...' : post.description}
                    </div>
                  )}
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>

      <Modal
        title="Share Your Work"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} onFinish={handleCreatePost} layout="vertical">
          <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Please enter a title' }]}>
            <Input placeholder="Enter work title" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Describe your work (optional)" />
          </Form.Item>
          <Form.Item name="thumbnail" label="Thumbnail URL">
            <Input placeholder="Image URL (optional, will use default)" />
          </Form.Item>
          <Form.Item name="projectUrl" label="Project URL">
            <Input placeholder="Project link (optional)" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Share
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}