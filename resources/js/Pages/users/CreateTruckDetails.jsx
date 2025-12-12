import React, { useEffect, useState } from 'react';
import {
  message,
  Layout,
  Button,
  Typography,
  Form,
  Input,
  Modal,
  Table,
  Card,
  Tag,
  Space,
  Select,
} from 'antd';
import { useForm, router, Head } from '@inertiajs/react';
import { PlusCircleOutlined, EditOutlined, DeleteOutlined,CloseCircleOutlined, CheckCircleOutlined, ToolOutlined } from '@ant-design/icons';
import Sidebar from '@/Components/Sidebar';
import Navbar from '@/Components/Navbar';
import EditTruckModal from '@/modal/EditTruckModal';

const { Content } = Layout;
const { Text, Title } = Typography;
const { Option } = Select;

const inputStyle = {
  borderRadius: 12,
  border: '1px solid #d9d9d9',
  padding: '12px 16px',
  boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.05)',
  transition: 'all 0.3s',
  width: '100%',
  fontSize: '1rem',
};

const tableStyle = {
  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
  borderRadius: 12,
  overflow: 'hidden',
};

export default function CreateTruckDetails({ auth, trucks = [] }) {
  const [collapsed, setCollapsed] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedTruck, setSelectedTruck] = useState(null);

  const { data, setData, post, processing, errors, reset } = useForm({
    plate_number: '',
    model: '',
    status: 'Active',
  });

  useEffect(() => {
    const firstError = Object.values(errors)[0];
    if (firstError) message.error(firstError);
  }, [errors]);

  const showModal = () => setIsModalVisible(true);
  const handleCancel = () => {
    setIsModalVisible(false);
    reset();
  };

  const handleFinish = () => {
    post(route('trucks.store'), {
      onSuccess: () => {
        setIsModalVisible(false);
        reset();
        router.reload({ only: ['trucks'] });
        message.success('Truck created successfully');
      },
      onError: () => {
        message.error('Please fix the highlighted errors.');
      },
    });
  };

  const handleEdit = (truck) => {
    setSelectedTruck(truck);
    setIsEditModalVisible(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Delete Truck?',
      content: 'This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => {
        router.delete(route('trucks.destroy', id), {
          onSuccess: () => message.success('Truck deleted successfully'),
          onError: () => message.error('Failed to delete truck'),
        });
      },
    });
  };

  const columns = [
    { title: 'Plate Number', dataIndex: 'plate_number', key: 'plate_number' },
    { title: 'Model', dataIndex: 'model', key: 'model' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag
          color={
            status === 'Active'
              ? 'green'
              : status === 'Inactive'
              ? 'red'
              : 'orange'
          }
          style={{ fontWeight: 600, padding: '4px 12px', borderRadius: 8 }}
        >
          {status}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="default"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            style={{
              borderRadius: 8,
              background: '#f0f2f5',
              border: '1px solid #d9d9d9',
              fontWeight: 500,
            }}
          >
            Edit
          </Button>
          <Button
            type="primary"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
            style={{ borderRadius: 8, fontWeight: 500 }}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: '#f6f7fb' }}>
      <Head title="Truck Management" />
      <Sidebar
        collapsible
        collapsed={collapsed}
        onCollapse={() => setCollapsed(!collapsed)}
      />
      <Layout>
         <Navbar
                 collapsed={collapsed}
                 setCollapsed={setCollapsed}
                 auth={auth}
               />
        <Content style={{ margin: 24 }}>
          {/* Info Card */}
          <Card
            style={{
              marginBottom: 24,
              borderRadius: 16,
              background: 'linear-gradient(90deg, #e6f7ff 0%, #bae7ff 100%)',
              border: 'none',
              boxShadow: '0 6px 18px rgba(0,0,0,0.06)',
              padding: 24,
            }}
          >
            <Title level={4} style={{ marginBottom: 12 }}>
              Truck Management
            </Title>
            <Text>
              Manage your garbage trucks here. Click{' '}
              <Text strong>+ New Truck</Text> to register a new one.
            </Text>
          </Card>

          {/* New Truck Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <Button
              type="primary"
              icon={<PlusCircleOutlined />}
              size="large"
              onClick={showModal}
              style={{
                borderRadius: 12,
                fontWeight: 600,
                padding: '0 24px',
                background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
                border: 'none',
                boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.boxShadow = '0 6px 16px rgba(24, 144, 255, 0.5)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.boxShadow = '0 4px 12px rgba(24, 144, 255, 0.3)')
              }
            >
              New Truck
            </Button>
          </div>

          {/* Truck Table */}
          <Card
            style={{
              borderRadius: 16,
              boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              overflow: 'hidden',
            }}
            bodyStyle={{ padding: 0 }}
          >
            <Table
              dataSource={trucks}
              columns={columns}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              scroll={{ x: 'max-content' }}
              style={tableStyle}
              rowClassName={() => 'ant-table-row-hover'}
            />
          </Card>

         {/* New Truck Modal */}
