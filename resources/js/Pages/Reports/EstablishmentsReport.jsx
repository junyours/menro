// resources/js/Pages/Reports/EstablishmentsReport.jsx
import React, { useState } from "react";
import { Head, usePage } from "@inertiajs/react";
import { Layout, Row, Col, Card, Table, Typography, Select, Tag } from "antd";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";
import Sidebar from "@/Components/Sidebar";
import Navbar from "@/Components/Navbar";

const { Option } = Select;
const { Title, Text } = Typography;
const COLORS = ["#1890ff", "#52c41a", "#faad14", "#f5222d", "#722ed1"];

const EstablishmentsReport = ({ barangays }) => {
  const [collapsed, setCollapsed] = useState(true);
  const { auth } = usePage().props;

  const [selectedBarangayId, setSelectedBarangayId] = useState(
    barangays.length > 0 ? barangays[0].id : null
  );

  const selectedBarangay = barangays.find((b) => b.id === selectedBarangayId);

  // ✅ Compute overall totals
  const totalHouseholds = barangays.reduce((sum, b) => sum + (b.total_households || 0), 0);
  const totalEstablishments = barangays.reduce((sum, b) => sum + (b.total_establishments || 0), 0);
  const totalBiodegradable = barangays.reduce((sum, b) => sum + (b.total_biodegradable || 0), 0);
  const totalNonBiodegradable = barangays.reduce((sum, b) => sum + (b.total_non_biodegradable || 0), 0);
  const totalRecyclable = barangays.reduce((sum, b) => sum + (b.total_recyclable || 0), 0);

  // ✅ Chart Data
  const pieHouseholdEstablishment = [
    { name: "Households", value: totalHouseholds },
    { name: "Establishments", value: totalEstablishments },
  ];

  const pieWaste = [
    { name: "Biodegradable", value: totalBiodegradable },
    { name: "Non-Biodegradable", value: totalNonBiodegradable },
    { name: "Recyclable", value: totalRecyclable },
  ];

  // ✅ Table Columns
  const columns = [
    { title: "Barangay", dataIndex: "name", key: "name" },
    {
      title: "Households",
      dataIndex: "total_households",
      key: "total_households",
      render: (val) => (val != null ? val : <Tag color="default">N/A</Tag>),
    },
    {
      title: "Establishments",
      dataIndex: "total_establishments",
      key: "total_establishments",
      render: (val) => (val != null ? val : <Tag color="default">N/A</Tag>),
    },
    {
      title: "Biodegradable",
      dataIndex: "total_biodegradable",
      key: "total_biodegradable",
      render: (val) => (val != null ? val : <Tag color="default">N/A</Tag>),
    },
    {
      title: "Non-Biodegradable",
      dataIndex: "total_non_biodegradable",
      key: "total_non_biodegradable",
      render: (val) => (val != null ? val : <Tag color="default">N/A</Tag>),
    },
    {
      title: "Recyclable",
      dataIndex: "total_recyclable",
      key: "total_recyclable",
      render: (val) => (val != null ? val : <Tag color="default">N/A</Tag>),
    },
  ];

  // ✅ Terminal Breakdown data per barangay
  const getTerminalData = (barangay) => {
    if (!barangay) return [];
    const terminals = [];
    (barangay.zones || []).forEach((zone) => {
      (zone.garbageTerminals || []).forEach((terminal) => {
        terminals.push({
          name: `${zone.name} - ${terminal.name}`,
          households: terminal.household_count || 0,
          establishments: terminal.establishment_count || 0,
          biodegradable: terminal.estimated_biodegradable || 0,
          nonBiodegradable: terminal.estimated_non_biodegradable || 0,
          recyclable: terminal.estimated_recyclable || 0,
        });
      });
    });
    return terminals;
  };

  const terminalData = getTerminalData(selectedBarangay);

  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f7fa" }}>
      <Head title="Establishments & Households Report" />
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      <Layout>
        <Navbar collapsed={collapsed} setCollapsed={setCollapsed} auth={auth} />

        <Layout.Content style={{ padding: "20px 24px" }}>
          {/* --- Page Header --- */}
          <Card
            bordered={false}
            style={{
              background: "#ffffff",
              borderRadius: 16,
              boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
              marginBottom: 30,
              textAlign: "center",
            }}
          >
            <Title level={2} style={{ marginBottom: 8, color: "#001529" }}>
              Establishments & Households Report
            </Title>
            <Text type="secondary">
              Comprehensive overview of household, establishment, and waste data across barangays.
            </Text>
          </Card>

          <Row gutter={[24, 24]}>
            {/* --- LEFT SECTION --- */}
            <Col xs={24} md={16}>
              {/* Barangay Summary */}
              <Card
                title={
                  <>
                    <Text strong style={{ fontSize: 16, color: "#001529" }}>
                      Barangay Waste Summary
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      Displays household and waste-related information for each barangay.
                    </Text>
                  </>
                }
                bordered={false}
                style={{
                  borderRadius: 12,
                  background: "#ffffff",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
                  marginBottom: 20,
                }}
              >
                <Table
                  dataSource={barangays}
                  columns={columns}
                  rowKey="id"
                  pagination={{ pageSize: 8 }}
                  bordered
                  size="middle"
                  scroll={{ x: true }}
                />
              </Card>

              {/* Terminal Breakdown Section (VERTICAL LAYOUT) */}
              <Card
                bordered={false}
                title={
                  <>
                    <Text strong style={{ fontSize: 16, color: "#001529" }}>
                      Terminal Breakdown by Barangay
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      View the distribution of households, establishments, and waste per terminal.
                    </Text>
                  </>
                }
                style={{
                  borderRadius: 12,
                  background: "#ffffff",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
                }}
              >
                <Select
                  value={selectedBarangayId}
                  onChange={(value) => setSelectedBarangayId(value)}
                  style={{ width: 250, marginBottom: 20 }}
                >
                  {barangays.map((b) => (
                    <Option key={b.id} value={b.id}>
                      {b.name}
                    </Option>
                  ))}
                </Select>

                {/* 1️⃣ Households & Establishments Chart */}
                <Card
                  bordered={false}
                  title={
                    <>
                      <Text strong style={{ fontSize: 14, color: "#001529" }}>
                        Households & Establishments
                      </Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Compares the number of households and establishments for each terminal.
                      </Text>
                    </>
                  }
                  style={{
                    borderRadius: 10,
                    background: "#fafafa",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                    marginBottom: 20,
                  }}
                >
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={terminalData}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="households" fill="#1890ff" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="establishments" fill="#52c41a" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                {/* 2️⃣ Waste Breakdown Chart */}
                <Card
                  bordered={false}
                  title={
                    <>
                      <Text strong style={{ fontSize: 14, color: "#001529" }}>
                        Waste Type Breakdown
                      </Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Shows how much biodegradable, non-biodegradable, and recyclable waste each terminal produces.
                      </Text>
                    </>
                  }
                  style={{
                    borderRadius: 10,
                    background: "#fafafa",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                  }}
                >
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={terminalData}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="biodegradable" fill="#faad14" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="nonBiodegradable" fill="#f5222d" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="recyclable" fill="#722ed1" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </Card>
            </Col>

            {/* --- RIGHT SECTION --- */}
            <Col xs={24} md={8}>
              {/* Households vs Establishments */}
              <Card
                bordered={false}
                title={
                  <>
                    <Text strong style={{ fontSize: 16, color: "#001529" }}>
                      Households vs Establishments
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Provides an overall comparison of total households and establishments across all barangays.
                    </Text>
                  </>
                }
                style={{
                  borderRadius: 12,
                  background: "#ffffff",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
                  marginBottom: 20,
                }}
              >
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieHouseholdEstablishment}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      label
                    >
                      {pieHouseholdEstablishment.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              {/* Waste Breakdown */}
              <Card
                bordered={false}
                title={
                  <>
                    <Text strong style={{ fontSize: 16, color: "#001529" }}>
                      Waste Breakdown
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Illustrates the total distribution of waste types collected from all barangays.
                    </Text>
                  </>
                }
                style={{
                  borderRadius: 12,
                  background: "#ffffff",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
                }}
              >
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieWaste}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {pieWaste.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </Layout.Content>
      </Layout>
    </Layout>
  );
};

export default EstablishmentsReport;
