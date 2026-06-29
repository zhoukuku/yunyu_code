import { useEffect, useState } from 'react';
import { Card, Form, Input, Button, Avatar, Upload, message, Table, Tag, Space, Spin } from 'antd';
import { UserOutlined, UploadOutlined, TeamOutlined, SaveOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { getMyClasses, getUserDetail, request } from '../../services/api';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    fetchUserProfile();
    fetchMyClasses();
  }, []);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const res = await getUserDetail();
      if (res && res.result) {
        const u = res.result;
        setUser(u);
        setAvatarUrl(u.avatar || '');
        form.setFieldsValue({
          username: u.username || '',
          nickname: u.nickname || '',
          phone: u.phone || '',
        });
      } else {
        const stored = localStorage.getItem('user');
        if (stored) {
          try {
            const u = JSON.parse(stored);
            setUser(u);
            setAvatarUrl(u.avatar || '');
            form.setFieldsValue({ username: u.username || '', nickname: u.nickname || '' });
          } catch (e) { /* ignore */ }
        }
      }
    } catch (error) {
      message.error('获取用户信息失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyClasses = async () => {
    setLoadingClasses(true);
    try {
      const res = await getMyClasses();
      if (res && res.status === 200) {
        setClasses(Array.isArray(res.result) ? res.result : (res.result?.records || []));
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    } finally {
      setLoadingClasses(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const values = form.getFieldsValue();
      const res = await request.put('/users/profile/me', {
        nickname: values.nickname,
      });
      if (res && res.status === 200) {
        message.success('个人资料已更新');
        // Update localStorage
        const stored = localStorage.getItem('user');
        if (stored) {
          const u = JSON.parse(stored);
          u.nickname = values.nickname;
          localStorage.setItem('user', JSON.stringify(u));
        }
      } else {
        message.error('更新失败，请重试');
      }
    } catch (error) {
      message.error('保存失败：' + (error.message || '未知错误'));
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) { message.error('请上传图片文件'); return false; }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) { message.error('图片大小不能超过2MB'); return false; }
    const reader = new FileReader();
    reader.onload = (e) => setAvatarUrl(e.target.result);
    reader.readAsDataURL(file);
    return false;
  };

  const classColumns = [
    { title: '班级名称', dataIndex: 'className' },
    { title: '学生数', dataIndex: 'studentNum', render: (n) => `${n || 0}人` },
    { title: '最近课程', dataIndex: 'lastCourseName', render: (v) => v || '-' },
    { title: '状态', dataIndex: 'isEnd', render: (v) => <Tag color={v ? 'red' : 'green'}>{v ? '已结束' : '进行中'}</Tag> },
  ];

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>;
  }

  return (
    <div style={{ padding: 24, maxWidth: 800 }}>
      <Card title="个人资料">
        <Form form={form} layout="vertical">
          <Form.Item label="头像">
            <Avatar size={64} src={avatarUrl} icon={!avatarUrl && <UserOutlined />} />
            <Upload showUploadList={false} beforeUpload={handleAvatarUpload}>
              <Button icon={<UploadOutlined />} style={{ marginLeft: 16 }}>更换头像</Button>
            </Upload>
          </Form.Item>
          <Form.Item label="用户名" name="username">
            <Input disabled />
          </Form.Item>
          <Form.Item label="昵称" name="nickname">
            <Input placeholder="请输入昵称" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveProfile} loading={saving}>保存修改</Button>
          </Form.Item>
        </Form>
      </Card>

      <Card
        title={<Space><TeamOutlined />我的班级</Space>}
        extra={<Button type="primary" size="small"><Link to="/class/join">加入班级</Link></Button>}
        style={{ marginTop: 16 }}
      >
        <Table columns={classColumns} dataSource={classes} rowKey="id" loading={loadingClasses} pagination={false}
          locale={{ emptyText: '暂未加入任何班级，点击"加入班级"添加' }} />
      </Card>
    </div>
  );
}