import { useEffect, useState, useRef, useCallback } from 'react';
import { Card, List, Avatar, Input, Button, Badge, message, Empty } from 'antd';
import { SendOutlined, MessageOutlined, UserOutlined } from '@ant-design/icons';
import {
  getConversationsList,
  getConversation,
  sendMessage,
  markConversationAsRead,
} from '../../services/api';
import { safeGetJSON } from '../../utils/storage';

export default function MessagesPage() {
  const [conversations, setConversations] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const messagesEndRef = useRef(null);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getConversationsList();
      if (res.status === 200) {
        setConversations(res.result || []);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      message.error('加载对话列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (partnerId) => {
    if (!partnerId) return;
    try {
      const res = await getConversation(partnerId);
      if (res.status === 200) {
        setMessages(res.result?.messages || []);
        // Mark conversation as read
        await markConversationAsRead(partnerId);
        // Update unread count in local state
        setConversations(prev => prev.map(c =>
          c.partnerId === partnerId ? { ...c, unreadCount: 0 } : c
        ));
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      message.error('加载消息失败');
    }
  }, []);

  useEffect(() => {
    const parsedUser = safeGetJSON('user');
    if (parsedUser) {
      setCurrentUser(parsedUser);
    }
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (selectedPartner) {
      fetchMessages(selectedPartner.partnerId);
    }
  }, [selectedPartner, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedPartner || !currentUser) return;

    setSending(true);
    try {
      const res = await sendMessage(selectedPartner.partnerId, inputMessage.trim());
      if (res.status === 200) {
        setInputMessage('');
        setMessages(prev => [...prev, {
          ...res.result,
          senderId: currentUser.id,
          sender: { id: currentUser.id, username: currentUser.username, avatar: currentUser.avatar },
          receiver: { id: selectedPartner.partnerId, username: selectedPartner.partnerUsername, avatar: selectedPartner.partnerAvatar }
        }]);
        // Update conversation list
        setConversations(prev => prev.map(c =>
          c.partnerId === selectedPartner.partnerId
            ? { ...c, lastMessage: inputMessage.trim(), lastMessageTime: new Date().toISOString() }
            : c
        ).sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime)));
      }
    } catch (error) {
      message.error('发送失败');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const diff = now - date;
    const oneDay = 24 * 60 * 60 * 1000;

    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < oneDay) return `${Math.floor(diff / 3600000)}小时前`;
    if (diff < 7 * oneDay) return `${Math.floor(diff / oneDay)}天前`;
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const getTotalUnreadCount = () => {
    return conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  };

  return (
    <div style={{ padding: 24, height: 'calc(100vh - 120px)', display: 'flex', gap: 16 }}>
      {/* Conversation List */}
      <Card
        title={<><MessageOutlined /> 私信 <Badge count={getTotalUnreadCount()} size="small" /></>}
        style={{ width: 320, flexShrink: 0, height: '100%', display: 'flex', flexDirection: 'column' }}
        styles={{ body: { flex: 1, overflow: 'auto', padding: 0 } }}
        loading={loading}
      >
        <List
          dataSource={conversations}
          rowKey="partnerId"
          locale={{ emptyText: '暂无私信' }}
          renderItem={item => (
            <List.Item
              onClick={() => setSelectedPartner(item)}
              style={{
                cursor: 'pointer',
                padding: '12px 16px',
                background: selectedPartner?.partnerId === item.partnerId ? '#f0f5ff' : 'transparent',
                borderLeft: selectedPartner?.partnerId === item.partnerId ? '3px solid #1890ff' : '3px solid transparent',
              }}
            >
              <List.Item.Meta
                avatar={
                  <Badge count={item.unreadCount} size="small" offset={[-2, 2]}>
                    <Avatar
                      src={item.partnerAvatar}
                      icon={<UserOutlined />}
                      style={{ backgroundColor: '#1890ff' }}
                    />
                  </Badge>
                }
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: item.unreadCount > 0 ? 600 : 400 }}>
                      {item.partnerName || item.partnerUsername}
                    </span>
                    <span style={{ fontSize: 11, color: '#999' }}>
                      {formatTime(item.lastMessageTime)}
                    </span>
                  </div>
                }
                description={
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: item.unreadCount > 0 ? '#000' : '#999' }}>
                    {item.lastMessage}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      {/* Chat View */}
      <Card
        title={selectedPartner ? (
          <span>
            <Avatar src={selectedPartner.partnerAvatar} icon={<UserOutlined />} style={{ marginRight: 8 }} />
            {selectedPartner.partnerName || selectedPartner.partnerUsername}
          </span>
        ) : '私信'}
        style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}
        styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', padding: 0 } }}
      >
        {!selectedPartner ? (
          <Empty
            image={<MessageOutlined style={{ fontSize: 64, color: '#ccc' }} />}
            description="选择对话开始聊天"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          />
        ) : (
          <>
            {/* Messages Area */}
            <div style={{ flex: 1, overflow: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {messages.length === 0 ? (
                <Empty description="暂无消息，发送一条消息开始对话吧" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
              ) : (
                messages.map((msg, index) => {
                const isSelf = msg.senderId === currentUser?.id;
                const showAvatar = index === 0 || messages[index - 1]?.senderId !== msg.senderId;
                return (
                  <div
                    key={msg.id || `msg-${index}`}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isSelf ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, maxWidth: '70%' }}>
                      {!isSelf && (
                        showAvatar ? (
                          <Avatar src={msg.sender?.avatar} icon={<UserOutlined />} size="small" />
                        ) : (
                          <div style={{ width: 24 }} />
                        )
                      )}
                      <div
                        style={{
                          padding: '10px 14px',
                          borderRadius: isSelf ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          background: isSelf ? '#1890ff' : '#f0f0f0',
                          color: isSelf ? '#fff' : '#000',
                          wordBreak: 'break-word',
                        }}
                      >
                        {msg.content}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: '#999', marginTop: 4, paddingLeft: isSelf ? 0 : 32 }}>
                      {formatTime(msg.createdAt)}
                    </div>
                  </div>
                );
              })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{ padding: 16, borderTop: '1px solid #f0f0f0', display: 'flex', gap: 8 }}>
              <Input
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                onPressEnter={handleSendMessage}
                placeholder="输入消息..."
                disabled={sending}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSendMessage}
                loading={sending}
                disabled={!inputMessage.trim()}
              >
                发送
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}