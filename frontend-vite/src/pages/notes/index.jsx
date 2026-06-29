import { useEffect, useState } from 'react';
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

  const fetchNotes = async () => {
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
  };

  const fetchStats = async () => {
    try {
      const res = await getStudyNotesCount();
      if (res.status === 200) {
        setStats(res.result || { count: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchNotes();
    fetchStats();
  }, []);

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
        message.success('Note deleted successfully');
        fetchNotes();
        fetchStats();
      }
    } catch (error) {
      message.error('Failed to delete note');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingNote) {
        const res = await updateStudyNote(editingNote.id, values);
        if (res.status === 200) {
          message.success('Note updated successfully');
          setModalVisible(false);
          fetchNotes();
        }
      } else {
        const res = await createStudyNote(values);
        if (res.status === 200) {
          message.success('Note created successfully');
          setModalVisible(false);
          fetchNotes();
          fetchStats();
        }
      }
    } catch (error) {
      console.error('Failed to submit:', error);
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
            <span>Study Notes</span>
          </div>
        }
        extra={
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                {stats.count}
              </div>
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>Total Notes</div>
            </div>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              New Note
            </Button>
          </div>
        }
      >
        <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
          <Input
            placeholder="Search notes..."
            prefix={<SearchOutlined />}
            value={searchKeyword}
            onChange={e => setSearchKeyword(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
          {allTags.length > 0 && (
            <Select
              placeholder="Filter by tag"
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
          <Empty description="No notes found" style={{ padding: 40 }}>
            <Button type="primary" onClick={handleCreate}>Create Your First Note</Button>
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
                      title="Delete this note?"
                      onConfirm={() => handleDelete(note.id)}
                      okText="Yes"
                      cancelText="No"
                    >
                      <DeleteOutlined />
                    </Popconfirm>,
                  ]}
                >
                  <Card.Meta
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 14, fontWeight: 'bold' }}>{note.title}</span>
                        {note.isPublic && <Tag color="blue">Public</Tag>}
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
                          Updated: {new Date(note.updatedAt).toLocaleDateString()}
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
        title={editingNote ? 'Edit Note' : 'Create New Note'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText={editingNote ? 'Update' : 'Create'}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter a title' }]}
          >
            <Input placeholder="Enter note title" />
          </Form.Item>
          <Form.Item
            name="content"
            label="Content"
            rules={[{ required: true, message: 'Please enter content' }]}
          >
            <TextArea rows={8} placeholder="Enter your notes here..." />
          </Form.Item>
          <Form.Item name="tags" label="Tags (comma separated)">
            <Input placeholder="e.g. math, calculus, important" />
          </Form.Item>
          <Form.Item name="isPublic" label="Visibility" valuePropName="checked">
            <Select
              placeholder="Select visibility"
              options={[
                { value: false, label: 'Private' },
                { value: true, label: 'Public (share with class)' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
