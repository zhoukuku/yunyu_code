import { Button, Space, Dropdown } from 'antd';
import { EditOutlined, PlusOutlined, DeleteOutlined, CustomerServiceOutlined } from '@ant-design/icons';

export default function SpritePanel({
  sprites,
  selectedSprite,
  spriteFeaturesVisible,
  spriteModalVisible,
  editingSpriteName,
  setSpriteFeaturesVisible,
  setSpriteModalVisible,
  setEditingSpriteName,
  handleSelectSprite,
  handleDeleteSprite,
}) {
  return (
    <div className="sprite-panel">
      <div className="sprite-panel-header">
        <span>角色列表</span>
        <Space size={4}>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => setSpriteFeaturesVisible(!spriteFeaturesVisible)}
            style={{ color: spriteFeaturesVisible ? '#6366f1' : undefined }}
            title="角色属性"
          />
          <Button type="text" icon={<PlusOutlined />} onClick={() => setSpriteModalVisible(true)} />
        </Space>
      </div>
      <div className="sprite-list">
        {sprites.map(sprite => (
          <div
            key={sprite.id}
            className={`sprite-item ${selectedSprite === sprite.id ? 'selected' : ''}`}
            onClick={() => handleSelectSprite(sprite.id)}
          >
            <div className="sprite-thumbnail">
              {sprite.costumes[0]?.dataUrl ? (
                <img src={sprite.costumes[0].dataUrl} alt={sprite.name} />
              ) : (
                <div className="sprite-placeholder" />
              )}
            </div>
            <span className="sprite-name">{sprite.name}</span>
            <Dropdown menu={{
              items: [
                { key: 'rename', label: '重命名', icon: <EditOutlined />, onClick: ({ domEvent }) => { domEvent.stopPropagation(); setEditingSpriteName(sprite.name); setSpriteModalVisible(true); } },
                { key: 'delete', label: '删除', icon: <DeleteOutlined />, danger: true, onClick: ({ domEvent }) => { domEvent.stopPropagation(); handleDeleteSprite(sprite.id); } },
              ]
            }}>
              <Button type="text" size="small" icon={<CustomerServiceOutlined />} onClick={e => e.stopPropagation()} />
            </Dropdown>
          </div>
        ))}
      </div>
    </div>
  );
}