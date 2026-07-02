import { useState } from 'react';
import { Form, Input, Button, message, Card } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { history } from '@umijs/max';
import { login as loginApi } from '@/services/api';
import './index.less';

// Safe localStorage helpers
function safeSetItem(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch (e) { /* Swallow */ }
}
function safeSetJSON(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* Swallow */ }
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { account: string; password: string }) => {
    setLoading(true);
    try {
      const res = await loginApi(values.account, values.password);
      if (res && res.status === 200 && res.result?.accessToken) {
        safeSetItem('accessToken', res.result.accessToken);
        safeSetJSON('user', res.result.user);
        message.success('登录成功');
        history.push('/');
      } else {
        message.error(res?.result?.msg || '登录失败');
      }
    } catch (e: unknown) {
      message.error((e instanceof Error ? e.message : null) || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Card className="login-card">
        <h1>奇码科技学习平台</h1>
        <Form onFinish={onFinish} size="large">
          <Form.Item name="account" rules={[{ required: true, message: '请输入账号' }]}>
            <Input prefix={<UserOutlined />} placeholder="请输入账号" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}