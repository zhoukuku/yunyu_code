import { useEffect, useState } from 'react';
import { Card, List, Tag, Button, Modal, message } from 'antd';
import { BellOutlined, CheckOutlined, DeleteOutlined, ReadOutlined } from '@ant-design/icons';
import { getNotices, markNoticeAsRead, markAllNoticesAsRead, deleteNotice } from '../../services/api';

const noticeTypeMap = {
  '课程': { color: 'blue', label: '课程' },
  '作业': { color: 'orange', label: '作业' },
  '班级': { color: 'green', label: '班级' },
  '系统': { color: 'purple', label: '系统' },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      const parsed = JSON.parse(user);
      setUserId(parsed.id);
      fetchNotifications(parsed.id);
    }
  }, []);

  const fetchNotifications = async (uid) => {
    const targetUserId = uid || userId;
    setLoading(true);
    try {
      const res = await getNotices(targetUserId);
      if (res.status === 200) {
        // Handle both array and paginated response { records: [] }
        const result = res.result;
        let data = [];
        if (Array.isArray(result)) {
          data = result;
        } else if (result && Array.isArray(result.records)) {
          data = result.records;
        } else if (result && typeof result === 'object') {
          data = result.records || [];
        }
        setNotifications(data);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      const res = await markNoticeAsRead(id);
      if (res.status === 200) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: 1 } : n));
        message.success('已标记为已读');
      }
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!userId) return;
    try {
      const res = await markAllNoticesAsRead(userId);
      if (res.status === 200) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: 1 })));
        message.success('已标记全部为已读');
      }
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条通知吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          const res = await deleteNotice(id);
          if (res.status === 200) {
            setNotifications(prev => prev.filter(n => n.id !== id));
            message.success('已删除');
          }
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const getUnreadCount = () => (Array.isArray(notifications) ? notifications : []).filter(n => n.isRead === 0).length;

  const formatTime = (sendTime) => {
    if (!sendTime) return '';
    const date = new Date(sendTime);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={<><BellOutlined /> 通知中心</>}
        extra={
          <div style={{ display: 'flex', gap: 8 }}>
            <Tag color="blue" style={{ marginRight: 8 }}>未读: {getUnreadCount()}</Tag>
            <Button icon={<CheckOutlined />} onClick={handleMarkAllAsRead} disabled={getUnreadCount() === 0}>
              全部已读
            </Button>
          </div>
        }
        loading={loading}
      >
        <List
          dataSource={notifications}
          locale={{ emptyText: '暂无通知' }}
          renderItem={item => {
            const typeInfo = noticeTypeMap[item.noticeType] || { color: 'default', label: item.noticeType || '系统' };
            return (
              <List.Item
                style={{
                  background: item.isRead === 0 ? '#f0f5ff' : 'transparent',
                  borderRadius: 8,
                  marginBottom: 8,
                  padding: '12px 16px',
                }}
              >
                <List.Item.Meta
                  avatar={
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: typeInfo.color === 'blue' ? '#e6f7ff' : typeInfo.color === 'orange' ? '#fff7e6' : typeInfo.color === 'green' ? '#f6ffed' : '#f9f0ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <BellOutlined style={{ fontSize: 20, color: typeInfo.color === 'blue' ? '#1890ff' : typeInfo.color === 'orange' ? '#fa8c16' : typeInfo.color === 'green' ? '#52c41a' : '#722ed1' }} />
                    </div>
                  }
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: item.isRead === 0 ? 600 : 400 }}>{item.title}</span>
                      <Tag color={typeInfo.color}>{typeInfo.label}</Tag>
                      {item.isRead === 0 && <Tag color="red">未读</Tag>}
                    </div>
                  }
                  description={
                    <div>
                      <span style={{ color: '#999', fontSize: 12 }}>{formatTime(item.sendTime)}</span>
                      {item.content && <span style={{ marginLeft: 8 }}>- {item.content}</span>}
                    </div>
                  }
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  {item.isRead === 0 && (
                    <Button size="small" icon={<ReadOutlined />} onClick={() => handleMarkAsRead(item.id)}>
                      已读
                    </Button>
                  )}
                  <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(item.id)}>
                    删除
                  </Button>
                </div>
              </List.Item>
            );
          }}
        />
      </Card>
    </div>
  );
}