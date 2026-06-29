import { useEffect, useState } from 'react';
import { Card, Row, Col, Button, List, message, Modal, Input } from 'antd';
import { EditOutlined, DeleteOutlined, CloudOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getProjects, deleteProject } from '../../services/api';

export default function MyWorksPage() {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (searchText) {
      const filtered = projects.filter(p =>
        p.name && p.name.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredProjects(filtered);
    } else {
      setFilteredProjects(projects);
    }
  }, [searchText, projects]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const res = await getProjects(user.id);
      const projectsList = res?.result || res?.records || (Array.isArray(res) ? res : []);
      setProjects(projectsList);
      setFilteredProjects(projectsList);
    } catch (error) {
      console.error('获取项目列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteProject(id);
      message.success('删除成功');
      fetchProjects();
    } catch (error) {
      console.error('删除失败:', error);
      message.error('删除失败');
    }
  };

  const handleEdit = (project) => {
    navigate(`/create/${project.type}`, { state: { projectId: project.id } });
  };

  return (
    <div style={{ padding: 24 }}>
      <Card title="我的作品" extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/create/scratch')}>
          创建新作品
        </Button>
      }>
        <div style={{ marginBottom: 16 }}>
          <Input.Search
            placeholder="搜索项目名称..."
            allowClear
            enterButton={<><SearchOutlined /> 搜索</>}
            onSearch={setSearchText}
            style={{ width: 300 }}
          />
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>加载中...</div>
        ) : filteredProjects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <CloudOutlined style={{ fontSize: 48, color: '#ccc' }} />
            <p style={{ color: '#999', marginTop: 16 }}>{searchText ? '未找到匹配的项目' : '暂无作品'}</p>
            {!searchText && <Button type="primary" onClick={() => navigate('/create/scratch')}>开始创作</Button>}
          </div>
        ) : (
          <Row gutter={[16, 16]}>
            {filteredProjects.map(p => (
              <Col xs={24} sm={12} md={8} lg={6} key={p.id}>
                <Card
                  hoverable
                  cover={
                    <div style={{ height: 150, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 48 }}>🧩</span>
                    </div>
                  }
                  actions={[
                    <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(p)}>编辑</Button>,
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(p.id)}>删除</Button>
                  ]}
                >
                  <Card.Meta title={p.name} description={`类型: ${p.type === 'scratch' ? '图形化编程' : p.type} | 更新时间: ${new Date(p.updatedAt).toLocaleDateString()}`} />
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>
    </div>
  );
}