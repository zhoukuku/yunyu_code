import { useEffect, useState } from 'react';
import { Table, Card, Tag, Progress, Button, Modal, Input, message } from 'antd';
import { PlayCircleOutlined, UserAddOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getClasses, searchClassByCode, applyToJoinClass } from '../../services/api';

export default function ClassPage() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const navigate = useNavigate();

  const loadData = () => {
    setLoading(true);
    getClasses().then(res => {
      if (res.status === 200) setClasses(res.result?.records || []);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleJoinClass = async () => {
    if (!joinCode.trim()) {
      message.warning('请输入班级代码');
      return;
    }
    setJoinLoading(true);
    try {
      const res = await searchClassByCode(joinCode.trim());
      if (res.result) {
        await applyToJoinClass(res.result.id);
        message.success('申请加入班级成功，请等待老师审核');
        setJoinModalVisible(false);
        setJoinCode('');
        loadData();
      } else {
        message.error('未找到该班级，请检查班级代码');
      }
    } catch (error) {
      console.error('Failed to join class:', error);
      message.error('加入班级失败，请检查班级代码是否正确');
    } finally {
      setJoinLoading(false);
    }
  };

  const columns = [
    { title: '班级名称', dataIndex: 'className' },
    { title: '最近课程', dataIndex: 'lastCourseName' },
    { title: '学生数', dataIndex: 'studentNum', render: n => `${n}人` },
    { title: '课程进度', dataIndex: 'hadCourseNum', render: (_, r) => <Progress percent={Math.round(r.hadCourseNum / r.totalCourseNum * 100)} size="small" /> },
    { title: '状态', dataIndex: 'isEnd', render: v => <Tag color={v ? 'red' : 'green'}>{v ? '已结束' : '进行中'}</Tag> },
    { title: '操作', render: (_, r) => <Button type="link" icon={<PlayCircleOutlined />} onClick={() => navigate(`/ide/${r.id}`)}>进入课堂</Button> },
  ];

  return (
    <Card
      title="班级管理"
      extra={
        <Button type="primary" icon={<UserAddOutlined />} onClick={() => setJoinModalVisible(true)}>
          加入班级
        </Button>
      }
    >
      <Table columns={columns} dataSource={classes} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />

      <Modal
        title="加入班级"
        open={joinModalVisible}
        onCancel={() => {
          setJoinModalVisible(false);
          setJoinCode('');
        }}
        onOk={handleJoinClass}
        confirmLoading={joinLoading}
        okText="加入"
        cancelText="取消"
      >
        <p>请输入班级代码申请加入班级：</p>
        <Input
          placeholder="请输入班级代码"
          value={joinCode}
          onChange={e => setJoinCode(e.target.value)}
          onPressEnter={handleJoinClass}
        />
      </Modal>
    </Card>
  );
}