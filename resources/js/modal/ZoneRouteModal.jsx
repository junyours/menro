// resources/js/Components/ZoneRouteModal.jsx
import React, { useEffect } from 'react';
import { Modal, Form, Input, Button, Row, Col, Typography, List, message } from 'antd';

const { Text } = Typography;

export default function ZoneRouteModal({ visible, onCancel, zone, saving, onSubmit, backendErrors }) {
    const [form] = Form.useForm();

    useEffect(() => {
        if (visible) {
            form.resetFields();
        }

        // Show backend error if exists
        if (backendErrors?.terminals) {
            message.error(backendErrors.terminals);
        }
    }, [visible, backendErrors, form]);

    const handleFinish = (values) => {
        if (!zone?.id) {
            message.error("Invalid zone. Cannot submit routes.");
            return;
        }

        if (!values.terminals || values.terminals.length === 0) {
            message.warning("Please add at least one route.");
            return;
        }

        // Check for duplicate coordinates within the form itself
        const coordsSet = new Set();
        for (let point of values.terminals) {
            const key = `${point.lat},${point.lng}`;
            if (coordsSet.has(key)) {
                message.error("Duplicate coordinates found in the form. Each point must be unique.");
                return;
            }
            coordsSet.add(key);
        }

        if (onSubmit) {
            onSubmit(values, form);
        }
    };

    return (
        <Modal
            title={`Add Terminal to ${zone?.name || 'Zone'}`}
            open={visible}
            onCancel={onCancel}
            footer={null}
            destroyOnClose
        >
            {zone && (
                <>
                    <Text strong>Current Route Path:</Text>
                    {zone.route_path?.length > 0 ? (
                        <List
                            dataSource={zone.route_path}
                            bordered
                            size="small"
                            style={{ marginBottom: 16 }}
                            renderItem={(item, index) => (
                                <List.Item key={index}>
                                    <Text strong>{item.name}</Text> – Lat: {item.lat}, Lng: {item.lng}
                                </List.Item>
                            )}
                        />
                    ) : (
                        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                            No routes added yet.
                        </Text>
                    )}

                    <Form form={form} layout="vertical" onFinish={handleFinish}>
                        <Form.List name="terminals">
                            {(fields, { add, remove }) => (
                                <>
                                    <Text strong>Add New Terminal Path(s)</Text>
                                    {fields.map(({ key, name, ...restField }) => (
                                        <Row gutter={8} key={key} style={{ marginBottom: 12 }}>
                                            <Col span={8}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'name']}
                                                    rules={[{ required: true, message: 'Name required' }]}
                                                >
                                                    <Input placeholder="Terminal Name" />
                                                </Form.Item>
                                            </Col>
                                            <Col span={6}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'lat']}
                                                    rules={[{ required: true, message: 'Latitude required' }]}
                                                >
                                                    <Input placeholder="Latitude" />
                                                </Form.Item>
                                            </Col>
                                            <Col span={6}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'lng']}
                                                    rules={[{ required: true, message: 'Longitude required' }]}
                                                >
                                                    <Input placeholder="Longitude" />
                                                </Form.Item>
                                            </Col>
                                            <Col span={4}>
                                                <Button danger onClick={() => remove(name)} style={{ marginTop: 4 }}>
                                                    Remove
                                                </Button>
                                            </Col>
                                        </Row>
                                    ))}

                                    <Form.Item>
                                        <Button type="dashed" onClick={() => add()} block>
                                            + Add Route
                                        </Button>
                                    </Form.Item>
                                </>
                            )}
                        </Form.List>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" block loading={saving}>
                                Submit Routes
                            </Button>
                        </Form.Item>
                    </Form>
                </>
            )}
        </Modal>
    );
}
