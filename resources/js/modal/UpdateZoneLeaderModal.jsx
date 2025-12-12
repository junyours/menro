import React, { useEffect } from "react";
import { Modal, Form, Select, Button } from "antd";

export default function UpdateZoneLeaderModal({
  visible,
  onCancel,
  onSubmit,
  saving,
  zonalLeaders,
  zone,
}) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (zone) {
      form.setFieldsValue({
        zone_leader_id: zone.zone_leader_id || null,
      });
    }
  }, [zone, form]);

  const handleFinish = (values) => {
    onSubmit(values, form);
  };

  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      title={`Update Leader for ${zone?.name || "Zone"}`}
      footer={null}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="zone_leader_id"
          label="Select Zone Leader"
          rules={[{ required: true, message: "Please select a zone leader" }]}
        >
          <Select
            placeholder="Select Zonal Leader"
            options={zonalLeaders.map((leader) => ({
              label: `${leader.firstname} ${leader.lastname}`,
              value: leader.id,
            }))}
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={saving}
            style={{ width: "100%" }}
          >
            Update Leader
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}