<Modal
  title={
    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <PlusCircleOutlined style={{ color: '#1890ff', fontSize: 20 }} />
      Create Truck Account
    </span>
  }
  open={isModalVisible}
  onCancel={handleCancel}
  onOk={() => document.getElementById('truck-form-submit').click()}
  confirmLoading={processing}
  okText="Create"
  centered
  bodyStyle={{ padding: 32 }}
  okButtonProps={{
    style: {
      borderRadius: 12,
      background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
      border: 'none',
      fontWeight: 600,
      boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)',
    },
  }}
  cancelButtonProps={{
    style: {
      borderRadius: 12,
      fontWeight: 500,
    },
  }}
>
  <Form layout="vertical" onFinish={handleFinish}>
    <Form.Item
      label="Plate Number"
      validateStatus={errors.plate_number ? 'error' : ''}
      help={errors.plate_number || ''}
    >
      <Input
        value={data.plate_number}
        onChange={(e) => setData('plate_number', e.target.value)}
        placeholder="e.g. ABC-1234"
        style={inputStyle}
      />
    </Form.Item>

    <Form.Item
      label="Model"
      validateStatus={errors.model ? 'error' : ''}
      help={errors.model || ''}
    >
      <Input
        value={data.model}
        onChange={(e) => setData('model', e.target.value)}
        placeholder="e.g. Isuzu NLR"
        style={inputStyle}
      />
    </Form.Item>

    <Form.Item
      label="Status"
      validateStatus={errors.status ? 'error' : ''}
      help={errors.status || ''}
    >
      <Select
        value={data.status}
        onChange={(value) => setData('status', value)}
        placeholder="Select status"
        allowClear
        style={{ borderRadius: 12 }}
      >
        <Option value="Active">
          <Tag color="green" style={{ fontWeight: 600 }}>
            <CheckCircleOutlined /> Active
          </Tag>
        </Option>
        <Option value="Inactive">
          <Tag color="red" style={{ fontWeight: 600 }}>
            <CloseCircleOutlined /> Inactive
          </Tag>
        </Option>
        <Option value="Under_Maintenance">
          <Tag color="orange" style={{ fontWeight: 600 }}>
            <ToolOutlined /> Under Maintenance
          </Tag>
        </Option>
      </Select>
    </Form.Item>

    <button type="submit" id="truck-form-submit" style={{ display: 'none' }} />
  </Form>
</Modal>


          {/* Edit Truck Modal */}
          <EditTruckModal
            visible={isEditModalVisible}
            onCancel={() => setIsEditModalVisible(false)}
            truck={selectedTruck}
            onSuccess={() => {
              setIsEditModalVisible(false);
              router.reload({ only: ['trucks'] });
              message.success('Truck updated successfully');
            }}
          />
        </Content>
      </Layout>
    </Layout>
  );
}
