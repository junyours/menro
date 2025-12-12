import React, { useEffect } from 'react';
import { Modal, Form, Input, Button, Row, Col, Select, message } from 'antd';

export default function EditZoneModal({
    visible,
    onCancel,
    onFinish,
    saving,
    zone,
    zonalLeaders = [],
}) {
    const [form] = Form.useForm();

    useEffect(() => {
        if (visible && zone) {
            form.setFieldsValue({
                name: zone.name,
                zone_leader_id: zone.zone_leader?.id ?? null,
                route_path: (zone.route_path || []).map((p) => ({
                    lat: p.lat,
                    lng: p.lng,
                })),
            });
        }
    }, [visible, zone, form]);

    const handleSubmit = (values) => {
        const routePath = values.route_path || [];

        const coordsSet = new Set();
        for (let point of routePath) {
            const key = `${point.lat},${point.lng}`;
            if (coordsSet.has(key)) {
                message.error('Duplicate coordinates found in the route path.');
                return;
            }
            coordsSet.add(key);
        }

        onFinish(values, form);
    };

    return (
        <Modal
            title={
                <div
                    style={{
                        fontWeight: 700,
                        fontSize: 20,
                        letterSpacing: 0.3,
                        color: '#111827',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <span>Edit Zone</span>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>Update details and route path</span>
                </div>
            }
            open={visible}
            onCancel={onCancel}
            footer={null}
            destroyOnClose
            centered
            width={760}
            bodyStyle={{
                padding: 24,
                background: 'linear-gradient(135deg,#f9fafb 0%,#eff6ff 100%)',
            }}
            style={{ borderRadius: 16, overflow: 'hidden' }}
        >
            <div
                style={{
                    background: '#ffffff',
                    borderRadius: 16,
                    padding: 20,
                    boxShadow: '0 18px 45px rgba(15,23,42,0.12)',
                    border: '1px solid #e5e7eb',
                }}
            >
                <Form
                    layout="vertical"
                    form={form}
                    onFinish={handleSubmit}
                    style={{ marginTop: 4 }}
                >
                    <Form.Item
                        name="name"
                        label={<span style={{ fontWeight: 600 }}>Zone Name</span>}
                        rules={[{ required: true, message: 'Please enter a zone name' }]}
                    >
                        <Input
                            placeholder="Enter zone name"
                            style={{
                                borderRadius: 10,
                                height: 44,
                                borderColor: '#d1d5db',
                            }}
                        />
                    </Form.Item>

                    <Form.Item
                        name="zone_leader_id"
                        label={<span style={{ fontWeight: 600 }}>Assign Zonal Leader</span>}
                        rules={[{ required: true, message: 'Please select a Zonal Leader' }]}
                    >
                        <Select
                            placeholder="Select Zonal Leader"
                            options={zonalLeaders.map((zl) => ({
                                label: `${zl.firstname} ${zl.lastname}`,
                                value: zl.id,
                            }))}
                            style={{ borderRadius: 10 }}
                        />
                    </Form.Item>

                    <Form.List name="route_path">
                        {(fields, { add, remove }) => (
                            <>
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: 8,
                                    }}
                                >
                                    <span style={{ fontWeight: 600 }}>Route Path (Lat, Lng)</span>
                                    <Button type="dashed" onClick={() => add()} size="small">
                                        + Add Point
                                    </Button>
                                </div>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Row gutter={12} key={key} style={{ marginBottom: 12 }}>
                                        <Col span={10}>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'lat']}
                                                rules={[{ required: true, message: 'Latitude required' }]}
                                            >
                                                <Input placeholder="Latitude" style={{ borderRadius: 8 }} />
                                            </Form.Item>
                                        </Col>
                                        <Col span={10}>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'lng']}
                                                rules={[{ required: true, message: 'Longitude required' }]}
                                            >
                                                <Input placeholder="Longitude" style={{ borderRadius: 8 }} />
                                            </Form.Item>
                                        </Col>
                                        <Col span={4}>
                                            <Button
                                                danger
                                                size="small"
                                                onClick={() => remove(name)}
                                                style={{ marginTop: 4, width: '100%', borderRadius: 999 }}
                                            >
                                                Remove
                                            </Button>
                                        </Col>
                                    </Row>
                                ))}
                            </>
                        )}
                    </Form.List>

                    <Form.Item style={{ marginBottom: 0, marginTop: 12 }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={saving}
                            block
                            style={{
                                fontWeight: 600,
                                height: 44,
                                borderRadius: 999,
                                background: 'linear-gradient(90deg,#2563eb,#38bdf8)',
                                boxShadow: '0 12px 25px rgba(37,99,235,0.35)',
                            }}
                        >
                            Save Changes
                        </Button>
                    </Form.Item>
                </Form>
            </div>
        </Modal>
    );
}
