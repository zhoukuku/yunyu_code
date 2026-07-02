import { useEffect, useState, useCallback } from 'react';
import { Card, Avatar, Button, Input, List, Spin, message, Modal } from 'antd';
import { HeartOutlined, HeartFilled, ArrowLeftOutlined, UserOutlined, DeleteOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { getCommunityPost, getPostComments, createComment, deleteComment, toggleLike, checkUserLiked } from '../../../services/api';
import { safeGetJSON } from '../../../utils/storage';

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

  const currentUser = safeGetJSON('user', {});
  const currentUserId = currentUser.id;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [postRes, commentsRes] = await Promise.all([
        getCommunityPost(id),
        getPostComments(id),
      ]);
      const postData = postRes?.result;
      const commentsData = commentsRes?.result;
      setPost(postData);
      setComments(commentsData || []);

      if (currentUserId && postData) {
        const likedRes = await checkUserLiked(postData.id);
        setLiked(likedRes.status === 200 ? likedRes.result?.liked : false);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      message.error('加载作品详情失败');
    } finally {
      setLoading(false);
    }
  }, [id, currentUserId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLike = async () => {
    if (!currentUserId) {
      message.warning('请先登录');
      return;
    }
    try {
      const result = await toggleLike(post.id);
      const data = result?.result;
      setPost({ ...post, likesCount: data?.likesCount ?? post.likesCount });
      setLiked(data?.liked ?? false);
    } catch (error) {
      console.error('Failed to toggle like:', error);
      message.error('点赞操作失败');
    }
  };

  const handleSubmitComment = async () => {
    if (!currentUserId) {
      message.warning('请先登录');
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
      const updatedRes = await getPostComments(id);
      setComments(updatedRes?.result || []);
      setPost({ ...post, commentsCount: (post.commentsCount || 0) + 1 });
      message.success('评论发表成功');
    } catch (error) {
      console.error('Failed to add comment:', error);
      message.error('评论发表失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId) => {
    if (!currentUserId) {
      message.warning('请先登录');
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
      const updatedRes = await getPostComments(id);
      setComments(updatedRes?.result || []);
      message.success('回复发表成功');
    } catch (error) {
      console.error('Failed to add reply:', error);
      message.error('回复发表失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    Modal.confirm({
      title: '删除评论',
      content: '确定要删除此评论吗？',
      onOk: async () => {
        try {
          await deleteComment(commentId);
          const updatedRes = await getPostComments(id);
          setComments(updatedRes?.result || []);
          setPost({ ...post, commentsCount: Math.max(0, (post.commentsCount || 0) - 1) });
          message.success('评论已删除');
        } catch (error) {
          console.error('Failed to delete comment:', error);
          message.error('删除评论失败');
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
        <h3>未找到作品</h3>
        <Button onClick={() => navigate('/community')}>返回社区</Button>
      </div>
    );
  }

  const organizedComments = organizeComments(comments);

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/community')} style={{ marginBottom: 16 }}>
        返回
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
            {post.likesCount || 0} 赞
          </Button>
          <Button type="text">
            {post.viewsCount || 0} 浏览
          </Button>
          <Button type="text">
            {post.commentsCount || 0} 评论
          </Button>
        </div>

        {post.description && (
          <div style={{ marginTop: 24, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
            <strong>描述：</strong>
            <p>{post.description}</p>
          </div>
        )}

        {post.projectUrl && (
          <div style={{ marginTop: 16 }}>
            <a href={post.projectUrl} target="_blank" rel="noopener noreferrer">
              查看项目
            </a>
          </div>
        )}

        <div style={{ marginTop: 16, fontSize: 12, color: '#888', textAlign: 'center' }}>
          由用户 {post.userId} 于 {new Date(post.createdAt).toLocaleDateString()} 分享
        </div>
      </Card>

      <Card title="评论" style={{ marginTop: 16 }}>
        <div style={{ marginBottom: 24 }}>
          <TextArea
            rows={3}
            placeholder="写下你的评论..."
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
          />
          <Button
            type="primary"
            onClick={handleSubmitComment}
            loading={submitting}
            style={{ marginTop: 8 }}
          >
            发表评论
          </Button>
        </div>

        <List
          dataSource={organizedComments}
          renderItem={(comment) => (
            <List.Item
              actions={[
                currentUserId === comment.userId ? (
                  <DeleteOutlined
                    key="delete"
                    style={{ cursor: 'pointer', color: '#ff4d4f' }}
                    onClick={() => handleDeleteComment(comment.id)}
                  />
                ) : null,
              ].filter(Boolean)}
            >
              <List.Item.Meta
                avatar={<Avatar icon={<UserOutlined />} />}
                title={`用户 ${comment.userId || '匿名'} - ${new Date(comment.createdAt).toLocaleString()}`}
                description={comment.content}
              />
              <div style={{ marginLeft: 48 }}>
                <Button size="small" onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}>
                  回复
                </Button>

                {replyingTo === comment.id && (
                  <div style={{ marginTop: 8 }}>
                    <TextArea
                      rows={2}
                      placeholder="写下你的回复..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                    />
                    <Button size="small" type="primary" onClick={() => handleSubmitReply(comment.id)} loading={submitting} style={{ marginTop: 4 }}>
                      发表回复
                    </Button>
                  </div>
                )}

                {comment.replies && comment.replies.length > 0 && (
                  <div style={{ marginTop: 8, marginLeft: 24 }}>
                    {comment.replies.map((reply) => (
                      <Card key={reply.id} size="small" style={{ marginTop: 4 }}
                        actions={[
                          currentUserId === reply.userId ? (
                            <DeleteOutlined
                              key="delete"
                              style={{ cursor: 'pointer', color: '#ff4d4f' }}
                              onClick={() => handleDeleteComment(reply.id)}
                            />
                          ) : null,
                        ].filter(Boolean)}
                      >
                        <List.Item.Meta
                          avatar={<Avatar size="small" icon={<UserOutlined />} />}
                          title={`用户 ${reply.userId || '匿名'} - ${new Date(reply.createdAt).toLocaleString()}`}
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