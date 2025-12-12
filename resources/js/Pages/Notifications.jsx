// resources/js/Pages/Notifications.jsx
import React, { useState } from "react";
import { Modal, Button, Typography } from "antd";

const { Text } = Typography;

export default function NotificationDetail({ notification }) {
  const [modalVisible, setModalVisible] = useState(true);

  if (!notification) return null;

  return (
    <Modal
      title="Notification Details"
      open={modalVisible}
      onCancel={() => setModalVisible(false)}
      footer={[
        <Button key="close" onClick={() => setModalVisible(false)}>
          Close
        </Button>,
      ]}
    >
      <p>
        <Text strong>From:</Text> {notification.username || "Unknown"}
      </p>
      <p>
        <Text strong>Message:</Text> {notification.message || "No message"}
      </p>
      <p>
        <Text strong>Status:</Text> {notification.is_viewed ? "Read" : "Unread"}
      </p>
      {notification.schedule && (
        <p>
          <Text strong>Pickup Date:</Text> {notification.schedule.pickup_date}
        </p>
      )}
      {notification.terminal && (
        <>
          <p>
            <Text strong>Terminal:</Text> {notification.terminal.name}
          </p>
          {notification.terminal.zone && (
            <p>
              <Text strong>Zone:</Text> {notification.terminal.zone.name}
            </p>
          )}
        </>
      )}
    </Modal>
  );
}
