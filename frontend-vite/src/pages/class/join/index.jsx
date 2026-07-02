import { useState } from 'react';
import { Card, Input, Button, Table, Tag, message, Space } from 'antd';
import { SearchOutlined, UserAddOutlined } from '@ant-design/icons';
import { searchClassByCode, applyToJoinClass } from '../../../services/api';

export default function ClassJoinPage() {
  const [code, setCode] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);

  const handleSearch = async () => {
    if (!code.trim()) {
      message.warning('请输入班级代码');
      return;
    }
    setLoading(true);
    setSearchResult(null);
    try {
      const res = await searchClassByCode(code.trim());
      if (res.status === 200 && res.result) {
        setSearchResult(res.result);
      } else {
        message.error(res.msg || '未找到班级');
      }
    } catch (error) {
      console.error('Failed to search class:', error);
      const detail = error.response?.data?.msg;
      message.error(detail || '搜索班级失败');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (classId) => {
    setJoining(true);
    try {
      const res = await applyToJoinClass(classId);
      if (res.status === 200) {
        message.success('成功加入班级！');
        setSearchResult(null);
        setCode('');
      } else {
        message.error(res.msg || '加入班级失败');
      }
    } catch (error) {
      console.error('Failed to join class:', error);
      const detail = error.response?.data?.msg;
      message.error(detail || '加入班级失败');
    } finally {
      setJoining(false);
    }
  };

  const columns = [
    { title: '班级名称', dataIndex: 'className' },
    {
      title: '教师ID',
      dataIndex: 'teacherId',
      render: (id) => id || '-',
    },
    { title: '学生', dataIndex: 'studentNum', render: (n) => `${n} 名学生` },
    {
      title: '状态',
      dataIndex: 'isEnd',
      render: (v) => <Tag color={v ? 'red' : 'green'}>{v ? '已结束' : '进行中'}</Tag>,
    },
    {
      title: '操作',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<UserAddOutlined />}
          loading={joining}
          onClick={() => handleJoin(record.id)}
        >
          加入班级
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card title="加入班级">
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Card size="small" title="按班级代码搜索">
            <Space>
              <Input
                placeholder="输入班级代码"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onPressEnter={handleSearch}
                style={{ width: 300 }}
              />
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} loading={loading}>
                搜索
              </Button>
            </Space>
          </Card>

          {searchResult && (
            <Card size="small" title="搜索结果">
              <Table
                columns={columns}
                dataSource={[searchResult]}
                rowKey="id"
                pagination={false}
              />
            </Card>
          )}
        </Space>
      </Card>
    </div>
  );
}