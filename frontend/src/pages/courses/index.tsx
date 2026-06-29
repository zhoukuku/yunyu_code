import { useEffect, useState } from 'react';
import { history } from '@umijs/max';
import { Row, Col, Card, Tag, Tabs } from 'antd';
import { BookOutlined } from '@ant-design/icons';
import { getHierarchy } from '@/services/api';
import type { Hierarchy } from '@/services/types';
import './index.less';

const { TabPane } = Tabs;

export default function CoursesPage() {
  const [hierarchies, setHierarchies] = useState<Hierarchy[]>([]);

  useEffect(() => {
    loadHierarchy();
  }, []);

  const loadHierarchy = async () => {
    try {
      const res = await getHierarchy();
      if (res.status === 200) {
        setHierarchies(res.result || []);
      }
    } catch (e) {
      console.error('加载失败', e);
    }
  };

  const handleCardClick = (item: Hierarchy) => {
    history.push(`/courses/${item.id}`);
  };

  const grouped = hierarchies.reduce((acc, h) => {
    const key = h.hierarchyName;
    if (!acc[key]) acc[key] = [];
    acc[key].push(h);
    return acc;
  }, {} as Record<string, Hierarchy[]>);

  return (
    <div className="courses-page">
      <Card title="课程中心">
        <Tabs defaultActiveKey="Scratch">
          {Object.entries(grouped).map(([name, items]) => (
            <TabPane tab={name} key={name}>
              <Row gutter={[16, 16]}>
                {items.map((item) => (
                  <Col xs={24} sm={12} md={8} key={item.id}>
                    <Card
                      hoverable
                      clickable
                      onClick={() => handleCardClick(item)}
                      cover={<div className="course-cover"><BookOutlined style={{fontSize:48,color:'#fff'}} /></div>}
                    >
                      <Card.Meta title={item.hierarchyName} description={
                        <div><Tag color="blue">{item.standardClassifyName}</Tag><Tag color="green">{item.themeClassifyName}</Tag></div>
                      } />
                    </Card>
                  </Col>
                ))}
              </Row>
            </TabPane>
          ))}
        </Tabs>
      </Card>
    </div>
  );
}