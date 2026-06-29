import { useEffect, useState } from 'react';
import { Card, Avatar, Button, Input, List, Spin, message, Modal } from 'antd';
import { HeartOutlined, HeartFilled, ArrowLeftOutlined, UserOutlined, DeleteOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { getCommunityPost, getPostComments, createComment, deleteComment, toggleLike, checkUserLiked } from '../../../services/api';

const { TextArea } = Input;

export default function WorkDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = currentUser.id;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [postData, commentsData] = await Promise.all([
        getCommunityPost(id),
        getPostComments(id),
      ]);
      setPost(postData);
      setComments(commentsData || []);

      if (currentUserId && postData) {
        const likedRes = await checkUserLiked(postData.id, currentUserId);
        setLiked(likedRes.liked);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      message.error('Failed to load work details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleLike = async () => {
    if (!currentUserId) {
      message.warning('Please login first');
      return;
    }
    try {
      const result = await toggleLike(post.id, currentUserId);
      setPost({ ...post, likesCount: result.likesCount });
      setLiked(result.liked);
    } catch (error) {
      console.error('Failed to toggle like:', error);
      message.error('Failed to toggle like');
    }
  };

  const handleSubmitComment = async () => {
    if (!currentUserId) {
      message.warning('Please login first');
      return;
    }
    if (!commentContent.trim()) {
      return;
    }
    setSubmitting(true);
    try {
      await createComment({
        content: commentContent,
        postId: parseInt(id, 10),
        userId: currentUserId,
      });
      setCommentContent('');
      const updatedComments = await getPostComments(id);
      setComments(updatedComments || []);
      setPost({ ...post, commentsCount: (post.commentsCount || 0) + 1 });
      message.success('Comment added');
    } catch (error) {
      console.error('Failed to add comment:', error);
      message.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId) => {
    if (!currentUserId) {
      message.warning('Please login first');
      return;
    }
    if (!replyContent.trim()) {
      return;
    }
    setSubmitting(true);
    try {
      await createComment({
        content: replyContent,
        postId: parseInt(id, 10),
        userId: currentUserId,
        parentId,
      });
      setReplyingTo(null);
      setReplyContent('');
      const updatedComments = await getPostComments(id);
      setComments(updatedComments || []);
      message.success('Reply added');
    } catch (error) {
      console.error('Failed to add reply:', error);
      message.error('Failed to add reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    Modal.confirm({
      title: 'Delete Comment',
      content: 'Are you sure you want to delete this comment?',
      onOk: async () => {
        try {
          await deleteComment(commentId);
          const updatedComments = await getPostComments(id);
          setComments(updatedComments || []);
          setPost({ ...post, commentsCount: Math.max(0, (post.commentsCount || 0) - 1) });
          message.success('Comment deleted');
        } catch (error) {
          console.error('Failed to delete comment:', error);
          message.error('Failed to delete comment');
        }
      },
    });
  };

  const organizeComments = (comments) => {
    const topLevel = comments.filter(c => !c.parentId);
    const replies = comments.filter(c => c.parentId);

    return topLevel.map(comment => ({
      ...comment,
      replies: replies.filter(r => r.parentId === comment.id),
    }));
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <h3>Work not found</h3>
        <Button onClick={() => navigate('/community')}>Back to Community</Button>
      </div>
    );
  }

  const organizedComments = organizeComments(comments);

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/community')} style={{ marginBottom: 16 }}>
        Back
      </Button>

      <Card>
        <div style={{ textAlign: 'center' }}>
          <img
            src={post.thumbnail || 'https://scratch.mit.edu/static/preview-f66a8e3c0f1d3b9c.png'}
            alt={post.title}
            style={{ maxWidth: '100%', maxHeight: 400, objectFit: 'contain', borderRadius: 8 }}
          />
        </div>

        <h1 style={{ textAlign: 'center', marginTop: 16 }}>{post.title}</h1>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 16 }}>
          <Button
            type={liked ? 'primary' : 'default'}
            icon={liked ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
            onClick={handleLike}
          >
            {post.likesCount || 0} Likes
          </Button>
          <Button type="text">
            {post.viewsCount || 0} Views
          </Button>
          <Button type="text">
            {post.commentsCount || 0} Comments
          </Button>
        </div>

        {post.description && (
          <div style={{ marginTop: 24, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
            <strong>Description:</strong>
            <p>{post.description}</p>
          </div>
        )}

        {post.projectUrl && (
          <div style={{ marginTop: 16 }}>
            <a href={post.projectUrl} target="_blank" rel="noopener noreferrer">
              View Project
            </a>
          </div>
        )}

        <div style={{ marginTop: 16, fontSize: 12, color: '#888', textAlign: 'center' }}>
          Shared by User {post.userId} on {new Date(post.createdAt).toLocaleDateString()}
        </div>
      </Card>

      <Card title="Comments" style={{ marginTop: 16 }}>
        <div style={{ marginBottom: 24 }}>
          <TextArea
            rows={3}
            placeholder="Write a comment..."
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
          />
          <Button
            type="primary"
            onClick={handleSubmitComment}
            loading={submitting}
            style={{ marginTop: 8 }}
          >
            Post Comment
          </Button>
        </div>

        <List
          dataSource={organizedComments}
          renderItem={(comment) => (
            <List.Item
              actions={[
                currentUserId === comment.userId && (
                  <DeleteOutlined
                    style={{ cursor: 'pointer', color: '#ff4d4f' }}
                    onClick={() => handleDeleteComment(comment.id)}
                  />
                ),
              ]}
            >
              <List.Item.Meta
                avatar={<Avatar icon={<UserOutlined />} />}
                title={`User ${comment.userId || 'Anonymous'} - ${new Date(comment.createdAt).toLocaleString()}`}
                description={comment.content}
              />
              <div style={{ marginLeft: 48 }}>
                <Button size="small" onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}>
                  Reply
                </Button>

                {replyingTo === comment.id && (
                  <div style={{ marginTop: 8 }}>
                    <TextArea
                      rows={2}
                      placeholder="Write a reply..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                    />
                    <Button size="small" type="primary" onClick={() => handleSubmitReply(comment.id)} loading={submitting} style={{ marginTop: 4 }}>
                      Post Reply
                    </Button>
                  </div>
                )}

                {comment.replies && comment.replies.length > 0 && (
                  <div style={{ marginTop: 8, marginLeft: 24 }}>
                    {comment.replies.map((reply) => (
                      <Card key={reply.id} size="small" style={{ marginTop: 4 }}
                        actions={[
                          currentUserId === reply.userId && (
                            <DeleteOutlined
                              style={{ cursor: 'pointer', color: '#ff4d4f' }}
                              onClick={() => handleDeleteComment(reply.id)}
                            />
                          ),
                        ]}
                      >
                        <List.Item.Meta
                          avatar={<Avatar size="small" icon={<UserOutlined />} />}
                          title={`User ${reply.userId || 'Anonymous'} - ${new Date(reply.createdAt).toLocaleString()}`}
                          description={reply.content}
                        />
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}