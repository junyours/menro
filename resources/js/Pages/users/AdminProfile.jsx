import React, { useState } from "react";
import { Head, useForm } from "@inertiajs/react";
import Sidebar from "@/Components/Sidebar";
import Navbar from "@/Components/Navbar";
import {
  Card,
  Avatar,
  Typography,
  Row,
  Col,
  Divider,
  Form,
  Input,
  Button,
  message,
  Space,
  Progress,
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  IdcardOutlined,
  ClockCircleOutlined,
  CheckCircleTwoTone,
  CloseCircleTwoTone,
} from "@ant-design/icons";

const { Title, Text } = Typography;

export default function Profile({ admin, auth }) {
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // ✅ Profile form
  const {
    data,
    setData,
    put: updateProfile,
    processing: updatingProfile,
  } = useForm({
    name: admin.name || "",
    email: admin.email || "",
  });

  // ✅ Password form
  const {
    data: passData,
    setData: setPassData,
    put: updatePassword,
    processing: updatingPassword,
    reset,
  } = useForm({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });

  // ✅ Check password strength function
  const checkPasswordStrength = (password) => {
    let score = 0;
    if (password.length >= 8) score += 25;
    if (/[A-Z]/.test(password)) score += 25;
    if (/[0-9]/.test(password)) score += 25;
    if (/[^A-Za-z0-9]/.test(password)) score += 25;
    return score;
  };

  // ✅ Handle profile update
  const handleProfileUpdate = () => {
    setLoading(true);
    updateProfile(route("admin.updateProfile"), {
      preserveScroll: true,
      onSuccess: () => {
        message.success("Profile updated successfully!");
        setLoading(false);
      },
      onError: () => {
        message.error("Failed to update profile!");
        setLoading(false);
      },
    });
  };

  // ✅ Handle password change
  const handlePasswordChange = () => {
    const { new_password, new_password_confirmation } = passData;

    // Frontend strong password validation
    if (new_password !== new_password_confirmation) {
      message.error("Passwords do not match!");
      return;
    }
    if (checkPasswordStrength(new_password) < 75) {
      message.warning(
        "Please choose a stronger password (8+ chars, upper/lowercase, number, symbol)."
      );
      return;
    }

    setLoading(true);
    updatePassword(route("admin.updatePassword"), {
      preserveScroll: true,
      onSuccess: () => {
        message.success("Password changed successfully!");
        reset();
        setPasswordStrength(0);
        setLoading(false);
      },
      onError: () => {
        message.error("Failed to change password!");
        setLoading(false);
      },
    });
  };

  return (
    <>
      <Head title="Admin Profile" />
      <div className="flex min-h-screen bg-gradient-to-br from-slate-100 via-white to-blue-50">
        <Sidebar
          collapsible
          collapsed={collapsed}
          onCollapse={() => setCollapsed(!collapsed)}
        />

        <div className="flex-1 flex flex-col">
          <Navbar
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            auth={auth}
          />

          <div className="p-6">
            <Row justify="center" gutter={[32, 32]}>
              {/* LEFT PROFILE CARD */}
              <Col xs={24} md={10} lg={8}>
                <Card
                  bordered={false}
                  className="rounded-2xl shadow-xl backdrop-blur-md bg-white/80 hover:shadow-2xl transition-all duration-300"
                  cover={
                    <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-500 rounded-t-2xl" />
                  }
                >
                  <div className="flex flex-col items-center -mt-12">
                    <Avatar
                      size={120}
                      icon={<UserOutlined />}
                      className="shadow-lg border-4 border-white"
                      style={{
                        background:
                          "linear-gradient(135deg, #4f46e5, #3b82f6)",
                      }}
                    />
                    <Title level={3} className="mt-4 mb-0 text-gray-800">
                      {admin.name}
                    </Title>
                    <Text type="secondary" className="text-sm mb-4">
                      {admin.role || admin.type}
                    </Text>
                  </div>

                  <Divider className="my-4" />

                  <Space
                    direction="vertical"
                    size="middle"
                    className="w-full text-gray-700"
                  >
                    <div className="flex items-center text-base">
                      <IdcardOutlined className="text-blue-500 mr-3" />
                      <Text strong>ID:</Text>
                      <span className="ml-2">{admin.id}</span>
                    </div>

                    <div className="flex items-center text-base">
                      <MailOutlined className="text-blue-500 mr-3" />
                      <Text strong>Email:</Text>
                      <span className="ml-2">{admin.email}</span>
                    </div>

                    <div className="flex items-center text-base">
                      <ClockCircleOutlined className="text-blue-500 mr-3" />
                      <Text strong>Joined:</Text>
                      <span className="ml-2">
                        {new Date(admin.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </Space>
                </Card>
              </Col>

              {/* RIGHT SIDE FORMS */}
              <Col xs={24} md={14} lg={10}>
                {/* Profile Info Update */}
                <Card
                  title={
                    <span className="text-lg font-semibold text-blue-700">
                      ✨ Update Profile Information
                    </span>
                  }
                  bordered={false}
                  className="rounded-2xl shadow-md bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 mb-6"
                >
                  <Form layout="vertical" onFinish={handleProfileUpdate}>
                    <Form.Item label="Full Name" required>
                      <Input
                        prefix={<UserOutlined />}
                        value={data.name}
                        onChange={(e) => setData("name", e.target.value)}
                        className="rounded-lg py-2"
                      />
                    </Form.Item>

                    <Form.Item label="Email Address" required>
                      <Input
                        prefix={<MailOutlined />}
                        type="email"
                        value={data.email}
                        onChange={(e) => setData("email", e.target.value)}
                        className="rounded-lg py-2"
                      />
                    </Form.Item>

                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={updatingProfile || loading}
                      block
                      size="large"
                      className="mt-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-500"
                    >
                      Save Changes
                    </Button>
                  </Form>
                </Card>

                {/* Password Change */}
                <Card
                  title={
                    <span className="text-lg font-semibold text-blue-700">
                      🔒 Change Password
                    </span>
                  }
                  bordered={false}
                  className="rounded-2xl shadow-md bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300"
                >
                  <Form layout="vertical" onFinish={handlePasswordChange}>
                    <Form.Item label="Current Password" required>
                      <Input.Password
                        prefix={<LockOutlined />}
                        value={passData.current_password}
                        onChange={(e) =>
                          setPassData("current_password", e.target.value)
                        }
                        className="rounded-lg py-2"
                      />
                    </Form.Item>

                    <Form.Item label="New Password" required>
                      <Input.Password
                        prefix={<LockOutlined />}
                        value={passData.new_password}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPassData("new_password", val);
                          setPasswordStrength(checkPasswordStrength(val));
                        }}
                        className="rounded-lg py-2"
                      />
                      {/* Password strength meter */}
                      {passData.new_password && (
                        <div className="mt-2">
                          <Progress
                            percent={passwordStrength}
                            showInfo={false}
                            strokeColor={
                              passwordStrength < 50
                                ? "#f87171"
                                : passwordStrength < 75
                                ? "#facc15"
                                : "#22c55e"
                            }
                            status="active"
                          />
                          <Text type="secondary" className="text-sm">
                            {passwordStrength < 50
                              ? "Weak"
                              : passwordStrength < 75
                              ? "Moderate"
                              : "Strong"}
                          </Text>
                        </div>
                      )}
                    </Form.Item>

                    <Form.Item label="Confirm New Password" required>
                      <Input.Password
                        prefix={<LockOutlined />}
                        value={passData.new_password_confirmation}
                        onChange={(e) =>
                          setPassData(
                            "new_password_confirmation",
                            e.target.value
                          )
                        }
                        className="rounded-lg py-2"
                      />
                    </Form.Item>

                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={updatingPassword || loading}
                      block
                      size="large"
                      className="mt-2 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-500"
                    >
                      Update Password
                    </Button>
                  </Form>
                </Card>
              </Col>
            </Row>
          </div>
        </div>
      </div>
    </>
  );
}
