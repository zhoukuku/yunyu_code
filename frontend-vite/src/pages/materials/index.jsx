import { useEffect, useState, useCallback } from 'react';
import { Card, Row, Col, Button, Tag, Modal, Form, Input, Select, message, Empty, Spin, Statistic, Pagination, Space } from 'antd';
import { PictureOutlined, VideoCameraOutlined, AudioOutlined, FileOutlined, DeleteOutlined, DownloadOutlined, EyeOutlined, UploadOutlined, SearchOutlined } from '@ant-design/icons';
import {
  getMaterials,
  searchMaterials,
  getMaterialStats,
  getMaterial,
  createMaterial,
  deleteMaterial,
  recordDownload,
} from '../../services/api';

const { Option } = Select;

const PAGE_SIZE = 20;

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
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ total: 0, byType: {}, totalSize: 0 });
  const [typeFilter, setTypeFilter] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [form] = Form.useForm();

  const buildFilters = useCallback(() => {
    const filters = { page, pageSize: PAGE_SIZE };
    if (typeFilter) filters.type = typeFilter;
    return filters;
  }, [page, typeFilter]);

  const fetchMaterials = useCallback(async (overridePage) => {
    setError(null);
    setLoading(true);
    try {
      const currentPage = overridePage ?? page;
      const filters = { page: currentPage, pageSize: PAGE_SIZE };
      if (typeFilter) filters.type = typeFilter;

      let res;
      if (keyword.trim()) {
        res = await searchMaterials(keyword.trim(), filters);
      } else {
        res = await getMaterials(filters);
      }

      if (res?.status === 200 && res.result) {
        setMaterials(res.result.materials || []);
        setTotal(res.result.total || 0);
      } else {
        setMaterials([]);
        setTotal(0);
        setError(res?.msg || '获取素材列表失败');
      }
    } catch (err) {
      console.error('Failed to fetch materials:', err);
      setError(err?.response?.data?.msg || err?.message || '获取素材列表失败，请检查网络后重试');
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, keyword]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await getMaterialStats();
      if (res?.status === 200 && res.result) {
        setStats(res.result);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleSearch = (value) => {
    setKeyword(value.trim());
    setPage(1);
  };

  const handleTypeFilterChange = (value) => {
    setTypeFilter(value);
    setPage(1);
  };

  const handleAddMaterial = async (values) => {
    try {
      const payload = { ...values };
      if (typeof payload.isPublic === 'string') {
        payload.isPublic = payload.isPublic === 'true';
      }
      if (payload.tags && typeof payload.tags === 'string') {
        payload.tags = payload.tags.split(',').map((t) => t.trim()).filter(Boolean);
      }
      const res = await createMaterial(payload);
      if (res?.status === 200) {
        message.success('素材添加成功');
        setIsModalOpen(false);
        form.resetFields();
        setPage(1);
      } else {
        message.error(res?.msg || '添加失败');
      }
    } catch (err) {
      message.error(err?.response?.data?.msg || '添加失败');
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await deleteMaterial(id);
      if (res?.status === 200) {
        message.success('删除成功');
        // If we deleted the last item on this page, go back one page
        if (materials.length === 1 && page > 1) {
          setPage(page - 1);
        } else {
          fetchMaterials();
        }
        fetchStats();
      } else {
        message.error(res?.msg || '删除失败');
      }
    } catch (err) {
      message.error(err?.response?.data?.msg || '删除失败');
    }
  };

  const handleDownload = async (id) => {
    try {
      await recordDownload(id);
      message.success('下载次数已记录');
    } catch (err) {
      console.error('Failed to record download:', err);
    }
  };

  const showDetail = async (id) => {
    try {
      const res = await getMaterial(id);
      if (res?.status === 200 && res.result) {
        setSelectedMaterial(res.result);
        setIsDetailOpen(true);
      } else {
        message.error('获取素材详情失败');
      }
    } catch (err) {
      message.error('获取素材详情失败');
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <Spin size="large" />
        </div>
      );
    }

    if (error) {
      return (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Empty description={error} />
          <Button type="primary" onClick={() => fetchMaterials()} style={{ marginTop: 16 }}>
            重试
          </Button>
        </div>
      );
    }

    if (materials.length === 0) {
      const desc = keyword.trim()
        ? `未找到与"${keyword.trim()}"相关的素材`
        : typeFilter
          ? `暂无"${typeMap[typeFilter]?.label || typeFilter}"类型的素材`
          : '暂无素材，点击右上角上传';
      return <Empty description={desc} style={{ padding: 40 }} />;
    }

    return (
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

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Pagination
            current={page}
            pageSize={PAGE_SIZE}
            total={total}
            onChange={setPage}
            showSizeChanger={false}
            showTotal={(t) => `共 ${t} 条素材`}
          />
        </div>
      </>
    );
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

        {/* Search and Filter */}
        <Space style={{ marginBottom: 24 }} wrap>
          <Input.Search
            placeholder="搜索素材名称..."
            allowClear
            onSearch={handleSearch}
            style={{ width: 280 }}
            enterButton={<><SearchOutlined /> 搜索</>}
          />
          <span style={{ marginLeft: 8 }}>筛选类型:</span>
          <Select
            placeholder="选择类型"
            allowClear
            style={{ width: 160 }}
            onChange={handleTypeFilterChange}
            value={typeFilter}
          >
            <Option value="image">图片</Option>
            <Option value="video">视频</Option>
            <Option value="audio">音频</Option>
            <Option value="document">文档</Option>
            <Option value="other">其他</Option>
          </Select>
        </Space>

        {renderContent()}
      </Card>

      {/* Upload Modal */}
      <Modal
        title="添加素材"
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

          <Form.Item name="size" label="文件大小(字节)">
            <Input type="number" placeholder="文件大小（可选）" />
          </Form.Item>

          <Form.Item name="mimeType" label="MIME类型">
            <Input placeholder="如 image/png（可选）" />
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
