import { useEffect, useState, useCallback } from 'react';
import { Card, Row, Col, Button, Modal, Form, Input, Select, Tag, Empty, Spin, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, FileTextOutlined, SearchOutlined } from '@ant-design/icons';
import { createStudyNote, getStudyNotes, updateStudyNote, deleteStudyNote, getStudyNotesCount } from '../../services/api';

const { TextArea } = Input;

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [form] = Form.useForm();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [stats, setStats] = useState({ count: 0 });

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getStudyNotes({});
      if (res.status === 200) {
        setNotes(res.result || []);
      }
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await getStudyNotesCount();
      if (res.status === 200) {
        setStats(res.result || { count: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
    fetchStats();
  }, [fetchNotes, fetchStats]);

  const handleCreate = () => {
    setEditingNote(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (note) => {
    setEditingNote(note);
    form.setFieldsValue({
      title: note.title,
      content: note.content,
      tags: note.tags,
      isPublic: note.isPublic,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      const res = await deleteStudyNote(id);
      if (res.status === 200) {
        message.success('笔记删除成功');
        fetchNotes();
        fetchStats();
      }
    } catch (error) {
      message.error('删除笔记失败');
    }
  };

  const handleSubmit = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch {
      // Validation error — Ant Design shows inline field errors automatically
      return;
    }

    try {
      if (editingNote) {
        const res = await updateStudyNote(editingNote.id, values);
        if (res.status === 200) {
          message.success('笔记更新成功');
          setModalVisible(false);
          fetchNotes();
        }
      } else {
        const res = await createStudyNote(values);
        if (res.status === 200) {
          message.success('笔记创建成功');
          setModalVisible(false);
          fetchNotes();
          fetchStats();
        }
      }
    } catch (error) {
      console.error('Failed to submit:', error);
      message.error('保存笔记失败');
    }
  };

  const allTags = [...new Set(notes.flatMap(n => n.tags ? n.tags.split(',').map(t => t.trim()) : []))].filter(Boolean);

  const filteredNotes = notes.filter(note => {
    if (searchKeyword && !note.title.toLowerCase().includes(searchKeyword.toLowerCase()) &&
        !note.content.toLowerCase().includes(searchKeyword.toLowerCase())) {
      return false;
    }
    if (selectedTag && note.tags) {
      const noteTags = note.tags.split(',').map(t => t.trim());
      if (!noteTags.includes(selectedTag)) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileTextOutlined />
            <span>学习笔记</span>
          </div>
        }
        extra={
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                {stats.count}
              </div>
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>笔记总数</div>
            </div>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              新建笔记
            </Button>
          </div>
        }
      >
        <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
          <Input
            placeholder="搜索笔记..."
            prefix={<SearchOutlined />}
            value={searchKeyword}
            onChange={e => setSearchKeyword(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
          {allTags.length > 0 && (
            <Select
              placeholder="按标签筛选"
              value={selectedTag}
              onChange={setSelectedTag}
              style={{ width: 150 }}
              allowClear
            >
              {allTags.map(tag => (
                <Select.Option key={tag} value={tag}>{tag}</Select.Option>
              ))}
            </Select>
          )}
        </div>

        {filteredNotes.length === 0 ? (
          <Empty description="未找到笔记" style={{ padding: 40 }}>
            <Button type="primary" onClick={handleCreate}>创建你的第一篇笔记</Button>
          </Empty>
        ) : (
          <Row gutter={[16, 16]}>
            {filteredNotes.map((note) => (
              <Col xs={24} sm={12} md={8} lg={6} key={note.id}>
                <Card
                  hoverable
                  style={{ height: '100%' }}
                  actions={[
                    <EditOutlined key="edit" onClick={() => handleEdit(note)} />,
                    <Popconfirm
                      key="delete"
                      title="确定删除此笔记？"
                      onConfirm={() => handleDelete(note.id)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <DeleteOutlined />
                    </Popconfirm>,
                  ]}
                >
                  <Card.Meta
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 14, fontWeight: 'bold' }}>{note.title}</span>
                        {note.isPublic && <Tag color="blue">公开</Tag>}
                      </div>
                    }
                    description={
                      <div>
                        <div style={{
                          fontSize: 12,
                          color: '#8c8c8c',
                          marginBottom: 8,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          minHeight: 54
                        }}>
                          {note.content}
                        </div>
                        {note.tags && (
                          <div style={{ marginTop: 8 }}>
                            {note.tags.split(',').map((tag, i) => (
                              <Tag key={i} style={{ marginBottom: 4 }}>{tag.trim()}</Tag>
                            ))}
                          </div>
                        )}
                        <div style={{ fontSize: 11, color: '#bfbfbf', marginTop: 8 }}>
                          更新于：{new Date(note.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>

      <Modal
        title={editingNote ? '编辑笔记' : '创建新笔记'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText={editingNote ? '更新' : '创建'}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="请输入笔记标题" />
          </Form.Item>
          <Form.Item
            name="content"
            label="内容"
            rules={[{ required: true, message: '请输入内容' }]}
          >
            <TextArea rows={8} placeholder="在此输入笔记..." />
          </Form.Item>
          <Form.Item name="tags" label="标签（逗号分隔）">
            <Input placeholder="例如：数学、微积分、重要" />
          </Form.Item>
          <Form.Item name="isPublic" label="可见性" valuePropName="checked">
            <Select
              placeholder="选择可见性"
              options={[
                { value: false, label: '私密' },
                { value: true, label: '公开（与班级分享）' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
