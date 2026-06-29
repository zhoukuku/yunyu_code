import { useEffect, useState } from 'react';
import { Card, Row, Col, Button } from 'antd';
import { PlayCircleOutlined, CodeOutlined, CustomerServiceOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';

export default function CreatePage() {
  const { type } = useParams();
  const navigate = useNavigate();

  const types = [
    { key: 'scratch', name: '图形化编程', icon: <PlayCircleOutlined style={{ fontSize: 64, color: '#FFBF00' }} />, desc: '使用积木块学习编程，适合零基础学员', color: '#FFBF00' },
    { key: 'python', name: '趣味Python', icon: <CodeOutlined style={{ fontSize: 64, color: '#11998e' }} />, desc: 'Python趣味编程，边玩边学', color: '#11998e' },
    { key: 'python-ide', name: 'Python', icon: <CodeOutlined style={{ fontSize: 64, color: '#38ef7d' }} />, desc: '专业Python编程环境', color: '#38ef7d' },
    { key: 'cpp', name: 'C++', icon: <CustomerServiceOutlined style={{ fontSize: 64, color: '#fc4a1a' }} />, desc: 'C++程序设计', color: '#fc4a1a' },
  ];

  const currentType = type || 'scratch';

  return (
    <div style={{ padding: 24 }}>
      <Card title="选择编程环境">
        <Row gutter={[24, 24]}>
          {types.map(t => (
            <Col xs={24} sm={12} md={6} key={t.key}>
              <Card
                hoverable
                onClick={() => navigate(`/create/${t.key}`)}
                style={{ textAlign: 'center', border: currentType === t.key ? `2px solid ${t.color}` : 'none' }}
                cover={
                  <div style={{ padding: 40, background: `${t.color}20`, textAlign: 'center' }}>
                    {t.icon}
                  </div>
                }
              >
                <Card.Meta title={t.name} description={t.desc} />
                <Button type="primary" style={{ marginTop: 16, width: '100%' }} icon={t.icon}>
                  开始创作
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );
}