import React, { useEffect } from 'react';
import { Modal, Form, Input, Button, Row, Col, Select, message } from 'antd';

export default function CreateZoneModal({
    visible,
    onCancel,
    onFinish,
    saving,
    maxZones,
    existingZones,
    backendErrors,
    zonalLeaders = [], // ✅ Passed from backend (leaders of this barangay only)
}) {
    const [form] = Form.useForm();

    useEffect(() => {
        if (backendErrors?.route_path) message.error(backendErrors.route_path);
        if (backendErrors?.name) message.error(backendErrors.name);
    }, [backendErrors]);

    const handleSubmit = (values) => {
        const routePath = values.route_path || [];

        // check duplicate coords
        const coordsSet = new Set();
        for (let point of routePath) {
            const key = `${point.lat},${point.lng}`;
            if (coordsSet.has(key)) {
                message.error("Duplicate coordinates found in the route path.");
                return;
            }
            coordsSet.add(key);
        }

        onFinish(values, form);
    };

    return (
        <Modal
            title={
                <div style={{ fontWeight: 600, fontSize: 18 }}>
                    Create New Zone
                </div>
            }
            open={visible}
            onCancel={onCancel}
            footer={null}
            destroyOnClose
            centered
            width={720}
            bodyStyle={{ padding: 24, background: '#fafafa' }}
            style={{ borderRadius: 12, overflow: 'hidden' }}
        >
            <Form
                layout="vertical"
                form={form}
                onFinish={handleSubmit}
                style={{ marginTop: 4 }}
            >
                {/* Zone Name */}
                <Form.Item
                    name="name"
                    label="Zone Name"
                    rules={[{ required: true, message: 'Please enter a zone name' }]}
                >
                    <Input placeholder="Enter zone name (e.g. Zone 1, Zone 2)" style={{ borderRadius: 4, height: 40 }} />
                </Form.Item>

                {/* Zonal Leader */}
                <Form.Item
                    name="zone_leader_id"
                    label="Assign Zonal Leader"
                    rules={[{ required: true, message: "Please select a Zonal Leader" }]}
                >
                    <Select
                        placeholder="Select Zonal Leader"
                        options={zonalLeaders.map(zl => ({
                            label: `${zl.firstname} ${zl.lastname}`,
                            value: zl.id,
                        }))}
                        style={{ borderRadius: 4, height: 40 }}
                    />
                </Form.Item>

                {/* Route Path */}
                <Form.List name="route_path">
                    {(fields, { add, remove }) => (
                        <>
                            <label style={{ display: 'block', marginBottom: 8 }}><strong>Route Path (Lat, Lng)</strong></label>
                            {fields.map(({ key, name, ...restField }) => (
                                <Row gutter={12} key={key} style={{ marginBottom: 12 }}>
                                    <Col span={10}>
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'lat']}
                                            rules={[{ required: true, message: 'Latitude required' }]}
                                        >
                                            <Input placeholder="Latitude" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={10}>
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'lng']}
                                            rules={[{ required: true, message: 'Longitude required' }]}
                                        >
                                            <Input placeholder="Longitude" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={4}>
                                        <Button
                                            danger
                                            size="small"
                                            onClick={() => remove(name)}
                                            style={{ marginTop: 4, width: '100%' }}
                                        >
                                            Remove
                                        </Button>
                                    </Col>
                                </Row>
                            ))}
                            <Form.Item style={{ marginBottom: 24 }}>
                                <Button type="dashed" onClick={() => add()} block>
                                    + Add Point
                                </Button>
                            </Form.Item>
                        </>
                    )}
                </Form.List>

                <Form.Item style={{ marginBottom: 0 }}>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={saving}
                        block
                        style={{ fontWeight: 500 }}
                    >
                        Submit
                    </Button>
                </Form.Item>
            </Form>
        </Modal>
    );
}
