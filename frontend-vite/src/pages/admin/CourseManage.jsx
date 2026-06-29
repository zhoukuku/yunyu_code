import { useEffect, useState } from 'react';
import { Table, Tag, Button, Switch, Input, Card, Modal, message, Popconfirm, Form, Select, InputNumber, Space } from 'antd';
import { getAdminCourses, updateCourseStatus, deleteCourse, createCourse, updateCourse } from '../../services/api';

export default function CourseManage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [formVisible, setFormVisible] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [form] = Form.useForm();

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (searchText) filters.search = searchText;
      if (statusFilter !== undefined) filters.status = statusFilter;
      const res = await getAdminCourses(null, filters);
      if (res.status === 200) {
        setData(res.result.records || []);
      }
    } catch (e) {
      message.error('获取课程列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [statusFilter]);

  const handleSearch = () => {
    fetchCourses();
  };

  const handleStatusChange = async (id, checked) => {
    try {
      const res = await updateCourseStatus(id, checked ? 1 : 0);
      if (res.status === 200) {
        message.success('课程状态更新成功');
        fetchCourses();
      }
    } catch (e) {
      message.error('状态更新失败');
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await deleteCourse(id);
      if (res.status === 200) {
        message.success('课程删除成功');
        fetchCourses();
      }
    } catch (e) {
      message.error('删除失败');
    }
  };

  const handleCreate = () => {
    setEditingCourse(null);
    form.resetFields();
    setFormVisible(true);
  };

  const handleEdit = (record) => {
    setEditingCourse(record);
    form.setFieldsValue({
      courseName: record.courseName,
      description: record.description,
      hierarchyId: record.hierarchyId,
      difficulty: record.difficulty,
      price: record.price,
      totalLessons: record.totalLessons,
      teacher: record.teacher,
    });
    setFormVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      let res;
      if (editingCourse) {
        res = await updateCourse(editingCourse.id, values);
      } else {
        res = await createCourse(values);
      }
      if (res.status === 200) {
        message.success(editingCourse ? '课程更新成功' : '课程创建成功');
        setFormVisible(false);
        fetchCourses();
      }
    } catch (e) {
      message.error(editingCourse ? '更新失败' : '创建失败');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '课程名称', dataIndex: 'courseName' },
    { title: '教师', dataIndex: 'teacher' },
    { title: '难度', dataIndex: 'difficulty', render: v => v || '-', width: 70 },
    { title: '价格', dataIndex: 'price', render: v => v || 0, width: 80 },
    { title: '学生数', dataIndex: 'studentCount', render: v => v || 0, width: 80 },
    { title: '课时数', dataIndex: 'totalLessons', render: v => v || 0, width: 80 },
    {
      title: '状态',
      dataIndex: 'status',
      render: (status, record) => (
        <Switch
          checked={status === 1}
          onChange={(checked) => handleStatusChange(record.id, checked)}
          checkedChildren="上架"
          unCheckedChildren="下架"
        />
      ),
      width: 100,
    },
    {
      title: '操作',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm
            title="确认删除该课程？"
            onConfirm={() => handleDelete(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="link" danger size="small">删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card title="课程管理">
      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <Button type="primary" onClick={handleCreate}>创建课程</Button>
        <Input.Search
          placeholder="搜索课程名称"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          onSearch={handleSearch}
          style={{ width: 200 }}
        />
        <Button onClick={() => setStatusFilter(undefined)}>全部</Button>
        <Button onClick={() => setStatusFilter(1)}>已上架</Button>
        <Button onClick={() => setStatusFilter(0)}>已下架</Button>
      </div>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
      />
      <Modal
        title={editingCourse ? '编辑课程' : '创建课程'}
        open={formVisible}
        onOk={handleSubmit}
        onCancel={() => setFormVisible(false)}
        okText="确认"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="courseName" label="课程名称" rules={[{ required: true, message: '请输入课程名称' }]}>
            <Input placeholder="请输入课程名称" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea placeholder="请输入课程描述" rows={3} />
          </Form.Item>
          <Form.Item name="hierarchyId" label="体系ID">
            <Input placeholder="请输入体系ID" />
          </Form.Item>
          <Form.Item name="teacher" label="教师">
            <Input placeholder="请输入教师名称" />
          </Form.Item>
          <Form.Item name="difficulty" label="难度" rules={[{ type: 'number', min: 1, max: 5 }]}>
            <InputNumber min={1} max={5} placeholder="1-5" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="price" label="价格">
            <InputNumber min={0} placeholder="请输入价格" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="totalLessons" label="课时数">
            <InputNumber min={0} placeholder="请输入课时数" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}