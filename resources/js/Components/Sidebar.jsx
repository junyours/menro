import React from 'react';
import { Link } from '@inertiajs/react';
import { Layout, Menu, Typography } from 'antd';
import {
  DashboardOutlined,
  TruckOutlined,
  HomeOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  PlusCircleOutlined,
  FileTextOutlined,
  UserOutlined,
  WarningOutlined,
  AppstoreOutlined,
  NodeIndexOutlined,
  SwapOutlined,
  BarChartOutlined,
  DatabaseOutlined,
  ApartmentOutlined,
} from '@ant-design/icons';

const { Sider } = Layout;
const { Text } = Typography;

const Sidebar = ({ collapsed, setCollapsed }) => {
  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={(value) => setCollapsed(value)}
      width={260}
      theme="light"
      style={{
        borderRadius: '16px',
        margin: '12px',
        overflow: 'hidden',
        background: '#ffffff',
        boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
      }}
    >
      {/* Logo & Inline Multi-line Title */}
      <div
        className="flex items-center gap-3 px-4 py-4"
        style={{
          background: '#f5f5f5',
          borderBottom: '1px solid #eaeaea',
          minHeight: '72px',
        }}
      >
        <img
          src="/images/logo.png"
          alt="MENRO Logo"
          className={`transition-all duration-300 ${collapsed ? 'w-10 h-10 mx-auto' : 'w-12 h-12'}`}
        />
        {!collapsed && (
          <div style={{ lineHeight: '16px' }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: '#333',
                display: 'block',
                whiteSpace: 'nowrap',
              }}
            >
              Municipal Environment &
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: '#333',
                display: 'block',
                whiteSpace: 'nowrap',
              }}
            >
              Natural Resources Office
            </Text>
          </div>
        )}
      </div>

      {/* Menu Items */}
      <Menu
        mode="inline"
        theme="light"
        defaultSelectedKeys={['1']}
        style={{
          borderRight: 'none',
          fontSize: 13,
          fontWeight: 500,
          marginTop: 10,
        }}
        inlineCollapsed={collapsed}
      >
        <Menu.Item key="1" icon={<DashboardOutlined />}>
          <Link href={route('dashboard')}>Dashboard</Link>
        </Menu.Item>

        <Menu.SubMenu key="2" icon={<AppstoreOutlined />} title="Manage Account">
          <Menu.Item key="2-1" icon={<UserOutlined />}>
            <Link href={route('users.drivers')}>Driver</Link>
          </Menu.Item>
          <Menu.Item key="2-2" icon={<TruckOutlined />}>
            <Link href={route('users.trucks')}>Truck</Link>
          </Menu.Item>
          <Menu.Item key="2-3" icon={<HomeOutlined />}>
            <Link href={route('users.barangays')}>Barangay</Link>
          </Menu.Item>
        </Menu.SubMenu>

        <Menu.Item key="3" icon={<FileTextOutlined />}>
          <Link href={route('weekly.reports')}>Manage Segregations</Link>
        </Menu.Item>

        <Menu.SubMenu key="5" icon={<CalendarOutlined />} title="Manage Schedule">
          <Menu.Item key="5-1" icon={<PlusCircleOutlined />}>
            <Link href={route('schedule.create')}>Create Schedule</Link>
          </Menu.Item>
          <Menu.Item key="5-2" icon={<NodeIndexOutlined />}>
            <Link href={route('schedule.zones')}>Route Plan</Link>
          </Menu.Item>
          <Menu.Item key="5-3" icon={<WarningOutlined />}>
            <Link href={route('route-details.missed')}>Missed Segments</Link>
          </Menu.Item>
        </Menu.SubMenu>

        <Menu.SubMenu key="6" icon={<NodeIndexOutlined />} title="Routes">
          <Menu.Item key="6-1" icon={<EnvironmentOutlined />}>
            <Link href={route('adminMap')}>Map</Link>
          </Menu.Item>
          <Menu.Item key="6-2" icon={<NodeIndexOutlined />}>
            <Link href={route('History')}>Schedule List</Link>
          </Menu.Item>
          <Menu.Item key="6-3" icon={<SwapOutlined />}>
            <Link href={route('adResched')}>Reschedule List</Link>
          </Menu.Item>
        </Menu.SubMenu>

        <Menu.SubMenu key="7" icon={<BarChartOutlined />} title="Reports">
  <Menu.Item key="7-1" icon={<DatabaseOutlined />}>
    <Link href={route('reports.establishments')}>Establishments & Households</Link>
  </Menu.Item>
  <Menu.Item key="7-2" icon={<TruckOutlined />}>
    <Link href={route('reports.collections')}>Garbage Collections</Link>
  </Menu.Item>
  <Menu.Item key="7-3" icon={<ApartmentOutlined />}>
    <Link href={route('reports.routes')}>Routes Reports</Link>
  </Menu.Item>
  <Menu.Item key="7-4" icon={<FileTextOutlined />}>
    <Link href={route('reports.feedback')}>Feedback Report</Link>
  </Menu.Item>
</Menu.SubMenu>
      </Menu>
    </Sider>
  );
};

export default Sidebar;
