// resources/js/Pages/Settings/Index.jsx
import React from "react";
import { Head, useForm } from "@inertiajs/react";
import { Layout, Typography, Form, Input, Button, Card } from "antd";
import Sidebar from "@/Components/BarSide";
import Navbar from "@/Components/BarNav";

const { Content } = Layout;
const { Title } = Typography;

export default function SettingsPage({ auth, settings }) {
  const { data, setData, post, processing } = useForm({
    primary_color: settings.primary_color || "#1890ff",
    secondary_color: settings.secondary_color || "#52c41a",
    sidebar_bg: settings.sidebar_bg || "#ffffff",
  });

  const onFinish = () => {
    post(route("settings.update"));
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Head title="Settings" />
      <Sidebar />
      <Layout>
        <Navbar user={auth.user} />
        <Content style={{ margin: "24px 16px", padding: 24 }}>
          <Card style={{ borderRadius: 12 }}>
            <Title level={3}>Theme Settings</Title>
            <Form layout="vertical" onFinish={onFinish}>
              <Form.Item label="Primary Color">
                <Input
                  type="color"
                  value={data.primary_color}
                  onChange={(e) => setData("primary_color", e.target.value)}
                />
              </Form.Item>

              <Form.Item label="Secondary Color">
                <Input
                  type="color"
                  value={data.secondary_color}
                  onChange={(e) => setData("secondary_color", e.target.value)}
                />
              </Form.Item>

              <Form.Item label="Sidebar Background">
                <Input
                  type="color"
                  value={data.sidebar_bg}
                  onChange={(e) => setData("sidebar_bg", e.target.value)}
                />
              </Form.Item>

              <Button type="primary" htmlType="submit" loading={processing}>
                Save Theme
              </Button>
            </Form>
          </Card>
        </Content>
      </Layout>
    </Layout>
  );
}
