import { useEffect, useState } from 'react';
import { Table, Card, Tag, Progress, Button } from 'antd';
import { PlayCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { history } from '@umijs/max';
import { getClasses } from '@/services/api';
import type { ClassEntity } from '@/services/types';
import './index.less';

export default function ClassPage() {
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const res = await getClasses();
      if (res.status === 200) {
        setClasses(res.result?.records || []);
      }
    } catch (e) {
      console.error('加载失败', e);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: '班级名称', dataIndex: 'className', key: 'className' },
    { title: '最近课程', dataIndex: 'lastCourseName', key: 'lastCourseName' },
    { title: '学生数', dataIndex: 'studentNum', key: 'studentNum', render: (n: number) => `${n}人` },
    { title: '课程进度', dataIndex: 'hadCourseNum', key: 'progress', render: (_: any, r: ClassEntity) => (
      <Progress percent={Math.round((r.hadCourseNum / r.totalCourseNum) * 100)} size="small" />
    )},
    { title: '状态', dataIndex: 'isEnd', key: 'isEnd', render: (v: number) => (
      <Tag color={v ? 'red' : 'green'}>{v ? '已结束' : '进行中'}</Tag>
    )},
    { title: '操作', key: 'action', render: (_: any, r: ClassEntity) => (
      <Button type="link" icon={<PlayCircleOutlined />} onClick={() => history.push(`/ide/${r.id}`)}>
        进入课堂
      </Button>
    )}
  ];

  return (
    <div className="class-page">
      <Card title="班级管理" extra={<Button type="primary" icon={<PlusOutlined />}>新建班级</Button>}>
        <Table columns={columns} dataSource={classes} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      </Card>
    </div>
  );
}