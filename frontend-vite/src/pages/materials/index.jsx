import { useEffect, useState } from 'react';
import { Card, Row, Col, Upload, Button, Tag, Modal, Form, Input, Select, message, Empty, Spin, Progress, Statistic } from 'antd';
import { InboxOutlined, PictureOutlined, VideoCameraOutlined, AudioOutlined, FileOutlined, DeleteOutlined, DownloadOutlined, EyeOutlined, UploadOutlined, SearchOutlined } from '@ant-design/icons';

const { Option } = Select;
const { Dragger } = Upload;

const typeMap = {
  image: { icon: <PictureOutlined />, color: '#1890ff', label: '图片' },
  video: { icon: <VideoCameraOutlined />, color: '#52c41a', label: '视频' },
  audio: { icon: <AudioOutlined />, color: '#fa8c16', label: '音频' },
  document: { icon: <FileOutlined />, color: '#722ed1', label: '文档' },
  other: { icon: <FileOutlined />, color: '#8c8c8c', label: '其他' },
};

export default function MaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, byType: {}, totalSize: 0 });
  const [typeFilter, setTypeFilter] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [form] = Form.useForm();

  const fetchMaterials = async (resetPage = false) => {
    setLoading(true);
    try {
      const currentPage = resetPage ? 1 : page;
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('pageSize', pageSize.toString());
      if (typeFilter) params.append('type', typeFilter);

      const res = await fetch(`/api/materials?${params.toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      }).then(r => r.json());

      if (res.status === 200) {
        setMaterials(res.result.materials || []);
        setTotal(res.result.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/materials/stats', {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      }).then(r => r.json());
      if (res.status === 200) {
        setStats(res.result || { total: 0, byType: {}, totalSize: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchMaterials();
    fetchStats();
  }, [page, typeFilter]);

  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name);
    formData.append('size', file.size.toString());
    formData.append('mimeType', file.type);
    formData.append('type', getFileType(file.type));
    formData.append('url', URL.createObjectURL(file));
    return false;
  };

  const getFileType = (mimeType) => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('document') || mimeType.includes('pdf') || mimeType.includes('word')) return 'document';
    return 'other';
  };

  const handleAddMaterial = async (values) => {
    try {
      const res = await fetch('/api/materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(values),
      }).then(r => r.json());

      if (res.status === 200) {
        message.success('素材添加成功');
        setIsModalOpen(false);
        form.resetFields();
        fetchMaterials(true);
        fetchStats();
      } else {
        message.error('添加失败');
      }
    } catch (error) {
      message.error('添加失败');
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/materials/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      }).then(r => r.json());

      if (res.status === 200) {
        message.success('删除成功');
        fetchMaterials();
        fetchStats();
      }
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleDownload = async (id) => {
    try {
      await fetch(`/api/materials/${id}/download`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      });
      message.success('下载次数已记录');
    } catch (error) {
      console.error('Failed to record download:', error);
    }
  };

  const showDetail = async (id) => {
    try {
      const res = await fetch(`/api/materials/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      }).then(r => r.json());
      if (res.status === 200) {
        setSelectedMaterial(res.result);
        setIsDetailOpen(true);
      }
    } catch (error) {
      console.error('Failed to fetch material:', error);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div style={{ padding: 24 }}>
      <Card
        title="素材中心"
        extra={
          <Button type="primary" icon={<UploadOutlined />} onClick={() => setIsModalOpen(true)}>
            上传素材
          </Button>
        }
      >
        {/* Statistics */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Statistic title="素材总数" value={stats.total} />
          </Col>
          <Col span={6}>
            <Statistic title="图片" value={stats.byType?.image || 0} prefix={<PictureOutlined />} valueStyle={{ color: '#1890ff' }} />
          </Col>
          <Col span={6}>
            <Statistic title="视频" value={stats.byType?.video || 0} prefix={<VideoCameraOutlined />} valueStyle={{ color: '#52c41a' }} />
          </Col>
          <Col span={6}>
            <Statistic title="总大小" value={formatSize(stats.totalSize)} />
          </Col>
        </Row>

        {/* Filter */}
        <div style={{ marginBottom: 24 }}>
          <span style={{ marginRight: 8 }}>筛选类型:</span>
          <Select
            placeholder="选择类型"
            allowClear
            style={{ width: 200 }}
            onChange={(value) => { setTypeFilter(value); setPage(1); }}
            value={typeFilter}
          >
            <Option value="image">图片</Option>
            <Option value="video">视频</Option>
            <Option value="audio">音频</Option>
            <Option value="document">文档</Option>
            <Option value="other">其他</Option>
          </Select>
        </div>

        {/* Materials Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <Spin size="large" />
          </div>
        ) : materials.length === 0 ? (
          <Empty description="暂无素材" style={{ padding: 40 }} />
        ) : (
          <>
            <Row gutter={[16, 16]}>
              {materials.map((material) => {
                const typeInfo = typeMap[material.type] || typeMap.other;
                return (
                  <Col xs={24} sm={12} md={8} lg={6} key={material.id}>
                    <Card
                      hoverable
                      cover={
                        material.type === 'image' ? (
                          <div style={{ height: 150, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
                            <img src={material.thumbnailUrl || material.url} alt={material.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'cover' }} />
                          </div>
                        ) : (
                          <div style={{ height: 150, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', fontSize: 48, color: typeInfo.color }}>
                            {typeInfo.icon}
                          </div>
                        )
                      }
                      actions={[
                        <EyeOutlined key="view" onClick={() => showDetail(material.id)} />,
                        <DownloadOutlined key="download" onClick={() => handleDownload(material.id)} />,
                        <DeleteOutlined key="delete" onClick={() => handleDelete(material.id)} />,
                      ]}
                    >
                      <Card.Meta
                        title={material.name}
                        description={
                          <div>
                            <Tag color={typeInfo.color}>{typeInfo.label}</Tag>
                            <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                              {formatSize(material.size)} | {material.views} 次浏览 | {material.downloads} 次下载
                            </div>
                          </div>
                        }
                      />
                    </Card>
                  </Col>
                );
              })}
            </Row>

            {/* Pagination */}
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <Button disabled={page === 1} onClick={() => setPage(page - 1)}>上一页</Button>
              <span style={{ margin: '0 16px' }}>第 {page} / {Math.ceil(total / pageSize)} 页</span>
              <Button disabled={page * pageSize >= total} onClick={() => setPage(page + 1)}>下一页</Button>
            </div>
          </>
        )}
      </Card>

      {/* Upload Modal */}
      <Modal
        title="上传素材"
        open={isModalOpen}
        onCancel={() => { setIsModalOpen(false); form.resetFields(); }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleAddMaterial}>
          <Form.Item name="name" label="素材名称" rules={[{ required: true, message: '请输入素材名称' }]}>
            <Input placeholder="请输入素材名称" />
          </Form.Item>

          <Form.Item name="type" label="素材类型" rules={[{ required: true, message: '请选择素材类型' }]}>
            <Select placeholder="请选择素材类型">
              <Option value="image">图片</Option>
              <Option value="video">视频</Option>
              <Option value="audio">音频</Option>
              <Option value="document">文档</Option>
              <Option value="other">其他</Option>
            </Select>
          </Form.Item>

          <Form.Item name="url" label="素材URL" rules={[{ required: true, message: '请输入素材URL' }]}>
            <Input placeholder="请输入素材URL" />
          </Form.Item>

          <Form.Item name="thumbnailUrl" label="缩略图URL">
            <Input placeholder="请输入缩略图URL（可选）" />
          </Form.Item>

          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="请输入素材描述（可选）" />
          </Form.Item>

          <Form.Item name="tags" label="标签">
            <Input placeholder="请输入标签，用逗号分隔（可选）" />
          </Form.Item>

          <Form.Item name="isPublic" label="是否公开" initialValue={true}>
            <Select>
              <Option value={true}>公开</Option>
              <Option value={false}>私有</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>添加素材</Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        title="素材详情"
        open={isDetailOpen}
        onCancel={() => { setIsDetailOpen(false); setSelectedMaterial(null); }}
        footer={[
          <Button key="download" type="primary" icon={<DownloadOutlined />} onClick={() => selectedMaterial && handleDownload(selectedMaterial.id)}>
            下载
          </Button>,
          <Button key="close" onClick={() => setIsDetailOpen(false)}>关闭</Button>,
        ]}
      >
        {selectedMaterial && (
          <div>
            {selectedMaterial.type === 'image' && (
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <img src={selectedMaterial.thumbnailUrl || selectedMaterial.url} alt={selectedMaterial.name} style={{ maxWidth: '100%' }} />
              </div>
            )}
            <p><strong>名称:</strong> {selectedMaterial.name}</p>
            <p><strong>类型:</strong> <Tag color={typeMap[selectedMaterial.type]?.color}>{typeMap[selectedMaterial.type]?.label}</Tag></p>
            <p><strong>大小:</strong> {formatSize(selectedMaterial.size)}</p>
            <p><strong>MIME类型:</strong> {selectedMaterial.mimeType}</p>
            <p><strong>浏览次数:</strong> {selectedMaterial.views}</p>
            <p><strong>下载次数:</strong> {selectedMaterial.downloads}</p>
            <p><strong>描述:</strong> {selectedMaterial.description || '无'}</p>
            <p><strong>标签:</strong> {selectedMaterial.tags || '无'}</p>
            <p><strong>创建时间:</strong> {new Date(selectedMaterial.createdAt).toLocaleString()}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
