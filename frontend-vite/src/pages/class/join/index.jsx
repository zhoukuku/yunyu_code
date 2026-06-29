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
      message.warning('Please enter a class code');
      return;
    }
    setLoading(true);
    setSearchResult(null);
    try {
      const res = await searchClassByCode(code.trim());
      if (res.status === 200 && res.result) {
        setSearchResult(res.result);
      } else {
        message.error(res.message || 'Class not found');
      }
    } catch (error) {
      message.error('Failed to search class');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (classId) => {
    setJoining(true);
    try {
      const res = await applyToJoinClass(classId);
      if (res.status === 200) {
        message.success('Successfully joined the class!');
        setSearchResult(null);
        setCode('');
      } else {
        message.error(res.message || 'Failed to join class');
      }
    } catch (error) {
      message.error('Failed to join class');
    } finally {
      setJoining(false);
    }
  };

  const columns = [
    { title: 'Class Name', dataIndex: 'className' },
    {
      title: 'Teacher ID',
      dataIndex: 'teacherId',
      render: (id) => id || '-',
    },
    { title: 'Students', dataIndex: 'studentNum', render: (n) => `${n} students` },
    {
      title: 'Status',
      dataIndex: 'isEnd',
      render: (v) => <Tag color={v ? 'red' : 'green'}>{v ? 'Ended' : 'Active'}</Tag>,
    },
    {
      title: 'Action',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<UserAddOutlined />}
          loading={joining}
          onClick={() => handleJoin(record.id)}
        >
          Join Class
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card title="Join Class">
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Card size="small" title="Search by Class Code">
            <Space>
              <Input
                placeholder="Enter class code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onPressEnter={handleSearch}
                style={{ width: 300 }}
              />
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} loading={loading}>
                Search
              </Button>
            </Space>
          </Card>

          {searchResult && (
            <Card size="small" title="Search Result">
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