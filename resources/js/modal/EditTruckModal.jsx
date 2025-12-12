import React, { useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Divider,
  Typography,
  Row,
  Col,
  Select,
  Tag,
} from "antd";
import { useForm } from "@inertiajs/react";
import {
  NumberOutlined,
  BuildOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ToolOutlined,
} from "@ant-design/icons";

const { Title } = Typography;
const { Option } = Select;

export default function EditTruckModal({ visible, onCancel, truck, onSuccess }) {
  const { data, setData, put, processing, errors, reset } = useForm({
    plate_number: "",
    model: "",
    status: "",
  });

  useEffect(() => {
    if (truck) {
      setData({
        plate_number: truck.plate_number,
        model: truck.model,
        status: truck.status,
      });
    }
  }, [truck]);

  const handleFinish = () => {
    put(route("trucks.update", truck.id), {
      onSuccess: () => {
        reset();
        onSuccess();
      },
    });
  };

  return (
    <Modal
      title={
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <BuildOutlined style={{ fontSize: 20, color: "#1890ff" }} />
          Edit Truck
        </span>
      }
      open={visible}
      onCancel={onCancel}
      onOk={() => document.getElementById("truck-edit-form-submit").click()}
      confirmLoading={processing}
      okText="Update Truck"
      cancelText="Cancel"
      centered
      width={700}
      bodyStyle={{ padding: 32 }}
      okButtonProps={{
        style: {
          borderRadius: 12,
          background: "linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)",
          border: "none",
          fontWeight: 600,
          boxShadow: "0 4px 12px rgba(24, 144, 255, 0.3)",
        },
      }}
      cancelButtonProps={{
        style: {
          borderRadius: 12,
          fontWeight: 500,
        },
      }}
    >
      <Form layout="vertical" onFinish={handleFinish} size="large">
        <Row gutter={32}>
          {/* Left column */}
          <Col span={12}>
            <Divider orientation="left">Truck Details</Divider>

            <Form.Item
              label="Plate Number"
              validateStatus={errors.plate_number && "error"}
              help={errors.plate_number}
            >
              <Input
                prefix={<NumberOutlined />}
                placeholder="Enter plate number"
                value={data.plate_number}
                onChange={(e) => setData("plate_number", e.target.value)}
                style={{ borderRadius: 12 }}
              />
            </Form.Item>

            <Form.Item
              label="Model"
              validateStatus={errors.model && "error"}
              help={errors.model}
            >
              <Input
                prefix={<BuildOutlined />}
                placeholder="Enter truck model"
                value={data.model}
                onChange={(e) => setData("model", e.target.value)}
                style={{ borderRadius: 12 }}
              />
            </Form.Item>
          </Col>

          {/* Right column */}
          <Col span={12}>
            <Divider orientation="left">Status</Divider>

            <Form.Item
              label="Truck Status"
              validateStatus={errors.status && "error"}
              help={errors.status}
            >
              <Select
                value={data.status}
                onChange={(value) => setData("status", value)}
                placeholder="Select status"
                allowClear
                style={{ borderRadius: 12 }}
              >
                <Option value="Active">
                  <Tag color="green" style={{ fontWeight: 600 }}>
                    <CheckCircleOutlined /> Active
                  </Tag>
                </Option>
                <Option value="Inactive">
                  <Tag color="red" style={{ fontWeight: 600 }}>
                    <CloseCircleOutlined /> Inactive
                  </Tag>
                </Option>
                <Option value="Under_Maintenance">
                  <Tag color="orange" style={{ fontWeight: 600 }}>
                    <ToolOutlined /> Under Maintenance
                  </Tag>
                </Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* hidden submit for modal ok */}
        <button
          type="submit"
          id="truck-edit-form-submit"
          style={{ display: "none" }}
        />
      </Form>
    </Modal>
  );
}
