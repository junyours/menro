// resources/js/Components/BarSide.jsx
import { Layout, Menu } from "antd";
import {
  DashboardTwoTone,
  PieChartTwoTone,
  PlusCircleTwoTone,
  CalendarTwoTone,
  CheckSquareTwoTone,
  SettingTwoTone,
  TeamOutlined,
  NodeIndexOutlined,
  CalendarOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import { Link } from "@inertiajs/react";

const { Sider } = Layout;

export default function Sidebar({ collapsed, toggleCollapsed }) {
  const menuItems = [
    {
      key: "1",
      icon: <DashboardTwoTone />,
      label: (
        <Link href={route("BarDashboard")} className="text-gray-800 font-medium">
          Dashboard
        </Link>
      ),
    },
    {
      key: "3",
      icon: <TeamOutlined />,
      label: (
        <Link href={route("zonal-leaders.index")} className="text-gray-800 font-medium">
          Zonal Leader
        </Link>
      ),
    },
    {
      key: "2",
      icon: <PieChartTwoTone />,
      label: "Manage Weekly Plan",
      children: [
        {
          key: "2-1",
          icon: <PlusCircleTwoTone />,
          label: (
            <Link href={route("barangay.weekly")} className="text-gray-800 font-medium">
              Create Weekly Plan
            </Link>
          ),
        },
        {
          key: "2-2",
          icon: <CalendarTwoTone />,
          label: (
            <Link href={route("barangay.zone")} className="text-gray-800 font-medium">
              Weekly Zone Plan
            </Link>
          ),
        },
        {
          key: "2-3",
          icon: <CheckSquareTwoTone />,
          label: (
            <Link href={route("reports.index")} className="text-gray-800 font-medium">
              Reports
            </Link>
          ),
        },
      ],
    },
    {
      key: "4",
      icon: <NodeIndexOutlined />,
      label: "Schedule list",
      children: [
        {
          key: "schedule",
          icon: <CalendarOutlined />,
          label: (
            <Link href={route("BarHistory")} className="text-gray-800 font-medium">
              Schedule
            </Link>
          ),
        },
        {
          key: "reschedule",
          icon: <SwapOutlined />,
          label: (
            <Link href={route("BarResched")} className="text-gray-800 font-medium">
              Reschedule
            </Link>
          ),
        },
      ],
    },
    // {
    //   key: "5",
    //   icon: <SettingTwoTone />,
    //   label: (
    //     <Link href={route("settings.index")} className="text-gray-800 font-medium">
    //       Settings
    //     </Link>
    //   ),
    // },
  ];

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={toggleCollapsed}
      theme="light"
      width={260}
      style={{
        borderRadius: "16px",
        margin: "12px",
        overflow: "hidden",
        background: "#ffffff",
        boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
        transition: "all 0.3s ease",
      }}
    >
      {/* Sidebar Header with Logo + Title */}
      <div
        className="flex items-center gap-3 px-4 py-4"
        style={{
          background: "#f5f5f5",
          borderBottom: "1px solid #eaeaea",
          minHeight: "72px",
        }}
      >
        <img
          src="/images/logo.png"
          alt="Logo"
          className={`transition-all duration-300 ${collapsed ? 'w-10 h-10 mx-auto' : 'w-12 h-12'}`}
        />
        {!collapsed && (
          <div style={{ lineHeight: "16px" }}>
            <span className="block text-gray-800 font-semibold text-sm">
              Barangay
            </span>
            <span className="block text-gray-800 font-semibold text-sm">
              Administration
            </span>
          </div>
        )}
      </div>

      {/* Sidebar Menu */}
      <Menu
        mode="inline"
        theme="light"
        items={menuItems}
        defaultSelectedKeys={["1"]}
        inlineCollapsed={collapsed}
        style={{
          borderRight: "none",
          fontWeight: 500,
          fontSize: "14px",
          marginTop: 10,
          transition: "all 0.3s ease",
        }}
      />

      {/* Custom CSS for hover & selected */}
      <style jsx>{`
        .ant-menu-item-selected {
          background-color: #e6f7ff !important;
          border-radius: 8px;
        }
        .ant-menu-item:hover {
          background-color: #f0f5ff !important;
          border-radius: 8px;
        }
        .ant-menu-submenu-title:hover {
          background-color: #f0f5ff !important;
          border-radius: 8px;
        }
      `}</style>
    </Sider>
  );
}
