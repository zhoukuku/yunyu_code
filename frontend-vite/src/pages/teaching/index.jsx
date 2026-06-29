import { useEffect, useState } from 'react';
import { Card, Table, Button, Tag, Progress, Space, Modal, Form, Input, message, Popconfirm } from 'antd';
import { PlusOutlined, TeamOutlined, PlayCircleOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getClasses, createClass, updateClass, deleteClass } from '../../services/api';

export default function TeachingPage() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getClasses();
      if (res.status === 200) {
        setClasses(res.result?.records || []);
      }
    } catch (e) {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingClass(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingClass(record);
    form.setFieldsValue({
      className: record.className,
      lastCourseName: record.lastCourseName,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteClass(id);
      message.success('删除成功');
      loadData();
    } catch (e) {
      message.error('删除失败');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingClass) {
        await updateClass(editingClass.id, values);
        message.success('编辑成功');
      } else {
        await createClass(values);
        message.success('新增成功');
      }
      setModalVisible(false);
      loadData();
    } catch (e) {
      message.error(e.response?.data?.message || '操作失败');
    }
  };

  const columns = [
    { title: '班级名称', dataIndex: 'className', key: 'className' },
    { title: '最近课程', dataIndex: 'lastCourseName', key: 'lastCourseName' },
    { title: '上课时间', dataIndex: 'classTime', key: 'classTime', render: t => t || '-' },
    { title: '学生数', dataIndex: 'studentNum', key: 'studentNum', render: n => `${n}人` },
    { title: '课程进度', key: 'progress', render: (_, r) => (
      <Progress percent={Math.round(r.hadCourseNum / r.totalCourseNum * 100)} size="small" />
    )},
    { title: '状态', dataIndex: 'isEnd', key: 'isEnd', render: v => (
      <Tag color={v ? 'red' : 'green'}>{v ? '已结束' : '进行中'}</Tag>
    )},
    { title: '操作', key: 'action', render: (_, r) => (
      <Space>
        <Button type="link" icon={<PlayCircleOutlined />} onClick={() => navigate(`/ide/${r.id}`)}>进入课堂</Button>
        <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(r)} />
        <Popconfirm title="确认删除？" onConfirm={() => handleDelete(r.id)}>
          <Button type="link" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      </Space>
    )}
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={<><TeamOutlined /> 教学中心</>}
        extra={
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新建班级</Button>
          </Space>
        }
      >
        <Table columns={columns} dataSource={classes} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal
        title={editingClass ? '编辑班级' : '新建班级'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        okText="确认"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="className" label="班级名称" rules={[{ required: true, message: '请输入班级名称' }]}>
            <Input placeholder="请输入班级名称" />
          </Form.Item>
          <Form.Item name="lastCourseName" label="最近课程" rules={[{ required: true, message: '请输入最近课程' }]}>
            <Input placeholder="请输入最近课程" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
