// resources/js/Pages/Reports/FeedbackReport.jsx
import React, { useState, useMemo } from "react";
import { Head, usePage, router } from "@inertiajs/react";
import { Layout, Table, Card, Typography, Row, Col, Space, DatePicker, Tag, Button } from "antd";
import Sidebar from "@/Components/Sidebar";
import Navbar from "@/Components/Navbar";
import { CommentOutlined, FilterOutlined, UndoOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Content } = Layout;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const FeedbackReport = ({ feedback = [], filters = {} }) => {
    const { auth } = usePage().props;
    const [collapsed, setCollapsed] = useState(true);

    const initialRange = useMemo(() => {
        if (filters.start_date && filters.end_date) {
            return [dayjs(filters.start_date), dayjs(filters.end_date)];
        }
        return [];
    }, [filters.start_date, filters.end_date]);

    const [dateRange, setDateRange] = useState(initialRange);

    const handleRangeChange = (dates) => {
        setDateRange(dates || []);
    };

    const applyFilters = () => {
        if (dateRange && dateRange.length === 2) {
            router.get(
                route("reports.feedback"),
                {
                    start_date: dateRange[0].format("YYYY-MM-DD"),
                    end_date: dateRange[1].format("YYYY-MM-DD"),
                },
                {
                    preserveScroll: true,
                    preserveState: true,
                }
            );
        } else {
            router.get(
                route("reports.feedback"),
                {},
                {
                    preserveScroll: true,
                    preserveState: true,
                }
            );
        }
    };

    const resetFilters = () => {
        setDateRange([]);
        router.get(
            route("reports.feedback"),
            {},
            {
                preserveScroll: true,
                preserveState: true,
            }
        );
    };

    const columns = [
        {
            title: "Date Submitted",
            dataIndex: "created_at",
            key: "created_at",
            sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
            render: (value) =>
                value
                    ? new Date(value).toLocaleString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                      })
                    : "-",
        },
        {
            title: "Resident",
            key: "resident",
            render: (record) => {
                const name = [record.first_name, record.last_name]
                    .filter(Boolean)
                    .join(" ");
                return name || record.username || "N/A";
            },
        },
        {
            title: "Schedule",
            dataIndex: ["schedule", "pickup_datetime"],
            key: "schedule",
            render: (value, record) => {
                if (!record.schedule) return "-";
                return new Date(record.schedule.pickup_datetime).toLocaleString(
                    "en-US",
                    {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                    }
                );
            },
        },
        {
            title: "Terminal",
            dataIndex: ["terminal", "name"],
            key: "terminal",
            render: (value, record) => record.terminal?.name || "-",
        },
        {
            title: "Zone",
            dataIndex: "terminal_zone_name",
            key: "terminal_zone_name",
            render: (value) => value || "-",
        },
        {
            title: "Message",
            dataIndex: "message",
            key: "message",
            ellipsis: true,
            render: (value) => value || "(No message)",
        },
        {
            title: "Status",
            dataIndex: "is_viewed",
            key: "is_viewed",
            render: (value) =>
                value ? (
                    <Tag color="success">Viewed</Tag>
                ) : (
                    <Tag color="processing">New</Tag>
                ),
        },
    ];

    const viewedCount = feedback.filter((f) => f.is_viewed).length;
    const newCount = feedback.length - viewedCount;

    return (
        <Layout style={{ minHeight: "100vh", background: "#f8fafc" }}>
            <Head title="Feedback Report" />
            <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
            <Layout style={{ background: "transparent" }}>
                <Navbar collapsed={collapsed} setCollapsed={setCollapsed} auth={auth} />
                <Content style={{ margin: "24px 16px" }}>
                    <Card
                        style={{
                            borderRadius: 16,
                            marginBottom: 20,
                            padding: "16px 20px",
                            background: "linear-gradient(135deg, #eef2ff, #e0f2fe)",
                            border: "1px solid #c7d2fe",
                            boxShadow: "0 10px 30px rgba(15, 23, 42, 0.12)",
                        }}
                        bodyStyle={{ padding: 0 }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: 16,
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <div
                                    style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 999,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        background: "rgba(37, 99, 235, 0.12)",
                                    }}
                                >
                                    <CommentOutlined style={{ fontSize: 20, color: "#1d4ed8" }} />
                                </div>
                                <div>
                                    <Title level={3} style={{ margin: 0, color: "#0f172a" }}>
                                        Resident Feedback Report
                                    </Title>
                                    <Text type="secondary">
                                        Review and monitor feedback submitted by residents over time.
                                    </Text>
                                </div>
                            </div>

                            <Space size={12} wrap>
                                <Card
                                    size="small"
                                    style={{
                                        borderRadius: 999,
                                        padding: "4px 14px",
                                        background: "rgba(59, 130, 246, 0.06)",
                                        border: "1px solid rgba(59, 130, 246, 0.16)",
                                    }}
                                    bodyStyle={{ padding: 0, display: "flex", alignItems: "center", gap: 8 }}
                                >
                                    <span
                                        style={{
                                            display: "inline-flex",
                                            width: 8,
                                            height: 8,
                                            borderRadius: 999,
                                            background: "#3b82f6",
                                        }}
                                    />
                                    <Text style={{ fontSize: 12, color: "#1e293b" }}>
                                        Total: <strong>{feedback.length}</strong>
                                    </Text>
                                </Card>

                                <Card
                                    size="small"
                                    style={{
                                        borderRadius: 999,
                                        padding: "4px 14px",
                                        background: "rgba(22, 163, 74, 0.06)",
                                        border: "1px solid rgba(22, 163, 74, 0.18)",
                                    }}
                                    bodyStyle={{ padding: 0, display: "flex", alignItems: "center", gap: 8 }}
                                >
                                    <span
                                        style={{
                                            display: "inline-flex",
                                            width: 8,
                                            height: 8,
                                            borderRadius: 999,
                                            background: "#16a34a",
                                        }}
                                    />
                                    <Text style={{ fontSize: 12, color: "#166534" }}>
                                        Viewed: <strong>{viewedCount}</strong>
                                    </Text>
                                </Card>

                                <Card
                                    size="small"
                                    style={{
                                        borderRadius: 999,
                                        padding: "4px 14px",
                                        background: "rgba(59, 130, 246, 0.06)",
                                        border: "1px solid rgba(59, 130, 246, 0.18)",
                                    }}
                                    bodyStyle={{ padding: 0, display: "flex", alignItems: "center", gap: 8 }}
                                >
                                    <span
                                        style={{
                                            display: "inline-flex",
                                            width: 8,
                                            height: 8,
                                            borderRadius: 999,
                                            background: "#2563eb",
                                        }}
                                    />
                                    <Text style={{ fontSize: 12, color: "#1d4ed8" }}>
                                        New: <strong>{newCount}</strong>
                                    </Text>
                                </Card>
                            </Space>
                        </div>
                    </Card>

                    <Card
                        style={{
                            borderRadius: 16,
                            marginBottom: 24,
                            padding: 20,
                            boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)",
                        }}
                        bodyStyle={{ padding: 0 }}
                    >
                        <Row gutter={[20, 16]} align="middle">
                            <Col xs={24} sm={14} md={10} lg={8}>
                                <Text strong style={{ display: "block", marginBottom: 4 }}>
                                    Feedback Date Range
                                </Text>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    Limit the report to feedback submitted within a specific period.
                                </Text>
                            </Col>
                            <Col xs={24} sm={10} md={8} lg={7}>
                                <RangePicker
                                    value={dateRange}
                                    onChange={handleRangeChange}
                                    style={{ width: "100%", marginTop: 4 }}
                                />
                            </Col>
                            <Col
                                xs={24}
                                md={6}
                                lg={9}
                                style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}
                            >
                                <Space>
                                    <Button type="primary" onClick={applyFilters} icon={<FilterOutlined />}>
                                        Apply
                                    </Button>
                                    <Button icon={<UndoOutlined />} onClick={resetFilters}>
                                        Reset
                                    </Button>
                                </Space>
                            </Col>
                        </Row>
                    </Card>

                    <Space
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 16,
                        }}
                    >
                        <div>
                            <Title level={3} style={{ fontWeight: 700, color: "#0f172a", marginBottom: 0 }}>
                                <CommentOutlined style={{ marginRight: 10, color: "#2563eb" }} />
                                Feedback Details
                            </Title>
                            <Text type="secondary" style={{ fontSize: 13 }}>
                                Each row represents an individual feedback entry linked to a schedule and terminal.
                            </Text>
                        </div>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                            Showing {feedback.length} feedback record{feedback.length !== 1 ? "s" : ""}
                        </Text>
                    </Space>

                    <Card
                        style={{
                            borderRadius: 16,
                            boxShadow: "0 4px 14px rgba(15, 23, 42, 0.06)",
                        }}
                    >
                        <Table
                            columns={columns}
                            dataSource={feedback}
                            pagination={{ pageSize: 10, showSizeChanger: false }}
                            rowKey="id"
                            bordered
                        />
                    </Card>
                </Content>
            </Layout>
        </Layout>
    );
};

export default FeedbackReport;
