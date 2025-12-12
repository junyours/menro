import React, { useState } from "react";
import { Head, useForm, router } from "@inertiajs/react";
import {
  Layout,
  Typography,
  Card,
  Form,
  Input,
  Button,
  List,
  Row,
  Col,
  Divider,
  Modal,
  message,
  Pagination,
  Space,
  Switch,
} from "antd";
import Sidebar from "@/Components/BarSide";
import Navbar from "@/Components/BarNav";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  LockOutlined,
  PlusCircleOutlined,
  SearchOutlined,
} from "@ant-design/icons";

const { Content } = Layout;
const { Title, Text } = Typography;

export default function CreateZonalLeaderAccount({ auth, leaders: initialLeaders, barangay }) {
  const [collapsed, setCollapsed] = useState(true);
  const toggleCollapsed = () => setCollapsed(!collapsed);

  const [leaders, setLeaders] = useState(initialLeaders);
  const [selectedLeader, setSelectedLeader] = useState(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editData, setEditData] = useState({
    firstname: "",
    lastname: "",
    phone_number: "",
    email: "",
  });

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const { data, setData, post, processing, errors, reset } = useForm({
    firstname: "",
    lastname: "",
    phone_number: "",
    email: "",
    password: "",
  });

  // ✅ Create Zonal Leader
  const submit = () => {
    post(route("zonal-leaders.store"), {
      onSuccess: (page) => {
        const newLeader = page.props?.leaders?.slice(-1)[0];
        if (newLeader) setLeaders((prev) => [newLeader, ...prev]);

        message.success("Zonal leader created successfully!");
        reset(); // clears the fields
        setCreateModalVisible(false);
      },
      onError: () => {
        message.error("Failed to create Zonal Leader.");
      },
    });
  };

  // ✅ Open Edit Modal
  const openEditModal = (leader) => {
    setSelectedLeader(leader);
    setEditData({
      firstname: leader.firstname,
      lastname: leader.lastname,
      phone_number: leader.phone_number,
      email: leader.user.email,
    });
    setEditModalVisible(true);
  };

  // ✅ Handle Edit Submit
  const handleEditSubmit = async () => {
    try {
      const response = await axios.put(
        route("zonal-leaders.update", selectedLeader.id),
        editData
      );

      message.success(response.data.message);

      // Update UI with new data
      setLeaders((prev) =>
        prev.map((l) =>
          l.id === selectedLeader.id ? { ...response.data.leader } : l
        )
      );

      setEditModalVisible(false);
    } catch (error) {
      console.error(error);
      message.error("Failed to update leader. Please try again.");
    }
  };

  // ✅ Toggle Active/Inactive
  const toggleActive = (leader, checked) => {
    setLeaders((prev) =>
      prev.map((l) => (l.id === leader.id ? { ...l, is_active: checked } : l))
    );

    router.put(
      route("zonal-leaders.updateStatus", leader.id),
      { is_active: checked },
      {
        preserveState: true,
        onError: () => {
          setLeaders((prev) =>
            prev.map((l) =>
              l.id === leader.id ? { ...l, is_active: leader.is_active } : l
            )
          );
          message.error("Failed to update status.");
        },
        onSuccess: () => {
          message.success(
            `${leader.firstname} ${leader.lastname} is now ${checked ? "Active" : "Inactive"}`
          );
        },
      }
    );
  };

  // ✅ Filter + Pagination
  const filteredLeaders = leaders.filter((leader) =>
    `${leader.firstname} ${leader.lastname}`.toLowerCase().includes(search.toLowerCase())
  );
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedLeaders = filteredLeaders.slice(startIndex, startIndex + pageSize);

  return (
    <Layout style={{ minHeight: "100vh", backgroundColor: "#f3f6fa" }}>
      <Head title="Zonal Leader Management" />
      <Sidebar collapsed={collapsed} toggleCollapsed={toggleCollapsed} />
      <Layout style={{ background: "transparent" }}>
        <Navbar collapsed={collapsed} toggleCollapsed={toggleCollapsed} user={auth.user} />
        <Content style={{ margin: "24px 16px" }}>
          {/* Header */}
          <div
            style={{
              background: "linear-gradient(135deg, #2c3e50, #34495e)",
              padding: "32px 24px",
              borderRadius: "18px",
              margin: "24px",
              boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
              position: "relative",
              zIndex: 1,
            }}
          >
            <Row justify="space-between" align="middle">
              <Col>
                <Title
                  level={2}
                  style={{ color: "#fff", marginBottom: 4, fontWeight: 800, textShadow: "1px 1px 3px rgba(0,0,0,0.3)" }}
                >
                  Zonal Leader Management
                </Title>
                <Text type="secondary" style={{ fontSize: 15, color: "#dfe6ed" }}>
                  Manage zonal leaders for Barangay:{" "}
                  <strong style={{ color: "#1a73e8" }}>{barangay?.name}</strong>
                </Text>
              </Col>
              <Col>
                <Button
                  type="primary"
                  icon={<PlusCircleOutlined />}
                  size="large"
                  style={{
                    borderRadius: 10,
                    background: "linear-gradient(90deg,#667eea,#764ba2)",
                    border: "none",
                    fontWeight: 600,
                    boxShadow: "0 4px 14px rgba(102,126,234,0.35)",
                  }}
                  onClick={() => setCreateModalVisible(true)}
                >
                  New Zonal Leader
                </Button>
              </Col>
            </Row>
          </div>

          {/* Leaders List */}
          <Row style={{ padding: "0 24px" }}>
            <Col span={24}>
              <Card
                title={
                  <Row justify="space-between" align="middle">
                    <Col>
                      <Text strong style={{ fontSize: 17, color: "#2c3e50" }}>
                        Existing Zonal Leaders
                      </Text>
                    </Col>
                    <Col>
                      <Input
                        prefix={<SearchOutlined />}
                        placeholder="Search by name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ borderRadius: 8, width: 250 }}
                      />
                    </Col>
                  </Row>
                }
                style={{
                  borderRadius: 20,
                  padding: 24,
                  background: "#ffffff",
                  boxShadow: "0 6px 25px rgba(0,0,0,0.07)",
                }}
                hoverable
              >
                <List
                  itemLayout="horizontal"
                  dataSource={paginatedLeaders}
                  renderItem={(leader) => (
                    <List.Item
                      style={{
                        borderBottom: "1px solid #f0f0f0",
                        padding: "18px 12px",
                        borderRadius: 14,
                        background: "#fafbff",
                        marginBottom: 8,
                        boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                        transition: "all 0.3s ease",
                        cursor: "pointer",
                      }}
                      key={leader.id}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f4ff")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#fafbff")}
                    >
                      <List.Item.Meta
                        title={
                          <Text
                            strong
                            style={{
                              fontSize: 16,
                              color: "#34495e",
                              transition: "color 0.3s",
                            }}
                            onClick={() => openEditModal(leader)}
                            onMouseEnter={(e) => (e.target.style.color = "#1a73e8")}
                            onMouseLeave={(e) => (e.target.style.color = "#34495e")}
                          >
                            {leader.firstname} {leader.lastname}
                          </Text>
                        }
                        description={
                          <Space direction="vertical" size={2}>
                            <Text type="secondary">
                              <PhoneOutlined /> {leader.phone_number}
                            </Text>
                            <Text type="secondary">
                              <MailOutlined /> {leader.user.email}
                            </Text>
                          </Space>
                        }
                      />
                      <Switch
                        checked={leader.is_active}
                        checkedChildren="Active"
                        unCheckedChildren="Inactive"
                        onChange={(checked) => toggleActive(leader, checked)}
                      />
                    </List.Item>
                  )}
                />
                {filteredLeaders.length > pageSize && (
                  <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={filteredLeaders.length}
                    onChange={(page) => setCurrentPage(page)}
                    showSizeChanger={false}
                    style={{ marginTop: 16, textAlign: "center" }}
                  />
                )}
              </Card>
            </Col>
          </Row>

          <Divider style={{ margin: "32px 24px" }} />

          {/* Create Modal */}
          <Modal
            title="Create New Zonal Leader"
            open={createModalVisible}
            onCancel={() => setCreateModalVisible(false)}
            footer={null}
            centered
            style={{ borderRadius: 16, overflow: "hidden" }}
          >
            <Form layout="vertical" onFinish={submit}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="First Name" name="firstname" validateStatus={errors.firstname && "error"} help={errors.firstname}>
                    <Input
                      placeholder="First Name"
                      prefix={<UserOutlined />}
                      value={data.firstname}
                      onChange={(e) => setData("firstname", e.target.value)}
                      style={{ borderRadius: 10 }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Last Name" name="lastname" validateStatus={errors.lastname && "error"} help={errors.lastname}>
                    <Input
                      placeholder="Last Name"
                      prefix={<UserOutlined />}
                      value={data.lastname}
                      onChange={(e) => setData("lastname", e.target.value)}
                      style={{ borderRadius: 10 }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Phone Number" name="phone_number" validateStatus={errors.phone_number && "error"} help={errors.phone_number}>
                    <Input
                      placeholder="Phone Number"
                      prefix={<PhoneOutlined />}
                      value={data.phone_number}
                      onChange={(e) => setData("phone_number", e.target.value)}
                      style={{ borderRadius: 10 }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Email" name="email" validateStatus={errors.email && "error"} help={errors.email}>
                    <Input
                      type="email"
                      placeholder="Email"
                      prefix={<MailOutlined />}
                      value={data.email}
                      onChange={(e) => setData("email", e.target.value)}
                      style={{ borderRadius: 10 }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item label="Password" name="password" validateStatus={errors.password && "error"} help={errors.password}>
                    <Input.Password
                      placeholder="Password"
                      prefix={<LockOutlined />}
                      value={data.password}
                      onChange={(e) => setData("password", e.target.value)}
                      style={{ borderRadius: 10 }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={processing}
                  block
                  style={{
                    borderRadius: 10,
                    background: "linear-gradient(90deg,#667eea,#764ba2)",
                    border: "none",
                    height: 44,
                    fontWeight: 500,
                    boxShadow: "0 4px 12px rgba(102,126,234,0.3)",
                  }}
                >
                  Create Zonal Leader
                </Button>
              </Form.Item>
            </Form>
          </Modal>

          {/* Edit Modal */}
          <Modal
            title={<div style={{ fontSize: 20, fontWeight: 600, color: "#2c3e50", textAlign: "center" }}>Edit Zonal Leader</div>}
            open={editModalVisible}
            onCancel={() => setEditModalVisible(false)}
            footer={null}
            centered
            style={{ borderRadius: 20, overflow: "hidden" }}
          >
            <Form layout="vertical" onFinish={handleEditSubmit}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="First Name">
                    <Input
                      value={editData.firstname}
                      onChange={(e) => setEditData({ ...editData, firstname: e.target.value })}
                      style={{ borderRadius: 10 }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Last Name">
                    <Input
                      value={editData.lastname}
                      onChange={(e) => setEditData({ ...editData, lastname: e.target.value })}
                      style={{ borderRadius: 10 }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Phone Number">
                    <Input
                      value={editData.phone_number}
                      onChange={(e) => setEditData({ ...editData, phone_number: e.target.value })}
                      style={{ borderRadius: 10 }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Email">
                    <Input
                      value={editData.email}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      style={{ borderRadius: 10 }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  style={{
                    borderRadius: 10,
                    background: "linear-gradient(90deg,#36d1dc,#5b86e5)",
                    border: "none",
                    height: 44,
                    fontWeight: 500,
                    boxShadow: "0 4px 12px rgba(91,134,229,0.3)",
                  }}
                >
                  Save Changes
                </Button>
              </Form.Item>
            </Form>
          </Modal>
        </Content>
      </Layout>
    </Layout>
  );
}
