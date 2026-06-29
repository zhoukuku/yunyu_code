import { useEffect, useState } from 'react';
import { Table, Tag, Button, Switch, Select, Modal, message, Card, Input, Space, Popconfirm } from 'antd';
import { getAdminUsers, updateUserStatus, updateUserRole, createUser, deleteUser } from '../../services/api';

const { Option } = Select;
const { Search } = Input;

const roleMap = {
  1: { label: '管理员', color: 'red' },
  2: { label: '普通用户', color: 'blue' },
  3: { label: '教师', color: 'green' },
};

const statusMap = {
  1: { label: '启用', color: 'success' },
  0: { label: '禁用', color: 'default' },
};

export default function UserManage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [editingRole, setEditingRole] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createForm, setCreateForm] = useState({
    username: '',
    account: '',
    password: '',
    name: '',
    nickname: '',
    role: 2,
  });
  const [createLoading, setCreateLoading] = useState(false);

  const fetchUsers = async (page = 1, pageSize = 10, keyword = '') => {
    setLoading(true);
    try {
      const res = await getAdminUsers(page, pageSize, keyword);
      if (res.status === 200) {
        setData(res.result.records || []);
        setPagination({
          current: res.result.current,
          pageSize: res.result.size,
          total: res.result.total,
        });
      }
    } catch (e) {
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = (value) => {
    setSearchKeyword(value);
    fetchUsers(1, pagination.pageSize, value);
  };

  const handleStatusChange = async (id, checked) => {
    try {
      const res = await updateUserStatus(id, checked ? 1 : 0);
      if (res.status === 200) {
        message.success('状态更新成功');
        fetchUsers(pagination.current, pagination.pageSize, searchKeyword);
      }
    } catch (e) {
      message.error('状态更新失败');
    }
  };

  const handleRoleEdit = (record) => {
    setEditingRole(record.id);
    setSelectedRole(record.role);
  };

  const handleRoleSave = async (id) => {
    try {
      const res = await updateUserRole(id, selectedRole);
      if (res.status === 200) {
        message.success('角色更新成功');
        setEditingRole(null);
        fetchUsers(pagination.current, pagination.pageSize, searchKeyword);
      }
    } catch (e) {
      message.error('角色更新失败');
    }
  };

  const handleRoleCancel = () => {
    setEditingRole(null);
    setSelectedRole(null);
  };

  const handleCreateUser = async () => {
    if (!createForm.username || !createForm.account || !createForm.password) {
      message.error('请填写必填项');
      return;
    }
    setCreateLoading(true);
    try {
      const res = await createUser(createForm);
      if (res.status === 200) {
        message.success('创建用户成功');
        setCreateModalVisible(false);
        setCreateForm({ username: '', account: '', password: '', name: '', nickname: '', role: 2 });
        fetchUsers(1, pagination.pageSize, searchKeyword);
      }
    } catch (e) {
      message.error(e.response?.data?.message || '创建用户失败');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      const res = await deleteUser(id);
      if (res.status === 200) {
        message.success('删除用户成功');
        fetchUsers(pagination.current, pagination.pageSize, searchKeyword);
      }
    } catch (e) {
      message.error('删除用户失败');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '用户名', dataIndex: 'username' },
    { title: '账号', dataIndex: 'account' },
    { title: '姓名', dataIndex: 'name' },
    { title: '昵称', dataIndex: 'nickname' },
    {
      title: '角色',
      dataIndex: 'role',
      render: (role, record) => {
        if (editingRole === record.id) {
          return (
            <Select value={selectedRole} onChange={setSelectedRole} style={{ width: 100 }}>
              {Object.entries(roleMap).map(([k, v]) => (
                <Option key={k} value={+k}>{v.label}</Option>
              ))}
            </Select>
          );
        }
        return <Tag color={roleMap[role]?.color}>{roleMap[role]?.label}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (status, record) => (
        <Switch
          checked={status === 1}
          onChange={(checked) => handleStatusChange(record.id, checked)}
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />
      ),
    },
    {
      title: '操作',
      render: (_, record) => {
        if (editingRole === record.id) {
          return (
            <>
              <Button type="link" size="small" onClick={() => handleRoleSave(record.id)}>保存</Button>
              <Button type="link" size="small" onClick={handleRoleCancel}>取消</Button>
            </>
          );
        }
        return (
          <Space>
            <Button type="link" size="small" onClick={() => handleRoleEdit(record)}>编辑角色</Button>
            <Popconfirm
              title="确定删除该用户？"
              onConfirm={() => handleDeleteUser(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" danger>删除</Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <Card
      title="用户管理"
      extra={
        <Space>
          <Search
            placeholder="搜索用户名/账号/姓名/昵称"
            onSearch={handleSearch}
            style={{ width: 250 }}
            allowClear
          />
          <Button type="primary" onClick={() => setCreateModalVisible(true)}>创建用户</Button>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) => fetchUsers(page, pageSize, searchKeyword),
        }}
      />

      <Modal
        title="创建用户"
        open={createModalVisible}
        onOk={handleCreateUser}
        onCancel={() => {
          setCreateModalVisible(false);
          setCreateForm({ username: '', account: '', password: '', name: '', nickname: '', role: 2 });
        }}
        confirmLoading={createLoading}
        okText="创建"
        cancelText="取消"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <span style={{ color: 'red' }}>*</span> 用户名：
            <Input
              value={createForm.username}
              onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
              placeholder="请输入用户名"
              style={{ width: 200, marginLeft: 8 }}
            />
          </div>
          <div>
            <span style={{ color: 'red' }}>*</span> 账号：
            <Input
              value={createForm.account}
              onChange={(e) => setCreateForm({ ...createForm, account: e.target.value })}
              placeholder="请输入账号"
              style={{ width: 200, marginLeft: 8 }}
            />
          </div>
          <div>
            <span style={{ color: 'red' }}>*</span> 密码：
            <Input.Password
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              placeholder="请输入密码"
              style={{ width: 200, marginLeft: 8 }}
            />
          </div>
          <div>
            姓名：
            <Input
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              placeholder="请输入姓名"
              style={{ width: 200, marginLeft: 24 }}
            />
          </div>
          <div>
            昵称：
            <Input
              value={createForm.nickname}
              onChange={(e) => setCreateForm({ ...createForm, nickname: e.target.value })}
              placeholder="请输入昵称"
              style={{ width: 200, marginLeft: 24 }}
            />
          </div>
          <div>
            角色：
            <Select
              value={createForm.role}
              onChange={(value) => setCreateForm({ ...createForm, role: value })}
              style={{ width: 200, marginLeft: 24 }}
            >
              {Object.entries(roleMap).map(([k, v]) => (
                <Option key={k} value={+k}>{v.label}</Option>
              ))}
            </Select>
          </div>
        </div>
      </Modal>
    </Card>
  );
}
