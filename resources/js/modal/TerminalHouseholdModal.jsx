import React, { useEffect, useMemo } from "react";
import { Modal, Form, InputNumber, Button, Row, Col, Statistic, Divider, Typography } from "antd";

const { Title, Text } = Typography;

/**
 * TerminalHouseholdModal
 *
 * Props:
 * - visible: boolean
 * - onCancel: fn
 * - onSubmit: fn(values, form) -> promise
 * - terminal: object (may be null)
 * - saving: boolean
 *
 * This modal shows household_count & establishment_count inputs and
 * shows live calculation of estimated sacks by category.
 */
export default function TerminalHouseholdModal({
  visible,
  onCancel,
  onSubmit,
  terminal,
  saving,
}) {
  const [form] = Form.useForm();

  const RATES = {
    household: { bio: 1, non: 1, rec: 1 },
    establishment: { bio: 3, non: 3, rec: 3 },
  };

  useEffect(() => {
    if (terminal) {
      form.setFieldsValue({
        household_count: terminal.household_count ?? 0,
        establishment_count: terminal.establishment_count ?? 0,
        estimated_biodegradable: terminal.estimated_biodegradable ?? 0,
        estimated_non_biodegradable: terminal.estimated_non_biodegradable ?? 0,
        estimated_recyclable: terminal.estimated_recyclable ?? 0,
      });
    } else {
      form.resetFields();
    }
  }, [terminal, visible]);

  // compute estimates (floating) and rounded display
  const values = Form.useWatch([], form) || {};
  const householdCount = Number(values.household_count ?? (terminal?.household_count ?? 0));
  const establishmentCount = Number(values.establishment_count ?? (terminal?.establishment_count ?? 0));

  const estimates = useMemo(() => {
    const bio = householdCount * RATES.household.bio + establishmentCount * RATES.establishment.bio;
    const non = householdCount * RATES.household.non + establishmentCount * RATES.establishment.non;
    const rec = householdCount * RATES.household.rec + establishmentCount * RATES.establishment.rec;

    // We store/return integer sacks. Round to nearest integer (Math.round).
    // You can change to Math.ceil if you prefer to always round up.
    return {
      bioFloat: bio,
      nonFloat: non,
      recFloat: rec,
      bio: Math.round(bio),
      non: Math.round(non),
      rec: Math.round(rec),
      totalFloat: bio + non + rec,
      total: Math.round(bio + non + rec),
    };
  }, [householdCount, establishmentCount]);

  const handleFinish = async (vals) => {
    // attach counts plus editable estimates (fallback to calculated values if empty)
    const payload = {
      household_count: Number(vals.household_count || 0),
      establishment_count: Number(vals.establishment_count || 0),
      estimated_biodegradable: vals.estimated_biodegradable !== undefined
        ? Number(vals.estimated_biodegradable || 0)
        : estimates.bio,
      estimated_non_biodegradable: vals.estimated_non_biodegradable !== undefined
        ? Number(vals.estimated_non_biodegradable || 0)
        : estimates.non,
      estimated_recyclable: vals.estimated_recyclable !== undefined
        ? Number(vals.estimated_recyclable || 0)
        : estimates.rec,
    };

    await onSubmit(payload, form);
  };

  return (
    <Modal
      title={null}
      open={visible}
      onCancel={onCancel}
      footer={null}
      centered
      destroyOnClose={false}
      maskClosable={false}
      width={720}
      style={{
        padding: 0,
      }}
      bodyStyle={{ padding: 0 }}
    >
      <div
        style={{
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 18px 40px rgba(15, 23, 42, 0.18)",
          background: "#0f172a",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            background:
              "radial-gradient(circle at top left, rgba(59,130,246,0.3), transparent 55%), #0f172a",
            borderBottom: "1px solid rgba(148, 163, 184, 0.35)",
          }}
        >
          <Row align="middle" justify="space-between" gutter={12}>
            <Col>
              <Title level={4} style={{ margin: 0, color: "#e5e7eb" }}>
                {terminal ? `Update Terminal — ${terminal.name}` : "Update Terminal"}
              </Title>
              <Text style={{ color: "#9ca3af", fontSize: 12 }}>
                Adjust households, establishments, and estimated sacks for this garbage terminal.
              </Text>
            </Col>
            {terminal && (
              <Col>
                <div
                  style={{
                    padding: "6px 12px",
                    borderRadius: 999,
                    background: "rgba(15, 118, 110, 0.12)",
                    border: "1px solid rgba(45, 212, 191, 0.6)",
                    color: "#a5f3fc",
                    fontSize: 11,
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: 0.6,
                  }}
                >
                  Terminal ID: {terminal.id}
                </div>
              </Col>
            )}
          </Row>
        </div>

        <div
          style={{
            padding: 20,
            background: "#020617",
          }}
        >
          <Form
            layout="vertical"
            form={form}
            onFinish={handleFinish}
            initialValues={{
              household_count: terminal?.household_count ?? 0,
              establishment_count: terminal?.establishment_count ?? 0,
            }}
          >
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label={<span style={{ color: "#e5e7eb" }}>Number of Households</span>}
                  name="household_count"
                  rules={[{ required: true, message: "Please input number of households" }]}
                >
                  <InputNumber min={0} className="w-full" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label={<span style={{ color: "#e5e7eb" }}>Number of Establishments</span>}
                  name="establishment_count"
                  rules={[{ required: true, message: "Please input number of establishments" }]}
                >
                  <InputNumber min={0} className="w-full" />
                </Form.Item>
              </Col>
            </Row>

            <Divider style={{ borderColor: "#1f2937", margin: "16px 0" }}>
              <span style={{ color: "#9ca3af", fontSize: 12 }}>Estimated sacks (live)</span>
            </Divider>

            <Row gutter={12}>
              <Col span={8}>
                <Statistic
                  title={<span style={{ color: "#9ca3af", fontSize: 12 }}>Biodegradable (float)</span>}
                  value={estimates.bioFloat.toFixed(2)}
                  valueStyle={{ color: "#e5e7eb", fontSize: 18 }}
                />
                <div style={{ marginTop: 6, fontSize: 12, color: "#9ca3af" }}>
                  Rounded suggestion: <strong style={{ color: "#facc15" }}>{estimates.bio}</strong> sacks
                </div>
              </Col>

              <Col span={8}>
                <Statistic
                  title={<span style={{ color: "#9ca3af", fontSize: 12 }}>Non-biodegradable (float)</span>}
                  value={estimates.nonFloat.toFixed(2)}
                  valueStyle={{ color: "#e5e7eb", fontSize: 18 }}
                />
                <div style={{ marginTop: 6, fontSize: 12, color: "#9ca3af" }}>
                  Rounded suggestion: <strong style={{ color: "#facc15" }}>{estimates.non}</strong> sacks
                </div>
              </Col>

              <Col span={8}>
                <Statistic
                  title={<span style={{ color: "#9ca3af", fontSize: 12 }}>Recyclable (float)</span>}
                  value={estimates.recFloat.toFixed(2)}
                  valueStyle={{ color: "#e5e7eb", fontSize: 18 }}
                />
                <div style={{ marginTop: 6, fontSize: 12, color: "#9ca3af" }}>
                  Rounded suggestion: <strong style={{ color: "#facc15" }}>{estimates.rec}</strong> sacks
                </div>
              </Col>
            </Row>

            <Divider style={{ borderColor: "#1f2937", margin: "18px 0" }}>
              <span style={{ color: "#9ca3af", fontSize: 12 }}>Override estimated sacks (optional)</span>
            </Divider>

            <Row gutter={12}>
              <Col xs={24} md={8}>
                <Form.Item
                  label={<span style={{ color: "#e5e7eb" }}>Biodegradable (sacks)</span>}
                  name="estimated_biodegradable"
                >
                  <InputNumber min={0} className="w-full" />
                </Form.Item>
              </Col>

              <Col xs={24} md={8}>
                <Form.Item
                  label={<span style={{ color: "#e5e7eb" }}>Non-biodegradable (sacks)</span>}
                  name="estimated_non_biodegradable"
                >
                  <InputNumber min={0} className="w-full" />
                </Form.Item>
              </Col>

              <Col xs={24} md={8}>
                <Form.Item
                  label={<span style={{ color: "#e5e7eb" }}>Recyclable (sacks)</span>}
                  name="estimated_recyclable"
                >
                  <InputNumber min={0} className="w-full" />
                </Form.Item>
              </Col>
            </Row>

            <Divider style={{ borderColor: "#1f2937", margin: "18px 0 14px" }} />

            <Row gutter={12} align="middle">
              <Col span={12}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#e5e7eb" }}>
                  Total (float): {estimates.totalFloat.toFixed(2)}
                </div>
                <div style={{ fontSize: 12, color: "#9ca3af" }}>
                  Total (rounded suggestion): <strong style={{ color: "#facc15" }}>{estimates.total}</strong> sacks
                </div>
              </Col>

              <Col span={12} style={{ textAlign: "right" }}>
                <Button onClick={onCancel} style={{ marginRight: 8 }}>
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit" loading={saving}>
                  Save
                </Button>
              </Col>
            </Row>
          </Form>
        </div>
      </div>
    </Modal>
  );
}
