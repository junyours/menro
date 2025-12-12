import React, { useState, useMemo } from "react";
import {
  Layout,
  Typography,
  Table,
  Form,
  DatePicker,
  Button,
  Card,
  message,
  Divider,
  Tag,
} from "antd";
import dayjs from "dayjs";
import { Head, useForm } from "@inertiajs/react";
import {
  PlusCircleOutlined,
  FileTextOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";

import Sidebar from "@/Components/BarSide";
import Navbar from "@/Components/BarNav";

const { Content } = Layout;
const { Title, Text } = Typography;

export default function WeeklyReport({ auth, reports }) {
  const [collapsed, setCollapsed] = useState(true);

  const { data, setData, post, processing, reset } = useForm({
    comply_on: null,
    submitted_at: null,
  });

  // Filter reports to only pending
  const pendingReports = useMemo(
    () => reports.filter((report) => report.status === "pending"),
    [reports]
  );

  const hasPending = pendingReports.length > 0;

  const onFinish = () => {
    if (!data.comply_on) {
      message.error("Please select a comply date and time");
      return;
    }
    if (!data.submitted_at) {
      message.error("Please select a submission date and time");
      return;
    }
    post(route("barangay.weekly.store"), {
      onSuccess: () => {
        message.success("Report submitted successfully!");
        reset();
      },
      onError: () => {
        message.error("Something went wrong.");
      },
    });
  };

  const columns = [
    {
      title: "Barangay",
      dataIndex: ["barangay", "name"],
      key: "barangay",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Comply Date",
      dataIndex: "comply_on",
      key: "comply_on",
      render: (comply_on) =>
        comply_on
          ? dayjs(comply_on, "YYYY-MM-DD HH:mm:ss").format(
              "MMMM D, YYYY h:mm A"
            )
          : "—",
    },
    {
      title: "Submitted At",
      dataIndex: "submitted_at",
      key: "submitted_at",
      render: (submitted_at) =>
        submitted_at
          ? dayjs(submitted_at, "YYYY-MM-DD HH:mm:ss").format(
              "MMMM D, YYYY h:mm A"
            )
          : "—",
    },
    {
      title: "Days Difference",
      key: "days_diff",
      render: (_, record) => {
        if (record.comply_on && record.submitted_at) {
          const days = dayjs(record.submitted_at).diff(
            dayjs(record.comply_on),
            "day"
          );
          return <Text>{days} day(s)</Text>;
        }
        return "—";
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag icon={<ClockCircleOutlined />} color="warning">
          Pending
        </Tag>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Head title="Weekly Plan" />
      <Sidebar
        collapsed={collapsed}
        toggleCollapsed={() => setCollapsed(!collapsed)}
      />
      <Layout>
        <Navbar
          collapsed={collapsed}
          toggleCollapsed={() => setCollapsed(!collapsed)}
          user={auth?.user ?? { name: "Barangay User" }}
        />

        <Content
          style={{
            margin: "24px 16px",
            padding: 24,
            background: "#f5f6fa",
            minHeight: "calc(100vh - 64px)",
            borderRadius: 12,
          }}
        >
          {/* Submit Report Card */}
          <Card
            bordered={false}
            style={{
              borderRadius: 14,
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              marginBottom: 32,
            }}
          >
            <Title level={3} style={{ marginBottom: 8 }}>
              <CalendarOutlined
                style={{ marginRight: 8, color: "#1890ff" }}
              />
              Weekly Plan Submission
            </Title>
            <Text type="secondary">
              Submit your barangay's weekly waste collection report below.
            </Text>

            {hasPending && (
              <Text type="warning" style={{ display: "block", marginTop: 8 }}>
                You already have a pending report. Submission is disabled.
              </Text>
            )}

            <Divider style={{ margin: "16px 0" }} />

            <Form
              layout="inline"
              onFinish={onFinish}
              style={{ display: "flex", gap: 12, flexWrap: "wrap" }}
            >
              {/* Comply Date */}
              <Form.Item style={{ flex: 1, minWidth: 220 }}>
                <DatePicker
                  showTime
                  placeholder="Select Comply Date & Time"
                  value={data.comply_on ? dayjs(data.comply_on) : null}
                  onChange={(value) =>
                    setData(
                      "comply_on",
                      value ? value.format("YYYY-MM-DD HH:mm:ss") : null
                    )
                  }
                  disabledDate={(current) =>
                    current && current < dayjs().startOf("day")
                  }
                  style={{ width: "100%" }}
                />
              </Form.Item>

              {/* Submitted At */}
              <Form.Item style={{ flex: 1, minWidth: 220 }}>
                <DatePicker
                  showTime
                  placeholder="Select Submitted Date & Time"
                  value={data.submitted_at ? dayjs(data.submitted_at) : null}
                  onChange={(value) =>
                    setData(
                      "submitted_at",
                      value ? value.format("YYYY-MM-DD HH:mm:ss") : null
                    )
                  }
                  disabledDate={(current) => {
                    if (!data.comply_on) return false;
                    const comply = dayjs(data.comply_on);
                    return current && current.isBefore(comply, "day"); // disable dates before comply_on
                  }}
                  style={{ width: "100%" }}
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<PlusCircleOutlined />}
                  loading={processing}
                  disabled={hasPending}
                  style={{ borderRadius: 8 }}
                >
                  Submit Report
                </Button>
              </Form.Item>
            </Form>
          </Card>

          {/* Pending Reports Table */}
          <Divider orientation="left">
            <FileTextOutlined style={{ marginRight: 6, color: "#faad14" }} />
            Pending Reports
          </Divider>

          <Card
            bordered={false}
            style={{
              borderRadius: 14,
              boxShadow: "0 3px 10px rgba(0,0,0,0.05)",
            }}
          >
            <Table
              columns={columns}
              dataSource={pendingReports}
              rowKey="id"
              bordered
              pagination={{ pageSize: 5, showSizeChanger: false }}
              style={{ marginTop: 12 }}
            />
          </Card>
        </Content>
      </Layout>
    </Layout>
  );
}
