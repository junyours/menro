import React, { useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Divider,
  Typography,
  Row,
  Col,
  message,
  Space,
} from "antd";
import { useForm, router } from "@inertiajs/react";
import {
  HomeOutlined,
  MailOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

export default function EditBarangayModal({ visible, onCancel, barangay }) {
  const { data, setData, patch, processing, errors, reset } = useForm({
    name: "",
    email: "",
    zone_count: "",
  });

  useEffect(() => {
    if (barangay) {
      setData({
        name: barangay.barangay_profile?.name || "",
        email: barangay.email || "",
        zone_count: barangay.barangay_profile?.zone_count || "",
      });
    }
  }, [barangay]);

  const handleFinish = () => {
    if (!barangay) return;
    patch(route("barangays.update", barangay.id), {
      data,
      onSuccess: (page) => {
        message.success(page.props.success || "Barangay updated successfully");
        onCancel();
        reset();
        router.reload({ only: ["barangays"] });
      },
      onError: () => {
        message.error("Please check the form for errors.");
      },
    });
  };

  return (
    <Modal
      title={
        <Title level={4} style={{ margin: 0 }}>
          Edit Barangay
        </Title>
      }
      open={visible}
      onCancel={onCancel}
      onOk={() => document.getElementById("edit-barangay-form-submit").click()}
      confirmLoading={processing}
      okText="Save Changes"
      cancelText="Cancel"
      centered
      width={700}
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
          {/* Left column */}
          <Col span={12}>
            <Divider orientation="left">
              <Text strong>General Info</Text>
            </Divider>

            <Form.Item
              label="Barangay Name"
              validateStatus={errors.name && "error"}
              help={errors.name}
            >
              <Input
                prefix={<HomeOutlined style={{ color: "#1890ff" }} />}
                placeholder="Enter barangay name"
                value={data.name}
                onChange={(e) => setData("name", e.target.value)}
              />
            </Form.Item>

            <Form.Item
              label="Email"
              validateStatus={errors.email && "error"}
              help={errors.email}
            >
              <Input
                prefix={<MailOutlined style={{ color: "#1890ff" }} />}
                placeholder="Enter barangay email"
                value={data.email}
                onChange={(e) => setData("email", e.target.value)}
              />
            </Form.Item>
          </Col>

          {/* Right column */}
          <Col span={12}>
            <Divider orientation="left">
              <Text strong>Zone Information</Text>
            </Divider>

            <Form.Item
              label="Zone Count"
              validateStatus={errors.zone_count && "error"}
              help={errors.zone_count}
            >
              <Input
                prefix={<AppstoreOutlined style={{ color: "#1890ff" }} />}
                placeholder="Enter number of zones"
                value={data.zone_count}
                onChange={(e) => setData("zone_count", e.target.value)}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Hidden submit button for modal OK */}
        <button
          type="submit"
          id="edit-barangay-form-submit"
          style={{ display: "none" }}
        />
      </Form>
    </Modal>
  );
}
