import { useEffect, useState, useCallback } from 'react';
import { Table, Tag, Button, Input, Card, Modal, Form, Select, message, Popconfirm } from 'antd';
import { getNotices, createNotice, updateNotice, deleteNotice } from '../../services/api';

const { TextArea } = Input;
const { Option } = Select;

const noticeTypeMap = {
  system: { label: '系统通知', color: 'blue' },
  activity: { label: '活动通知', color: 'green' },
  course: { label: '课程通知', color: 'purple' },
  personal: { label: '个人通知', color: 'orange' },
};

export default function NoticeManage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchNotices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getNotices();
      if (res.status === 200) {
        setData(res.result?.records || []);
      }
    } catch (e) {
      message.error(e.response?.data?.message || '获取通知列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingId(record.id);
    form.setFieldsValue({
      noticeId: record.noticeId,
      title: record.title,
      content: record.content,
      noticeType: record.noticeType,
      popupType: record.popupType,
      contentType: record.contentType,
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      try {
        let res;
        if (editingId) {
          res = await updateNotice(editingId, values);
        } else {
          res = await createNotice(values);
        }
        if (res.status === 200) {
          message.success(editingId ? '通知更新成功' : '通知发布成功');
          setModalVisible(false);
          fetchNotices();
        }
      } catch (e) {
        message.error(e.response?.data?.message || (editingId ? '更新失败' : '发布失败'));
      } finally {
        setSubmitting(false);
      }
    } catch (validationError) {
      // Form validation failed — Ant Design already shows field-level errors, no extra toast needed
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await deleteNotice(id);
      if (res.status === 200) {
        message.success('删除成功');
        fetchNotices();
      }
    } catch (e) {
      message.error(e.response?.data?.message || '删除失败');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '通知ID', dataIndex: 'noticeId', width: 120 },
    { title: '标题', dataIndex: 'title' },
    { title: '类型', dataIndex: 'noticeType', render: v => <Tag color={noticeTypeMap[v]?.color}>{noticeTypeMap[v]?.label || v}</Tag>, width: 120 },
    { title: '弹窗类型', dataIndex: 'popupType', render: v => v === 1 ? '弹窗' : '普通', width: 80 },
    { title: '内容类型', dataIndex: 'contentType', render: v => v === 0 ? '文本' : '其他', width: 80 },
    { title: '创建时间', dataIndex: 'createdAt', width: 180 },
    {
      title: '操作',
      render: (_, record) => (
        <>
          <Button type="link" size="small" onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm
            title="确认删除该通知？"
            onConfirm={() => handleDelete(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="link" danger size="small">删除</Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  return (
    <Card
      title="通知管理"
      extra={<Button type="primary" onClick={handleAdd}>发布通知</Button>}
    >
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
      />
      <Modal
        title={editingId ? '编辑通知' : '发布通知'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        confirmLoading={submitting}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="noticeId" label="通知标识" rules={[{ required: true, message: '请输入通知标识' }]}>
            <Input placeholder="如: system_001" />
          </Form.Item>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="通知标题" />
          </Form.Item>
          <Form.Item name="noticeType" label="类型" rules={[{ required: true, message: '请选择类型' }]}>
            <Select>
              {Object.entries(noticeTypeMap).map(([k, v]) => (
                <Option key={k} value={k}>{v.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="popupType" label="弹窗类型">
            <Select>
              <Option value={0}>普通</Option>
              <Option value={1}>弹窗</Option>
            </Select>
          </Form.Item>
          <Form.Item name="contentType" label="内容类型">
            <Select>
              <Option value={0}>文本</Option>
              <Option value={1}>其他</Option>
            </Select>
          </Form.Item>
          <Form.Item name="content" label="内容">
            <TextArea rows={4} placeholder="通知内容" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}