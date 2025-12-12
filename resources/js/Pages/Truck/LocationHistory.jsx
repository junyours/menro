import React, { useState } from "react";
import { router, Head } from "@inertiajs/react";
import {
  DatePicker,
  Table,
  Card,
  Select,
  Typography,
  Empty,
  Alert,
  Layout,
} from "antd";
import Sidebar from "@/Components/Sidebar";
import Navbar from "@/Components/Navbar";
import dayjs from "dayjs";

const { Title, Text, Paragraph } = Typography;
const { Content } = Layout;

export default function LocationHistory({
  auth,
  truckId,
  trucks,
  locations,
  selectedDate,
}) {
  const [collapsed, setCollapsed] = useState(true); // ✅ add state

  const columns = [
    {
      title: "Latitude",
      dataIndex: "lat",
      key: "lat",
      render: (val) => <Text className="font-mono">{val}</Text>,
    },
    {
      title: "Longitude",
      dataIndex: "lng",
      key: "lng",
      render: (val) => <Text className="font-mono">{val}</Text>,
    },
    {
      title: "Time",
      dataIndex: "created_at",
      key: "created_at",
      render: (text) => (
        <Text className="text-gray-600">
          {dayjs(text).format("YYYY-MM-DD HH:mm:ss")}
        </Text>
      ),
    },
  ];

  const handleDateChange = (date, dateString) => {
    router.get(
      route("trucks.history", { truckId }),
      { date: dateString },
      { preserveState: true, preserveScroll: true }
    );
  };

  const handleTruckChange = (value) => {
    router.get(route("trucks.history", { truckId: value }), {
      date: selectedDate,
      preserveState: true,
      preserveScroll: true,
    });
  };

  return (
    <>
      <Head title="Truck Location History" />
      <Layout style={{ minHeight: "100vh", background: "#f5f7fb" }}>
        {/* Sidebar */}
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

        <Layout>
          {/* Navbar */}
          <Navbar collapsed={collapsed} setCollapsed={setCollapsed} auth={auth} />

          <Content style={{ margin: "24px 16px", padding: 24 }}>
            <Card
              bordered={false}
              className="shadow-md rounded-2xl bg-white"
              bodyStyle={{ padding: "24px" }}
            >
              {/* Page Header */}
              <div className="mb-6">
                <Title level={4} className="!mb-1">
                  🚛 Truck Location History
                </Title>
                <Text type="secondary">
                  Monitor truck movements by selecting a truck and date
                </Text>
              </div>

              {/* Guidance Message */}
              <Alert
                message="ℹ️ How to find the exact location"
                description={
                  <Paragraph className="mb-0">
                    You can copy the <Text code>Latitude</Text> and{" "}
                    <Text code>Longitude</Text> from the table and paste them
                    into{" "}
                    <a
                      href="https://www.google.com/maps"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      Google Maps
                    </a>{" "}
                    search bar. This will show the exact location of the truck.
                  </Paragraph>
                }
                type="info"
                showIcon
                className="mb-6 rounded-lg"
              />

              {/* Filter Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex gap-4 flex-wrap">
                  <Select
                    showSearch
                    style={{ width: 220 }}
                    placeholder="Select Truck"
                    value={truckId}
                    onChange={handleTruckChange}
                    options={trucks.map((t) => ({
                      label: t.name || `Truck ${t.id}`,
                      value: t.id,
                    }))}
                    className="rounded-md"
                  />

                  <DatePicker
                    onChange={handleDateChange}
                    defaultValue={selectedDate ? dayjs(selectedDate) : null}
                    format="YYYY-MM-DD"
                    allowClear
                    className="rounded-md"
                  />
                </div>
              </div>

              {/* Table or Empty State */}
              {locations.length === 0 ? (
                <Empty
                  description={
                    <Text type="secondary">
                      No location history found{" "}
                      {selectedDate ? `on ${selectedDate}` : ""}
                    </Text>
                  }
                  className="py-16"
                />
              ) : (
                <Table
                  columns={columns}
                  dataSource={locations}
                  rowKey={(record, index) => index}
                  pagination={{ pageSize: 10 }}
                  bordered={false}
                  className="rounded-lg overflow-hidden shadow-sm"
                />
              )}
            </Card>
          </Content>
        </Layout>
      </Layout>
    </>
  );
}
