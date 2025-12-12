import React, { useState } from "react";
import {
  Layout,
  Typography,
  Form,
  Input,
  Button,
  Card,
  Table,
  Space,
  Tag,
  Row,
  Col,
  message,
  Modal,
  Switch,
} from "antd";
import { useForm, router, Head } from "@inertiajs/react";
import { PlusCircleOutlined, EditOutlined } from "@ant-design/icons";

import Sidebar from "@/Components/Sidebar";
import Navbar from "@/Components/Navbar";
import EditBarangayModal from "@/modal/EditBarangayModal";

const { Content } = Layout;

export default function CreateBarangayAccount({ auth, barangays = [] }) {
  const [collapsed, setCollapsed] = useState(true);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedBarangay, setSelectedBarangay] = useState(null);

  const form = useForm({
    name: "",
    email: "",
    password: "",
  });

  const handleFinish = () => {
    form.post(route("barangays.store"), {
      onSuccess: () => {
        message.success("Barangay created successfully");
        form.reset();
        router.reload({ only: ["barangays"] });
      },
      onError: () => message.error("Please check the form for errors."),
    });
  };

  const handleEdit = (barangay) => {
    setSelectedBarangay(barangay);
    setIsEditModalVisible(true);
  };

  const handleStatusToggle = (record) => {
  const newStatus = !record.barangay_profile?.is_active;

  // Barangay user_id to send to backend
  const userId = record.id; // this is the user_id of barangay user account

  console.log("🔄 Toggling Barangay Active Status", {
    userId,
    currentStatus: record.barangay_profile?.is_active,
    newStatus,
  });

  router.put(
    route("barangays.toggleActive", userId),
    { is_active: newStatus },
    {
      preserveScroll: true,
      onSuccess: (page) => {
        message.success(
          `Barangay ${newStatus ? "activated" : "deactivated"} successfully.`
        );
        router.reload({ only: ["barangays"] }); // refresh barangay list
      },
      onError: (errors) => {
        console.error("❌ Toggle failed:", errors);
        message.error("Failed to update status.");
      },
    }
  );
};

  const columns = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Role", dataIndex: "role", key: "role" },
    {
      title: "Barangay Name",
      key: "barangay_name",
      render: (_, record) =>
        record.barangay_profile?.name || <Tag color="default">N/A</Tag>,
    },
    {
      title: "Zone Count",
      key: "zone_count",
      render: (_, record) =>
        record.barangay_profile?.zone_count || <Tag color="default">N/A</Tag>,
    },
    {
      title: "Profile Status",
      key: "status",
      render: (_, record) =>
        record.barangay_profile ? (
          <Tag color="green">Profile Added</Tag>
        ) : (
          <Tag color="orange">Pending</Tag>
        ),
    },
    {
  title: "Active Status",
  key: "is_active",
  render: (_, record) => {
    const isActive = record.barangay_profile?.is_active;
    return (
      <Space>
        <div
          style={{
            padding: 4,
            borderRadius: 20,
            background: "#fff",
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            display: "inline-block",
          }}
        >
          <Switch
            checked={isActive}
            onChange={() => handleStatusToggle(record)}
            checkedChildren="Active"
            unCheckedChildren="Inactive"
          />
        </div>
      </Space>
    );
  },
},
  {
  title: "Actions",
  key: "actions",
  render: (_, record) => (
    <Button
      icon={<EditOutlined style={{ color: "#003a8c", fontWeight: "bold" }} />} // dark blue icon
      onClick={() => handleEdit(record)}
      type="default" // keeps default button background
      style={{
        fontWeight: "600",
        color: "#003a8c", // bold text color to match icon
      }}
    >
      Edit
    </Button>
  ),
}

  ];

  return (
    <Layout style={{ minHeight: "100vh", backgroundColor: "#f4f6f9" }}>
      <Head title="Barangay Management" />
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

        <Content style={{ margin: "24px", overflow: "auto" }}>
          {/* Create Barangay Form */}
          <Card
            title="Create New Barangay"
            style={{
              borderRadius: 16,
              boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
              marginBottom: 32,
              backgroundColor: "#ffffff",
            }}
            headStyle={{
              fontWeight: 700,
              fontSize: "1.3rem",
              color: "#001529",
            }}
          >
            <Typography.Text
              type="secondary"
              style={{ display: "block", marginBottom: 16 }}
            >
              Add a new barangay account. All fields are required.
            </Typography.Text>

            <Form layout="vertical" onFinish={handleFinish}>
              <Row gutter={24}>
                <Col xs={24} sm={8}>
                  <Form.Item
                    label="Name"
                    validateStatus={form.errors.name && "error"}
                    help={form.errors.name || "Enter barangay name"}
                  >
                    <Input
                      placeholder="Barangay Name"
                      value={form.data.name}
                      onChange={(e) => form.setData("name", e.target.value)}
                      size="large"
                      style={{
                        borderRadius: 12,
                        padding: "10px 16px",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                        transition: "all 0.2s",
                      }}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={8}>
                  <Form.Item
                    label="Email"
                    validateStatus={form.errors.email && "error"}
                    help={form.errors.email || "Email will be used for login"}
                  >
                    <Input
                      placeholder="barangay@email.com"
                      value={form.data.email}
                      onChange={(e) => form.setData("email", e.target.value)}
                      size="large"
                      style={{
                        borderRadius: 12,
                        padding: "10px 16px",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                        transition: "all 0.2s",
                      }}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={8}>
                  <Form.Item
                    label="Password"
                    validateStatus={form.errors.password && "error"}
                    help={form.errors.password || "Set a secure password"}
                  >
                    <Input.Password
                      placeholder="••••••••"
                      value={form.data.password}
                      onChange={(e) =>
                        form.setData("password", e.target.value)
                      }
                      size="large"
                      style={{
                        borderRadius: 12,
                        padding: "10px 16px",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                        transition: "all 0.2s",
                      }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item style={{ textAlign: "right", marginTop: 16 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<PlusCircleOutlined />}
                  size="large"
                  style={{
                    borderRadius: 12,
                    padding: "0 28px",
                    fontWeight: 600,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    transition: "all 0.2s",
                  }}
                >
                  Create Barangay
                </Button>
              </Form.Item>
            </Form>
          </Card>

          {/* Barangay Management Table */}
          <Card
            title="Barangay Management"
            style={{
              borderRadius: 12,
              boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
            }}
            headStyle={{ fontWeight: 600, fontSize: "1.1rem" }}
          >
            <Table
              style={{ marginTop: 16 }}
              dataSource={barangays}
              columns={columns}
              rowKey="id"
              bordered={false}
              pagination={{ pageSize: 6 }}
              scroll={{ x: "max-content" }}
            />
          </Card>

          {/* Edit Barangay Modal */}
          <EditBarangayModal
            visible={isEditModalVisible}
            onCancel={() => setIsEditModalVisible(false)}
            barangay={selectedBarangay}
          />
        </Content>
      </Layout>
    </Layout>
  );
}
