import React, { useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Divider,
  Typography,
  Row,
  Col,
  message,
} from "antd";
import { useForm } from "@inertiajs/react";
import {
  UserOutlined,
  MailOutlined,
  IdcardOutlined,
  PhoneOutlined,
  CarOutlined,
} from "@ant-design/icons";

const { Option } = Select;
const { Title, Text } = Typography;

export default function EditDriverModal({ visible, onCancel, driver, trucks }) {
  const { data, setData, put, processing, errors, reset } = useForm({
    name: "",
    email: "",
    license_number: "",
    contact_number: "",
    assigned_truck_id: "",
  });

  useEffect(() => {
    if (driver) {
      setData({
        name: driver.name || "",
        email: driver.email || "",
        license_number: driver.driver_profile?.license_number || "",
        contact_number: driver.driver_profile?.contact_number || "",
        assigned_truck_id: driver.driver_profile?.assigned_truck_id || "",
      });
    }
  }, [driver]);

  useEffect(() => {
    // Show the first error as a toast message
    const firstError = Object.values(errors)[0];
    if (firstError) message.error(firstError);
  }, [errors]);

  const handleFinish = () => {
    if (!driver) return;
    put(route("drivers.update", driver.id), {
      onSuccess: () => {
        reset();
        onCancel();
        message.success("Driver updated successfully!");
      },
      onError: () => {
        message.error(
          "Failed to update driver. Please check the highlighted fields."
        );
      },
    });
  };

  return (
    <Modal
      title={
        <Title level={4} style={{ margin: 0 }}>
          Edit Driver
        </Title>
      }
      open={visible}
      onCancel={onCancel}
      onOk={() => document.getElementById("edit-driver-form-submit").click()}
      confirmLoading={processing}
      okText="Save Changes"
      cancelText="Cancel"
      centered
      width={800}
      bodyStyle={{ padding: "24px 32px" }}
      style={{ borderRadius: 12 }}
      maskStyle={{ backdropFilter: "blur(3px)" }}
    >
      <Form
        layout="vertical"
        onFinish={handleFinish}
        size="large"
        style={{ marginTop: 8 }}
      >
        <Row gutter={32}>
          <Col span={12}>
            <Divider orientation="left">
              <Text strong>Account Information</Text>
            </Divider>

            <Form.Item
              label="Full Name"
              validateStatus={errors.name ? "error" : ""}
              help={errors.name || ""}
            >
              <Input
                prefix={<UserOutlined style={{ color: "#1890ff" }} />}
                placeholder="Enter driver's full name"
                value={data.name}
                onChange={(e) => setData("name", e.target.value)}
              />
            </Form.Item>

            <Form.Item
              label="Email Address"
              validateStatus={errors.email ? "error" : ""}
              help={errors.email || ""}
            >
              <Input
                prefix={<MailOutlined style={{ color: "#1890ff" }} />}
                placeholder="Enter driver's email"
                value={data.email}
                onChange={(e) => setData("email", e.target.value)}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Divider orientation="left">
              <Text strong>Driver Profile</Text>
            </Divider>

            <Form.Item
              label="License Number"
              validateStatus={errors.license_number ? "error" : ""}
              help={errors.license_number || ""}
            >
              <Input
                prefix={<IdcardOutlined style={{ color: "#1890ff" }} />}
                placeholder="Enter license number"
                value={data.license_number}
                onChange={(e) => setData("license_number", e.target.value)}
              />
            </Form.Item>

            <Form.Item
              label="Contact Number"
              validateStatus={errors.contact_number ? "error" : ""}
              help={errors.contact_number || ""}
            >
              <Input
                prefix={<PhoneOutlined style={{ color: "#1890ff" }} />}
                placeholder="Enter contact number"
                value={data.contact_number}
                onChange={(e) => setData("contact_number", e.target.value)}
              />
            </Form.Item>

            <Form.Item
              label="Assigned Truck"
              validateStatus={errors.assigned_truck_id ? "error" : ""}
              help={errors.assigned_truck_id || ""}
            >
              <Select
                value={data.assigned_truck_id}
                onChange={(value) => setData("assigned_truck_id", value)}
                placeholder="Select a truck"
                allowClear
                showSearch
                optionFilterProp="children"
              >
                {trucks.map((truck) => (
                  <Option key={truck.id} value={truck.id}>
                    <CarOutlined style={{ color: "#1890ff", marginRight: 8 }} />
                    {truck.plate_number} — {truck.model}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* Hidden submit button for modal OK */}
        <button
          type="submit"
          id="edit-driver-form-submit"
          style={{ display: "none" }}
        />
      </Form>
    </Modal>
  );
}
