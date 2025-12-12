import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  DatePicker,
  TimePicker,
  Select,
  Button,
  message,
  Row,
  Col,
  Divider,
  Typography,
  Spin,
  Card,
} from "antd";
import {
  CarOutlined,
  UserOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  EditOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import LoadingCube from "@/Components/LoadingCube";

const { Option } = Select;
const { Title, Text } = Typography;

const EditScheduleModal = ({
  visible,
  onCancel,
  data,
  trucks,
  barangays,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  useEffect(() => {
    if (data) {
      form.setFieldsValue({
        truck_id: data.truck_id,
        driver_id: data.driver_id,
        barangay_id: data.barangay_id,
        pickup_date: dayjs(data.pickup_datetime),
        pickup_time: dayjs(data.pickup_datetime),
      });
      setSelectedTruck(trucks.find((t) => t.id === data.truck_id) || null);
      setSelectedDate(dayjs(data.pickup_datetime));
      setSelectedTime(dayjs(data.pickup_datetime));
      fetchDrivers(data.truck_id, false);
    }
  }, [data, form, trucks]);

  const fetchDrivers = async (truckId, clearSelection = true) => {
    if (!truckId) return;
    setLoadingDrivers(true);
    try {
      const res = await axios.get(`/drivers/by-truck/${truckId}`);
      const fetchedDrivers = res.data || [];
      setDrivers(fetchedDrivers);
      if (clearSelection) {
        form.setFieldValue("driver_id", undefined);
      }
    } catch {
      message.error("Failed to load drivers.");
    } finally {
      setLoadingDrivers(false);
    }
  };

  const handleTruckChange = (truckId) => {
    const selected = trucks.find((t) => t.id === truckId);
    setSelectedTruck(selected);
    fetchDrivers(truckId);
  };

  const handleClose = () => {
    form.resetFields();
    setDrivers([]);
    setSelectedTruck(null);
    setSelectedDate(null);
    setSelectedTime(null);
    onCancel();
  };

  const handleSubmit = () => {
    form.validateFields().then(async (values) => {
      const pickupDate = values.pickup_date;
      const pickupTime = values.pickup_time;

      if (!pickupDate || !pickupTime) {
        return message.error("Please select both date and time.");
      }

      const pickupDateTime = dayjs(
        `${pickupDate.format("YYYY-MM-DD")} ${pickupTime.format("HH:mm")}`
      );

      if (pickupDateTime.isBefore(dayjs())) {
        return message.error("Pickup date and time cannot be in the past");
      }

      const formattedValues = {
        ...values,
        pickup_datetime: pickupDateTime.format("YYYY-MM-DD HH:mm:ss"),
      };

      setSubmitting(true);
      try {
        const res = await axios.put(`/schedules/${data.id}`, formattedValues, {
          headers: { Accept: "application/json" },
        });
        if (res.data?.success) {
          message.success("Schedule updated successfully!");
          if (onSuccess) onSuccess(res.data.schedule);
          handleClose();
        }
      } catch (error) {
        message.error("Failed to update schedule.");
      } finally {
        setSubmitting(false);
      }
    });
  };

  return (
    <Modal
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={950}
      centered
      destroyOnClose
      bodyStyle={{
        padding: 30,
        borderRadius: 16,
        background: "linear-gradient(to bottom right, #f0f5ff, #ffffff)",
        boxShadow: "0 12px 48px rgba(0,0,0,0.12)",
      }}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <EditOutlined style={{ fontSize: 26, color: "#52c41a" }} />
          <Title level={4} style={{ margin: 0 }}>
            Edit Garbage Schedule
          </Title>
        </div>
      }
    >
      {submitting ? (
        <LoadingCube />
      ) : (
        <Row gutter={24}>
          <Col xs={24} md={16}>
            <Card
              bordered={false}
              style={{
                borderRadius: 16,
                boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                marginBottom: 20,
                background: "#fff",
              }}
            >
              <Form form={form} layout="vertical" autoComplete="off">
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="truck_id"
                      label={
                        <span>
                          <CarOutlined
                            style={{ color: "#52c41a", marginRight: 6 }}
                          />
                          Truck
                        </span>
                      }
                      rules={[
                        { required: true, message: "Please select a truck" },
                      ]}
                    >
                      <Select
                        placeholder="Select truck"
                        onChange={handleTruckChange}
                        allowClear
                        size="large"
                        value={selectedTruck?.id}
                        optionLabelProp="label"
                      >
                        {trucks.map((truck) => (
                          <Option
                            key={truck.id}
                            value={truck.id}
                            label={`${truck.plate_number} — ${truck.model}`}
                          >
                            {truck.plate_number} — {truck.model}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      name="driver_id"
                      label={
                        <span>
                          <UserOutlined
                            style={{ color: "#52c41a", marginRight: 6 }}
                          />
                          Driver
                        </span>
                      }
                      rules={[
                        { required: true, message: "Please select a driver" },
                      ]}
                    >
                      {loadingDrivers ? (
                        <Spin />
                      ) : drivers.length > 0 ? (
                        <Select
                          placeholder="Select driver"
                          size="large"
                          optionLabelProp="label"
                        >
                          {drivers.map((driver) => (
                            <Option
                              key={driver.id}
                              value={driver.id}
                              label={driver.name}
                            >
                              {driver.name}
                            </Option>
                          ))}
                        </Select>
                      ) : (
                        <Select
                          placeholder={
                            selectedTruck
                              ? "No drivers available"
                              : "Select truck first"
                          }
                          disabled
                          size="large"
                        />
                      )}
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="barangay_id"
                      label={
                        <span>
                          <EnvironmentOutlined
                            style={{ color: "#52c41a", marginRight: 6 }}
                          />
                          Barangay
                        </span>
                      }
                      rules={[
                        { required: true, message: "Please select barangay" },
                      ]}
                    >
                      <Select placeholder="Select barangay" size="large">
                        {barangays.map((bgy) => (
                          <Option key={bgy.id} value={bgy.id}>
                            {bgy.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Row gutter={8}>
                      <Col span={12}>
                        <Form.Item
                          name="pickup_date"
                          label="Pickup Date"
                          rules={[
                            { required: true, message: "Select pickup date" },
                          ]}
                        >
                          <DatePicker
                            style={{ width: "100%", borderRadius: 8 }}
                            size="large"
                            onChange={setSelectedDate}
                            disabledDate={(current) =>
                              current && current < dayjs().startOf("day")
                            }
                          />
                        </Form.Item>
                      </Col>

                      <Col span={12}>
                        <Form.Item
                          name="pickup_time"
                          label="Pickup Time"
                          rules={[
                            { required: true, message: "Select pickup time" },
                          ]}
                        >
                          <TimePicker
                            style={{ width: "100%", borderRadius: 8 }}
                            size="large"
                            format="HH:mm"
                            onChange={setSelectedTime}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Col>
                </Row>

                <Divider />

                <div
                  style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}
                >
                  <Button onClick={handleClose} size="large" style={{ borderRadius: 12 }}>
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={handleSubmit}
                    loading={submitting}
                    size="large"
                    style={{
                      borderRadius: 12,
                      boxShadow: "0 6px 20px rgba(82,196,26,0.25)",
                    }}
                  >
                    Update Schedule
                  </Button>
                </div>
              </Form>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card
              title="Schedule Preview"
              bordered={false}
              style={{
                borderRadius: 16,
                background: "#f6fff6",
                boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
              }}
            >
              {selectedDate || selectedTime ? (
                <>
                  {selectedDate && (
                    <Text strong>
                      Date: {dayjs(selectedDate).format("MMMM D, YYYY")}
                    </Text>
                  )}
                  <br />
                  {selectedTime && (
                    <Text strong>
                      Time: {dayjs(selectedTime).format("HH:mm")}
                    </Text>
                  )}
                  {selectedDate &&
                    selectedTime &&
                    dayjs(
                      `${selectedDate.format("YYYY-MM-DD")} ${selectedTime.format(
                        "HH:mm"
                      )}`
                    ).isBefore(dayjs()) && (
                      <Text type="danger" style={{ display: "block", marginTop: 8 }}>
                        ⚠ Pickup date/time cannot be in the past
                      </Text>
                    )}
                </>
              ) : (
                <Text type="secondary">
                  Select a date and time to preview here.
                </Text>
              )}
            </Card>
          </Col>
        </Row>
      )}
    </Modal>
  );
};

export default EditScheduleModal;
