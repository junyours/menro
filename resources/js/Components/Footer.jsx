import React from "react";
import {
  FacebookOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";

export default function Footer() {
  return (
    <footer className="bg-[#0D1117] text-gray-400 border-t border-gray-800">

      {/* Bottom Section */}
      <div className="border-t border-gray-800 py-6 text-center text-xs text-gray-500">
        <p>
          © {new Date().getFullYear()}{" "}
          <span className="font-medium text-gray-300">WasteCarrierMonitoring</span>. All
          rights reserved.
        </p>
        <p className="mt-1">
          Developed by{" "}
          <a
            href="https://www.facebook.com/bajing.castillo"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-green-400 transition-colors duration-300"
          >
            Jessther Salon
          </a>
          ,{" "}
          <a
            href="https://www.facebook.com/Joshuamontalban13"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-green-400 transition-colors duration-300"
          >
            Joshua Montalban
          </a>
          ,{" "}
          <a
            href="https://www.facebook.com/sendong.RR"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-green-400 transition-colors duration-300"
          >
            Fritz Magnetico
          </a>{" "}
          and{" "}
          <a
            href="https://www.facebook.com/bing.anana"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-green-400 transition-colors duration-300"
          >
            Carlo Anaña
          </a>
        </p>
      </div>
    </footer>
  );
}
